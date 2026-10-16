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

function isNetworkError(err: unknown): boolean {
  if (!err) return false;
  const msg = typeof err === 'string' ? err : (err as { message?: string }).message || '';
  const name = (err as { name?: string }).name || '';
  const status = (err as { status?: number }).status;
  return (
    status === 0 ||
    name === 'TypeError' ||
    msg.toLowerCase().includes('failed to fetch') ||
    msg.toLowerCase().includes('network') ||
    msg.toLowerCase().includes('connection') ||
    msg.toLowerCase().includes('offline')
  );
}

function isInvalidCredentialsError(err: unknown): boolean {
  if (!err) return false;
  const msg = typeof err === 'string' ? err : (err as { message?: string }).message || '';
  const code = (err as { code?: string }).code || '';
  const status = (err as { status?: number }).status;
  const lowerMsg = msg.toLowerCase();
  const lowerCode = code.toLowerCase();

  return (
    status === 400 ||
    lowerCode.includes('invalid') ||
    lowerMsg.includes('invalid') ||
    lowerMsg.includes('credentials')
  );
}

export async function adminLogin(email: string, password: string): Promise<AdminSession> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password;

  if (!cleanEmail || !cleanPassword) {
    throw new Error('Incorrect email or password.');
  }

  let authData;
  let authError;
  try {
    const res = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });
    authData = res.data;
    authError = res.error;
  } catch (err) {
    if (isNetworkError(err)) {
      throw new Error('Cannot reach the server. Check your internet connection and try again.');
    }
    console.error('Supabase auth error:', err);
    throw new Error('An unexpected error occurred. Please try again.');
  }

  if (authError || !authData.user) {
    if (isNetworkError(authError)) {
      throw new Error('Cannot reach the server. Check your internet connection and try again.');
    }
    if (isInvalidCredentialsError(authError)) {
      throw new Error('Incorrect email or password.');
    }
    console.error('Supabase auth error:', authError);
    throw new Error('An unexpected error occurred. Please try again.');
  }

  const sessionUser = authData.user;

  // Verify user exists in the owners table
  let ownerData;
  let ownerError;
  try {
    const res = await supabase
      .from('owners')
      .select('user_id')
      .eq('user_id', sessionUser.id)
      .maybeSingle();
    ownerData = res.data;
    ownerError = res.error;
  } catch (err) {
    await supabase.auth.signOut();
    if (isNetworkError(err)) {
      throw new Error('Cannot reach the server. Check your internet connection and try again.');
    }
    console.error('Owner check error:', err);
    throw new Error('An unexpected error occurred. Please try again.');
  }

  if (ownerError) {
    await supabase.auth.signOut();
    if (isNetworkError(ownerError)) {
      throw new Error('Cannot reach the server. Check your internet connection and try again.');
    }
    console.error('Owner check error:', ownerError);
    throw new Error('An unexpected error occurred. Please try again.');
  }

  if (!ownerData) {
    await supabase.auth.signOut();
    throw new Error('This account does not have admin access.');
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
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) {
      return null;
    }

    const user = data.session.user;
    const { data: ownerData, error: ownerError } = await supabase
      .from('owners')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!ownerError && ownerData) {
      return {
        id: user.id,
        email: user.email || '',
        role: 'admin',
        logged_in_at: user.last_sign_in_at || new Date().toISOString(),
      };
    } else {
      await supabase.auth.signOut();
      return null;
    }
  } catch (err) {
    console.error('Session check error:', err);
    return null;
  }
}

// ─── Booking list & detail (Explicit Columns Query) ──────────────────────────

const BOOKINGS_SELECT_QUERY = `
  id,
  reference,
  service_id,
  package_id,
  customer_name,
  phone,
  whatsapp,
  email,
  address,
  preferred_date,
  preferred_time,
  notes,
  total_amount,
  deposit_required,
  amount_paid,
  booking_status,
  payment_status,
  owner_note,
  created_at,
  updated_at,
  services(id, name, slug),
  packages(id, name, price),
  booking_items(id, package_name, unit_price, quantity),
  quotes(id, request_details, quoted_amount, owner_message, status),
  payments(id, receipt_path, receipt_mime, receipt_size, status, verified_amount, verified_at, rejection_reason, submitted_at)
`.replace(/\s+/g, ' ').trim();

