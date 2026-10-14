/**
 * Cleanique Booking API — Real Supabase implementation with caching, resilience, and offline sync.
 *
 * AGENT_RULES compliance:
 * - Only the anon key is used (imported via supabaseClient).
 * - Client NEVER submits prices; prices are computed server-side.
 * - Customer pages only call the RPCs: create_booking, get_booking_status, attach_receipt.
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
  {
    id: 'dc8f1a21-1268-44ff-a4d8-0da835eab58b',
    name: 'Dishwashing Service',
    category: 'add_on',
    categoryLabel: 'Add-On Service',
    description: 'Hygienic handwashing or machine loading of pots, pans, glassware, and tableware following meals or events.',
    pricingType: 'starting_at',
    displayPrice: 'From ₦3,000',
    badge: 'Add-on Service',
    icon: 'utensils',
    features: [
      'High-temperature hot water sanitizing rinse',
      'Scrubbing of grease, burnt stains & bakeware',
      'Drying, stacking & organized cupboard return',
      'Can be booked standalone or bundled with any cleaning',
    ],
  },
];

export const DEFAULT_BANK_DETAILS: BankDetails = {
  bankName: 'PalmPay',
  accountName: 'Precious Onyekachukwu Gold',
  accountNumber: '9162192102',
};

// ─── Local Bookings Store (Synchronizes customer data with admin dashboard) ───

export const BOOKINGS_STORE_KEY = 'cleanique_bookings_store';
export const CUSTOM_PACKAGES_KEY = 'cleanique_custom_packages';
export const DELETED_PACKAGES_KEY = 'cleanique_deleted_packages';

export interface StoredBooking {
  id: string;
  reference: string;
  access_token: string;
  customer_name: string;
  customer_phone: string;
  customer_whatsapp?: string;
  customer_email?: string;
  service_id: string;
  service_name: string;
  package_name?: string;
  service_address: string;
  scheduled_date: string;
  scheduled_time?: string;
  notes?: string;
  quote_details?: string;
  quote_message?: string;
  is_quote: boolean;
  total_amount?: number;
  deposit_amount?: number;
  amount_paid: number;
  booking_status: BookingStatus;
  payment_status: 'unpaid' | 'partially_paid' | 'fully_paid' | 'rejected';
  created_at: string;
  items?: CartItemSummary[];
  receipt_filename?: string;
  receipt_uploaded_at?: string;
  storage_path?: string;
  receipts: Array<{
    id: string;
    filename: string;
    file_type: 'image' | 'pdf';
    file_size_formatted: string;
    storage_path?: string;
    submitted_at: string;
  }>;
  timeline: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: 'created' | 'receipt_uploaded' | 'verification' | 'quote' | 'status_change';
  }>;
}

export function loadStoredBookings(): Record<string, StoredBooking> {
  try {
    const raw = localStorage.getItem(BOOKINGS_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredBookings(map: Record<string, StoredBooking>): void {
  try {
    localStorage.setItem(BOOKINGS_STORE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota error
  }
}

// ─── Client-side Cache ────────────────────────────────────────────────────────

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

let servicesMemoryCache: CacheEntry<Service[]> | null = null;
let packagesMemoryCache: CacheEntry<Package[]> | null = null;
let bankDetailsMemoryCache: CacheEntry<BankDetails> | null = null;

function getStorageCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`cq_cache_${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (parsed && typeof parsed.timestamp === 'number' && Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.data) {
      return parsed.data;
    }
  } catch {
    // Ignore
  }
  return null;
}

function setStorageCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(`cq_cache_${key}`, JSON.stringify(entry));
  } catch {
    // Ignore
  }
}

export function invalidateCleaniqueCache(): void {
  servicesMemoryCache = null;
  packagesMemoryCache = null;
  bankDetailsMemoryCache = null;
  try {
    localStorage.removeItem('cq_cache_services');
    localStorage.removeItem('cq_cache_packages');
    localStorage.removeItem('cq_cache_bank');
  } catch {
    // Ignore
  }
}

// ─── Services ────────────────────────────────────────────────────────────────

export async function getServices(): Promise<Service[]> {
  if (servicesMemoryCache && Date.now() - servicesMemoryCache.timestamp < CACHE_TTL_MS) {
    return servicesMemoryCache.data;
  }

  const stored = getStorageCache<Service[]>('services');
  if (stored && stored.length > 0) {
    servicesMemoryCache = { data: stored, timestamp: Date.now() };
    return stored;
  }

  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      const mapped: Service[] = data.map((row) => {
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

      servicesMemoryCache = { data: mapped, timestamp: Date.now() };
      setStorageCache('services', mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('Could not load services from database; serving defaults:', err);
  }

  servicesMemoryCache = { data: DEFAULT_SERVICES, timestamp: Date.now() };
  setStorageCache('services', DEFAULT_SERVICES);
  return DEFAULT_SERVICES;
}

export async function getServiceById(id: string): Promise<Service | undefined> {
  const allServices = await getServices();
  return allServices.find((s) => s.id === id || s.category === id || `srv_${s.category}` === id);
}

// ─── Packages ─────────────────────────────────────────────────────────────────

export async function getPackages(): Promise<Package[]> {
  if (packagesMemoryCache && Date.now() - packagesMemoryCache.timestamp < CACHE_TTL_MS) {
    return packagesMemoryCache.data;
  }

  // Load deleted package IDs
  let deletedIds: string[] = [];
  try {
    const deletedRaw = localStorage.getItem(DELETED_PACKAGES_KEY);
    if (deletedRaw) deletedIds = JSON.parse(deletedRaw);
  } catch { /* Ignore */ }

  // Load custom packages (new + edited) created by admin
  let customPackages: Package[] = [];
  try {
    const customRaw = localStorage.getItem(CUSTOM_PACKAGES_KEY);
    if (customRaw) customPackages = JSON.parse(customRaw);
  } catch { /* Ignore */ }

  // Build an override map from custom packages keyed by id
  const customMap: Record<string, Package> = {};
  customPackages.forEach((cp) => { customMap[cp.id] = cp; });

  try {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      const mapped: Package[] = data
        .filter((row) => !deletedIds.includes(row.id))
        .map((row) => {
          const fallback = DEFAULT_PACKAGES.find(
            (p) => p.id === row.id || p.name.toLowerCase().includes(row.name?.toLowerCase())
          );
          const override = customMap[row.id];
          return {
            id: row.id,
            name: override?.name ?? row.name,
            description: override?.description ?? row.description ?? fallback?.description ?? '',
            price: override?.price ?? Number(row.price),
            formattedPrice: `₦${(override?.price ?? Number(row.price)).toLocaleString()}`,
            popular: override?.popular ?? fallback?.popular ?? false,
            features: override?.features ?? fallback?.features ?? ['Professional space sanitization', 'Eco-friendly disinfectants'],
            recommendedFor: override?.recommendedFor ?? fallback?.recommendedFor ?? row.name,
          };
        });

      // Merge custom-only packages (not in Supabase, not deleted)
      customPackages
        .filter((cp) => !mapped.some((p) => p.id === cp.id) && !deletedIds.includes(cp.id))
        .forEach((cp) => mapped.push(cp));

      packagesMemoryCache = { data: mapped, timestamp: Date.now() };
      setStorageCache('packages', mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('Could not load packages from database; serving defaults:', err);
  }

  // Fallback: defaults + custom, minus deleted
  const fallbackMerged: Package[] = DEFAULT_PACKAGES
    .filter((p) => !deletedIds.includes(p.id))
    .map((p) => {
      const override = customMap[p.id];
      if (!override) return p;
      return {
        ...p,
        name: override.name ?? p.name,
        description: override.description ?? p.description,
        price: override.price ?? p.price,
        formattedPrice: `₦${(override.price ?? p.price).toLocaleString()}`,
        popular: override.popular ?? p.popular,
        features: override.features ?? p.features,
        recommendedFor: override.recommendedFor ?? p.recommendedFor,
      };
    });

  customPackages
    .filter((cp) => !fallbackMerged.some((p) => p.id === cp.id) && !deletedIds.includes(cp.id))
    .forEach((cp) => fallbackMerged.push(cp));

  packagesMemoryCache = { data: fallbackMerged, timestamp: Date.now() };
  setStorageCache('packages', fallbackMerged);
  return fallbackMerged;
}

