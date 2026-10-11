import type {
  AdminBooking,
  AdminSession,
} from '../types';

const ADMIN_SESSION_KEY = 'cleanique_admin_session';
const ADMIN_BOOKINGS_STORAGE_KEY = 'cleanique_admin_mock_bookings';

/**
 * 10 comprehensive mock bookings covering every booking and payment status,
 * including quote requests without prices.
 */
const DEFAULT_MOCK_BOOKINGS: AdminBooking[] = [
  {
    id: 'CLQ-P1V2W3',
    reference: 'CLQ-P1V2W3',
    customer_name: 'Dr. Folashade Adeleke',
    customer_phone: '0802 334 5566',
    customer_email: 'folashade@gmail.com',
    service_id: 'srv_residential',
    service_name: 'Standard Residential Cleaning',
    package_name: 'Self-Contained',
    service_address: '15 Bourdillon Road, Ikoyi, Lagos',
    scheduled_date: '2026-10-14',
    scheduled_time: '09:00 AM - 12:00 PM (Morning)',
    notes: 'Gate access code: 4421. Clean balcony glass.',
    is_quote: false,
    total_amount: 35000,
    deposit_amount: 17500,
    amount_paid: 0,
    booking_status: 'pending_verification',
    payment_status: 'pending_verification',
    created_at: '2026-10-11T14:30:00Z',
    receipts: [
      {
        id: 'rcpt_1',
        filename: 'palmpay_transfer_17500.jpg',
        file_type: 'image',
        file_size_formatted: '1.45 MB',
        submitted_at: '2026-10-11T15:10:00Z',
      },
    ],
    timeline: [
      {
        id: 'tl_1',
        title: 'Booking Created',
        description: 'Customer requested Self-Contained residential clean.',
        timestamp: '2026-10-11T14:30:00Z',
        type: 'created',
      },
      {
        id: 'tl_2',
        title: 'Receipt Attached',
        description: 'Customer attached transfer slip (palmpay_transfer_17500.jpg).',
        timestamp: '2026-10-11T15:10:00Z',
        type: 'receipt',
      },
    ],
  },
  {
    id: 'CLQ-Q7R8S9',
    reference: 'CLQ-Q7R8S9',
    customer_name: 'Lanre Balogun (Apex Health Ltd)',
    customer_phone: '0813 445 6677',
    customer_email: 'facilities@apexhealth.ng',
    service_id: 'srv_commercial',
    service_name: 'Commercial Cleaning',
    service_address: 'Plot 12, Commercial Avenue, Yaba, Lagos',
    scheduled_date: '2026-10-15',
    scheduled_time: 'After Hours (Commercial / Flexible)',
    is_quote: true,
    quote_details: '2-floor outpatient clinic with 14 consultation rooms, reception, and terrazzo floors. Needs clinical sanitization protocol.',
    notes: 'Requires weekend or late evening team.',
    total_amount: undefined,
    deposit_amount: undefined,
    amount_paid: 0,
    booking_status: 'quote_requested',
    payment_status: 'unpaid',
    created_at: '2026-10-11T16:00:00Z',
    receipts: [],
    timeline: [
      {
        id: 'tl_3',
        title: 'Quote Requested',
        description: 'Customer submitted specifications for 2-floor outpatient clinic.',
        timestamp: '2026-10-11T16:00:00Z',
        type: 'created',
      },
    ],
  },
  {
    id: 'CLQ-D4E5F6',
    reference: 'CLQ-D4E5F6',
    customer_name: 'Emeka Nwosu',
    customer_phone: '0809 112 2334',
    customer_email: 'emeka.nwosu@yahoo.com',
    service_id: 'srv_deep_clean',
    service_name: 'Deep Cleaning',
    service_address: 'Block C, Oceanview Mansions, Lekki Phase 1',
    scheduled_date: '2026-10-16',
    scheduled_time: '08:00 AM - 11:00 AM (Early Morning)',
    is_quote: true,
    quote_details: '5-bedroom duplex, unoccupied for 8 months. Heavy limescale in 6 bathrooms and greasy grease traps in dirty kitchen.',
    notes: 'Please bring steam cleaners.',
    total_amount: undefined,
    deposit_amount: undefined,
    amount_paid: 0,
    booking_status: 'quote_requested',
    payment_status: 'unpaid',
    created_at: '2026-10-11T17:15:00Z',
    receipts: [],
    timeline: [
      {
        id: 'tl_4',
        title: 'Quote Requested',
        description: 'Customer requested intensive deep clean for 5-bedroom duplex.',
        timestamp: '2026-10-11T17:15:00Z',
        type: 'created',
      },
    ],
  },
  {
    id: 'CLQ-X3Y4Z5',
    reference: 'CLQ-X3Y4Z5',
    customer_name: 'Kemi Oladipo (DesignCraft)',
    customer_phone: '0805 778 8990',
    customer_email: 'operations@designcraft.co',
    service_id: 'srv_office',
    service_name: 'Office Cleaning',
    service_address: 'Victoria Mall Plaza, 4th Floor, VI, Lagos',
    scheduled_date: '2026-10-17',
    scheduled_time: 'After Hours (Commercial / Flexible)',
    is_quote: true,
    quote_details: 'Design agency studio, 28 workstations and boardroom.',
    total_amount: 80000,
    deposit_amount: 40000,
    amount_paid: 0,
    booking_status: 'pending_verification',
    payment_status: 'pending_verification',
    created_at: '2026-10-10T11:00:00Z',
    receipts: [
      {
        id: 'rcpt_2',
        filename: 'bank_transfer_40000.pdf',
        file_type: 'pdf',
        file_size_formatted: '420 KB',
        submitted_at: '2026-10-11T18:05:00Z',
      },
    ],
    timeline: [
      {
        id: 'tl_5',
        title: 'Quote Sent',
        description: 'Cleanique issued customized quote for ₦80,000.',
        timestamp: '2026-10-10T14:00:00Z',
        type: 'quote',
      },
      {
        id: 'tl_6',
        title: 'Receipt Attached',
        description: 'Customer uploaded deposit slip (bank_transfer_40000.pdf).',
        timestamp: '2026-10-11T18:05:00Z',
        type: 'receipt',
      },
    ],
  },
  {
    id: 'CLQ-A8B9C0',
    reference: 'CLQ-A8B9C0',
    customer_name: 'Babajide Sanwo',
    customer_phone: '0703 556 7788',
    service_id: 'srv_residential',
    service_name: 'Standard Residential Cleaning',
    package_name: 'Two-Bedroom',
    service_address: '7 Adeola Odeku Street, Victoria Island',
    scheduled_date: '2026-10-18',
    scheduled_time: '12:00 PM - 03:00 PM (Midday)',
    is_quote: false,
    total_amount: 50000,
    deposit_amount: 25000,
    amount_paid: 0,
    booking_status: 'pending_payment',
    payment_status: 'unpaid',
    created_at: '2026-10-11T18:30:00Z',
    receipts: [],
    timeline: [
      {
        id: 'tl_7',
        title: 'Booking Created',
        description: 'Customer registered 2-Bedroom booking. Awaiting 50% deposit.',
        timestamp: '2026-10-11T18:30:00Z',
        type: 'created',
      },
    ],
  },
  {
    id: 'CLQ-M2N3P4',
    reference: 'CLQ-M2N3P4',
    customer_name: 'Zainab Danjuma',
    customer_phone: '0812 667 8899',
    customer_email: 'zainab.d@gmail.com',
    service_id: 'srv_residential',
    service_name: 'Standard Residential Cleaning',
    package_name: 'Single Room',
    service_address: 'Grace Court, University Road, Akoka',
    scheduled_date: '2026-10-19',
    scheduled_time: '09:00 AM - 12:00 PM (Morning)',
    is_quote: false,
    total_amount: 20000,
    deposit_amount: 10000,
    amount_paid: 10000,
    booking_status: 'confirmed',
    payment_status: 'partially_paid',
    created_at: '2026-10-09T09:00:00Z',
    receipts: [
      {
        id: 'rcpt_3',
        filename: 'palmpay_10000.jpg',
        file_type: 'image',
        file_size_formatted: '2.1 MB',
        submitted_at: '2026-10-09T10:00:00Z',
      },
    ],
    timeline: [
      {
        id: 'tl_8',
        title: 'Booking Created',
        description: 'Single Room scheduled for student apartment.',
        timestamp: '2026-10-09T09:00:00Z',
        type: 'created',
      },
      {
        id: 'tl_9',
        title: 'Payment Verified',
        description: 'Deposit of ₦10,000 verified in PalmPay.',
        timestamp: '2026-10-09T10:30:00Z',
        type: 'verification',
      },
      {
        id: 'tl_10',
        title: 'Booking Confirmed',
        description: 'Cleanique confirmed cleaner deployment.',
        timestamp: '2026-10-09T11:00:00Z',
        type: 'status_change',
      },
    ],
  },
  {
    id: 'CLQ-T5U6V7',
    reference: 'CLQ-T5U6V7',
    customer_name: 'Oluwaseun Bakare',
    customer_phone: '0808 223 3445',
    customer_email: 'sbakare@fcmb.com',
    service_id: 'srv_residential',
    service_name: 'Standard Residential Cleaning',
    package_name: 'Three-Bedroom',
    service_address: '10 Cameron Road, Ikoyi, Lagos',
    scheduled_date: '2026-10-20',
    scheduled_time: '09:00 AM - 12:00 PM (Morning)',
    is_quote: false,
    total_amount: 65000,
    deposit_amount: 32500,
    amount_paid: 65000,
    booking_status: 'confirmed',
    payment_status: 'fully_paid',
    created_at: '2026-10-08T15:00:00Z',
    receipts: [
      {
        id: 'rcpt_4',
        filename: 'full_payment_65000.pdf',
        file_type: 'pdf',
        file_size_formatted: '890 KB',
        submitted_at: '2026-10-08T16:00:00Z',
      },
    ],
    timeline: [
      {
        id: 'tl_11',
        title: 'Booking Created',
        description: '3-Bedroom family home registered.',
        timestamp: '2026-10-08T15:00:00Z',
        type: 'created',
      },
      {
        id: 'tl_12',
        title: 'Full Payment Verified',
        description: 'Customer transferred full ₦65,000 upfront.',
        timestamp: '2026-10-08T16:20:00Z',
        type: 'verification',
      },
      {
        id: 'tl_13',
        title: 'Booking Confirmed',
        description: 'Slot locked for team deployment.',
        timestamp: '2026-10-08T16:25:00Z',
        type: 'status_change',
      },
    ],
  },
  {
    id: 'CLQ-K8L9M1',
    reference: 'CLQ-K8L9M1',
    customer_name: 'Amina Bello',
    customer_phone: '0814 889 9001',
    service_id: 'srv_residential',
    service_name: 'Standard Residential Cleaning',
    package_name: 'Bedsitter',
    service_address: 'Flat 2, Green Springs Estate, Anthony Village',
    scheduled_date: '2026-10-07',
    scheduled_time: '12:00 PM - 03:00 PM (Midday)',
    is_quote: false,
    total_amount: 25000,
    deposit_amount: 12500,
    amount_paid: 25000,
    booking_status: 'completed',
    payment_status: 'fully_paid',
    created_at: '2026-10-05T08:00:00Z',
    receipts: [
      {
        id: 'rcpt_5',
        filename: 'bedsitter_transfer.png',
        file_type: 'image',
        file_size_formatted: '1.8 MB',
        submitted_at: '2026-10-05T08:30:00Z',
      },
    ],
    timeline: [
      {
        id: 'tl_14',
        title: 'Booking Created',
        description: 'Bedsitter session scheduled.',
        timestamp: '2026-10-05T08:00:00Z',
        type: 'created',
      },
      {
        id: 'tl_15',
        title: 'Cleaning Executed',
        description: 'Supervisor verified completion and customer signed off.',
        timestamp: '2026-10-07T15:00:00Z',
        type: 'status_change',
      },
    ],
  },
  {
    id: 'CLQ-J6K7L8',
    reference: 'CLQ-J6K7L8',
    customer_name: 'Tunde Afolayan',
    customer_phone: '0802 990 0112',
    service_id: 'srv_residential',
    service_name: 'Standard Residential Cleaning',
    package_name: 'Self-Contained',
    service_address: '3 Ogudu Road, Ojota, Lagos',
    scheduled_date: '2026-10-21',
    scheduled_time: '03:00 PM - 06:00 PM (Afternoon)',
    is_quote: false,
    total_amount: 35000,
    deposit_amount: 17500,
    amount_paid: 0,
    booking_status: 'pending_payment',
    payment_status: 'rejected',
    created_at: '2026-10-10T12:00:00Z',
    receipts: [
      {
        id: 'rcpt_6',
        filename: 'blurred_screenshot.jpg',
        file_type: 'image',
        file_size_formatted: '450 KB',
        submitted_at: '2026-10-10T12:30:00Z',
      },
    ],
    timeline: [
      {
        id: 'tl_16',
        title: 'Booking Created',
        description: 'Self-Contained booking registered.',
        timestamp: '2026-10-10T12:00:00Z',
        type: 'created',
      },
      {
        id: 'tl_17',
        title: 'Receipt Rejected',
        description: 'Payment verification rejected: Transfer slip was blurred and transaction reference unreadable.',
        timestamp: '2026-10-10T13:00:00Z',
        type: 'verification',
      },
    ],
  },
  {
    id: 'CLQ-C9D0E1',
    reference: 'CLQ-C9D0E1',
    customer_name: 'Ngozi Eze',
    customer_phone: '0816 332 2110',
    service_id: 'srv_residential',
    service_name: 'Standard Residential Cleaning',
    package_name: 'Two-Bedroom',
    service_address: '18 Isaac John Street, GRA Ikeja',
    scheduled_date: '2026-10-22',
    scheduled_time: '09:00 AM - 12:00 PM (Morning)',
    is_quote: false,
    total_amount: 50000,
    deposit_amount: 25000,
    amount_paid: 0,
    booking_status: 'cancelled',
    payment_status: 'unpaid',
    created_at: '2026-10-07T14:00:00Z',
    receipts: [],
    timeline: [
      {
        id: 'tl_18',
        title: 'Booking Cancelled',
        description: 'Customer requested cancellation due to travel schedule change.',
        timestamp: '2026-10-08T10:00:00Z',
        type: 'status_change',
      },
    ],
  },
];

