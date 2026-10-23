import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bookingCustomerDetailsSchema, quoteCustomerDetailsSchema } from './bookingValidation';
import { formatStatusLabel, createBooking } from './bookingApi';
import { supabase } from '../../../lib/supabaseClient';

describe('Validation Schemas', () => {
  it('requires customer email', () => {
    const invalidData = {
      customerName: 'Chinedu Okafor',
      customerPhone: '08031234567',
      customerEmail: '',
      serviceAddress: 'Victoria Island, Lagos',
      scheduledDate: '2029-12-31',
      scheduledTime: '09:00 AM - 12:00 PM (Morning)',
    };
    const result = bookingCustomerDetailsSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.customerEmail).toBeDefined();
    }
  });

  it('allows optional whatsapp number', () => {
    const validData = {
      customerName: 'Chinedu Okafor',
      customerPhone: '08031234567',
      customerEmail: 'chinedu@example.com',
      customerWhatsapp: '08031234567',
      serviceAddress: 'Victoria Island, Lagos',
      scheduledDate: '2029-12-31',
      scheduledTime: '09:00 AM - 12:00 PM (Morning)',
    };
    const result = bookingCustomerDetailsSchema.safeParse(validData);
    expect(result.success).toBe(true);

    const validDataNoWhatsapp = {
      ...validData,
      customerWhatsapp: '',
    };
    const result2 = bookingCustomerDetailsSchema.safeParse(validDataNoWhatsapp);
    expect(result2.success).toBe(true);
  });
});

describe('File Validation Rules', () => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  const MAX_SIZE = 5242880;

  function validateFile(file: { type: string; size: number }) {
    if (!allowedMimeTypes.includes(file.type)) {
      return 'Invalid file format. Please upload JPG, PNG, or PDF receipts only.';
    }
    if (file.size <= 0 || file.size > MAX_SIZE) {
      return 'Invalid file size. File must be greater than 0B and no larger than 5MB.';
    }
    return null;
  }

  it('accepts JPG, PNG, and PDF files under 5MB', () => {
    expect(validateFile({ type: 'image/jpeg', size: 1024 })).toBeNull();
    expect(validateFile({ type: 'image/png', size: 2 * 1024 * 1024 })).toBeNull();
    expect(validateFile({ type: 'application/pdf', size: 5242880 })).toBeNull();
  });

  it('rejects unsupported file formats', () => {
    expect(validateFile({ type: 'image/gif', size: 1024 })).toContain('Invalid file format');
    expect(validateFile({ type: 'text/plain', size: 1024 })).toContain('Invalid file format');
  });

  it('rejects files larger than 5MB', () => {
    expect(validateFile({ type: 'image/jpeg', size: 5242881 })).toContain('Invalid file size');
  });
});

describe('Status Label Mapping', () => {
  it('maps pending_verification to Awaiting verification', () => {
    expect(formatStatusLabel('pending_verification')).toBe('Awaiting verification');
  });

  it('maps pending_payment to Awaiting payment', () => {
    expect(formatStatusLabel('pending_payment')).toBe('Awaiting payment');
  });

  it('maps confirmed to Confirmed', () => {
    expect(formatStatusLabel('confirmed')).toBe('Confirmed');
  });
});

interface TestCartItem {
  id: string;
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  itemType: string;
}

interface TestPackageInput {
  id: string;
  name: string;
  price: number;
}

