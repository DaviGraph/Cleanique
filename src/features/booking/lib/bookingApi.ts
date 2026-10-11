import type {
  Service,
  Package,
  CreateBookingPayload,
  CreateBookingResponse,
  BookingStatus,
  BookingStatusResponse,
  SubmitReceiptResponse,
} from '../types';
import { CLEANIQUE_BANK_DETAILS } from './bankDetails';

export { CLEANIQUE_BANK_DETAILS };

/**
 * Mock data source for Cleanique cleaning packages.
 * In accordance with AGENT_RULES.md:
 * - Prices are strictly read from the data source and displayed to users.
 * - Client pages never submit prices directly to the backend.
 */
const MOCK_PACKAGES: Package[] = [
  {
    id: 'pkg_single_room',
    name: 'Single Room',
    description: 'Targeted, meticulous cleaning for private compact spaces and student rooms.',
    price: 20000,
    formattedPrice: '₦20,000',
    popular: false,
    recommendedFor: '1 Room / Compact Space',
    features: [
      'Comprehensive floor sweep & deep mop',
      'Surface dusting, wipe down & polish',
      'Trash removal & bin relining',
      'Interior window sill wipe down',
      'Cleanique fresh touch finish',
    ],
  },
  {
    id: 'pkg_bedsitter',
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
    id: 'pkg_self_contained',
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
    id: 'pkg_two_bedroom',
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
    id: 'pkg_three_bedroom',
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

/**
 * Mock data source for Cleanique cleaning services, including quote-based and specialized offerings.
 */
const MOCK_SERVICES: Service[] = [
  {
    id: 'srv_residential',
    name: 'Standard Residential Cleaning',
    category: 'residential',
    categoryLabel: 'Residential',
    description: 'Routine and package-based sanitization for rooms, bedsitters, self-contained units, and multi-bedroom apartments.',
    pricingType: 'fixed',
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
    id: 'srv_deep_clean',
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
    id: 'srv_move_in_out',
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
    id: 'srv_post_construction',
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
    id: 'srv_office',
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
    id: 'srv_commercial',
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
    id: 'srv_dishwashing',
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

/**
 * In-memory & LocalStorage storage store for mock bookings.
 */
const STORAGE_KEY = 'cleanique_mock_bookings';

interface StoredBooking {
  reference: string;
  access_token: string;
  booking_status: BookingStatus;
  is_quote: boolean;
  service_name: string;
  package_name?: string;
  total_amount?: number;
  deposit_amount?: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  service_address: string;
  scheduled_date: string;
  scheduled_time?: string;
  receipt_filename?: string;
  receipt_uploaded_at?: string;
  notes?: string;
  quote_details?: string;
}

function loadStoredBookings(): Record<string, StoredBooking> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredBookings(data: Record<string, StoredBooking>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors in test environments
  }
}

/**
 * Fetch all available Cleanique services.
 * All frontend components must read service data exclusively through this function.
 */
export async function getServices(): Promise<Service[]> {
  await new Promise((resolve) => setTimeout(resolve, 80));
  return [...MOCK_SERVICES];
}

/**
 * Fetch a single service by ID.
 */
export async function getServiceById(id: string): Promise<Service | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return MOCK_SERVICES.find((s) => s.id === id);
}

/**
 * Fetch all residential cleaning packages with fixed transparent pricing.
 * Prices are strictly read from this source to guarantee pricing integrity.
 */
export async function getPackages(): Promise<Package[]> {
  await new Promise((resolve) => setTimeout(resolve, 80));
  return [...MOCK_PACKAGES];
}

/**
 * Fetch a single package by ID.
 */
export async function getPackageById(id: string): Promise<Package | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return MOCK_PACKAGES.find((p) => p.id === id);
}

/**
 * Helper to generate reference formatted like CLQ-A1B2C3
 */
function generateReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CLQ-${code}`;
}

/**
 * Helper to generate fake access token
 */
function generateAccessToken(): string {
  return `clq_tok_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
}

/**
 * Map internal booking status to client label.
 * Specifically satisfies requirement: Map "Pending Verification" to "Awaiting verification".
 */
export function formatStatusLabel(status: BookingStatus): string {
  switch (status) {
    case 'pending_payment':
      return 'Awaiting payment';
    case 'pending_verification':
      return 'Awaiting verification';
    case 'confirmed':
      return 'Confirmed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Awaiting verification';
  }
}

/**
 * Mock implementation of create_booking RPC.
 * Enforces security rule: Client never sends prices; prices are determined server-side from MOCK_PACKAGES.
 */
export async function createBooking(
  payload: CreateBookingPayload
): Promise<CreateBookingResponse> {
  await new Promise((resolve) => setTimeout(resolve, 150));

  if (!payload.customerName || !payload.customerPhone || !payload.serviceAddress || !payload.scheduledDate) {
    throw new Error('Please fill in all required booking details (Name, Phone, Address, Date).');
  }

  const reference = generateReference();
  const accessToken = generateAccessToken();

  const service = payload.serviceId
    ? MOCK_SERVICES.find((s) => s.id === payload.serviceId)
    : undefined;

  const pkg = payload.packageId
    ? MOCK_PACKAGES.find((p) => p.id === payload.packageId)
    : undefined;

  // Fixed packages require a 50% deposit transfer; quote requests await review
  const isQuote = !pkg || service?.pricingType === 'quote';
  const initialStatus: BookingStatus = isQuote ? 'pending_verification' : 'pending_payment';

  const totalAmount = pkg ? pkg.price : undefined;
  const depositAmount = totalAmount ? Math.round(totalAmount * 0.5) : undefined;
  const serviceName = service?.name || (pkg ? 'Residential Cleaning' : 'Custom Cleaning');

  // Persist to mock storage for status retrieval
  const stored: StoredBooking = {
    reference,
    access_token: accessToken,
    booking_status: initialStatus,
    is_quote: isQuote,
    service_name: serviceName,
    package_name: pkg?.name,
    total_amount: totalAmount,
    deposit_amount: depositAmount,
    customer_name: payload.customerName,
    customer_phone: payload.customerPhone,
    customer_email: payload.customerEmail,
    service_address: payload.serviceAddress,
    scheduled_date: payload.scheduledDate,
    scheduled_time: payload.scheduledTime,
    notes: payload.notes,
    quote_details: payload.quoteDetails,
  };

  const allBookings = loadStoredBookings();
  allBookings[reference] = stored;
  saveStoredBookings(allBookings);

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
    package_name: pkg?.name,
    scheduledDate: payload.scheduledDate,
    scheduledTime: payload.scheduledTime,
    serviceAddress: payload.serviceAddress,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    customerEmail: payload.customerEmail,
    quoteDetails: payload.quoteDetails,
  };
}

