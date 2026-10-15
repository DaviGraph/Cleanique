/**
 * Cleanique Booking API — Real Supabase implementation with customer RPCs & Storage.
 *
 * AGENT_RULES compliance:
 * - Only the anon key is used (imported via supabaseClient).
 * - Client NEVER submits prices; prices are computed server-side.
 * - Customer pages only call the RPCs: create_booking, get_booking_status, get_booking_items, attach_receipt,
 *   and the receipt-upload-url Edge Function.
 * - No direct supabase.from() calls on bookings, payments, or quotes from customer pages.
 * - All data access goes through this file.
 */
import { supabase } from '../../../lib/supabaseClient';
import type {
  Service,
  Package,
  BankDetails,
  CreateBookingPayload,
  CreateBookingResponse,
  BookingStatus,
  BookingStatusResponse,
  SubmitReceiptResponse,
  CartItemSummary,
} from '../types';

// Helper for fast fallback when database is unreachable
function withTimeout<T>(promise: PromiseLike<T>, timeoutMs = 800): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Database query timeout')), timeoutMs);
    promise.then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

// ─── Constants & Fallback Data ───────────────

export const PACKAGE_UUID_MAP: Record<string, string> = {
  'pkg_single_room': '106409c9-1bab-4302-ac1d-8bf9e272c027',
  'pkg_bedsitter': '59120b58-6a87-4bd3-9ee2-3806d49151c5',
  'pkg_self_contained': 'f4600b9b-d54e-4587-8f09-5b6bf78291cc',
  'pkg_two_bedroom': 'f4becdd5-d42d-47bf-9c28-4227e7ee6a47',
  'pkg_three_bedroom': '0c869d1f-436e-4c79-8a8f-d9af9d28e302',
};

export const DEFAULT_PACKAGES: Package[] = [
  {
    id: '106409c9-1bab-4302-ac1d-8bf9e272c027',
    name: 'Single Room',
    description: 'Targeted hygiene reset for single occupancy bedrooms, student rooms, or self-units.',
    price: 20000,
    formattedPrice: '₦20,000',
    popular: false,
    recommendedFor: '1 Bedroom / Studio Single',
    features: [
      'Comprehensive room dusting & vacuuming',
      'Floor scrubbing & disinfectant wet mopping',
      'Wardrobe & surface contact sanitization',
      'Window sill, frame & mirror wipe down',
      'Cleanique fresh touch finish',
    ],
  },
  {
    id: '59120b58-6a87-4bd3-9ee2-3806d49151c5',
    name: 'Bedsitter',
    description: 'Thorough, top-to-bottom clean for studio living and integrated bed-sitting layouts.',
    price: 25000,
    formattedPrice: '₦25,000',
    popular: false,
    recommendedFor: 'Open-plan Bedsitter units',
    features: [
      'Living & sleep zone sanitization',
      'Kitchenette / cook space counter sanitizing',
      'Floor scrubbing & disinfectant mopping',
      'Mirror, glass & fixture polishing',
      'Under-furniture dusting & vacuuming',
    ],
  },
  {
    id: 'f4600b9b-d54e-4587-8f09-5b6bf78291cc',
    name: 'Self-Contained',
    description: 'Complete restorative cleaning for full self-contained apartments with private washroom.',
    price: 35000,
    formattedPrice: '₦35,000',
    popular: true,
    recommendedFor: 'Studio / 1-Room Self-Contained',
    features: [
      'Dedicated private bathroom descaling & disinfection',
      'Kitchen sink, backsplash & surface degreasing',
      'Main living area vacuum & floor restoration',
      'Door handle, light switch & touchpoint sanitizing',
      'Interior trash empty & disposal',
    ],
  },
  {
    id: 'f4becdd5-d42d-47bf-9c28-4227e7ee6a47',
    name: 'Two-Bedroom',
    description: 'Comprehensive sanitization designed for couples, roommates, and two-bedroom apartments.',
    price: 50000,
    formattedPrice: '₦50,000',
    popular: false,
    recommendedFor: '2-Bedroom Apartments / Flats',
    features: [
      'Deep cleaning for up to 2 bedrooms',
      'Living room & dining area detailing',
      'Full kitchen degrease & appliance exterior scrub',
      'Complete bathroom tile & porcelain sanitization',
      'Baseboard & corners dust extraction',
    ],
  },
  {
    id: '0c869d1f-436e-4c79-8a8f-d9af9d28e302',
    name: 'Three-Bedroom',
    description: 'Full-scale master clean for larger homes and 3-bedroom family residences.',
    price: 65000,
    formattedPrice: '₦65,000',
    popular: false,
    recommendedFor: '3-Bedroom Family Homes',
    features: [
      'Complete service across all 3 bedrooms',
      'Multi-bathroom scrub, descale & shine',
      'Expansive living, lounge & corridor floor care',
      'Kitchen deep cleanse including cabinet fronts',
      'Window ledges, cobweb removal & deodorization',
    ],
  },
];

