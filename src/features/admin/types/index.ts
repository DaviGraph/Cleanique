export type AdminBookingStatus =
  | 'pending_payment'
  | 'pending_verification'
  | 'quote_requested'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export type PaymentStatus =
  | 'unpaid'
  | 'pending_verification'
  | 'partially_paid'
  | 'fully_paid'
  | 'rejected';

export interface AdminReceipt {
  id: string;
  filename: string;
  file_type: 'image' | 'pdf';
  file_size_formatted: string;
  submitted_at: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'created' | 'receipt' | 'verification' | 'quote' | 'status_change';
}

export interface AdminBooking {
  id: string; // reference string, e.g. "CLQ-P1V2W3"
  reference: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  service_id: string;
  service_name: string;
  package_name?: string;
  service_address: string;
  scheduled_date: string;
  scheduled_time?: string;
  notes?: string;
  quote_details?: string;
  is_quote: boolean;
  total_amount?: number;
  deposit_amount?: number;
  amount_paid?: number;
  booking_status: AdminBookingStatus;
  payment_status: PaymentStatus;
  receipts: AdminReceipt[];
  timeline: TimelineEvent[];
  created_at: string;
}

export interface AdminSession {
  email: string;
  role: 'admin';
  logged_in_at: string;
}
