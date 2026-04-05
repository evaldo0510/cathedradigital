import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  name: string;
  email: string;
  is_premium: boolean;
  role: 'user' | 'admin' | string | null;
  avatar_url: string | null;
  xp?: number;
  streak?: number;
  level?: number;
  last_visit?: string;
  completed_books?: string[];
  badges?: string[];
  total_minutes_read?: number;
}

interface AuthContextValue {
  user: SupabaseUser | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isPremium: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileRequestId = useRef(0);

  const loadProfile = useCallback(async (currentUser: SupabaseUser | null) => {
    const requestId = ++profileRequestId.current;

    if (!currentUser) {
      setProfile(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (requestId !== profileRequestId.current) return;

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
        return;
      }

      const { count: approvedTransactionsCount, error: premiumError } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('status', 'approved');

      if (requestId !== profileRequestId.current) return;

      if (premiumError) {
        console.error('Error checking premium access:', premiumError);
      }

      const resolvedProfile = data
        ? {
            ...data,
            is_premium: Boolean(data.is_premium || (approvedTransactionsCount ?? 0) > 0),
          }
        : null;

      setProfile(resolvedProfile as Profile | null);
    } catch (e) {
      if (requestId !== profileRequestId.current) return;
      console.error('Error fetching profile:', e);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || event === 'INITIAL_SESSION') return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (event === 'SIGNED_OUT' || !currentUser) {
        profileRequestId.current += 1;
        setProfile(null);
        setLoading(false);
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        return;
      }

      setLoading(true);
      window.setTimeout(() => {
        if (!active) return;

        void loadProfile(currentUser).finally(() => {
          if (active) setLoading(false);
        });
      }, 0);
    });

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!active) return;
        
        if (error) console.error('Error getting session:', error);

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        await loadProfile(currentUser);
      } catch (e) {
        console.error('Session init error:', e);
      } finally {
        if (active) setLoading(false);
      }
    };

    void initSession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    profileRequestId.current += 1;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    loading,
    signOut,
    isPremium: profile?.is_premium ?? false,
  }), [user, profile, loading, signOut]);

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