export const DEFAULT_SERVICES: Service[] = [
  {
    id: '3902a232-06a1-4a3b-a8f1-cdf9e6e92485',
    name: 'Standard Residential Cleaning',
    category: 'residential',
    categoryLabel: 'Residential',
    description: 'Routine and package-based sanitization for rooms, bedsitters, self-contained units, and multi-bedroom apartments.',
    pricingType: 'starting_at',
    displayPrice: 'From ₦20,000',
    badge: 'Fixed Packages Available',
    icon: 'home',
    features: [
      'Includes Single Room, Bedsitter, Self-Contained, 2 & 3 Bedroom packages',
      'Trained & vetted professional cleaning staff',
      'Child & pet-safe hospital-grade sanitizers',
      'Flexible scheduling with prompt arrival',
    ],
  },
  {
    id: '6a4020c9-5361-447c-9e79-369087f4b10d',
    name: 'Deep Cleaning',
    category: 'specialized',
    categoryLabel: 'Specialized',
    description: 'An exhaustive, high-intensity clean targeting accumulated grime, hard water stains, hidden nooks, and high-touch areas.',
    pricingType: 'quote',
    displayPrice: 'Custom Quote',
    badge: 'Custom Quote',
    icon: 'sparkles',
    features: [
      'Detailed grout, tile, and limescale removal',
      'Behind & underneath major appliances',
      'Interior cabinetry & high-reach dusting',
      'Full wall spot-washing and sanitization',
    ],
  },
  {
    id: 'afb4f891-dc8d-41ee-8e8b-07585901dcb2',
    name: 'Move-in / Move-out Cleaning',
    category: 'specialized',
    categoryLabel: 'Specialized',
    description: 'Ensure a pristine handover when transitioning properties. Perfect for landlords, tenants, and real estate managers.',
    pricingType: 'quote',
    displayPrice: 'Custom Quote',
    badge: 'Custom Quote',
    icon: 'truck',
    features: [
      'Deposit-retention standard of clean',
      'Empty space comprehensive floor & wall detailing',
      'Oven, fridge & kitchen cabinet interior sanitizing',
      'Disinfected restrooms ready for immediate handover',
    ],
  },
  {
    id: '02a39f65-1e67-4851-8beb-b28bcbf5b285',
    name: 'Post-Construction Cleaning',
    category: 'specialized',
    categoryLabel: 'Specialized',
    description: 'Heavy-duty post-renovation cleanup removing fine silica dust, paint splatters, adhesive residue, and building debris.',
    pricingType: 'quote',
    displayPrice: 'Custom Quote',
    badge: 'Custom Quote',
    icon: 'hard-hat',
    features: [
      'Industrial HEPA dust extraction & fine residue wipe',
      'Paint drop, cement film & sticker removal',
      'Windows, frames, vents & fixtures detailing',
      'Safe disposal of renovation dust & debris',
    ],
  },
  {
    id: 'f5e0fb72-72b4-4d83-84a9-4d4530328821',
    name: 'Office Cleaning',
    category: 'commercial',
    categoryLabel: 'Commercial',
    description: 'Professional workspace hygiene maintaining productive, spotless work environments for corporate teams and studios.',
    pricingType: 'quote',
    displayPrice: 'Custom Quote',
    badge: 'Corporate Quote',
    icon: 'briefcase',
    features: [
      'Workstation, keyboard & phone sanitization',
      'Conference room & executive office care',
      'Breakroom & employee kitchenette sanitizing',
      'Scheduled after-hours or weekend visits available',
    ],
  },
  {
    id: '4cee048b-123c-476b-b590-140ffc953680',
    name: 'Commercial Cleaning',
    category: 'commercial',
    categoryLabel: 'Commercial',
    description: 'Large-scale cleaning solutions for retail stores, clinics, gyms, schools, and commercial facilities with strict hygiene protocols.',
    pricingType: 'quote',
    displayPrice: 'Custom Quote',
    badge: 'Commercial Quote',
    icon: 'building',
    features: [
      'High-traffic floor buffing & sanitization',
      'Public restroom deep cleansing protocols',
      'Customized cleaning schedules (daily, weekly, monthly)',
      'Dedicated supervisor & compliance checklist',
    ],
  },
];

