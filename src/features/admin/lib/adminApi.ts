/**
 * Cleanique Admin API — Real Supabase implementation reading direct tables & calling Owner RPCs.
 *
 * Compliance:
 * - Admin login is email + password only via supabase.auth.signInWithPassword. No sign-up link.
 * - After login, verifies user exists in the `owners` table (`select user_id where user_id = auth.uid()`).
 * - If user is not in `owners`, signs out and throws "Access denied".
 * - Reads explicit columns from `bookings` (NEVER selects access_token_hash).
 * - Owner RPCs used: owner_review_payment, owner_set_quote.
 * - Signed receipt URLs generated with createSignedUrl(receipt_path, 60) on click only.
 */
import { supabase } from '../../../lib/supabaseClient';
import type {
  AdminBooking,
  AdminSession,
  CleaniqueSetting,
  PaymentRow,
  AdminBookingItem,
} from '../types';
export type { CleaniqueSetting };

import { DEFAULT_PACKAGES, DEFAULT_BANK_DETAILS } from '../../booking/lib/bookingApi';

// ─── Authentication ────────────────────────────────────────────────────────────

export async function adminLogin(email: string, password: string): Promise<AdminSession> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanEmail || !cleanPassword) {
    throw new Error('Please enter both email and password.');
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: cleanPassword,
  });

  if (authError || !authData.user) {
    console.error('Supabase auth error:', authError);
    throw new Error(authError?.message || 'Invalid email or password.');
  }

  const sessionUser = authData.user;

  // Verify user exists in the owners table
  const { data: ownerData, error: ownerError } = await supabase
    .from('owners')
    .select('user_id')
    .eq('user_id', sessionUser.id)
    .maybeSingle();

  if (ownerError || !ownerData) {
    console.warn('Owner check failed or user not in owners table:', ownerError);
    await supabase.auth.signOut();
    throw new Error('Access denied');
  }

  return {
    id: sessionUser.id,
    email: sessionUser.email || cleanEmail,
    role: 'admin',
    logged_in_at: new Date().toISOString(),
  };
}

export async function adminLogout(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Logout notice:', err);
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const user = data.session.user;
      const { data: ownerData } = await supabase
        .from('owners')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (ownerData) {
        return {
          id: user.id,
          email: user.email || '',
          role: 'admin',
          logged_in_at: user.last_sign_in_at || new Date().toISOString(),
        };
      } else {
        await supabase.auth.signOut();
      }
    }
  } catch (err) {
    console.warn('Session check error:', err);
  }

  return null;
}

// ─── Booking list & detail (Explicit Columns Query) ──────────────────────────

