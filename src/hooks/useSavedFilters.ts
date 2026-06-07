import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface SavedFilter {
  id: string;
  user_id: string;
  name: string;
  query: string;
  filter_by: string;
  project_id: string;
  created_at: string;
  updated_at: string;
}

export function useSavedFilters(projectId: string = 'global') {
  const { user } = useAuth();
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFilters = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('saved_filters')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching filters:', error);
    } else {
      setFilters(data || []);
    }
    setIsLoading(false);
  }, [user, projectId]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  const saveFilter = useCallback(async (name: string, query: string, filterBy: string) => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('saved_filters')
      .insert({
        user_id: user.id,
        name,
        query,
        filter_by: filterBy,
        project_id: projectId
      })
      .select()
      .single();

    if (error) {
      toast.error('Erro ao salvar filtro');
      return null;
    }

    setFilters(prev => [data, ...prev]);
    return data;
  }, [user, projectId]);

  const updateFilter = useCallback(async (id: string, updates: Partial<SavedFilter>) => {
    const { data, error } = await supabase
      .from('saved_filters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast.error('Erro ao atualizar filtro');
      return null;
    }

    setFilters(prev => prev.map(f => f.id === id ? data : f));
    return data;
  }, []);

  const deleteFilter = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('saved_filters')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir filtro');
      return;
    }

    setFilters(prev => prev.filter(f => f.id !== id));
    toast.success('Filtro excluído');
  }, []);

  const duplicateToUser = useCallback(async (filter: SavedFilter, targetUserId: string, targetProjectId?: string) => {
    const { data, error } = await supabase
      .from('saved_filters')
      .insert({
        user_id: targetUserId,
        name: `${filter.name} (Compartilhado)`,
        query: filter.query,
        filter_by: filter.filter_by,
        project_id: targetProjectId || filter.project_id
      })
      .select()
      .single();

    if (error) {
      toast.error('Erro ao duplicar filtro para o usuário');
      return null;
    }

    return data;
  }, []);

  return { filters, isLoading, saveFilter, updateFilter, deleteFilter, duplicateToUser, refreshFilters: fetchFilters };
}
