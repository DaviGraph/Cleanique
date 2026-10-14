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

export interface PaymentRow {
  id: string;
  submitted_at: string;
  file_type: 'image' | 'pdf';
  size: number;
  size_formatted: string;
  status: string;
  verified_amount: number;
  rejection_reason: string | null;
  receipt_path: string;
}

export interface AdminReceipt {
  id: string;
  filename: string;
  file_type: 'image' | 'pdf';
  file_size_formatted: string;
  storage_path?: string;
  submitted_at: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'created' | 'receipt' | 'receipt_uploaded' | 'verification' | 'quote' | 'status_change';
}

export interface AdminBookingItem {
  id: string;
  name: string;
  quantity: number;
  price: number | null;
  formattedPrice: string;
}

export interface AdminBooking {
  id: string; // UUID
  reference: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_whatsapp?: string;
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
  amount_paid?: number;
  booking_status: AdminBookingStatus;
  payment_status: PaymentStatus;
  payments: PaymentRow[];
  receipts: AdminReceipt[];
  items?: AdminBookingItem[];
  timeline: TimelineEvent[];
  created_at: string;
}

export interface AdminSession {
  id: string;
  email: string;
  role: 'admin';
  logged_in_at: string;
}

export interface CleaniqueSetting {
  key: string;
  value: string;
  updated_at: string;
}
