import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, RefreshCcw, Trash2, Flame } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface Row {
  cache_key: string;
  version: number;
  expires_at: string | null;
  created_at: string | null;
  fresh: boolean;
  age_s: number;
  hash: string | null;
}

async function call(action: string, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('bible-cache-admin', {
    body: { action, ...payload },
  });
  if (error) throw new Error(error.message);
  return data;
}

export default function BibleCacheAdminPage() {
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const qc = useQueryClient();
  const [prefix, setPrefix] = useState('');
  const [warmInput, setWarmInput] = useState('Sl:1, Mt:1, Jo:1');

  const stats = useQuery({
    queryKey: ['bible-cache-stats'],
    enabled: isAdmin,
    queryFn: () => call('stats'),
    refetchInterval: 15_000,
  });

  const list = useQuery({
    queryKey: ['bible-cache-list', prefix],
    enabled: isAdmin,
    queryFn: () => call('list', { limit: 200, prefix: prefix || undefined }),
  });

  const purge = useMutation({
    mutationFn: (vars: { cache_key?: string; prefix?: string }) => call('purge', vars),
    onSuccess: () => {
      toast.success('Cache purgado');
      qc.invalidateQueries({ queryKey: ['bible-cache-stats'] });
      qc.invalidateQueries({ queryKey: ['bible-cache-list'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Falha ao purgar'),
  });

  const warm = useMutation({
    mutationFn: (items: { abbrev: string; chapter: number }[]) => call('warm', { items }),
    onSuccess: (r: any) => {
      toast.success(`Warm concluído: ${r?.succeeded ?? 0}/${r?.total ?? 0}`);
      qc.invalidateQueries({ queryKey: ['bible-cache-stats'] });
      qc.invalidateQueries({ queryKey: ['bible-cache-list'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Falha no warm'),
  });

  if (roleLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  const rows: Row[] = list.data?.rows ?? [];

  const handleWarm = () => {
    const items = warmInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const [abbrev, chapter] = s.split(':').map((p) => p.trim());
        return { abbrev, chapter: Number(chapter) };
      })
      .filter((i) => i.abbrev && Number.isFinite(i.chapter));
    if (!items.length) {
      toast.error('Formato: "Sl:1, Mt:5, Jo:3"');
      return;
    }
    warm.mutate(items);
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Cache da Bíblia (L2)</h1>
        <p className="text-sm text-muted-foreground">
          Inspeciona, purga e reaquece capítulos no cache servidor.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Total</div>
          <div className="mt-2 text-3xl font-semibold">{stats.data?.total ?? '—'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Frescos</div>
          <div className="mt-2 text-3xl font-semibold text-emerald-600">{stats.data?.fresh ?? '—'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Stale</div>
          <div className="mt-2 text-3xl font-semibold text-amber-600">{stats.data?.stale ?? '—'}</div>
        </Card>
      </div>

      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-semibold">Reaquecer manualmente</h2>
        <p className="text-xs text-muted-foreground">
          Formato: <code className="rounded bg-muted px-1">Sl:1, Mt:5, Jo:3</code>
        </p>
        <div className="flex gap-2">
          <Input value={warmInput} onChange={(e) => setWarmInput(e.target.value)} className="font-mono text-sm" />
          <Button onClick={handleWarm} disabled={warm.isPending}>
            {warm.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Flame className="mr-2 h-4 w-4" />}
            Reaquecer
          </Button>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Entradas no cache</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Filtrar por prefixo (ex.: Sl:)"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="h-8 w-64 text-sm"
            />
            <Button size="sm" variant="outline" onClick={() => list.refetch()}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
            {prefix && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => purge.mutate({ prefix })}
                disabled={purge.isPending}
              >
                Purgar prefixo
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">Chave</th>
                <th className="py-2 pr-3">Versão</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Idade</th>
                <th className="py-2 pr-3">Expira</th>
                <th className="py-2 pr-3" />
              </tr>
            </thead>
            <tbody>
              {list.isLoading && (
                <tr><td colSpan={6} className="py-6 text-center text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin" /></td></tr>
              )}
              {!list.isLoading && rows.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Nenhuma entrada</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.cache_key} className="border-t border-border/40">
                  <td className="py-2 pr-3 font-mono text-xs">{r.cache_key}</td>
                  <td className="py-2 pr-3">{r.version}</td>
                  <td className="py-2 pr-3">
                    <Badge variant={r.fresh ? 'default' : 'secondary'}>{r.fresh ? 'fresh' : 'stale'}</Badge>
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">{formatAge(r.age_s)}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{r.expires_at ? new Date(r.expires_at).toLocaleString() : '—'}</td>
                  <td className="py-2 pr-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const [abbrev, chapter] = r.cache_key.split(':');
                          warm.mutate([{ abbrev, chapter: Number(chapter) }]);
                        }}
                      >
                        <Flame className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => purge.mutate({ cache_key: r.cache_key })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function formatAge(s: number) {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}min`;
  if (s < 86400) return `${(s / 3600).toFixed(1)}h`;
  return `${(s / 86400).toFixed(1)}d`;
}
