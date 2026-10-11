export type PricingType = 'fixed' | 'quote' | 'starting_at';

export type ServiceCategory = 'residential' | 'commercial' | 'specialized' | 'add_on';

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  categoryLabel: string;
  description: string;
  pricingType: PricingType;
  displayPrice: string;
  badge?: string;
  features: string[];
  icon: string;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  formattedPrice: string;
  popular?: boolean;
  features: string[];
  recommendedFor: string;
}

export interface CreateBookingPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceId?: string;
  packageId?: string;
  serviceAddress: string;
  scheduledDate: string;
  scheduledTime?: string;
  notes?: string;
  quoteDetails?: string;
  // NOTE: In accordance with AGENT_RULES.md, client NEVER submits prices.
}

export type BookingStatus =
  | 'pending_payment'
  | 'pending_verification'
  | 'confirmed'
  | 'cancelled';

export interface CreateBookingResponse {
  reference: string; // e.g. "CLQ-A1B2C3"
  access_token: string;
  booking_status: BookingStatus;
  message: string;
  is_quote: boolean;
  total_amount?: number;
  deposit_amount?: number;
  service_name: string;
  package_name?: string;
  scheduledDate: string;
  scheduledTime?: string;
  serviceAddress: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  quoteDetails?: string;
}

export interface BookingStatusResponse {
  reference: string;
  access_token: string;
  booking_status: BookingStatus;
  status_label: string;
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

export interface SubmitReceiptResponse {
  success: boolean;
  message: string;
  booking_status: BookingStatus;
}