export const DEFAULT_BANK_DETAILS: BankDetails = {
  bankName: 'PalmPay',
  accountName: 'Precious Onyekachukwu Gold',
  accountNumber: '9162192102',
};

// ─── Services ────────────────────────────────────────────────────────────────

export async function getServices(): Promise<Service[]> {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
    );

    if (!error && data && data.length > 0) {
      return data.map((row) => {
        const fallback = DEFAULT_SERVICES.find(
          (s) => s.id === row.id || s.category === row.slug || s.name.toLowerCase() === row.name?.toLowerCase()
        );
        return {
          id: row.id,
          name: row.name,
          category: (row.slug || fallback?.category || 'residential') as Service['category'],
          categoryLabel: fallback?.categoryLabel || row.name,
          description: row.description || fallback?.description || '',
          pricingType: (row.pricing || fallback?.pricingType || 'quote') as Service['pricingType'],
          displayPrice: row.starting_price ? `From ₦${Number(row.starting_price).toLocaleString()}` : (fallback?.displayPrice || 'Custom Quote'),
          badge: fallback?.badge,
          features: fallback?.features || [],
          icon: fallback?.icon || 'home',
        };
      });
    }
  } catch (err) {
    console.warn('Could not load services from database; serving defaults:', err);
  }

  return DEFAULT_SERVICES;
}

export async function getServiceById(id: string): Promise<Service | undefined> {
  const allServices = await getServices();
  return allServices.find((s) => s.id === id || s.category === id || `srv_${s.category}` === id);
}

// ─── Packages ─────────────────────────────────────────────────────────────────

export async function getPackages(): Promise<Package[]> {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
    );

    if (!error && data && data.length > 0) {
      return data.map((row) => {
        const fallback = DEFAULT_PACKAGES.find(
          (p) => p.id === row.id || p.name.toLowerCase().includes(row.name?.toLowerCase())
        );
        return {
          id: row.id,
          name: row.name,
          description: row.description || fallback?.description || '',
          price: Number(row.price),
          formattedPrice: `₦${Number(row.price).toLocaleString()}`,
          popular: fallback?.popular || false,
          features: fallback?.features || ['Professional space sanitization', 'Eco-friendly disinfectants'],
          recommendedFor: fallback?.recommendedFor || row.name,
        };
      });
    }
  } catch (err) {
    console.warn('Could not load packages from database; serving defaults:', err);
  }

  return DEFAULT_PACKAGES;
}

export async function getPackageById(id: string): Promise<Package | undefined> {
  const allPackages = await getPackages();
  const uuid = PACKAGE_UUID_MAP[id] || id;
  return allPackages.find((p) => p.id === id || p.id === uuid);
}

// ─── Bank Details ──────────────────────────────────────────────────────────────

export async function getBankDetails(): Promise<BankDetails> {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('business_settings')
        .select('*')
        .limit(1)
        .maybeSingle()
    );

    if (!error && data) {
      return {
        bankName: data.bank_name || DEFAULT_BANK_DETAILS.bankName,
        accountName: data.account_name || DEFAULT_BANK_DETAILS.accountName,
        accountNumber: data.account_number || DEFAULT_BANK_DETAILS.accountNumber,
      };
    }
  } catch (err) {
    console.warn('Could not load bank details from database; serving defaults:', err);
  }

  return DEFAULT_BANK_DETAILS;
}