function loadBookings(): AdminBooking[] {
  if (typeof window === 'undefined') return [...DEFAULT_MOCK_BOOKINGS];
  try {
    const raw = localStorage.getItem(ADMIN_BOOKINGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_BOOKINGS_STORAGE_KEY, JSON.stringify(DEFAULT_MOCK_BOOKINGS));
      return [...DEFAULT_MOCK_BOOKINGS];
    }
    return JSON.parse(raw);
  } catch {
    return [...DEFAULT_MOCK_BOOKINGS];
  }
}

function saveBookings(bookings: AdminBooking[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  } catch {
    // Ignore storage issues in test run
  }
}

/**
 * Authentication
 * In strict compliance with AGENT_RULES.md:
 * - No sign-up UI anywhere.
 * - Admin login is email + password only.
 */
export async function adminLogin(email: string, password: string): Promise<AdminSession> {
  await new Promise((r) => setTimeout(r, 120));

  if (!email.trim() || !password.trim()) {
    throw new Error('Please enter both email and password.');
  }

  const session: AdminSession = {
    email: email.trim(),
    role: 'admin',
    logged_in_at: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  }

  return session;
}

export function adminLogout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Fetch bookings for owner dashboard.
 * Requirement: Sort so “Pending Verification” and “Quote Requested” bookings come first, then upcoming dates.
 */
