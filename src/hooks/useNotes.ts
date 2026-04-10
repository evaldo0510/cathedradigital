import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { saveUserPsychology } from '@/lib/psychologicalProfile';

export interface UserNote {
  id: string;
  content_type: string;
  content_id: string;
  note_text: string;
  highlight_color: string;
  created_at: string;
  updated_at: string;
}

export function useNotes(contentType: string, contentId?: string) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!user) { setNotes([]); return; }
    setLoading(true);
    let query = supabase
      .from('user_notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('content_type', contentType)
      .order('created_at', { ascending: false });

    if (contentId) query = query.eq('content_id', contentId);

    const { data } = await query;
    setNotes((data as UserNote[]) || []);
    setLoading(false);
  }, [user, contentType, contentId]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const addNote = useCallback(async (cId: string, text: string, color = 'yellow') => {
    if (!user || !text.trim()) return null;
    const { data, error } = await supabase
      .from('user_notes')
      .insert({ user_id: user.id, content_type: contentType, content_id: cId, note_text: text.trim(), highlight_color: color })
      .select()
      .single();
    if (!error && data) {
      setNotes(prev => [data as UserNote, ...prev]);
      return data as UserNote;
    }
    return null;
  }, [user, contentType]);

  const updateNote = useCallback(async (noteId: string, text: string) => {
    if (!user) return;
    await supabase.from('user_notes').update({ note_text: text.trim() }).eq('id', noteId);
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, note_text: text.trim(), updated_at: new Date().toISOString() } : n));
  }, [user]);

  const deleteNote = useCallback(async (noteId: string) => {
    if (!user) return;
    await supabase.from('user_notes').delete().eq('id', noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
  }, [user]);

  return { notes, loading, addNote, updateNote, deleteNote, refetch: fetchNotes };
}