// ─── Status helpers ────────────────────────────────────────────────────────────

export function formatStatusLabel(status: BookingStatus | string): string {
  const s = status?.toLowerCase().replace(/\s+/g, '_');
  switch (s) {
    case 'pending_payment':
      return 'Awaiting payment';
    case 'pending_verification':
      return 'Awaiting verification';
    case 'confirmed':
      return 'Confirmed';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'quote_requested':
      return 'Quote Requested';
    default:
      return status || 'Awaiting verification';
  }
}

// ─── Booking creation (RPC) ────────────────────────────────────────────────────

/**
 * Create a booking via the create_booking RPC.
 * Client NEVER sends prices — prices are computed server-side.
 */
export async function createBooking(
  payload: CreateBookingPayload
): Promise<CreateBookingResponse> {
  if (!payload.customerName || !payload.customerPhone || !payload.customerEmail || !payload.serviceAddress || !payload.scheduledDate) {
    throw new Error('Please fill in all required booking details (Name, Phone, Email, Address, Preferred Date).');
  }

  let serviceSlug = 'residential';
  if (payload.serviceId) {
    const sId = payload.serviceId.toLowerCase();
    if (sId.includes('office')) serviceSlug = 'office';
    else if (sId.includes('commercial')) serviceSlug = 'commercial';
    else if (sId.includes('deep')) serviceSlug = 'deep-cleaning';
    else if (sId.includes('move')) serviceSlug = 'move-in-out';
    else if (sId.includes('construction') || sId.includes('post')) serviceSlug = 'post-construction';
    else serviceSlug = 'residential';
  }

  const isQuote = serviceSlug !== 'residential';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Build p_items containing ONLY package_id and quantity (never prices or totals)
  const itemsList = payload.items || [];
  const p_items = isQuote
    ? []
    : itemsList.map((it) => {
        const pkgUuid =
          PACKAGE_UUID_MAP[it.id] ||
          (uuidRegex.test(it.id) ? it.id : PACKAGE_UUID_MAP['pkg_self_contained']);
        return {
          package_id: pkgUuid,
          quantity: it.quantity || 1,
        };
      });

  if (!isQuote && p_items.length === 0 && payload.packageId) {
    const pkgUuid =
      PACKAGE_UUID_MAP[payload.packageId] ||
      (uuidRegex.test(payload.packageId) ? payload.packageId : PACKAGE_UUID_MAP['pkg_self_contained']);
    p_items.push({ package_id: pkgUuid, quantity: 1 });
  }

  let res;
  try {
    res = await supabase.rpc('create_booking', {
      p_service_slug: serviceSlug,
      p_items: p_items,
      p_name: payload.customerName.trim(),
      p_phone: payload.customerPhone.trim(),
      p_whatsapp: payload.customerWhatsapp?.trim() || null,
      p_email: payload.customerEmail.trim(),
      p_address: payload.serviceAddress.trim(),
      p_date: payload.scheduledDate,
      p_time: payload.scheduledTime?.trim() || null,
      p_notes: payload.notes?.trim() || null,
      p_quote_details: payload.quoteDetails?.trim() || null,
    });
  } catch (err) {
    console.error('create_booking network error:', err);
    throw new Error('Unable to connect to the booking service. Please check your internet connection and try again.', { cause: err });
  }

  if (res.error) {
    console.error('create_booking RPC error:', res.error);
    throw new Error(`Failed to create booking: ${res.error.message}`);
  }

  const row = Array.isArray(res.data) ? res.data[0] : res.data;
  if (!row || !row.reference) {
    throw new Error('Failed to create booking: Server did not return a valid reference.');
  }

  const reference: string = row.reference;
  const accessToken: string = row.access_token;
  const rawStatus: string = row.booking_status || (isQuote ? 'quote_requested' : 'pending_payment');

  let serverTotal: number | undefined;
  let serverDeposit: number | undefined;
  let serverStatus: BookingStatus = isQuote ? 'pending_payment' : 'pending_payment';

  if (!isQuote) {
    const computedTotal = itemsList.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
    serverTotal = computedTotal > 0 ? computedTotal : 35000;
    serverDeposit = Math.round(serverTotal * 0.5);
  }

  try {
    const statusRes = await getBookingStatus(reference, accessToken);
    if (statusRes.total_amount) serverTotal = statusRes.total_amount;
    if (statusRes.deposit_amount) serverDeposit = statusRes.deposit_amount;
    if (statusRes.booking_status) serverStatus = statusRes.booking_status;
  } catch {
    // Ignore error
  }

  return {
    reference,
    access_token: accessToken,
    booking_status: serverStatus || rawStatus,
    message: isQuote
      ? 'Quote request submitted successfully. A Cleanique representative will assess your space details and contact you.'
      : 'Booking request created successfully. Please transfer your deposit to proceed.',
    is_quote: isQuote,
    total_amount: serverTotal,
    deposit_amount: serverDeposit,
    service_name: isQuote ? 'Custom Cleaning Quote' : 'Standard Residential Cleaning',
    scheduledDate: payload.scheduledDate,
    scheduledTime: payload.scheduledTime,
    serviceAddress: payload.serviceAddress.trim(),
    customerName: payload.customerName.trim(),
    customerPhone: payload.customerPhone.trim(),
    customerEmail: payload.customerEmail.trim(),
    customerWhatsapp: payload.customerWhatsapp?.trim(),
    quoteDetails: payload.quoteDetails?.trim(),
    items: payload.items || [],
  };
}

