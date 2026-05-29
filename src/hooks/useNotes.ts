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
  book_abbr?: string;
  chapter?: number;
  paragraph?: number;
  verse?: number;
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

  // Realtime synchronization
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user_notes_realtime_${contentType}_${contentId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_notes',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          // Only refresh if it matches the content type filter (if not 'all')
          const newNote = payload.new as any;
          if (contentType === 'all' || (newNote && newNote.content_type === contentType)) {
            fetchNotes();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotes, contentType, contentId]);

  const addNote = useCallback(async (cId: string, text: string, color = 'yellow', context?: { book_abbr?: string; chapter?: number; paragraph?: number; verse?: number }) => {
    if (!user || !text.trim()) return null;
    
    // Create temporary item for optimistic UI
    const tempId = crypto.randomUUID();
    const tempNote: UserNote = {
      id: tempId,
      content_type: contentType,
      content_id: cId,
      note_text: text.trim(),
      highlight_color: color,
      ...context,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Optimistic update
    setNotes(prev => [tempNote, ...prev]);

    try {
      const { data, error } = await supabase
        .from('user_notes')
        .insert({ user_id: user.id, content_type: contentType, content_id: cId, note_text: text.trim(), highlight_color: color, ...context })
        .select()
        .single();
        
      if (!error && data) {
        // Replace temp note with real data from server
        setNotes(prev => prev.map(n => n.id === tempId ? (data as UserNote) : n));
        
        // Save psychological profile (backgrounded)
        saveUserPsychology(user.id, text.trim(), `note_${contentType}`);
        
        return data as UserNote;
      } else {
        throw error || new Error('Failed to save note');
      }
    } catch (err) {
      console.error('Error adding note:', err);
      // Rollback optimistic update
      setNotes(prev => prev.filter(n => n.id !== tempId));
      return null;
    }
  }, [user, contentType]);

  const updateNote = useCallback(async (noteId: string, text: string, color?: string) => {
    if (!user) return;
    const updates: any = { note_text: text.trim(), updated_at: new Date().toISOString() };
    if (color) updates.highlight_color = color;
    
    await supabase.from('user_notes').update(updates).eq('id', noteId);
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...updates } : n));
  }, [user]);

  const deleteNote = useCallback(async (noteId: string) => {
    if (!user) return;
    await supabase.from('user_notes').delete().eq('id', noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
  }, [user]);

  return { notes, loading, addNote, updateNote, deleteNote, refetch: fetchNotes };
}