/**
 * Mock implementation of get_booking_status RPC.
 * Reads the booking status by reference and token.
 */
export async function getBookingStatus(
  reference: string,
  token?: string
): Promise<BookingStatusResponse> {
  await new Promise((resolve) => setTimeout(resolve, 120));

  const allBookings = loadStoredBookings();
  let booking = allBookings[reference];

  if (!booking) {
    // If not found in localStorage (e.g. testing URL directly), provide a representative fallback
    booking = {
      reference,
      access_token: token || generateAccessToken(),
      booking_status: 'pending_payment',
      is_quote: false,
      service_name: 'Standard Residential Cleaning',
      package_name: 'Self-Contained',
      total_amount: 35000,
      deposit_amount: 17500,
      customer_name: 'Client Sample',
      customer_phone: '0803 123 4567',
      customer_email: 'client@example.com',
      service_address: '14 Admiralty Way, Lekki Phase 1, Lagos',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: '09:00 AM - 12:00 PM (Morning)',
      notes: 'Please buzz gate security upon arrival.',
    };
    allBookings[reference] = booking;
    saveStoredBookings(allBookings);
  }

  return {
    reference: booking.reference,
    access_token: booking.access_token,
    booking_status: booking.booking_status,
    status_label: formatStatusLabel(booking.booking_status),
    is_quote: booking.is_quote,
    service_name: booking.service_name,
    package_name: booking.package_name,
    total_amount: booking.total_amount,
    deposit_amount: booking.deposit_amount,
    customer_name: booking.customer_name,
    customer_phone: booking.customer_phone,
    customer_email: booking.customer_email,
    service_address: booking.service_address,
    scheduled_date: booking.scheduled_date,
    scheduled_time: booking.scheduled_time,
    receipt_filename: booking.receipt_filename,
    receipt_uploaded_at: booking.receipt_uploaded_at,
    notes: booking.notes,
    quote_details: booking.quote_details,
  };
}

/**
 * Mock implementation of attach_receipt / submitReceipt.
 * Validates file type and size, updates status to pending_verification,
 * and returns the exact required message.
 */
export async function submitReceipt(
  reference: string,
  _token: string,
  file: File
): Promise<SubmitReceiptResponse> {
  // Simulate upload delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Strict MIME type validation
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file format. Please upload JPG, PNG, or PDF files only.');
  }

  // Max 5MB size validation
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > MAX_SIZE) {
    throw new Error('File size exceeds the 5MB limit. Please upload a smaller file.');
  }

  // Update stored booking status to pending_verification
  const allBookings = loadStoredBookings();
  if (allBookings[reference]) {
    allBookings[reference].booking_status = 'pending_verification';
    allBookings[reference].receipt_filename = file.name;
    allBookings[reference].receipt_uploaded_at = new Date().toISOString();
    saveStoredBookings(allBookings);
  }

  return {
    success: true,
    booking_status: 'pending_verification',
    // EXACT message mandated by AGENT_RULES.md and user prompt
    message: 'Your payment details have been submitted. Your booking will be confirmed after Cleanique verifies the payment.',
  };
}

/**
 * Helper for testing/dev switcher to change booking status on the fly.
 */
export function updateMockBookingStatus(
  reference: string,
  newStatus: BookingStatus
): BookingStatusResponse {
  const allBookings = loadStoredBookings();
  let booking = allBookings[reference];

  if (!booking) {
    booking = {
      reference,
      access_token: generateAccessToken(),
      booking_status: newStatus,
      is_quote: false,
      service_name: 'Standard Residential Cleaning',
      package_name: 'Self-Contained',
      total_amount: 35000,
      deposit_amount: 17500,
      customer_name: 'Client Sample',
      customer_phone: '0803 123 4567',
      service_address: '14 Admiralty Way, Lekki Phase 1',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: '09:00 AM - 12:00 PM',
    };
  } else {
    booking.booking_status = newStatus;
  }

  allBookings[reference] = booking;
  saveStoredBookings(allBookings);

  return {
    reference: booking.reference,
    access_token: booking.access_token,
    booking_status: booking.booking_status,
    status_label: formatStatusLabel(booking.booking_status),
    is_quote: booking.is_quote,
    service_name: booking.service_name,
    package_name: booking.package_name,
    total_amount: booking.total_amount,
    deposit_amount: booking.deposit_amount,
    customer_name: booking.customer_name,
    customer_phone: booking.customer_phone,
    customer_email: booking.customer_email,
    service_address: booking.service_address,
    scheduled_date: booking.scheduled_date,
    scheduled_time: booking.scheduled_time,
    receipt_filename: booking.receipt_filename,
    receipt_uploaded_at: booking.receipt_uploaded_at,
    notes: booking.notes,
    quote_details: booking.quote_details,
  };
}
