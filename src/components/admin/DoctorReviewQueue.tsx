/**
 * DoctorReviewQueue — Fila de revisão editorial dos Doutores da Igreja.
 * Sprint Santos S2. Fluxo: draft → editorial_review → doctrinal_review → published.
 * Toda transição passa pela RPC `saints_advance_editorial_stage` (server-side).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Icons } from '@/constants';

type EditorialStatus = 'draft' | 'editorial_review' | 'doctrinal_review' | 'published' | 'archived';

interface DoctorRow {
  id: string;
  name: string;
  title: string | null;
  editorial_status: EditorialStatus | null;
  editorial_score: number | null;
  full_bio: string | null;
  bio: string | null;
  prayer: string | null;
  works: unknown;
  iconography: unknown;
  source_url: string | null;
}

const NEXT_STATUS: Record<string, EditorialStatus> = {
  draft: 'editorial_review',
  editorial_review: 'doctrinal_review',
  doctrinal_review: 'published',
};

const STAGE_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  editorial_review: 'Rev. Editorial',
  doctrinal_review: 'Rev. Doutrinal',
  published: 'Publicado',
  archived: 'Arquivado',
};

const STAGE_TONE: Record<string, string> = {
  draft: 'border-muted-foreground/40 text-muted-foreground',
  editorial_review: 'border-blue-500/40 text-blue-700 dark:text-blue-300',
  doctrinal_review: 'border-amber-500/40 text-amber-700 dark:text-amber-300',
  published: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
  archived: 'border-red-500/40 text-red-700 dark:text-red-300',
};

const missingFields = (r: DoctorRow): string[] => {
  const gaps: string[] = [];
  if (!r.bio || r.bio.length < 150) gaps.push('bio curta (≥150)');
  if (!r.full_bio || r.full_bio.length < 800) gaps.push('bio longa (≥800)');
  const worksArr = Array.isArray(r.works) ? r.works : [];
  if (worksArr.length < 1) gaps.push('escritos');
  const iconoArr = Array.isArray(r.iconography) ? r.iconography : (r.iconography ? [r.iconography] : []);
  if (iconoArr.length < 1) gaps.push('iconografia');
  if (!r.prayer) gaps.push('oração');
  if (!r.source_url) gaps.push('fonte');
  return gaps;
};

const DoctorReviewQueue: React.FC = () => {
  const [rows, setRows] = useState<DoctorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [rejectFor, setRejectFor] = useState<DoctorRow | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('saints')
      .select('id,name,title,editorial_status,editorial_score,full_bio,bio,prayer,works,iconography,source_url')
      .eq('category', 'doctor')
      .or('editorial_status.is.null,editorial_status.in.(draft,editorial_review,doctrinal_review)')
      .order('editorial_status', { ascending: false, nullsFirst: false })
      .order('editorial_score', { ascending: false, nullsFirst: true })
      .order('name');
    setLoading(false);
    if (error) return toast.error('Falha ao carregar fila', { description: error.message });
    setRows((data || []) as DoctorRow[]);
  }, []);

  useEffect(() => { load(); }, [load]);

  const pending = useMemo(() => rows.filter((r) => (r.editorial_status ?? 'draft') === 'draft'), [rows]);

  const advance = async (row: DoctorRow) => {
    const current = row.editorial_status ?? 'draft';
    const next = NEXT_STATUS[current];
    if (!next) return;
    if (next === 'published') {
      const gaps = missingFields(row);
      if (gaps.length > 0) {
        toast.error('Não pode publicar: campos faltantes', { description: gaps.join(', ') });
        return;
      }
      if (!confirm(`Publicar "${row.name}"? Score: ${row.editorial_score ?? 0}`)) return;
    }
    const { error } = await supabase.rpc('saints_advance_editorial_stage' as any, {
      _saint_id: row.id,
      _next_status: next,
      _note: null,
    });
    if (error) return toast.error('Falha na transição', { description: error.message });
    toast.success(`${row.name}: ${STAGE_LABEL[current]} → ${STAGE_LABEL[next]}`);
    load();
  };

  const reject = async () => {
    if (!rejectFor) return;
    const { error } = await supabase.rpc('saints_advance_editorial_stage' as any, {
      _saint_id: rejectFor.id,
      _next_status: 'draft' as any,
      _note: rejectNote || null,
    });
    if (error) return toast.error('Falha ao reprovar', { description: error.message });
    toast.success(`${rejectFor.name} devolvido para rascunho`);
    setRejectFor(null);
    setRejectNote('');
    load();
  };

  const ingestPending = async () => {
    if (pending.length === 0) {
      toast.info('Sem doutores pendentes de ingestão.');
      return;
    }
    if (!confirm(`Ingerir ${pending.length} doutor(es) via saint-import? Grava tudo como draft.`)) return;
    setIngesting(true);
    setProgress({ done: 0, total: pending.length });
    let ok = 0;
    let failed = 0;
    for (let i = 0; i < pending.length; i++) {
      const s = pending[i];
      try {
        const { error } = await supabase.functions.invoke('saint-import', {
          body: { saintId: s.id, mode: 'fill', dryRun: false },
        });
        if (error) throw error;
        ok++;
      } catch (e: unknown) {
        failed++;
        console.warn('saint-import failed', s.id, e);
      }
      setProgress({ done: i + 1, total: pending.length });
      await new Promise((r) => setTimeout(r, 1200)); // throttle
    }
    setIngesting(false);
    toast.success(`Ingestão concluída: ${ok} ok, ${failed} falhas`);
    load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icons.BookOpen className="w-4 h-4" /> Fila de Revisão · Doutores
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {rows.length} em revisão · {pending.length} pendente(s) de ingestão
          </p>
        </div>
        <div className="flex items-center gap-2">
          {progress && (
            <span className="text-xs text-muted-foreground">
              {progress.done}/{progress.total}
            </span>
          )}
          <Button size="sm" variant="secondary" onClick={ingestPending} disabled={ingesting || pending.length === 0}>
            <Icons.RefreshCw className={`w-4 h-4 mr-2 ${ingesting ? 'animate-spin' : ''}`} />
            {ingesting ? 'Ingerindo…' : 'Ingerir pendentes'}
          </Button>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum doutor em fila. Todos publicados ou arquivados.</p>
        ) : (
          <div className="divide-y">
            {rows.map((r) => {
              const status = (r.editorial_status ?? 'draft') as EditorialStatus;
              const gaps = missingFields(r);
              const next = NEXT_STATUS[status];
              const canPublish = next === 'published' ? gaps.length === 0 && (r.editorial_score ?? 0) >= 85 : true;
              return (
                <div key={r.id} className="py-3 flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{r.name}</p>
                      <Badge variant="outline" className={STAGE_TONE[status]}>{STAGE_LABEL[status]}</Badge>
                      <Badge variant="outline" className="text-[10px]">
                        score {r.editorial_score ?? 0}
                      </Badge>
                    </div>
                    {r.title && <p className="text-xs text-muted-foreground">{r.title}</p>}
                    {gaps.length > 0 && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                        faltando: {gaps.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {status !== 'draft' && (
                      <Button size="sm" variant="ghost" onClick={() => setRejectFor(r)}>
                        Reprovar
                      </Button>
                    )}
                    {next && (
                      <Button
                        size="sm"
                        variant={next === 'published' ? 'default' : 'secondary'}
                        onClick={() => advance(r)}
                        disabled={!canPublish}
                        title={!canPublish ? 'Requer score ≥ 85 e todos os campos mínimos' : undefined}
                      >
                        {next === 'published' ? 'Publicar' : `Avançar → ${STAGE_LABEL[next]}`}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={!!rejectFor} onOpenChange={(o) => { if (!o) { setRejectFor(null); setRejectNote(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprovar "{rejectFor?.name}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              O verbete voltará para <strong>Rascunho</strong>. A nota fica registrada em auditoria.
            </p>
            <Textarea
              rows={4}
              placeholder="Motivo da reprovação (opcional)"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setRejectFor(null); setRejectNote(''); }}>Cancelar</Button>
            <Button variant="destructive" onClick={reject}>Reprovar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default DoctorReviewQueue;