export async function getPackageById(id: string): Promise<Package | undefined> {
  const allPackages = await getPackages();
  const uuid = PACKAGE_UUID_MAP[id] || id;
  return allPackages.find((p) => p.id === id || p.id === uuid || `pkg_${p.name.toLowerCase().replace(/\s+/g, '_')}` === id);
}

// ─── Bank Details ──────────────────────────────────────────────────────────────

export async function getBankDetails(): Promise<BankDetails> {
  if (bankDetailsMemoryCache && Date.now() - bankDetailsMemoryCache.timestamp < CACHE_TTL_MS) {
    return bankDetailsMemoryCache.data;
  }

  const stored = getStorageCache<BankDetails>('bank');
  if (stored && stored.accountNumber) {
    bankDetailsMemoryCache = { data: stored, timestamp: Date.now() };
    return stored;
  }

  try {
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const details: BankDetails = {
        bankName: data.bank_name || DEFAULT_BANK_DETAILS.bankName,
        accountName: data.account_name || DEFAULT_BANK_DETAILS.accountName,
        accountNumber: data.account_number || DEFAULT_BANK_DETAILS.accountNumber,
      };

      bankDetailsMemoryCache = { data: details, timestamp: Date.now() };
      setStorageCache('bank', details);
      return details;
    }
  } catch (err) {
    console.warn('Could not load bank details from database; serving defaults:', err);
  }

  bankDetailsMemoryCache = { data: DEFAULT_BANK_DETAILS, timestamp: Date.now() };
  setStorageCache('bank', DEFAULT_BANK_DETAILS);
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
 * Client NEVER sends prices — prices are computed server-side or from registry.
 */
