import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { adminLogin, getAdminSession } from './adminApi';
import { supabase } from '../../../lib/supabaseClient';

vi.mock('../../../lib/supabaseClient', () => {
  const mockSignInWithPassword = vi.fn();
  const mockGetSession = vi.fn();
  const mockSignOut = vi.fn();
  const mockFrom = vi.fn();

  return {
    supabase: {
      auth: {
        signInWithPassword: mockSignInWithPassword,
        getSession: mockGetSession,
        signOut: mockSignOut,
      },
      from: mockFrom,
    },
  };
});

describe('Admin Authentication & Authorization Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('adminLogin', () => {
    it('trims and lowercases the email before submitting to Supabase auth', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: { id: 'user-123', email: 'owner@cleanique.com' } as any, session: {} as any },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: { user_id: 'user-123' },
          error: null,
        }),
      } as any);

      const result = await adminLogin('  OWNER@Cleanique.COM   ', 'SecretPass123!');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'owner@cleanique.com',
        password: 'SecretPass123!',
      });
      expect(result.id).toBe('user-123');
      expect(result.email).toBe('owner@cleanique.com');
    });

    it('returns "Incorrect email or password." when credentials are bad', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', status: 400 } as any,
      });

      await expect(adminLogin('admin@example.com', 'wrongpassword')).rejects.toThrow(
        'Incorrect email or password.'
      );
    });

    it('returns "Cannot reach the server. Check your internet connection and try again." on network failure', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockRejectedValueOnce(
        new TypeError('Failed to fetch')
      );

      await expect(adminLogin('admin@example.com', 'password')).rejects.toThrow(
        'Cannot reach the server. Check your internet connection and try again.'
      );
    });

    it('signs out immediately and shows "This account does not have admin access." if signed in but not in owners table', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: { id: 'not-owner-id', email: 'user@example.com' } as any, session: {} as any },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: null,
          error: null,
        }),
      } as any);

      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null });

      await expect(adminLogin('user@example.com', 'password123')).rejects.toThrow(
        'This account does not have admin access.'
      );

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('returns generic error message and logs real error to console for unexpected errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Internal Server Database Corruption', code: '500_CRITICAL' } as any,
      });

      await expect(adminLogin('admin@example.com', 'password')).rejects.toThrow(
        'An unexpected error occurred. Please try again.'
      );

      expect(consoleSpy).toHaveBeenCalledWith('Supabase auth error:', expect.anything());
    });
  });

  describe('Route Guard & Session Verification (getAdminSession)', () => {
    it('returns session if session exists and user is in owners table', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: {
          session: {
            user: { id: 'owner-1', email: 'owner@example.com', last_sign_in_at: '2025-01-01' },
          } as any,
        },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: { user_id: 'owner-1' },
          error: null,
        }),
      } as any);

      const session = await getAdminSession();
      expect(session).not.toBeNull();
      expect(session?.id).toBe('owner-1');
    });

    it('returns null and signs out if user has a session but is not an owner', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: {
          session: {
            user: { id: 'non-owner-id', email: 'guest@example.com' },
          } as any,
        },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: null,
          error: null,
        }),
      } as any);

      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null });

      const session = await getAdminSession();
      expect(session).toBeNull();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('returns null if no session exists', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const session = await getAdminSession();
      expect(session).toBeNull();
    });
  });
});
