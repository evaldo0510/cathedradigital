/**
 * useDevotionalProgress — persiste a última posição em um leitor devocional
 * (rosário, via crucis, breviário, ladainhas, missal, oração).
 *
 * - Autenticado: grava em `reading_marks` (content_type='devotional', content_id=key).
 * - Não autenticado: fallback em localStorage.
 * - Reaproveita a estrutura já existente (nenhum schema novo).
 */

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const LS_PREFIX = "cathedra:devotional-progress:";

export interface DevotionalProgress {
  section: string | null;
  step: number | null;
  label: string | null;
  updatedAt: string | null;
}

const EMPTY: DevotionalProgress = { section: null, step: null, label: null, updatedAt: null };

function readLocal(key: string): DevotionalProgress {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return EMPTY;
  }
}

function writeLocal(key: string, progress: DevotionalProgress) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(progress));
  } catch {
    /* noop */
  }
}

export function useDevotionalProgress(key: string) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<DevotionalProgress>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      // Sempre carrega localStorage primeiro para instant paint.
      const local = readLocal(key);
      if (!cancelled) setProgress(local);

      if (!user) {
        if (!cancelled) setLoaded(true);
        return;
      }

      const { data, error } = await supabase
        .from("reading_marks")
        .select("chapter, paragraph, label, updated_at")
        .eq("user_id", user.id)
        .eq("content_type", "devotional")
        .eq("content_id", key)
        .eq("is_last_read", true)
        .maybeSingle();

      if (cancelled) return;
      if (!error && data) {
        setProgress({
          section: data.label ? String(data.label).split("|")[0] || null : null,
          step: data.paragraph ?? data.chapter ?? null,
          label: data.label ?? null,
          updatedAt: data.updated_at ?? null,
        });
      }
      setLoaded(true);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user, key]);

  const save = useCallback(
    async (next: { section?: string | null; step?: number | null; label?: string | null }) => {
      const merged: DevotionalProgress = {
        section: next.section ?? progress.section,
        step: next.step ?? progress.step,
        label: next.label ?? progress.label,
        updatedAt: new Date().toISOString(),
      };
      setProgress(merged);
      writeLocal(key, merged);

      if (!user) return;
      await supabase.from("reading_marks").upsert(
        {
          user_id: user.id,
          content_type: "devotional",
          content_id: key,
          chapter: merged.step ?? null,
          paragraph: merged.step ?? null,
          label: merged.label ?? merged.section ?? null,
          is_last_read: true,
        },
        { onConflict: "user_id,content_type,content_id" },
      );
    },
    [key, user, progress.section, progress.step, progress.label],
  );

  return { progress, loaded, save };
}