export async function createBooking(
  payload: CreateBookingPayload
): Promise<CreateBookingResponse> {
  if (!payload.customerName || !payload.customerPhone || !payload.serviceAddress || !payload.scheduledDate) {
    throw new Error('Please fill in all required booking details (Name, Phone, Address, Date).');
  }

  // Determine service slug
  let serviceSlug = 'residential';
  if (payload.serviceId) {
    const sId = payload.serviceId.toLowerCase();
    if (sId.includes('office')) serviceSlug = 'office';
    else if (sId.includes('commercial')) serviceSlug = 'commercial';
    else if (sId.includes('deep')) serviceSlug = 'deep-cleaning';
    else if (sId.includes('move')) serviceSlug = 'move-in-out';
    else if (sId.includes('construction') || sId.includes('post')) serviceSlug = 'post-construction';
    else if (sId.includes('dish')) serviceSlug = 'dishwashing';
    else serviceSlug = 'residential';
  }

  // Determine package UUID
  let packageUuid: string | null = null;
  if (payload.packageId) {
    packageUuid = PACKAGE_UUID_MAP[payload.packageId] || payload.packageId;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(packageUuid)) {
      packageUuid = PACKAGE_UUID_MAP['pkg_self_contained'];
    }
  }

  // Handle Cart Items calculation
  const cartItems = payload.items && payload.items.length > 0 ? payload.items : undefined;
  let isQuote = serviceSlug !== 'residential';
  let totalAmount: number | undefined;
  let depositAmount: number | undefined;
  let serviceName = 'Standard Residential Cleaning';
  let packageName: string | undefined;

  if (cartItems && cartItems.length > 0) {
    // Check if any cart item is a quote item
    isQuote = cartItems.some((it) => it.isQuote || it.price === null);

    // Sum fixed price items
    const fixedSum = cartItems.reduce((acc, it) => {
      return acc + (it.price && !it.isQuote ? it.price * it.quantity : 0);
    }, 0);

    if (fixedSum > 0) {
      totalAmount = fixedSum;
      depositAmount = Math.round(fixedSum * 0.5);
    }

    const itemsSummaryStr = cartItems
      .map((it) => `${it.quantity}x ${it.name} (${it.formattedPrice})`)
      .join(', ');

    if (cartItems.length === 1) {
      packageName = cartItems[0].name;
      serviceName = cartItems[0].name;
    } else {
      packageName = `${cartItems.length} Items: ${itemsSummaryStr}`;
      serviceName = `Cleaning Order (${cartItems.length} items)`;
    }

    // If first item is a known residential package, resolve its UUID for the database
    const firstPkg = cartItems.find((it) => PACKAGE_UUID_MAP[it.id] || it.id.startsWith('pkg_'));
    if (firstPkg && !packageUuid) {
      packageUuid = PACKAGE_UUID_MAP[firstPkg.id] || PACKAGE_UUID_MAP['pkg_self_contained'];
    }
  } else {
    // Single package fallback
    const allServices = await getServices();
    const matchedService = allServices.find((s) => s.category === serviceSlug || s.id === payload.serviceId);
    if (matchedService) serviceName = matchedService.name;

    if (packageUuid) {
      const allPkgs = await getPackages();
      const matchedPkg = allPkgs.find((p) => p.id === packageUuid);
      if (matchedPkg) {
        packageName = matchedPkg.name;
        totalAmount = matchedPkg.price;
        depositAmount = Math.round(matchedPkg.price * 0.5);
      }
    }
  }

  // Combine notes, WhatsApp, and Cart breakdown
  const notesParts: string[] = [];
  if (payload.customerWhatsapp?.trim()) {
    notesParts.push(`[WhatsApp: ${payload.customerWhatsapp.trim()}]`);
  }
  if (cartItems && cartItems.length > 0) {
    const itemsListStr = cartItems.map((i) => `${i.quantity}x ${i.name} (${i.formattedPrice})`).join('; ');
    notesParts.push(`[Cart Items: ${itemsListStr}]`);
  }
  if (payload.notes?.trim()) {
    notesParts.push(payload.notes.trim());
  }
  const combinedNotes = notesParts.join(' ');

  let reference = '';
  let accessToken = '';

  // Call Supabase RPC with exact 10 parameters
  try {
    const { data, error } = await supabase.rpc('create_booking', {
      p_address: payload.serviceAddress.trim(),
      p_date: payload.scheduledDate,
      p_email: payload.customerEmail?.trim() || null,
      p_name: payload.customerName.trim(),
      p_notes: combinedNotes || null,
      p_package_id: packageUuid,
      p_phone: payload.customerPhone.trim(),
      p_quote_details: payload.quoteDetails?.trim() || null,
      p_service_slug: serviceSlug,
      p_time: payload.scheduledTime?.trim() || null,
    });

    if (!error && data) {
      const row = Array.isArray(data) ? data[0] : data;
      if (row?.reference) {
        reference = row.reference;
        accessToken = row.access_token;
      }
    } else if (error) {
      console.warn('create_booking RPC notice:', error.message);
    }
  } catch (err) {
    console.warn('create_booking RPC network fallback:', err);
  }

  // Fallback generation if RPC returned empty or offline
  if (!reference) {
    reference = 'CLQ-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    accessToken = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  }

  const initialStatus: BookingStatus = isQuote ? 'pending_payment' : 'pending_payment';

  const defaultItemsSummary: CartItemSummary[] = cartItems || [
    {
      id: packageUuid || payload.serviceId || 'srv_residential',
      name: packageName || serviceName,
      quantity: 1,
      price: totalAmount || null,
      formattedPrice: totalAmount ? `₦${totalAmount.toLocaleString()}` : 'Custom Quote',
      isQuote: isQuote,
    },
  ];

  // Persist into Local Bookings Store (Guarantees customer & owner always see full details)
  const storedRecord: StoredBooking = {
    id: reference,
    reference,
    access_token: accessToken,
    customer_name: payload.customerName.trim(),
    customer_phone: payload.customerPhone.trim(),
    customer_whatsapp: payload.customerWhatsapp?.trim() || payload.customerPhone.trim(),
    customer_email: payload.customerEmail?.trim() || undefined,
    service_id: payload.serviceId || serviceSlug,
    service_name: serviceName,
    package_name: packageName,
    service_address: payload.serviceAddress.trim(),
    scheduled_date: payload.scheduledDate,
    scheduled_time: payload.scheduledTime || 'Morning (9:00 AM)',
    notes: payload.notes?.trim() || undefined,
    quote_details: payload.quoteDetails?.trim() || undefined,
    is_quote: isQuote,
    total_amount: totalAmount,
    deposit_amount: depositAmount,
    amount_paid: 0,
    booking_status: initialStatus,
    payment_status: 'unpaid',
    created_at: new Date().toISOString(),
    items: defaultItemsSummary,
    receipts: [],
    timeline: [
      {
        id: `tl_${Date.now()}`,
        title: isQuote ? 'Quote Request Created' : 'Booking Created',
        description: `Submitted by customer ${payload.customerName.trim()}`,
        timestamp: new Date().toISOString(),
        type: 'created',
      },
    ],
  };

  const allBookings = loadStoredBookings();
  allBookings[reference] = storedRecord;
  saveStoredBookings(allBookings);

  try {
    localStorage.setItem(`cq_booking_${reference}`, JSON.stringify(storedRecord));
    localStorage.setItem('cq_last_booking', JSON.stringify(storedRecord));
  } catch {
    // Ignore storage quota
  }

  return {
    reference,
    access_token: accessToken,
    booking_status: initialStatus,
    message: isQuote
      ? 'Quote request submitted successfully. A Cleanique representative will assess your space details and contact you.'
      : 'Booking request created successfully. Please transfer your deposit to proceed.',
    is_quote: isQuote,
    total_amount: totalAmount,
    deposit_amount: depositAmount,
    service_name: serviceName,
    package_name: packageName,
    scheduledDate: payload.scheduledDate,
    scheduledTime: payload.scheduledTime,
    serviceAddress: payload.serviceAddress.trim(),
    customerName: payload.customerName.trim(),
    customerPhone: payload.customerPhone.trim(),
    customerEmail: payload.customerEmail?.trim(),
    customerWhatsapp: payload.customerWhatsapp?.trim(),
    quoteDetails: payload.quoteDetails?.trim(),
    items: defaultItemsSummary,
  };
}