export async function getAdminBookings(filters?: {
  bookingStatus?: string;
  paymentStatus?: string;
  searchQuery?: string;
}): Promise<AdminBooking[]> {
  await new Promise((r) => setTimeout(r, 100));

  let list = loadBookings();

  // Apply filters
  if (filters?.bookingStatus && filters.bookingStatus !== 'all') {
    list = list.filter((b) => b.booking_status === filters.bookingStatus);
  }

  if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
    list = list.filter((b) => b.payment_status === filters.paymentStatus);
  }

  if (filters?.searchQuery && filters.searchQuery.trim()) {
    const q = filters.searchQuery.toLowerCase().trim();
    list = list.filter(
      (b) =>
        b.reference.toLowerCase().includes(q) ||
        b.customer_name.toLowerCase().includes(q) ||
        b.customer_phone.toLowerCase().includes(q)
    );
  }

  // Sort: Pending Verification & Quote Requested first, then by scheduled_date ascending
  return list.sort((a, b) => {
    const isPriorityA =
      a.booking_status === 'pending_verification' || a.booking_status === 'quote_requested';
    const isPriorityB =
      b.booking_status === 'pending_verification' || b.booking_status === 'quote_requested';

    if (isPriorityA && !isPriorityB) return -1;
    if (!isPriorityA && isPriorityB) return 1;

    return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
  });
}

