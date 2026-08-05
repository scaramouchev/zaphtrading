/**
 * authService — all Supabase auth calls.
 *
 * This service owns I/O and throws typed AppErrors. It has no knowledge
 * of Zustand stores or React context; those concerns belong to AuthProvider.
 */
import { supabase } from '@/lib/supabase';
import { AppError } from '@/lib/errors';
import type { Session, User } from '@supabase/supabase-js';

export interface AuthResult {
  user: User | null;
  session: Session | null;
}

export const authService = {
  async signUp(email: string, password: string): Promise<AuthResult> {
    if (!email || !password) {
      throw AppError.validation('Email and password are required.');
    }
    if (password.length < 6) {
      throw AppError.validation('Password must be at least 6 characters.');
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        throw AppError.auth('An account with this email already exists.');
      }
      throw AppError.fromSupabase(error, 'authService.signUp');
    }
    return { user: data.user, session: data.session };
  },

  async signIn(email: string, password: string): Promise<AuthResult> {
    if (!email || !password) {
      throw AppError.validation('Email and password are required.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (
        error.message.toLowerCase().includes('invalid login') ||
        error.message.toLowerCase().includes('invalid credentials')
      ) {
        throw AppError.auth('Invalid email or password.');
      }
      throw AppError.fromSupabase(error, 'authService.signIn');
    }
    return { user: data.user, session: data.session };
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw AppError.fromSupabase(error, 'authService.signOut');
  },

  async resetPassword(email: string): Promise<void> {
    if (!email) throw AppError.validation('Email is required.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw AppError.fromSupabase(error, 'authService.resetPassword');
  },

  async updatePassword(newPassword: string): Promise<void> {
    if (newPassword.length < 6) {
      throw AppError.validation('Password must be at least 6 characters.');
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw AppError.fromSupabase(error, 'authService.updatePassword');
  },

  async getSession(): Promise<AuthResult> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw AppError.fromSupabase(error, 'authService.getSession');
    return { user: data.session?.user ?? null, session: data.session };
  },

  /** Subscribe to auth events. Returns an unsubscribe function. */
  onAuthStateChange(callback: (session: Session | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
    return () => data.subscription.unsubscribe();
  },
};