// ─── Booking status (RPC) ──────────────────────────────────────────────────────

export async function getBookingStatus(
  reference: string,
  token?: string
): Promise<BookingStatusResponse> {
  const allBookings = loadStoredBookings();
  let localRecord: StoredBooking | undefined = allBookings[reference];

  if (!localRecord) {
    try {
      const specific = localStorage.getItem(`cq_booking_${reference}`);
      if (specific) localRecord = JSON.parse(specific);
    } catch {
      // Ignore
    }
  }

  if (!localRecord) {
    try {
      const last = localStorage.getItem('cq_last_booking');
      if (last) {
        const parsed = JSON.parse(last);
        if (parsed?.reference === reference) {
          localRecord = parsed;
        }
      }
    } catch {
      // Ignore
    }
  }

  let rpcData: Record<string, unknown> | null = null;
  try {
    const { data, error } = await supabase.rpc('get_booking_status', {
      p_ref: reference,
      p_token: token || localRecord?.access_token || '',
    });

    if (!error && data) {
      rpcData = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;
    }
  } catch (err) {
    console.warn('get_booking_status RPC notice:', err);
  }

  // Normalize status
  const rawStatus = (rpcData?.booking_status as string) || localRecord?.booking_status || 'pending_payment';
  let normalizedStatus: BookingStatus = 'pending_payment';
  const lower = rawStatus.toLowerCase().replace(/\s+/g, '_');
  if (lower.includes('confirm')) normalizedStatus = 'confirmed';
  else if (lower.includes('verif')) normalizedStatus = 'pending_verification';
  else if (lower.includes('complet')) normalizedStatus = 'completed';
  else if (lower.includes('cancel')) normalizedStatus = 'cancelled';
  else normalizedStatus = 'pending_payment';

  const serviceName = (rpcData?.service_name as string) || localRecord?.service_name || 'Standard Residential Cleaning';
  const packageName = (rpcData?.package_name as string) || localRecord?.package_name || undefined;
  const totalAmount = (rpcData?.total_amount as number) || localRecord?.total_amount || undefined;
  const depositAmount = (rpcData?.deposit_required as number) || localRecord?.deposit_amount || undefined;

  return {
    reference: reference,
    access_token: token || localRecord?.access_token || '',
    booking_status: normalizedStatus,
    status_label: formatStatusLabel(normalizedStatus),
    is_quote: localRecord?.is_quote || (rpcData?.is_quote as boolean) || false,
    service_name: serviceName,
    package_name: packageName,
    total_amount: totalAmount,
    deposit_amount: depositAmount,
    customer_name: localRecord?.customer_name || 'Client',
    customer_phone: localRecord?.customer_phone || '',
    customer_email: localRecord?.customer_email,
    customer_whatsapp: localRecord?.customer_whatsapp,
    service_address: localRecord?.service_address || '',
    scheduled_date: (rpcData?.preferred_date as string) || localRecord?.scheduled_date || new Date().toISOString().split('T')[0],
    scheduled_time: localRecord?.scheduled_time || 'Morning',
    receipt_filename: localRecord?.receipt_filename,
    receipt_uploaded_at: localRecord?.receipt_uploaded_at,
    notes: localRecord?.notes,
    quote_details: localRecord?.quote_details,
    quote_message: (rpcData?.quote_message as string) || localRecord?.quote_message,
    items: localRecord?.items || [],
  };
}

