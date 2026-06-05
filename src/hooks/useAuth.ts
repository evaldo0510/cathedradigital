import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { checkNewBadges, getBadgeById, type BadgeContext } from '@/lib/badges';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { setSentryUser } from '@/lib/sentry';


export type UserLevelClass = 'iniciante' | 'intermediário' | 'avançado';

export interface SensitiveData {
  email: string;
  diagnosis_result: Record<string, string> | null;
}

export interface Profile {
  id: string;
  name: string;
  is_premium: boolean;
  role: 'user' | 'admin' | string | null;
  premium_status?: string | null;
  premium_expires_at?: string | null;
  mercado_pago_subscription_id?: string | null;
  avatar_url: string | null;
  xp?: number;
  streak?: number;
  max_streak?: number;
  level?: number;
  last_visit?: string;
  completed_books?: string[];
  badges?: string[];
  total_minutes_read?: number;
  estado?: string;
  diocese?: string;
  paroquia?: string;
  movimento_pastoral?: string;
  reading_settings?: Record<string, any>;
  journey_reminder_time?: string;
  weekly_goal?: number;
  spiritual_themes?: string[];
  contemplative_preferences?: Record<string, any>;
  notification_settings?: Record<string, any>;
  _sensitive?: SensitiveData;
}

interface AuthContextValue {
  user: SupabaseUser | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isPremium: boolean;
  userLevel: UserLevelClass;
  refreshProfile: () => Promise<void>;
  authenticated: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const authRequestId = useRef(0);

