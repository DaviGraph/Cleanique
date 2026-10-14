# Admin Feature Module

This directory contains admin management views and authentication.

## Strict Rules
- **No sign-up UI anywhere.** Cleanique admin accounts are provisioned directly in the backend.
- Admin login is **email + password only**.
- Only the Supabase anon key may appear in frontend code. Never a service role key.
