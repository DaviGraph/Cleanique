import { z } from 'zod';

/**
 * Validates whether a YYYY-MM-DD date string is today or later in local time.
 */
function isTodayOrLater(dateStr: string): boolean {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const targetDate = new Date(year, month, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return targetDate >= today;
}

/**
 * Customer details validation schema for fixed-price package bookings
 */
export const bookingCustomerDetailsSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, { message: 'Full name must be at least 2 characters.' }),
  customerPhone: z
    .string()
    .trim()
    .min(7, { message: 'Please provide a valid phone number (at least 7 digits).' })
    .regex(/^[+0-9\s\-()]+$/, { message: 'Phone number may only contain digits, spaces, and standard formatting.' }),
  customerEmail: z
    .string()
    .trim()
    .email({ message: 'Please enter a valid email address.' })
    .or(z.literal(''))
    .optional(),
  customerWhatsapp: z
    .string()
    .trim()
    .min(7, { message: 'Please provide a valid WhatsApp number (at least 7 digits).' })
    .regex(/^[+0-9\s\-()]+$/, { message: 'WhatsApp number may only contain digits, spaces, and standard formatting.' })
    .or(z.literal(''))
    .optional(),
  serviceAddress: z
    .string()
    .trim()
    .min(5, { message: 'Please enter the complete service address (at least 5 characters).' }),
  scheduledDate: z
    .string()
    .min(1, { message: 'Preferred date is required.' })
    .refine(isTodayOrLater, {
      message: 'Preferred date must be today or a future date.',
    }),
  scheduledTime: z
    .string()
    .min(1, { message: 'Please choose your preferred arrival time window.' }),
  notes: z.string().trim().optional(),
});

export type BookingCustomerDetailsFormData = z.infer<typeof bookingCustomerDetailsSchema>;

/**
 * Customer details validation schema for quote-based requests (includes space details textarea)
 */
export const quoteCustomerDetailsSchema = bookingCustomerDetailsSchema.extend({
  quoteDetails: z
    .string()
    .trim()
    .min(10, {
      message: 'Please provide details about your space (e.g. square footage, condition, rooms) so we can prepare an accurate quote.',
    }),
});

export type QuoteCustomerDetailsFormData = z.infer<typeof quoteCustomerDetailsSchema>;