  const fetchProfile = useCallback(async (currentUser: SupabaseUser) => {
    const [profileResult, sensitiveResult, premiumResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle(),
      (supabase as any)
        .from('user_sensitive_data')
        .select('email, diagnosis_result')
        .eq('user_id', currentUser.id)
        .maybeSingle(),
      supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('status', 'approved'),
    ]);

    if (profileResult.error) {
      console.error('Erro ao buscar perfil:', profileResult.error);
      return null;
    }

    if (premiumResult.error) {
      console.error('Erro ao verificar acesso premium:', premiumResult.error);
    }

    if (!profileResult.data) {
      return null;
    }

    return {
      ...profileResult.data,
      is_premium: Boolean(profileResult.data.is_premium || (premiumResult.count ?? 0) > 0),
      _sensitive: sensitiveResult.data as SensitiveData | undefined,
    } as Profile & { _sensitive?: { email: string; diagnosis_result: any } };
  }, []);

  const updateStreak = useCallback(async (currentUser: SupabaseUser, currentProfile: Profile) => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const lastVisit = currentProfile.last_visit ? new Date(currentProfile.last_visit) : null;
      const lastVisitStr = lastVisit ? lastVisit.toISOString().split('T')[0] : null;

      // Already visited today
      if (lastVisitStr === todayStr) {
        // Still check badges even if already visited today
        await checkAndAwardBadges(currentUser, currentProfile, currentProfile.streak || 0);
        return;
      }

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = 1;
      if (lastVisitStr === yesterdayStr) {
        newStreak = (currentProfile.streak || 0) + 1;
      }

      await supabase
        .from('profiles')
        .update({ streak: newStreak, last_visit: now.toISOString() })
        .eq('id', currentUser.id);

      // Check badges after streak update
      await checkAndAwardBadges(currentUser, currentProfile, newStreak);
    } catch (err) {
      console.error('Erro ao atualizar ofensiva (streak):', err);
    }
  }, []);

  const checkAndAwardBadges = useCallback(async (currentUser: SupabaseUser, currentProfile: Profile, streak: number) => {
    try {
      // 1. Fetch all necessary stats for badge conditions
      const [journeyRes, postsRes, likesRes, notesRes] = await Promise.all([
        supabase.from('journey_progress').select('journey_id', { count: 'exact', head: true }).eq('user_id', currentUser.id),
        supabase.from('community_posts').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id),
        supabase.from('community_likes').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id),
        supabase.from('user_notes').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id),
      ]);

      const currentBadges = currentProfile.badges || [];
      const ctx: BadgeContext = {
        completedBooks: new Set(currentProfile.completed_books || []),
        chaptersRead: {},
        totalMinutesRead: currentProfile.total_minutes_read || 0,
        streak,
        completedJourneys: journeyRes.count || 0,
        posts: postsRes.count || 0,
        likes: likesRes.count || 0,
        notes: notesRes.count || 0,
      } as any;

      const newBadgeIds = checkNewBadges(currentBadges, ctx);
      if (newBadgeIds.length > 0) {
        const updatedBadges = [...currentBadges, ...newBadgeIds];
        await supabase
          .from('profiles')
          .update({ badges: updatedBadges })
          .eq('id', currentUser.id);

        // Celebrate!
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#FFD700', '#FF6B35', '#4ECDC4', '#8B5CF6'] });
        for (const id of newBadgeIds) {
          const badge = getBadgeById(id);
          if (badge) {
            toast.success(`${badge.icon} ${badge.name}`, { description: badge.description, duration: 5000 });
          }
        }
      }
    } catch (err) {
      console.error('Erro ao verificar medalhas:', err);
    }
  }, []);

  const syncAuthState = useCallback(async (currentUser: SupabaseUser | null) => {
    const requestId = ++authRequestId.current;
    
    // If user is same as current state, skip (unless initial/loading)
    if (user?.id === currentUser?.id && !loading && requestId > 1) {
      return;
    }

    setUser(currentUser);
    setSentryUser(currentUser ? { id: currentUser.id, email: currentUser.email } : null);
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

      if (resolvedProfile) {
        void updateStreak(currentUser, resolvedProfile);
      }
    } catch (error) {
      if (requestId !== authRequestId.current) return;
      console.error('Erro na sincronização de sessão:', error);
      setProfile(null);
    } finally {
      if (requestId === authRequestId.current) {
        setLoading(false);
      }
    }
  }, [fetchProfile, updateStreak, user?.id, loading]);

  useEffect(() => {
    let active = true;

    // Safety timeout: never stay in loading state for more than 8 seconds
    const safetyTimeout = setTimeout(() => {
      if (active && loading) {
        console.warn('Tempo limite de carregamento de autenticação atingido. Forçando estado de carregamento como falso.');
        setLoading(false);
      }
    }, 8000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return;
      void syncAuthState(session?.user ?? null);
    });

    const initSession = async (retryCount = 0) => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!active) return;

        if (error) {
          if (error.name === 'AbortError' && retryCount < 3) {
            console.warn('Inicialização de sessão abortada (bloqueio roubado), tentando novamente...');
            setTimeout(() => initSession(retryCount + 1), 500);
            return;
          }
          console.error('Erro ao obter sessão:', error);
        }

        await syncAuthState(session?.user ?? null);
      } catch (error: any) {
        if (!active) return;
        
        if (error?.name === 'AbortError' && retryCount < 3) {
          console.warn('Inicialização de sessão abortada (bloqueio roubado), tentando novamente...');
          setTimeout(() => initSession(retryCount + 1), 500);
          return;
        }

        if (error?.name !== 'AbortError') {
          console.error('Erro de inicialização de sessão:', error);
        }
        
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    void initSession();

    return () => {
      active = false;
      clearTimeout(safetyTimeout);
      authRequestId.current += 1;
      subscription.unsubscribe();
    };
  }, [syncAuthState]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const resolvedProfile = await fetchProfile(user);
    if (resolvedProfile) setProfile(resolvedProfile);
  }, [user, fetchProfile]);

  // Realtime: sincroniza perfil entre dispositivos
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`profile-sync-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        () => { refreshProfile(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, refreshProfile]);


  const signOut = useCallback(async () => {
    authRequestId.current += 1;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
  }, []);

  const userLevel = useMemo<UserLevelClass>(() => {
    if (!profile) return 'iniciante';
    
    // Check diagnosis from sensitive data
    const diagnosis = profile._sensitive?.diagnosis_result as any;
    if (diagnosis) {
      const knowledge = diagnosis.knowledge;
      if (knowledge === 'basic') return 'iniciante';
      if (knowledge === 'moderate') return 'intermediário';
      if (knowledge === 'advanced' || knowledge === 'theological') return 'avançado';
    }

    // Fallback to integer level
    const levelNum = profile.level || 1;
    if (levelNum >= 10) return 'avançado';
    if (levelNum >= 4) return 'intermediário';
    return 'iniciante';
  }, [profile]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    loading,
    signOut,
    isPremium: profile?.is_premium ?? false,
    userLevel,
    refreshProfile,
    authenticated: !!user,
  }), [user, profile, loading, signOut, userLevel, refreshProfile]);

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}