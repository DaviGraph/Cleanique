# Cleanique rules (follow strictly, even when fixing errors)

- Never create or edit Supabase migrations, tables, or RLS policies. If a DB change
  is needed, stop and tell me what you need.
- Customer pages may ONLY call the RPCs create_booking, get_booking_status,
  attach_receipt, and the receipt-upload-url Edge Function. No direct
  supabase.from() calls on bookings, payments, or quotes from customer pages.
- All data access goes through src/features/booking/lib/bookingApi.ts.
  Components never fetch data directly.
- Never send prices from the client. Display prices read from the data source.
- Only the Supabase anon key may appear in frontend code. Never a service role key.
- No sign-up UI anywhere. Admin login is email + password only.
- Brand colours: #2ECDBF (turquoise), #102A29 (deep teal), #F5F9F8 (off-white), #FFFFFF.
- After a successful receipt upload show exactly: "Your payment details have been
  submitted. Your booking will be confirmed after Cleanique verifies the payment."
- Never show "Paid" or "Confirmed" to customers unless booking_status says so.
- Uploads: JPG, PNG, PDF only, max 5MB.