// ─── Booking status (RPC) ──────────────────────────────────────────────────────

export async function getBookingStatus(
  reference: string,
  token: string
): Promise<BookingStatusResponse> {
  const { data, error } = await supabase.rpc('get_booking_status', {
    p_ref: reference,
    p_token: token,
  });

  if (error) {
    throw new Error(error.message || 'Unable to retrieve booking status.');
  }

  const rpcData = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;
  if (!rpcData) {
    throw new Error('Booking not found or access denied.');
  }

  const rawStatus = (rpcData.booking_status as string) || 'pending_payment';
  const lower = rawStatus.toLowerCase().replace(/\s+/g, '_');
  let normalizedStatus: BookingStatus;
  if (lower.includes('confirm')) normalizedStatus = 'confirmed';
  else if (lower.includes('verif')) normalizedStatus = 'pending_verification';
  else if (lower.includes('complet')) normalizedStatus = 'completed';
  else if (lower.includes('cancel')) normalizedStatus = 'cancelled';
  else normalizedStatus = 'pending_payment';

  const items = await getBookingItems(reference, token);

  return {
    reference: reference,
    access_token: token,
    booking_status: normalizedStatus,
    status_label: formatStatusLabel(normalizedStatus),
    is_quote: (rpcData.is_quote as boolean) || false,
    service_name: (rpcData.service_name as string) || 'Residential Cleaning',
    package_name: (rpcData.package_name as string) || undefined,
    total_amount: rpcData.total_amount ? Number(rpcData.total_amount) : undefined,
    deposit_amount: rpcData.deposit_required ? Number(rpcData.deposit_required) : undefined,
    customer_name: (rpcData.customer_name as string) || (rpcData.name as string) || 'Client',
    customer_phone: (rpcData.phone as string) || (rpcData.customer_phone as string) || '',
    customer_email: (rpcData.email as string) || (rpcData.customer_email as string) || undefined,
    customer_whatsapp: (rpcData.whatsapp as string) || (rpcData.customer_whatsapp as string) || undefined,
    service_address: (rpcData.address as string) || (rpcData.service_address as string) || '',
    scheduled_date: (rpcData.preferred_date as string) || (rpcData.scheduled_date as string) || new Date().toISOString().split('T')[0],
    scheduled_time: (rpcData.preferred_time as string) || (rpcData.scheduled_time as string) || undefined,
    receipt_filename: (rpcData.receipt_filename as string) || undefined,
    receipt_uploaded_at: (rpcData.receipt_uploaded_at as string) || undefined,
    notes: (rpcData.notes as string) || undefined,
    quote_details: (rpcData.quote_details as string) || undefined,
    quote_message: (rpcData.quote_message as string) || undefined,
    items,
  };
}