/**
 * Fetch booking details by reference / ID
 */
export async function getAdminBookingById(id: string): Promise<AdminBooking | null> {
  await new Promise((r) => setTimeout(r, 80));
  const list = loadBookings();
  const found = list.find((b) => b.id === id || b.reference === id);
  return found || null;
}

/**
 * Mock receipt URL retriever.
 * Requirement: Fetch the link ONLY when the button is clicked, NEVER on page load.
 */
export async function getReceiptUrl(receiptId: string): Promise<{ url: string; file_type: 'image' | 'pdf' }> {
  await new Promise((r) => setTimeout(r, 150));

  // Placeholder receipt previews
  return {
    url: 'https://images.unsplash.com/photo-1554415707-9e4966668834?auto=format&fit=crop&w=1000&q=80',
    file_type: receiptId.endsWith('.pdf') ? 'pdf' : 'image',
  };
}

/**
 * Verify payment received in PalmPay.
 * - Approves or Rejects. Reject requires a reason.
 * - Warns if amount received is below deposit.
 * - Updates payment status to Partially Paid or Fully Paid.
 */
export async function verifyPayment(
  bookingId: string,
  amountReceived: number,
  decision: 'approve' | 'reject',
  rejectReason?: string
): Promise<AdminBooking> {
  await new Promise((r) => setTimeout(r, 150));

  const list = loadBookings();
  const index = list.findIndex((b) => b.id === bookingId || b.reference === bookingId);
  if (index === -1) throw new Error('Booking not found');

  const booking = { ...list[index] };
  const now = new Date().toISOString();

  if (decision === 'reject') {
    if (!rejectReason || !rejectReason.trim()) {
      throw new Error('Please provide a reason for rejecting this payment.');
    }

    booking.payment_status = 'rejected';
    booking.timeline = [
      {
        id: `tl_${Date.now()}`,
        title: 'Payment Rejected',
        description: `Rejected: ${rejectReason.trim()}`,
        timestamp: now,
        type: 'verification',
      },
      ...booking.timeline,
    ];
  } else {
    // Approved
    if (isNaN(amountReceived) || amountReceived <= 0) {
      throw new Error('Please enter a valid amount received.');
    }

    const currentPaid = booking.amount_paid || 0;
    const newTotalPaid = currentPaid + amountReceived;
    booking.amount_paid = newTotalPaid;

    const total = booking.total_amount || 0;
    if (newTotalPaid >= total && total > 0) {
      booking.payment_status = 'fully_paid';
    } else {
      booking.payment_status = 'partially_paid';
    }

    booking.timeline = [
      {
        id: `tl_${Date.now()}`,
        title: 'Payment Verified',
        description: `PalmPay transfer of ₦${amountReceived.toLocaleString()} verified. Status: ${
          booking.payment_status === 'fully_paid' ? 'Fully Paid' : 'Partially Paid'
        }.`,
        timestamp: now,
        type: 'verification',
      },
      ...booking.timeline,
    ];
  }

  list[index] = booking;
  saveBookings(list);
  return booking;
}