describe('Cart Total Calculation and Selection', () => {
  function calculateTotal(items: { price: number; quantity: number }[]) {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  function selectPackage(currentItems: TestCartItem[], pkg: TestPackageInput): TestCartItem[] {
    const nonPackageItems = currentItems.filter((i) => i.itemType !== 'package');
    const newItem: TestCartItem = {
      id: pkg.id,
      itemId: pkg.id,
      name: pkg.name,
      price: pkg.price,
      quantity: 1,
      itemType: 'package',
    };
    return [...nonPackageItems, newItem];
  }

  it('calculates total and deposit correctly', () => {
    const cart = [
      { price: 20000, quantity: 1 },
      { price: 35000, quantity: 2 },
    ];
    const total = calculateTotal(cart);
    expect(total).toBe(90000);
    expect(Math.round(total * 0.5)).toBe(45000);
  });

  it('replaces existing package on explicit Book Now selection', () => {
    let cart: TestCartItem[] = [{ id: 'pkg_1', itemId: 'pkg_1', name: 'Single Room', price: 20000, quantity: 1, itemType: 'package' }];
    cart = selectPackage(cart, { id: 'pkg_2', name: '2 Bedroom', price: 50000 });
    expect(cart.length).toBe(1);
    expect(cart[0].itemId).toBe('pkg_2');
    expect(cart[0].price).toBe(50000);
    expect(cart[0].quantity).toBe(1);
  });

  it('prevents accidental duplicate packages on repeated Book Now clicks', () => {
    let cart: TestCartItem[] = [];
    // Click 1
    cart = selectPackage(cart, { id: 'pkg_self_contained', name: 'Self-Contained', price: 35000 });
    // Click 2
    cart = selectPackage(cart, { id: 'pkg_self_contained', name: 'Self-Contained', price: 35000 });
    // Click 3
    cart = selectPackage(cart, { id: 'pkg_self_contained', name: 'Self-Contained', price: 35000 });

    expect(cart.length).toBe(1);
    expect(cart[0].itemId).toBe('pkg_self_contained');
    expect(cart[0].quantity).toBe(1);
    expect(calculateTotal(cart)).toBe(35000);
  });

  it('keeps optional add-ons unselected until explicitly added', () => {
    let cart: TestCartItem[] = [];
    cart = selectPackage(cart, { id: 'pkg_three_bedroom', name: 'Three-Bedroom', price: 65000 });

    // Optional dishwashing add-on is NOT automatically added
    const hasDishwashing = cart.some((i) => i.name.toLowerCase().includes('dish'));
    expect(hasDishwashing).toBe(false);
    expect(calculateTotal(cart)).toBe(65000);

    // Customer explicitly adds Dishwashing (starts at 3,000)
    cart.push({
      id: 'srv_dishwashing',
      itemId: 'srv_dishwashing',
      name: 'Dishwashing Add-on',
      price: 3000,
      quantity: 1,
      itemType: 'service',
    });

    expect(cart.length).toBe(2);
    expect(calculateTotal(cart)).toBe(68000);
    expect(Math.round(calculateTotal(cart) * 0.5)).toBe(34000);
  });

  it('preserves approved prices for all residential tiers', () => {
    const tierPrices: Record<string, number> = {
      'Single Room': 20000,
      'Bedsitter': 25000,
      'Self-Contained': 35000,
      'Two-Bedroom': 50000,
      'Three-Bedroom': 65000,
    };

    Object.entries(tierPrices).forEach(([tier, price]) => {
      const cart = selectPackage([], { id: `pkg_${tier}`, name: tier, price });
      expect(cart[0].price).toBe(price);
      expect(calculateTotal(cart)).toBe(price);
    });
  });
});

describe('createBooking RPC calls and Quote Requests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const validQuotePayloadBase = {
    customerName: 'Chinedu Okafor',
    customerPhone: '08031234567',
    customerEmail: 'chinedu@example.com',
    serviceAddress: 'Victoria Island, Lagos',
    scheduledDate: '2029-12-31',
    quoteDetails: 'We have a 3-floor office building needing deep sanitization.',
  };

  it('submitting a quote for "office" calls rpc("create_booking") with p_service_slug "office", p_items null, and p_quote_details set', async () => {
    const rpcSpy = vi.spyOn(supabase, 'rpc').mockImplementation((fnName: string) => {
      if (fnName === 'create_booking') {
        return Promise.resolve({
          data: [{ reference: 'CLQ-OFF123', access_token: 'tok-off123', booking_status: 'quote_requested' }],
          error: null,
        }) as any;
      }
      if (fnName === 'get_booking_status') {
        return Promise.resolve({
          data: [{ booking_status: 'quote_requested', is_quote: true, service_name: 'Office Cleaning' }],
          error: null,
        }) as any;
      }
      if (fnName === 'get_booking_items') {
        return Promise.resolve({ data: [], error: null }) as any;
      }
      return Promise.resolve({ data: null, error: null }) as any;
    });

    const res = await createBooking({
      ...validQuotePayloadBase,
      serviceSlug: 'office',
    });

    expect(rpcSpy).toHaveBeenCalled();
    const createBookingCall = rpcSpy.mock.calls.find((call) => call[0] === 'create_booking');
    expect(createBookingCall).toBeDefined();

    const args = createBookingCall![1];
    expect(args).toMatchObject({
      p_service_slug: 'office',
      p_items: null,
      p_quote_details: 'We have a 3-floor office building needing deep sanitization.',
    });
    expect(res.reference).toBe('CLQ-OFF123');
    expect(res.is_quote).toBe(true);
  });

  it('works identically for each of the six quote slugs', async () => {
    const quoteSlugs = [
      'office',
      'commercial',
      'move-in-out',
      'post-construction',
      'deep-cleaning',
      'dishwashing',
    ];

    for (const slug of quoteSlugs) {
      vi.restoreAllMocks();
      const rpcSpy = vi.spyOn(supabase, 'rpc').mockImplementation((fnName: string) => {
        if (fnName === 'create_booking') {
          return Promise.resolve({
            data: [{ reference: `CLQ-${slug.toUpperCase()}`, access_token: 'tok-123', booking_status: 'quote_requested' }],
            error: null,
          }) as any;
        }
        if (fnName === 'get_booking_status') {
          return Promise.resolve({
            data: [{ booking_status: 'quote_requested', is_quote: true }],
            error: null,
          }) as any;
        }
        if (fnName === 'get_booking_items') {
          return Promise.resolve({ data: [], error: null }) as any;
        }
        return Promise.resolve({ data: null, error: null }) as any;
      });

      const res = await createBooking({
        ...validQuotePayloadBase,
        serviceSlug: slug,
        quoteDetails: `Details for service ${slug} request.`,
      });

      const createBookingCall = rpcSpy.mock.calls.find((call) => call[0] === 'create_booking');
      expect(createBookingCall).toBeDefined();
      const args = createBookingCall![1];
      expect(args.p_service_slug).toBe(slug);
      expect(args.p_items).toBeNull();
      expect(args.p_quote_details).toBe(`Details for service ${slug} request.`);
      expect(res.is_quote).toBe(true);
    }
  });

  it('submitting a quote with description under 5 characters fails validation', () => {
    const invalidData = {
      ...validQuotePayloadBase,
      quoteDetails: '1234', // 4 characters
    };
    const result = quoteCustomerDetailsSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.quoteDetails).toBeDefined();
    }
  });

  it('submitting fixed-price flow sends p_service_slug "residential" with items', async () => {
    const rpcSpy = vi.spyOn(supabase, 'rpc').mockImplementation((fnName: string) => {
      if (fnName === 'create_booking') {
        return Promise.resolve({
          data: [{ reference: 'CLQ-RES123', access_token: 'tok-res123', booking_status: 'pending_payment' }],
          error: null,
        }) as any;
      }
      if (fnName === 'get_booking_status') {
        return Promise.resolve({
          data: [{ booking_status: 'pending_payment', is_quote: false, service_name: 'Residential Cleaning' }],
          error: null,
        }) as any;
      }
      if (fnName === 'get_booking_items') {
        return Promise.resolve({ data: [], error: null }) as any;
      }
      return Promise.resolve({ data: null, error: null }) as any;
    });

    const res = await createBooking({
      customerName: 'Chinedu Okafor',
      customerPhone: '08031234567',
      customerEmail: 'chinedu@example.com',
      serviceAddress: 'Victoria Island, Lagos',
      scheduledDate: '2029-12-31',
      serviceSlug: 'residential',
      packageId: 'pkg_self_contained',
      items: [
        {
          id: 'pkg_self_contained',
          name: 'Self-Contained',
          quantity: 1,
          price: 35000,
          formattedPrice: '₦35,000',
          isQuote: false,
        },
      ],
    });

    const createBookingCall = rpcSpy.mock.calls.find((call) => call[0] === 'create_booking');
    expect(createBookingCall).toBeDefined();
    const args = createBookingCall![1];
    expect(args.p_service_slug).toBe('residential');
    expect(Array.isArray(args.p_items)).toBe(true);
    expect(args.p_items.length).toBeGreaterThan(0);
    expect(res.is_quote).toBe(false);
  });

  it('maps raw database error "Choose at least one package" to a friendly message', async () => {
    vi.spyOn(supabase, 'rpc').mockImplementation((fnName: string) => {
      if (fnName === 'create_booking') {
        return Promise.resolve({
          data: null,
          error: { message: 'Choose at least one package' },
        }) as any;
      }
      return Promise.resolve({ data: null, error: null }) as any;
    });

    await expect(
      createBooking({
        ...validQuotePayloadBase,
        serviceSlug: 'office',
      })
    ).rejects.toThrow('Please choose a service and try again.');
  });
});