// ─── Booking items (RPC) ───────────────────────────────────────────────────────

export async function getBookingItems(
  reference: string,
  token: string
): Promise<CartItemSummary[]> {
  try {
    const { data, error } = await supabase.rpc('get_booking_items', {
      p_ref: reference,
      p_token: token,
    });

    if (!error && Array.isArray(data)) {
      return data.map((item: Record<string, unknown>) => {
        const priceNum = item.unit_price || item.price;
        const numVal = priceNum ? Number(priceNum) : null;
        return {
          id: (item.package_id as string) || (item.id as string) || `item_${Math.random()}`,
          name: (item.package_name as string) || (item.name as string) || 'Cleaning Item',
          quantity: Number(item.quantity || 1),
          price: numVal,
          formattedPrice: numVal ? `₦${numVal.toLocaleString()}` : 'Included',
          isQuote: false,
        };
      });
    }
  } catch (err) {
    console.warn('get_booking_items RPC notice:', err);
  }
  return [];
}

// ─── Receipt upload ────────────────────────────────────────────────────────────

/**
 * Submit payment receipt following real Edge Function + Storage upload + attach_receipt RPC flow.
 */
export async function submitReceipt(
  reference: string,
  token: string,
  file: File
): Promise<SubmitReceiptResponse> {
  // Step 1: Validate type and size in browser
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    const err = new Error('Invalid file format. Please upload JPG, PNG, or PDF receipts only.');
    console.error('Receipt validation error:', err);
    throw err;
  }

  const MAX_SIZE = 5242880; // 5MB
  if (file.size <= 0 || file.size > MAX_SIZE) {
    const err = new Error('Invalid file size. File must be greater than 0B and no larger than 5MB.');
    console.error('Receipt size error:', err);
    throw err;
  }

  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const cleanBaseUrl = supabaseUrl.replace(/\/+$/, '');
  const anonKey =
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string);

  const edgeUrl = `${cleanBaseUrl}/functions/v1/receipt-upload-url`;
  let uploadUrlRes: Response;
  try {
    uploadUrlRes = await fetch(edgeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        reference,
        token,
        mime: file.type,
        size: file.size,
      }),
    });
  } catch (err) {
    console.error('Receipt upload network error:', err);
    throw new Error('Network failure: Unable to connect to receipt upload service.', { cause: err });
  }

  if (!uploadUrlRes.ok) {
    const errBody = await uploadUrlRes.json().catch(() => ({}));
    console.error('Receipt Edge Function HTTP error:', uploadUrlRes.status, errBody);
    if (uploadUrlRes.status === 403) {
      throw new Error('403 Invalid booking access: Verification failed for reference or token.');
    }
    throw new Error(errBody.error || `Upload authorization failed (HTTP ${uploadUrlRes.status}).`);
  }

  const { path, token: signedToken } = await uploadUrlRes.json().catch(() => ({}));
  if (!path || !signedToken) {
    throw new Error('Server returned an invalid signed upload URL.');
  }

  const { error: storageErr } = await supabase.storage
    .from('payment-receipts')
    .uploadToSignedUrl(path, signedToken, file, { contentType: file.type });

  if (storageErr) {
    console.error('Storage upload failure:', storageErr);
    throw new Error(`Storage upload failure: ${storageErr.message}`);
  }

  const { error: rpcError } = await supabase.rpc('attach_receipt', {
    p_ref: reference,
    p_token: token,
    p_path: path,
    p_mime: file.type,
    p_size: file.size,
  });

  if (rpcError) {
    console.error('attach_receipt RPC failure:', rpcError);
    throw new Error(`attach_receipt failure: ${rpcError.message}`);
  }

  // Return EXACT mandatory confirmation message
  return {
    success: true,
    booking_status: 'pending_verification',
    message:
      'Your payment details have been submitted. Your booking will be confirmed after Cleanique verifies the payment.',
  };
}

export { CLEANIQUE_BANK_DETAILS } from './bankDetails';
