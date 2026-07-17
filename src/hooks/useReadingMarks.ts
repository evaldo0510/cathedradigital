import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ReadingMark {
  id: string;
  content_type: string;
  content_id: string;
  chapter?: number;
  paragraph?: number;
  position?: number;
  label?: string;
  url?: string;
  is_last_read: boolean;
  created_at: string;
  updated_at: string;
}

export function useReadingMarks() {
  const { user } = useAuth();
  const [marks, setMarks] = useState<ReadingMark[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMarks = useCallback(async () => {
    if (!user) { setMarks([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('reading_marks')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setMarks(data as ReadingMark[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMarks();
  }, [fetchMarks]);

  // Realtime synchronization
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`reading_marks_realtime:${user.id}:${Math.random().toString(36).slice(2, 10)}`)

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reading_marks',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchMarks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchMarks]);

  const addMark = useCallback(async (mark: Partial<ReadingMark>) => {
    if (!user) return null;

    // If setting as last_read, unset others for this user
    if (mark.is_last_read) {
      await supabase
        .from('reading_marks')
        .update({ is_last_read: false })
        .eq('user_id', user.id)
        .eq('is_last_read', true);
    }

    const { data, error } = await supabase
      .from('reading_marks')
      .insert({
        user_id: user.id,
        content_type: mark.content_type,
        content_id: mark.content_id,
        chapter: mark.chapter,
        paragraph: mark.paragraph,
        position: mark.position,
        label: mark.label,
        url: mark.url,
        is_last_read: mark.is_last_read || false,
      })
      .select()
      .single();

    if (!error && data) {
      setMarks(prev => [data as ReadingMark, ...prev]);
      return data as ReadingMark;
    }
    return null;
  }, [user]);

  const updateMark = useCallback(async (id: string, updates: Partial<ReadingMark>) => {
    if (!user) return;
    const { error } = await supabase
      .from('reading_marks')
      .update(updates)
      .eq('id', id);

    if (!error) {
      setMarks(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    }
  }, [user]);

  const deleteMark = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('reading_marks')
      .delete()
      .eq('id', id);

    if (!error) {
      setMarks(prev => prev.filter(m => m.id !== id));
    }
  }, [user]);

  const saveLastRead = useCallback(async (mark: Partial<ReadingMark>) => {
    if (!user) return;

    // Use upsert logic for last_read per content_type or just one global last_read
    // Let's do one global last_read for now as requested "return to last saved point"
    
    // 1. Unset previous global last_read
    await supabase
      .from('reading_marks')
      .update({ is_last_read: false })
      .eq('user_id', user.id)
      .eq('is_last_read', true);

    // 2. Insert new one
    await addMark({ ...mark, is_last_read: true });
  }, [user, addMark]);

  const getLastRead = useCallback(async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('reading_marks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_last_read', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!error && data) return data as ReadingMark;
    return null;
  }, [user]);

  return { marks, loading, addMark, updateMark, deleteMark, saveLastRead, getLastRead, refetch: fetchMarks };
}
