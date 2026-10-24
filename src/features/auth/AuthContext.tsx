import React, { createContext, useCallback, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import type { ProfileRow } from '../../types/database';

export type AuthErrorCode =
  | 'invalidCredentials'
  | 'emailAlreadyRegistered'
  | 'weakPassword'
  | 'rateLimited'
  | 'networkError'
  | 'genericError';

export interface AuthActionResult {
  errorCode: AuthErrorCode | null;
  profile?: ProfileRow | null;
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (params: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
  }) => Promise<AuthActionResult>;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthActionResult>;
  updatePassword: (newPassword: string) => Promise<AuthActionResult>;
  updateProfile: (params: { fullName: string; phone: string }) => Promise<AuthActionResult>;
  refreshProfile: () => Promise<ProfileRow | null>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapSupabaseErrorToCode(message?: string): AuthErrorCode {
  if (!message) return 'genericError';
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'invalidCredentials';
  }
  if (lower.includes('already registered') || lower.includes('already exists')) {
    return 'emailAlreadyRegistered';
  }
  if (lower.includes('password') && (lower.includes('weak') || lower.includes('least'))) {
    return 'weakPassword';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'rateLimited';
  }
  if (lower.includes('fetch') || lower.includes('network')) {
    return 'networkError';
  }
  return 'genericError';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState<boolean>(env.isConfigured);

  const fetchUserProfile = useCallback(async (userId: string): Promise<ProfileRow | null> => {
    if (!env.isConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }
      const typedProfile = data as ProfileRow;
      setProfile(typedProfile);
      return typedProfile;
    } catch {
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async (): Promise<ProfileRow | null> => {
    if (!user?.id) return null;
    return fetchUserProfile(user.id);
  }, [user?.id, fetchUserProfile]);

  useEffect(() => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!isMounted) return;
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          await fetchUserProfile(initialSession.user.id);
        } else {
          setProfile(null);
        }
      } catch {
        if (isMounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        await fetchUserProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signUp = useCallback(
    async ({
      fullName,
      phone,
      email,
      password,
    }: {
      fullName: string;
      phone: string;
      email: string;
      password: string;
    }): Promise<AuthActionResult> => {
      if (!env.isConfigured) {
        return { errorCode: 'networkError' };
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone,
            },
          },
        });

        if (error) {
          return { errorCode: mapSupabaseErrorToCode(error.message) };
        }

        let loadedProfile: ProfileRow | null = null;
        if (data.user) {
          loadedProfile = await fetchUserProfile(data.user.id);
        }
        return { errorCode: null, profile: loadedProfile };
      } catch (err) {
        return {
          errorCode: mapSupabaseErrorToCode(err instanceof Error ? err.message : undefined),
        };
      }
    },
    [fetchUserProfile]
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthActionResult> => {
      if (!env.isConfigured) {
        return { errorCode: 'networkError' };
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error || !data.user) {
          return { errorCode: mapSupabaseErrorToCode(error?.message) };
        }

        const loadedProfile = await fetchUserProfile(data.user.id);
        return { errorCode: null, profile: loadedProfile };
      } catch (err) {
        return {
          errorCode: mapSupabaseErrorToCode(err instanceof Error ? err.message : undefined),
        };
      }
    },
    [fetchUserProfile]
  );

  const signOut = useCallback(async () => {
    if (env.isConfigured) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthActionResult> => {
    if (!env.isConfigured) {
      return { errorCode: 'networkError' };
    }

    try {
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/reset-password`
          : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      // Security requirement: Do not reveal whether an email exists in the forgot-password flow.
      // Only surface rate limit or network connectivity errors.
      if (error) {
        const code = mapSupabaseErrorToCode(error.message);
        if (code === 'rateLimited' || code === 'networkError') {
          return { errorCode: code };
        }
      }
      return { errorCode: null };
    } catch (err) {
      return {
        errorCode: mapSupabaseErrorToCode(err instanceof Error ? err.message : undefined),
      };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string): Promise<AuthActionResult> => {
    if (!env.isConfigured) {
      return { errorCode: 'networkError' };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { errorCode: mapSupabaseErrorToCode(error.message) };
      }
      return { errorCode: null };
    } catch (err) {
      return {
        errorCode: mapSupabaseErrorToCode(err instanceof Error ? err.message : undefined),
      };
    }
  }, []);

  const updateProfile = useCallback(
    async ({
      fullName,
      phone,
    }: {
      fullName: string;
      phone: string;
    }): Promise<AuthActionResult> => {
      if (!env.isConfigured || !user?.id) {
        return { errorCode: 'genericError' };
      }

      try {
        // Strictly update only full_name and phone; never send role from client
        const { data, error } = await supabase
          .from('profiles')
          .update({
            full_name: fullName.trim(),
            phone: phone.trim(),
          })
          .eq('id', user.id)
          .select('*')
          .single();

        if (error || !data) {
          return { errorCode: mapSupabaseErrorToCode(error?.message) };
        }

        const updated = data as ProfileRow;
        setProfile(updated);
        return { errorCode: null, profile: updated };
      } catch (err) {
        return {
          errorCode: mapSupabaseErrorToCode(err instanceof Error ? err.message : undefined),
        };
      }
    },
    [user?.id]
  );

  // Admin status is determined strictly from the profiles database table row
  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isAdmin,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { useAuth } from './useAuth';
