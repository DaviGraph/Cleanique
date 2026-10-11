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

export interface CreateBookingResponse {
  reference: string; // e.g. "CLQ-A1B2C3"
  access_token: string;
  booking_status: 'pending';
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
