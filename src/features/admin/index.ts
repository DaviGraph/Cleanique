/**
 * Admin Feature Module
 * Cleanique rules reminder:
 * - No sign-up UI anywhere. Admin login is email + password only.
 * - Components must never expose service role keys.
 */

export interface AdminUser {
  email: string;
  role: 'admin';
}
