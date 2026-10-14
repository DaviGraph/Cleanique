import { describe, it, expect } from 'vitest';
import { bookingCustomerDetailsSchema } from './bookingValidation';
import { formatStatusLabel } from './bookingApi';

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

describe('Cart Total Calculation', () => {
  function calculateTotal(items: { price: number; quantity: number }[]) {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
});