function mapBookingRowToAdminBooking(row: Record<string, unknown>): AdminBooking {
  const rowId = String(row.id || '');
  const ref = String(row.reference || '');

  const customerName = row.customer_name != null ? String(row.customer_name) : '';
  const phone = row.phone != null ? String(row.phone) : '';
  const whatsapp = row.whatsapp != null ? String(row.whatsapp) : '';
  const email = row.email != null ? String(row.email) : '';
  const address = row.address != null ? String(row.address) : '';
  const preferredDate = row.preferred_date != null ? String(row.preferred_date) : '';
  const preferredTime = row.preferred_time != null ? String(row.preferred_time) : '';
  const notes = row.notes != null ? String(row.notes) : '';

  // Services
  const serviceObj = row.services as { name?: string; slug?: string; id?: string } | null;
  const serviceName = serviceObj?.name || '';
  const serviceId = serviceObj?.slug || serviceObj?.id || String(row.service_id || '');

  // Packages
  const pkgObj = row.packages as { name?: string } | null;
  const packageName = pkgObj?.name || undefined;

  // Booking items
  const rawItems = Array.isArray(row.booking_items) ? row.booking_items : [];
  const itemsList: AdminBookingItem[] = rawItems.map((item: Record<string, unknown>) => ({
    id: String(item.id || ''),
    name: String(item.package_name || ''),
    quantity: Number(item.quantity || 1),
    price: item.unit_price ? Number(item.unit_price) : null,
    formattedPrice: item.unit_price ? `₦${Number(item.unit_price).toLocaleString()}` : 'Included',
  }));

  // Quotes
  const rawQuotes = Array.isArray(row.quotes) ? row.quotes[0] : (row.quotes as Record<string, unknown> | null);
  const quoteDetails = rawQuotes?.request_details ? String(rawQuotes.request_details) : undefined;
  const quoteMessage = rawQuotes?.owner_message ? String(rawQuotes.owner_message) : undefined;
  const quoteAmount = rawQuotes?.quoted_amount ? Number(rawQuotes.quoted_amount) : undefined;

  // Payments
  const rawPayments = Array.isArray(row.payments) ? row.payments : [];
  const paymentsList: PaymentRow[] = rawPayments.map((p: Record<string, unknown>) => {
    const mimeStr = String(p.receipt_mime || '');
    const sizeVal = Number(p.receipt_size || 0);
    return {
      id: String(p.id || ''),
      submitted_at: String(p.submitted_at || new Date().toISOString()),
      file_type: mimeStr.includes('pdf') ? 'pdf' : 'image',
      size: sizeVal,
      size_formatted: sizeVal ? `${(sizeVal / 1024).toFixed(1)} KB` : 'Unknown size',
      status: String(p.status || 'pending'),
      verified_amount: p.verified_amount ? Number(p.verified_amount) : 0,
      rejection_reason: p.rejection_reason ? String(p.rejection_reason) : null,
      receipt_path: String(p.receipt_path || ''),
    };
  });

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

  return {
    id: rowId,
    reference: ref,
    customer_name: customerName,
    customer_phone: phone,
    customer_email: email || undefined,
    customer_whatsapp: whatsapp || undefined,
    service_id: serviceId,
    service_name: serviceName,
    package_name: packageName,
    service_address: address,
    scheduled_date: preferredDate,
    scheduled_time: preferredTime || undefined,
    notes: notes || undefined,
    quote_details: quoteDetails,
    quote_message: quoteMessage,
    is_quote: bStatus === 'quote_requested' || serviceName.toLowerCase().includes('quote'),
    total_amount: row.total_amount ? Number(row.total_amount) : quoteAmount,
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
}

export async function getAdminBookings(filters?: {
  bookingStatus?: string;
  paymentStatus?: string;
  searchQuery?: string;
}): Promise<AdminBooking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKINGS_SELECT_QUERY)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase error loading bookings:', error);
    throw new Error(error.message);
  }

  const rawBookings = (data || []) as unknown as Record<string, unknown>[];
  const list = rawBookings.map(mapBookingRowToAdminBooking);

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
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKINGS_SELECT_QUERY)
    .or(`id.eq.${id},reference.eq.${id}`)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Supabase error loading booking detail:', error);
    throw new Error(error.message);
  }

  if (!data) return null;
  return mapBookingRowToAdminBooking(data as unknown as Record<string, unknown>);
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
