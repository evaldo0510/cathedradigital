/**
 * /admin/biblioteca-patristica — Cathedra Patristic Library Studio (E1.3).
 *
 * Curadoria de obras dos santos: metadados, licença e workflow editorial
 * (draft → in_review → published → archived).
 *
 * Regra de licença: publicar exige `license` não vazia (enforced pelo trigger
 * `saint_works_license_gate`). A UI antecipa a validação para evitar 500.
 *
 * RLS: `saint_works_admins_all` restringe INSERT/UPDATE/DELETE a admins.
 */
import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ExternalLink, Loader2, Pencil, BookOpen, History } from 'lucide-react';
import { WorkAuditHistory } from '@/components/admin/WorkAuditHistory';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import type {
  SaintWork,
  SaintWorkStatus,
  SaintWorkCategory,
  SaintWorkFichaCompleteness,
} from '@/types/saintWorks';
import {
  SAINT_WORK_CATEGORY_LABELS,
  SAINT_WORK_FICHA_COMPLETENESS_LABELS,
} from '@/types/saintWorks';

const STATUS_LABEL: Record<SaintWorkStatus, string> = {
  draft: 'Rascunho',
  in_review: 'Em revisão',
  published: 'Publicado',
  archived: 'Arquivado',
};

const STATUS_VARIANT: Record<SaintWorkStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'outline',
  in_review: 'secondary',
  published: 'default',
  archived: 'destructive',
};

const NEXT_STATUS: Record<SaintWorkStatus, SaintWorkStatus[]> = {
  draft: ['in_review', 'archived'],
  in_review: ['published', 'draft', 'archived'],
  published: ['archived'],
  archived: ['draft'],
};

type StatusFilter = SaintWorkStatus | 'all';

function useAllWorks() {
  return useQuery({
    queryKey: ['admin', 'saint_works', 'all'],
    queryFn: async (): Promise<SaintWork[]> => {
      const { data, error } = await supabase
        .from('saint_works')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SaintWork[];
    },
  });
}

type WorkPatch = {
  title?: string;
  original_title?: string | null;
  abstract?: string | null;
  category?: SaintWorkCategory;
  year_written?: number | null;
  license?: string | null;
  source_url?: string | null;
  translation_credit?: string | null;
  cover_image_url?: string | null;
  is_public_domain?: boolean;
  status?: SaintWorkStatus;
};

function useUpdateWork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: WorkPatch & { id: string }) => {
      const { id, ...rest } = patch;
      const { data, error } = await supabase
        .from('saint_works')
        .update(rest)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data as SaintWork;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'saint_works', 'all'] });
    },
  });
}

