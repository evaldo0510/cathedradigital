/**
 * useDevotionalFavorites — CRUD sobre `bible_favorites` estendida para
 * suportar orações e trechos devocionais genéricos (content_type != 'bible_verse').
 */

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DevotionalFavorite {
  id: string;
  content_type: string;
  content_id: string | null;
  title: string | null;
  content: string | null;
  url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface FavoriteInput {
  contentType: string; // ex.: 'prayer', 'rosary_mystery', 'viacrucis_station'
  contentId: string;
  title: string;
  content?: string | null;
  url?: string | null;
  metadata?: Record<string, unknown>;
}

export function useDevotionalFavorites(filterContentType?: string) {
  const { user } = useAuth();
  const [items, setItems] = useState<DevotionalFavorite[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let q = supabase
      .from("bible_favorites")
      .select("id, content_type, content_id, title, content, url, metadata, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (filterContentType) q = q.eq("content_type", filterContentType);
    const { data, error } = await q;
    if (!error && data) {
      setItems(
        data.map((d: any) => ({
          ...d,
          metadata: d.metadata ?? {},
        })),
      );
    }
    setLoading(false);
  }, [user, filterContentType]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(
    async (input: FavoriteInput) => {
      if (!user) throw new Error("auth-required");
      const { error } = await supabase.from("bible_favorites").insert({
        user_id: user.id,
        content_type: input.contentType,
        content_id: input.contentId,
        title: input.title,
        content: input.content ?? null,
        url: input.url ?? null,
        metadata: input.metadata ?? {},
      });
      if (error && !String(error.message).includes("duplicate")) throw error;
      await load();
    },
    [user, load],
  );

  const remove = useCallback(
    async (params: { contentType: string; contentId: string }) => {
      if (!user) throw new Error("auth-required");
      const { error } = await supabase
        .from("bible_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("content_type", params.contentType)
        .eq("content_id", params.contentId);
      if (error) throw error;
      await load();
    },
    [user, load],
  );

  const isFavorited = useCallback(
    (contentType: string, contentId: string) =>
      items.some((i) => i.content_type === contentType && i.content_id === contentId),
    [items],
  );

  const toggle = useCallback(
    async (input: FavoriteInput) => {
      if (isFavorited(input.contentType, input.contentId)) {
        await remove({ contentType: input.contentType, contentId: input.contentId });
      } else {
        await add(input);
      }
    },
    [isFavorited, remove, add],
  );

  return { items, loading, add, remove, toggle, isFavorited, reload: load };
}
