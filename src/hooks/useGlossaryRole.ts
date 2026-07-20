import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type GlossaryRole = 'editor' | 'reviewer' | 'admin';

interface Result {
  role: GlossaryRole | null;
  isLoading: boolean;
  canEdit: boolean;
  canReview: boolean;
  canPublish: boolean;
  canDelete: boolean;
}

/**
 * Retorna a função do usuário no painel do Glossário.
 * Fonte da verdade: RPC `glossary_role_for` (server-trusted).
 * Admin global do site (user_roles.admin) é promovido automaticamente a 'admin'.
 */
export function useGlossaryRole(): Result {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['glossary-role', user?.id],
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.rpc('glossary_role_for', { _uid: user.id });
      if (error) return null;
      const role = (data ?? null) as GlossaryRole | null;
      if (role && ['editor', 'reviewer', 'admin'].includes(role)) return role;
      return null;
    },
  });

  const role = data ?? null;
  return {
    role,
    isLoading,
    canEdit: role === 'editor' || role === 'reviewer' || role === 'admin',
    canReview: role === 'reviewer' || role === 'admin',
    canPublish: role === 'reviewer' || role === 'admin',
    canDelete: role === 'admin',
  };
}