export default function BibliotecaPatristicaAdmin() {
  const { data: works = [], isLoading } = useAllWorks();
  const update = useUpdateWork();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [fichaFilter, setFichaFilter] = useState<SaintWorkFichaCompleteness | 'all'>('all');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<SaintWork | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return works.filter(w => {
      if (statusFilter !== 'all' && w.status !== statusFilter) return false;
      if (fichaFilter !== 'all' && w.ficha_completeness !== fichaFilter) return false;
      if (needle) {
        const hay = `${w.title} ${w.saint_id} ${w.slug}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [works, statusFilter, fichaFilter, q]);

  const stats = useMemo(() => {
    const by: Record<SaintWorkStatus, number> = { draft: 0, in_review: 0, published: 0, archived: 0 };
    works.forEach(w => { by[w.status]++; });
    return by;
  }, [works]);

  const transition = async (work: SaintWork, to: SaintWorkStatus) => {
    if (to === 'published' && (!work.license || work.license.trim().length === 0)) {
      toast.error('Licença é obrigatória para publicar (Editorial License Rule).');
      setEditing(work);
      return;
    }
    try {
      await update.mutateAsync({ id: work.id, status: to });
      toast.success(`"${work.title}" → ${STATUS_LABEL[to]}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao atualizar status.';
      toast.error(msg);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Helmet>
        <title>Biblioteca Patrística — Curadoria — Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Biblioteca Patrística</h1>
        <p className="text-muted-foreground">
          Curadoria de obras dos santos. Toda obra nasce em rascunho; publicação exige licença declarada.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(stats) as SaintWorkStatus[]).map(s => (
          <Card key={s}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {STATUS_LABEL[s]}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{stats[s]}</CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[220px]">
          <Label htmlFor="q">Buscar</Label>
          <Input id="q" value={q} onChange={e => setQ(e.target.value)} placeholder="Título, autor ou slug…" />
        </div>
        <div className="min-w-[180px]">
          <Label>Status</Label>
          <Select value={statusFilter} onValueChange={(v: StatusFilter) => setStatusFilter(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {(Object.keys(STATUS_LABEL) as SaintWorkStatus[]).map(s => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[180px]">
          <Label>Ficha editorial</Label>
          <Select value={fichaFilter} onValueChange={(v: SaintWorkFichaCompleteness | 'all') => setFichaFilter(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {(Object.keys(SAINT_WORK_FICHA_COMPLETENESS_LABELS) as SaintWorkFichaCompleteness[]).map(f => (
                <SelectItem key={f} value={f}>{SAINT_WORK_FICHA_COMPLETENESS_LABELS[f]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Carregando obras…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Nenhuma obra encontrada.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Obra</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Ficha</TableHead>
                  <TableHead>Licença</TableHead>
                  <TableHead>Cap.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(w => (
                  <TableRow key={w.id}>
                    <TableCell className="max-w-[280px]">
                      <div className="font-medium truncate">{w.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{w.slug}</div>
                    </TableCell>
                    <TableCell className="text-sm">{w.saint_id}</TableCell>
                    <TableCell className="text-sm">
                      {SAINT_WORK_CATEGORY_LABELS[w.category] ?? w.category}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          w.ficha_completeness === 'complete' ? 'default'
                            : w.ficha_completeness === 'minimal' ? 'secondary'
                            : 'outline'
                        }
                      >
                        {SAINT_WORK_FICHA_COMPLETENESS_LABELS[w.ficha_completeness]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {w.is_public_domain && (
                        <Badge variant="outline" className="mr-1">DP</Badge>
                      )}
                      <span className="text-muted-foreground">
                        {w.license ? w.license.slice(0, 32) : '—'}
                      </span>
                    </TableCell>
                    <TableCell>{w.chapter_count}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[w.status]}>{STATUS_LABEL[w.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {NEXT_STATUS[w.status].map(to => (
                        <Button
                          key={to}
                          size="sm"
                          variant="outline"
                          onClick={() => transition(w, to)}
                          disabled={update.isPending}
                        >
                          → {STATUS_LABEL[to]}
                        </Button>
                      ))}
                      <Button size="sm" variant="ghost" onClick={() => setEditing(w)} aria-label="Editar">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {w.status === 'published' && (
                        <Button size="sm" variant="ghost" asChild aria-label="Ver no site">
                          <Link to={`/biblioteca/escritos/${w.saint_id}/${w.slug}`} target="_blank">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editing && (
        <EditWorkDialog
          work={editing}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            try {
              await update.mutateAsync({ id: editing.id, ...patch });
              toast.success('Metadados atualizados.');
              setEditing(null);
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'Falha ao salvar.';
              toast.error(msg);
            }
          }}
          saving={update.isPending}
        />
      )}
    </div>
  );
}

interface EditWorkDialogProps {
  work: SaintWork;
  onClose: () => void;
  onSave: (patch: WorkPatch) => Promise<void>;
  saving: boolean;
}

function EditWorkDialog({ work, onClose, onSave, saving }: EditWorkDialogProps) {
  const [form, setForm] = useState({
    title: work.title,
    original_title: work.original_title ?? '',
    abstract: work.abstract ?? '',
    category: work.category as SaintWorkCategory,
    year_written: work.year_written ?? ('' as number | ''),
    license: work.license ?? '',
    source_url: work.source_url ?? '',
    translation_credit: work.translation_credit ?? '',
    cover_image_url: work.cover_image_url ?? '',
    is_public_domain: work.is_public_domain,
  });

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar obra — {work.title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input id="title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="original_title">Título original</Label>
            <Input id="original_title" value={form.original_title} onChange={e => setForm(f => ({ ...f, original_title: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="abstract">Resumo</Label>
            <Textarea id="abstract" rows={3} value={form.abstract} onChange={e => setForm(f => ({ ...f, abstract: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v: SaintWorkCategory) => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(SAINT_WORK_CATEGORY_LABELS) as SaintWorkCategory[]).map(c => (
                    <SelectItem key={c} value={c}>{SAINT_WORK_CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="year_written">Ano</Label>
              <Input
                id="year_written"
                type="number"
                value={form.year_written}
                onChange={e => setForm(f => ({ ...f, year_written: e.target.value === '' ? '' : Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_public_domain">Domínio público</Label>
                <p className="text-xs text-muted-foreground">Obra original em domínio público.</p>
              </div>
              <Switch
                id="is_public_domain"
                checked={form.is_public_domain}
                onCheckedChange={(v) => setForm(f => ({ ...f, is_public_domain: v }))}
              />
            </div>
            <div>
              <Label htmlFor="license">Licença <span className="text-destructive">*</span></Label>
              <Input
                id="license"
                value={form.license}
                onChange={e => setForm(f => ({ ...f, license: e.target.value }))}
                placeholder="Ex.: Domínio Público, CC BY-SA 4.0, Tradução Cathedra…"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Obrigatória para publicar. Se a tradução for licenciada separadamente, declare aqui.
              </p>
            </div>
            <div>
              <Label htmlFor="translation_credit">Crédito da tradução</Label>
              <Input id="translation_credit" value={form.translation_credit} onChange={e => setForm(f => ({ ...f, translation_credit: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="source_url">Fonte (URL)</Label>
              <Input id="source_url" value={form.source_url} onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))} placeholder="https://…" />
            </div>
            <div>
              <Label htmlFor="cover_image_url">Capa (URL)</Label>
              <Input id="cover_image_url" value={form.cover_image_url} onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))} placeholder="https://…" />
            </div>
          </div>

          <div className="border-t pt-4 text-sm text-muted-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>{work.chapter_count} capítulo(s) · edite via SQL enquanto o editor de capítulos não estiver disponível.</span>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <History className="w-4 h-4" /> Histórico editorial
            </div>
            <WorkAuditHistory workId={work.id} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button
            onClick={() => onSave({
              title: form.title.trim(),
              original_title: form.original_title.trim() || null,
              abstract: form.abstract.trim() || null,
              category: form.category,
              year_written: form.year_written === '' ? null : Number(form.year_written),
              license: form.license.trim() || null,
              source_url: form.source_url.trim() || null,
              translation_credit: form.translation_credit.trim() || null,
              cover_image_url: form.cover_image_url.trim() || null,
              is_public_domain: form.is_public_domain,
            })}
            disabled={saving || !form.title.trim()}
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