/**
 * Send quote for quote-requested bookings.
 */
export async function sendQuote(
  bookingId: string,
  amount: number,
  message: string
): Promise<AdminBooking> {
  await new Promise((r) => setTimeout(r, 150));

  if (isNaN(amount) || amount <= 0) {
    throw new Error('Please enter a valid quote amount.');
  }

  const list = loadBookings();
  const index = list.findIndex((b) => b.id === bookingId || b.reference === bookingId);
  if (index === -1) throw new Error('Booking not found');

  const booking = { ...list[index] };
  booking.total_amount = amount;
  booking.deposit_amount = Math.round(amount * 0.5);
  booking.booking_status = 'pending_payment';
  booking.payment_status = 'unpaid';

  const now = new Date().toISOString();
  booking.timeline = [
    {
      id: `tl_${Date.now()}`,
      title: 'Quote Sent to Customer',
      description: `Quote issued: ₦${amount.toLocaleString()} (50% deposit: ₦${Math.round(
        amount * 0.5
      ).toLocaleString()}). Note: ${message || 'No additional message.'}`,
      timestamp: now,
      type: 'quote',
    },
    ...booking.timeline,
  ];

  list[index] = booking;
  saveBookings(list);
  return booking;
}

/**
 * Update booking status (Confirm, Complete, Cancel).
 * Enforces:
 * - Confirm is disabled until verified payments cover the deposit.
 * - Complete is only available for Confirmed bookings.
 * - Cancel asks for confirmation.
 */
