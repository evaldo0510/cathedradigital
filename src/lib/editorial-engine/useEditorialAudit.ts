/**
 * Hook genérico do Editorial Engine.
 *
 * Consome o snapshot mais recente por `manifest.id` (fonte da verdade) para
 * alimentar Mission Control e outros consumidores agregadores. O painel
 * detalhado (`EditorialAudit.tsx`) continua fazendo sua própria auditoria
 * completa; este hook expõe a mesma superfície de dados em forma resumida.
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { EntityManifest, EntitySnapshot } from "./types";
import { iceTier, type IceTier } from "./ice";
import { computeFreezeCriteria, isFrozen } from "./freeze-manager";

export interface EditorialSummary {
  loading: boolean;
  ready: boolean;
  snapshot: EntitySnapshot | null;
  ice: number;
  editorial: number;
  nexus: number;
  gatePassing: number;
  gateTotal: number;
  tier: IceTier;
  frozen: boolean;
  freezePassCount: number;
  freezeTotalCount: number;
  capturedAt: string | null;
}

const EMPTY: EditorialSummary = {
  loading: true, ready: false, snapshot: null,
  ice: 0, editorial: 0, nexus: 0,
  gatePassing: 0, gateTotal: 0,
  tier: "review", frozen: false,
  freezePassCount: 0, freezeTotalCount: 5,
  capturedAt: null,
};

export function useEditorialSummary(manifest: EntityManifest): EditorialSummary {
  const [state, setState] = useState<EditorialSummary>(EMPTY);

  useEffect(() => {
    if (!manifest.ready) {
      setState({ ...EMPTY, loading: false, ready: false });
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from("editorial_snapshots")
        .select("id,module,captured_at,total,gold,silver,bronze,needs_review,avg_ice,avg_editorial,avg_nexus,gate_passing,gate_failing")
        .eq("module", manifest.id)
        .order("captured_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (!data) {
        setState({ ...EMPTY, loading: false, ready: true });
        return;
      }
      const snap = data as EntitySnapshot;
      const gateTotal = snap.gate_passing + snap.gate_failing;
      const totals = {
        total: snap.total,
        published: snap.total, // sem coluna dedicada no snapshot; usamos total como proxy p/ isFrozen
        drafts: 0,
        gold: snap.gold, silver: snap.silver, bronze: snap.bronze, needs_review: snap.needs_review,
        avg: Math.round(snap.avg_ice), avg_editorial: Math.round(snap.avg_editorial),
        avg_nexus: Math.round(snap.avg_nexus), avg_weighted: Math.round(snap.avg_ice),
      };
      const criteria = computeFreezeCriteria(totals);
      setState({
        loading: false, ready: true, snapshot: snap,
        ice: Number(snap.avg_ice),
        editorial: Number(snap.avg_editorial),
        nexus: Number(snap.avg_nexus),
        gatePassing: snap.gate_passing, gateTotal,
        tier: iceTier(Number(snap.avg_ice)),
        frozen: isFrozen(totals),
        freezePassCount: criteria.filter(c => c.ok).length,
        freezeTotalCount: criteria.length,
        capturedAt: snap.captured_at,
      });
    })();
    return () => { cancelled = true; };
  }, [manifest.id, manifest.ready]);

  return state;
}