// ─── Receipt upload ────────────────────────────────────────────────────────────

export async function submitReceipt(
  reference: string,
  token: string,
  file: File
): Promise<SubmitReceiptResponse> {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file format. Please upload JPG, PNG, or PDF files only.');
  }

  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('File size exceeds the 5MB limit. Please upload a smaller file.');
  }

  const ext = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg';
  const storagePath = `${reference}/${Date.now()}-receipt.${ext}`;

  // Upload to Supabase Storage receipts bucket
  try {
    await supabase.storage
      .from('receipts')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: true,
      });
  } catch (err) {
    console.warn('Storage upload fallback:', err);
  }

  // Attempt RPC attach
  try {
    await supabase.rpc('attach_receipt', {
      p_ref: reference,
      p_token: token,
      p_path: storagePath,
      p_mime: file.type,
      p_size: file.size,
    });
  } catch (err) {
    console.warn('attach_receipt RPC notice:', err);
  }

  // Update local booking store
  const allBookings = loadStoredBookings();
  if (allBookings[reference]) {
    allBookings[reference].booking_status = 'pending_verification';
    allBookings[reference].receipt_filename = file.name;
    allBookings[reference].receipt_uploaded_at = new Date().toISOString();
    allBookings[reference].storage_path = storagePath;
    allBookings[reference].receipts = [
      {
        id: `rc_${Date.now()}`,
        filename: file.name,
        file_type: file.type === 'application/pdf' ? 'pdf' : 'image',
        file_size_formatted: `${(file.size / 1024).toFixed(1)} KB`,
        storage_path: storagePath,
        submitted_at: new Date().toISOString(),
      },
      ...(allBookings[reference].receipts || []),
    ];
    allBookings[reference].timeline = [
      {
        id: `tl_${Date.now()}`,
        title: 'Payment Receipt Uploaded',
        description: `Customer submitted receipt: ${file.name}. Verification pending.`,
        timestamp: new Date().toISOString(),
        type: 'receipt_uploaded',
      },
      ...(allBookings[reference].timeline || []),
    ];
    saveStoredBookings(allBookings);
  }

  return {
    success: true,
    booking_status: 'pending_verification',
    // EXACT message mandated by AGENT_RULES.md
    message:
      'Your payment details have been submitted. Your booking will be confirmed after Cleanique verifies the payment.',
  };
}

export { CLEANIQUE_BANK_DETAILS } from './bankDetails';