export async function getAdminBookings(filters?: {
  bookingStatus?: string;
  paymentStatus?: string;
  searchQuery?: string;
}): Promise<AdminBooking[]> {
  // Explicitly select booking columns — NEVER select access_token_hash
  const EXPLICIT_BOOKING_COLUMNS = `
    id,
    reference,
    p_service_slug,
    p_name,
    p_phone,
    p_whatsapp,
    p_email,
    p_address,
    p_date,
    p_time,
    p_notes,
    p_quote_details,
    booking_status,
    payment_status,
    total_amount,
    deposit_required,
    amount_paid,
    created_at,
    updated_at
  `.replace(/\s+/g, ' ').trim();

  let res;
  try {
    res = await supabase
      .from('bookings')
      .select(EXPLICIT_BOOKING_COLUMNS)
      .order('created_at', { ascending: false });
  } catch (err) {
    console.error('getAdminBookings network error:', err);
    throw new Error('Unable to connect to the database server. Please verify your internet connection.', { cause: err });
  }

  if (res.error) {
    // If explicit p_ column names failed, fall back to general safe explicit column names without access_token_hash
    console.warn('Primary column select notice:', res.error.message);
    res = await supabase
      .from('bookings')
      .select('id, reference, booking_status, payment_status, total_amount, deposit_required, amount_paid, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (res.error) {
      console.error('Supabase error loading bookings:', res.error);
      throw new Error(`Failed to load bookings: ${res.error.message}`);
    }
  }

  const rawBookings = (res.data || []) as Record<string, unknown>[];

  // Load related payments, booking_items, quotes, services, and packages in parallel
  const paymentsMap: Record<string, Record<string, unknown>[]> = {};
  const itemsMap: Record<string, Record<string, unknown>[]> = {};
  const quotesMap: Record<string, Record<string, unknown>> = {};

  try {
    const [paymentsRes, itemsRes, quotesRes] = await Promise.all([
      supabase.from('payments').select('id, booking_id, receipt_path, receipt_mime, receipt_size, status, verified_amount, verified_at, rejection_reason, submitted_at'),
      supabase.from('booking_items').select('*'),
      supabase.from('quotes').select('id, booking_id, request_details, quoted_amount, owner_message, status'),
    ]);

    if (paymentsRes.data) {
      paymentsRes.data.forEach((p: Record<string, unknown>) => {
        const bId = (p.booking_id || p.booking) as string;
        if (bId) {
          if (!paymentsMap[bId]) paymentsMap[bId] = [];
          paymentsMap[bId].push(p);
        }
      });
    }

    if (itemsRes.data) {
      itemsRes.data.forEach((it: Record<string, unknown>) => {
        const bId = (it.booking_id || it.booking) as string;
        if (bId) {
          if (!itemsMap[bId]) itemsMap[bId] = [];
          itemsMap[bId].push(it);
        }
      });
    }

    if (quotesRes.data) {
      quotesRes.data.forEach((q: Record<string, unknown>) => {
        const bId = (q.booking_id || q.booking) as string;
        if (bId) {
          quotesMap[bId] = q;
        }
      });
    }
  } catch (relErr) {
    console.warn('Notice loading related tables:', relErr);
  }

  const list: AdminBooking[] = rawBookings.map((row) => {
    const rowId = String(row.id || '');
    const serviceSlug = (row.p_service_slug || row.service_slug || 'residential') as string;
    const isQuoteService = serviceSlug !== 'residential';

    let bStatus: AdminBooking['booking_status'] = 'pending_payment';
    const rawB = ((row.booking_status as string) || '').toLowerCase().replace(/\s+/g, '_');
    if (rawB.includes('confirm')) bStatus = 'confirmed';
    else if (rawB.includes('verif')) bStatus = 'pending_verification';
    else if (rawB.includes('complet')) bStatus = 'completed';
    else if (rawB.includes('cancel')) bStatus = 'cancelled';
    else if (rawB.includes('quote')) bStatus = 'quote_requested';

    let pStatus: AdminBooking['payment_status'] = 'unpaid';
    const rawP = ((row.payment_status as string) || '').toLowerCase().replace(/\s+/g, '_');
    if (rawP.includes('fully') || rawP.includes('paid')) pStatus = 'fully_paid';
    else if (rawP.includes('part')) pStatus = 'partially_paid';
    else if (rawP.includes('reject')) pStatus = 'rejected';
    else if (rawP.includes('verif')) pStatus = 'pending_verification';

    const bPayments = paymentsMap[rowId] || [];
    const paymentsList: PaymentRow[] = bPayments.map((p) => {
      const mimeStr = (p.receipt_mime || p.mime || '') as string;
      const sizeVal = Number(p.receipt_size || p.size || 0);
      return {
        id: String(p.id || ''),
        submitted_at: String(p.submitted_at || p.created_at || new Date().toISOString()),
        file_type: mimeStr.includes('pdf') ? 'pdf' : 'image',
        size: sizeVal,
        size_formatted: sizeVal ? `${(sizeVal / 1024).toFixed(1)} KB` : 'Unknown size',
        status: String(p.status || 'pending'),
        verified_amount: p.verified_amount ? Number(p.verified_amount) : 0,
        rejection_reason: (p.rejection_reason || p.reason || null) as string | null,
        receipt_path: String(p.receipt_path || p.path || ''),
      };
    });

    const bItems = itemsMap[rowId] || [];
    const itemsList: AdminBookingItem[] = bItems.map((item) => ({
      id: String(item.id || item.package_id || ''),
      name: String(item.package_name || item.name || 'Cleaning Item'),
      quantity: Number(item.quantity || 1),
      price: item.unit_price ? Number(item.unit_price) : null,
      formattedPrice: item.unit_price ? `₦${Number(item.unit_price).toLocaleString()}` : 'Included',
    }));

    const bQuote = quotesMap[rowId];
    const quoteMessage = bQuote?.owner_message || bQuote?.message || row.quote_message;
    const quoteAmount = bQuote?.quoted_amount || bQuote?.amount || row.quote_amount;

    return {
      id: rowId,
      reference: String(row.reference || rowId),
      customer_name: String(row.p_name || row.customer_name || row.name || 'Client'),
      customer_phone: String(row.p_phone || row.phone || ''),
      customer_email: (row.p_email || row.email) ? String(row.p_email || row.email) : undefined,
      customer_whatsapp: (row.p_whatsapp || row.whatsapp) ? String(row.p_whatsapp || row.whatsapp) : undefined,
      service_id: serviceSlug,
      service_name: isQuoteService ? 'Custom Quote Service' : 'Standard Residential Cleaning',
      package_name: row.package_name ? String(row.package_name) : undefined,
      service_address: String(row.p_address || row.address || row.service_address || ''),
      scheduled_date: String(row.p_date || row.preferred_date || row.scheduled_date || new Date().toISOString().split('T')[0]),
      scheduled_time: (row.p_time || row.preferred_time || row.scheduled_time) ? String(row.p_time || row.preferred_time || row.scheduled_time) : undefined,
      notes: row.p_notes ? String(row.p_notes) : (row.notes ? String(row.notes) : undefined),
      quote_details: row.p_quote_details ? String(row.p_quote_details) : (row.quote_details ? String(row.quote_details) : (bQuote?.request_details ? String(bQuote.request_details) : undefined)),
      quote_message: quoteMessage ? String(quoteMessage) : undefined,
      is_quote: isQuoteService || bStatus === 'quote_requested',
      total_amount: row.total_amount ? Number(row.total_amount) : (quoteAmount ? Number(quoteAmount) : undefined),
      deposit_amount: row.deposit_required ? Number(row.deposit_required) : undefined,
      amount_paid: row.amount_paid ? Number(row.amount_paid) : 0,
      booking_status: bStatus,
      payment_status: pStatus,
      payments: paymentsList,
      receipts: paymentsList.map((p) => ({
        id: p.id,
        filename: p.receipt_path ? p.receipt_path.split('/').pop() || 'receipt' : 'receipt',
        file_type: p.file_type,
        file_size_formatted: p.size_formatted,
        storage_path: p.receipt_path,
        submitted_at: p.submitted_at,
      })),
      items: itemsList,
      timeline: [],
      created_at: String(row.created_at || new Date().toISOString()),
    };
  });

  // Prioritize needs-attention items first: Pending Verification, then Quote Requested
  const priorityOrder = (b: AdminBooking) => {
    if (b.booking_status === 'pending_verification') return 1;
    if (b.booking_status === 'quote_requested') return 2;
    if (b.booking_status === 'pending_payment') return 3;
    if (b.booking_status === 'confirmed') return 4;
    if (b.booking_status === 'completed') return 5;
    return 6;
  };

  list.sort((a, b) => priorityOrder(a) - priorityOrder(b));

  let filtered = list;
  if (filters?.bookingStatus && filters.bookingStatus !== 'all') {
    filtered = filtered.filter((b) => b.booking_status === filters.bookingStatus);
  }
  if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
    filtered = filtered.filter((b) => b.payment_status === filters.paymentStatus);
  }
  if (filters?.searchQuery && filters.searchQuery.trim()) {
    const q = filters.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (b) =>
        b.reference.toLowerCase().includes(q) ||
        b.customer_name.toLowerCase().includes(q) ||
        b.customer_phone.toLowerCase().includes(q)
    );
  }

  return filtered;
}

