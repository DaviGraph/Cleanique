import type {
  Service,
  Package,
  CreateBookingPayload,
  CreateBookingResponse,
} from '../types';

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
 * Mock implementation of create_booking RPC.
 * Enforces security rule: Client never sends prices; prices are determined server-side from MOCK_PACKAGES.
 */
export async function createBooking(
  payload: CreateBookingPayload
): Promise<CreateBookingResponse> {
  await new Promise((resolve) => setTimeout(resolve, 200));

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

  // Determine if this is a quote-based request or fixed package booking
  const isQuote = !pkg || service?.pricingType === 'quote';

  const totalAmount = pkg ? pkg.price : undefined;
  const depositAmount = totalAmount ? Math.round(totalAmount * 0.5) : undefined;

  return {
    reference,
    access_token: accessToken,
    booking_status: 'pending',
    message: isQuote
      ? 'Quote request submitted successfully. A Cleanique representative will assess your space details and contact you.'
      : 'Booking request created successfully. Awaiting payment receipt verification.',
    is_quote: isQuote,
    total_amount: totalAmount,
    deposit_amount: depositAmount,
    service_name: service?.name || (pkg ? 'Residential Cleaning' : 'Custom Cleaning'),
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