export async function updateBookingStatus(
  bookingId: string,
  newStatus: 'confirmed' | 'completed' | 'cancelled'
): Promise<AdminBooking> {
  await new Promise((r) => setTimeout(r, 120));

  const list = loadBookings();
  const index = list.findIndex((b) => b.id === bookingId || b.reference === bookingId);
  if (index === -1) throw new Error('Booking not found');

  const booking = { ...list[index] };

  // Rule verification
  if (newStatus === 'confirmed') {
    const depositRequired = booking.deposit_amount || 0;
    const paid = booking.amount_paid || 0;
    if (paid < depositRequired) {
      throw new Error(
        `Cannot confirm booking: Verified payment (₦${paid.toLocaleString()}) does not cover the required deposit (₦${depositRequired.toLocaleString()}).`
      );
    }
  }

  if (newStatus === 'completed') {
    if (booking.booking_status !== 'confirmed') {
      throw new Error('Only Confirmed bookings can be marked as Completed.');
    }
  }

  booking.booking_status = newStatus;
  const now = new Date().toISOString();

  let actionTitle = 'Status Updated';
  if (newStatus === 'confirmed') actionTitle = 'Booking Confirmed';
  if (newStatus === 'completed') actionTitle = 'Service Completed';
  if (newStatus === 'cancelled') actionTitle = 'Booking Cancelled';

  booking.timeline = [
    {
      id: `tl_${Date.now()}`,
      title: actionTitle,
      description: `Booking status changed to ${newStatus}.`,
      timestamp: now,
      type: 'status_change',
    },
    ...booking.timeline,
  ];

  list[index] = booking;
  saveBookings(list);
  return booking;
}
