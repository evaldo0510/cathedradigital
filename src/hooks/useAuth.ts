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
  const authRequestId = useRef(0);

  const fetchProfile = useCallback(async (currentUser: SupabaseUser) => {
    const [profileResult, premiumResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle(),
      supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('status', 'approved'),
    ]);

    if (profileResult.error) {
      console.error('Error fetching profile:', profileResult.error);
      return null;
    }

    if (premiumResult.error) {
      console.error('Error checking premium access:', premiumResult.error);
    }

    if (!profileResult.data) {
      return null;
    }

    return {
      ...profileResult.data,
      is_premium: Boolean(profileResult.data.is_premium || (premiumResult.count ?? 0) > 0),
    } as Profile;
  }, []);

  const syncAuthState = useCallback(async (currentUser: SupabaseUser | null) => {
    const requestId = ++authRequestId.current;
    setUser(currentUser);
    setLoading(true);

    if (!currentUser) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const resolvedProfile = await fetchProfile(currentUser);
      if (requestId !== authRequestId.current) return;
      setProfile(resolvedProfile);
    } catch (error) {
      if (requestId !== authRequestId.current) return;
      console.error('Session sync error:', error);
      setProfile(null);
    } finally {
      if (requestId === authRequestId.current) {
        setLoading(false);
      }
    }
  }, [fetchProfile]);

  useEffect(() => {
    let active = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return;
      void syncAuthState(session?.user ?? null);
    });

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!active) return;

        if (error) {
          console.error('Error getting session:', error);
        }

        await syncAuthState(session?.user ?? null);
      } catch (error) {
        if (!active) return;
        console.error('Session init error:', error);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    void initSession();

    return () => {
      active = false;
      authRequestId.current += 1;
      subscription.unsubscribe();
    };
  }, [syncAuthState]);

  const signOut = useCallback(async () => {
    authRequestId.current += 1;
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