export async function getAdminBookingById(id: string): Promise<AdminBooking | null> {
  const all = await getAdminBookings();
  const found = all.find((b) => b.id === id || b.reference === id);
  return found || null;
}

// ─── Signed receipt URL generation (strictly on click, valid 60s) ────────────

export async function createSignedReceiptUrl(storagePath: string): Promise<string> {
  if (!storagePath) throw new Error('Receipt storage path is required.');

  const { data, error } = await supabase.storage
    .from('payment-receipts')
    .createSignedUrl(storagePath, 60);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${error?.message || 'Storage error'}`);
  }

  return data.signedUrl;
}

// ─── Owner RPCs ────────────────────────────────────────────────────────────────

export async function ownerReviewPayment(params: {
  paymentId: string;
  approve: boolean;
  verifiedAmount: number;
  reason?: string;
}): Promise<void> {
  if (!params.approve && (!params.reason || !params.reason.trim())) {
    throw new Error('A rejection reason is required when rejecting a payment.');
  }

  const { error } = await supabase.rpc('owner_review_payment', {
    p_payment: params.paymentId,
    p_approve: params.approve,
    p_verified_amount: params.verifiedAmount,
    p_reason: params.reason?.trim() || null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function ownerSetQuote(params: {
  bookingId: string;
  amount: number;
  message: string;
}): Promise<void> {
  if (isNaN(params.amount) || params.amount <= 0) {
    throw new Error('Please enter a valid quote amount.');
  }

  const { error } = await supabase.rpc('owner_set_quote', {
    p_booking: params.bookingId,
    p_amount: params.amount,
    p_message: params.message?.trim() || '',
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateBookingStatus(
  bookingId: string,
  newStatus: string
): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({
      booking_status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .or(`id.eq.${bookingId},reference.eq.${bookingId}`);

  if (error) {
    console.error('Failed to update booking_status in database:', error);
    throw new Error(error.message);
  }
}

export async function updatePaymentStatus(
  bookingId: string,
  newPaymentStatus: string
): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({
      payment_status: newPaymentStatus,
      updated_at: new Date().toISOString(),
    })
    .or(`id.eq.${bookingId},reference.eq.${bookingId}`);

  if (error) {
    console.error('Failed to update payment_status in database:', error);
    throw new Error(error.message);
  }
}

// ─── Business Settings management (business_settings table) ──────────────────

export async function getSettings(): Promise<CleaniqueSetting[]> {
  try {
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return [
        { key: 'bank_name', value: data.bank_name || DEFAULT_BANK_DETAILS.bankName, updated_at: data.updated_at || new Date().toISOString() },
        { key: 'account_name', value: data.account_name || DEFAULT_BANK_DETAILS.accountName, updated_at: data.updated_at || new Date().toISOString() },
        { key: 'account_number', value: data.account_number || DEFAULT_BANK_DETAILS.accountNumber, updated_at: data.updated_at || new Date().toISOString() },
        { key: 'deposit_percent', value: String(data.deposit_percent || 50), updated_at: data.updated_at || new Date().toISOString() },
      ];
    }
  } catch (err) {
    console.warn('Could not load business settings:', err);
  }

  return [
    { key: 'bank_name', value: DEFAULT_BANK_DETAILS.bankName, updated_at: new Date().toISOString() },
    { key: 'account_name', value: DEFAULT_BANK_DETAILS.accountName, updated_at: new Date().toISOString() },
    { key: 'account_number', value: DEFAULT_BANK_DETAILS.accountNumber, updated_at: new Date().toISOString() },
    { key: 'deposit_percent', value: '50', updated_at: new Date().toISOString() },
  ];
}

export async function updateSetting(key: string, value: string): Promise<void> {
  const colMap: Record<string, string> = {
    bank_name: 'bank_name',
    account_name: 'account_name',
    account_number: 'account_number',
    deposit_percent: 'deposit_percent',
  };

  const colName = colMap[key] || key;
  const updateVal = key === 'deposit_percent' ? Number(value) : value;

  const { error } = await supabase
    .from('business_settings')
    .update({ [colName]: updateVal, updated_at: new Date().toISOString() })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // match any row

  if (error) {
    throw new Error(error.message);
  }
}

// ─── Package management (packages table) ────────────────────────────────────

export interface AdminPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  recommended_for: string;
  popular: boolean;
  sort_order: number;
  active: boolean;
}

export async function getAdminPackages(): Promise<AdminPackage[]> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to load packages: ${error.message}`);
  }

  if (data && data.length > 0) {
    return data.map((row) => {
      const fallback = DEFAULT_PACKAGES.find(
        (p) => p.id === row.id || p.name.toLowerCase().includes(row.name?.toLowerCase())
      );
      return {
        id: row.id,
        name: row.name,
        description: row.description || fallback?.description || '',
        price: Number(row.price),
        features: fallback?.features || ['Professional hygiene treatment', 'Certified sanitizers'],
        recommended_for: fallback?.recommendedFor || row.name,
        popular: fallback?.popular || false,
        sort_order: row.sort_order || 0,
        active: row.is_active !== false,
      };
    });
  }

  return DEFAULT_PACKAGES.map((pkg, idx) => ({
    id: pkg.id,
    name: pkg.name,
    description: pkg.description,
    price: pkg.price,
    features: pkg.features,
    recommended_for: pkg.recommendedFor,
    popular: pkg.popular || false,
    sort_order: (idx + 1) * 10,
    active: true,
  }));
}

