/**
 * PrayerAdmin — painel de curadoria das Orações (SEG Sub-sprint 1).
 * Lista todas as orações por status de conteúdo (stub/partial/complete),
 * mostra número de blocos, duração, permite abrir o leitor e alternar publicação.
 * Somente admins acessam.
 */
import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, ExternalLink, Loader2, Search, BookOpenCheck } from 'lucide-react';

interface PrayerRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  category: string;
  content_status: 'stub' | 'partial' | 'complete';
  duration_min: number | null;
  is_published: boolean;
  blocks_count: number;
  updated_at: string;
}

const STATUS_STYLES: Record<PrayerRow['content_status'], string> = {
  complete: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  partial: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  stub: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
};

const STATUS_LABEL: Record<PrayerRow['content_status'], string> = {
  complete: 'Completa',
  partial: 'Parcial',
  stub: 'Rascunho',
};

export default function PrayerAdmin() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [rows, setRows] = useState<PrayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('prayers')
        .select('id, slug, title, subtitle, category, content_status, duration_min, is_published, blocks, updated_at')
        .order('content_status', { ascending: false })
        .order('category')
        .order('slug');
      if (cancelled) return;
      if (error) {
        toast.error('Falha ao carregar orações');
        setLoading(false);
        return;
      }
      setRows(
        (data ?? []).map((r) => ({
          ...r,
          blocks_count: Array.isArray(r.blocks) ? (r.blocks as unknown[]).length : 0,
        })) as PrayerRow[],
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(term) ||
        r.slug.toLowerCase().includes(term) ||
        r.category.toLowerCase().includes(term),
    );
  }, [rows, q]);

  const stats = useMemo(() => {
    const total = rows.length;
    const complete = rows.filter((r) => r.content_status === 'complete').length;
    const partial = rows.filter((r) => r.content_status === 'partial').length;
    const stub = rows.filter((r) => r.content_status === 'stub').length;
    const coverage = total ? Math.round((complete / total) * 100) : 0;
    return { total, complete, partial, stub, coverage };
  }, [rows]);

  const togglePublish = async (row: PrayerRow) => {
    const next = !row.is_published;
    const { error } = await supabase
      .from('prayers')
      .update({ is_published: next })
      .eq('id', row.id);
    if (error) {
      toast.error('Falha ao atualizar publicação');
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_published: next } : r)));
    toast.success(next ? 'Publicada' : 'Despublicada');
  };

  if (adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-stitch-secondary" aria-hidden />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <>
      <Helmet>
        <title>Curadoria de Orações · Cathedra Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link
          to="/admin"
          className="mb-6 inline-flex items-center gap-1.5 font-stitch-body text-xs uppercase tracking-widest text-stitch-on-surface-variant hover:text-stitch-secondary"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Voltar ao Admin
        </Link>

        <header className="mb-8">
          <p className="font-stitch-body text-[11px] font-bold uppercase tracking-[0.28em] text-stitch-secondary">
            Cathedra · Admin
          </p>
          <h1 className="mt-2 font-stitch-display text-3xl md:text-4xl leading-tight">
            Curadoria de Orações
          </h1>
          <p className="mt-2 max-w-[68ch] font-stitch-body text-sm text-stitch-on-surface-variant">
            Painel editorial das orações. Status <em>complete</em> abre com o leitor contemplativo por blocos;
            <em> stub</em> exibe o texto simples até a curadoria concluir.
          </p>
        </header>

        {/* Métricas */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Completas', value: stats.complete },
            { label: 'Parciais', value: stats.partial },
            { label: 'Rascunhos', value: stats.stub },
            { label: 'Cobertura', value: `${stats.coverage}%` },
          ].map((m) => (
            <Card key={m.label}>
              <CardHeader className="pb-1">
                <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-stitch-on-surface-variant">
                  {m.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="font-stitch-display text-2xl">{m.value}</CardContent>
            </Card>
          ))}
        </div>

        {/* Busca */}
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stitch-on-surface-variant" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título, slug ou categoria…"
              className="pl-9"
              aria-label="Buscar oração"
            />
          </div>
        </div>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-6 w-6 animate-spin text-stitch-secondary" aria-hidden />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center font-stitch-body text-sm text-stitch-on-surface-variant">
                Nenhuma oração encontrada.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Blocos</TableHead>
                    <TableHead className="text-right">Duração</TableHead>
                    <TableHead>Publicada</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.title}</div>
                        <div className="text-xs text-stitch-on-surface-variant">{r.slug}</div>
                      </TableCell>
                      <TableCell className="capitalize">{r.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_STYLES[r.content_status]}>
                          {STATUS_LABEL[r.content_status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.blocks_count}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.duration_min ? `${r.duration_min} min` : '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="sm"
                          variant={r.is_published ? 'default' : 'outline'}
                          onClick={() => togglePublish(r)}
                        >
                          {r.is_published ? 'Sim' : 'Não'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link to={`/oracao/${r.slug}`} target="_blank" rel="noreferrer">
                            <BookOpenCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                            Abrir
                            <ExternalLink className="ml-1 h-3 w-3" aria-hidden />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