export async function updatePackage(
  id: string,
  updates: Partial<Omit<AdminPackage, 'id'>>
): Promise<void> {
  const { error } = await supabase
    .from('packages')
    .update({
      name: updates.name,
      description: updates.description,
      price: updates.price !== undefined ? Number(updates.price) : undefined,
      is_active: updates.active !== undefined ? updates.active : undefined,
      sort_order: updates.sort_order,
    })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createPackage(
  pkg: Omit<AdminPackage, 'id'>
): Promise<AdminPackage> {
  const { data, error } = await supabase
    .from('packages')
    .insert({
      service_id: '3902a232-06a1-4a3b-a8f1-cdf9e6e92485',
      name: pkg.name.trim(),
      description: pkg.description?.trim() || '',
      price: Number(pkg.price),
      is_active: pkg.active !== false,
      sort_order: pkg.sort_order || 100,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Database error');
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    price: Number(data.price),
    features: pkg.features || [],
    recommended_for: pkg.recommended_for || '',
    popular: pkg.popular || false,
    sort_order: data.sort_order || 100,
    active: data.is_active !== false,
  };
}

export async function deletePackage(id: string): Promise<void> {
  const { error } = await supabase.from('packages').delete().eq('id', id);
  if (error) {
    const { error: updateErr } = await supabase
      .from('packages')
      .update({ is_active: false })
      .eq('id', id);
    if (updateErr) {
      throw new Error(updateErr.message);
    }
  }
}
