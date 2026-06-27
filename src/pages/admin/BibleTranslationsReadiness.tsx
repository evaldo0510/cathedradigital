import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Icons } from '@/constants';

interface ReadinessRow {
  id: string;
  code: string;
  name: string;
  author: string | null;
  year_published: number | null;
  status: string;
  is_primary: boolean;
  books_count: number;
  chapters_count: number;
  verses_count: number;
  imported_at: string | null;
  certified_at: string | null;
  ready: boolean;
  reason: string | null;
  sprint1_passed: boolean;
  gate_blocked: boolean;
}

const StatusBadge: React.FC<{ row: ReadinessRow }> = ({ row }) => {
  if (row.ready) return <Badge className="bg-emerald-600 hover:bg-emerald-600">Pronta</Badge>;
  if (row.gate_blocked) return <Badge variant="destructive">Gate bloqueado</Badge>;
  if (!row.sprint1_passed) return <Badge variant="secondary">Sprint 1 pendente</Badge>;
  return <Badge variant="outline">Não pronta</Badge>;
};

const BibleTranslationsReadiness: React.FC = () => {
  const [rows, setRows] = useState<ReadinessRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('bible_translations_readiness' as any);
      if (error) throw error;
      setRows((data ?? []) as ReadinessRow[]);
      setLastChecked(new Date());
    } catch (e: any) {
      toast.error('Falha ao consultar prontidão', { description: e?.message ?? String(e) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const readyCount = rows.filter(r => r.ready).length;
  const blockedCount = rows.filter(r => !r.ready).length;

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Prontidão das Traduções Bíblicas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Avalia em tempo real o gate <code className="text-xs">bible_translation_ready</code> para cada tradução cadastrada.
          </p>
          {lastChecked && (
            <p className="text-xs text-muted-foreground mt-1">
              Última verificação: {lastChecked.toLocaleString('pt-BR')}
            </p>
          )}
        </div>
        <Button onClick={load} disabled={loading} variant="default">
          {loading ? <Icons.Loader className="w-4 h-4 mr-2 animate-spin" /> : <Icons.RefreshCw className="w-4 h-4 mr-2" />}
          Reverificar
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{rows.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Prontas</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-emerald-600">{readyCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Bloqueadas</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-destructive">{blockedCount}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Traduções</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground">Nenhuma tradução cadastrada.</p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4">Código</th>
                  <th className="py-2 pr-4">Nome</th>
                  <th className="py-2 pr-4">Autor / Ano</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Prontidão</th>
                  <th className="py-2 pr-4">Motivo</th>
                  <th className="py-2 pr-4 text-right">Livros</th>
                  <th className="py-2 pr-4 text-right">Caps</th>
                  <th className="py-2 pr-4 text-right">Versos</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b align-top">
                    <td className="py-2 pr-4 font-mono text-xs">
                      {r.code}
                      {r.is_primary && <span className="ml-2 text-[10px] text-primary font-semibold">PRIMÁRIA</span>}
                    </td>
                    <td className="py-2 pr-4">{r.name}</td>
                    <td className="py-2 pr-4 text-xs text-muted-foreground">
                      {r.author ?? '—'}{r.year_published ? ` · ${r.year_published}` : ''}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge variant="outline" className="text-xs">{r.status}</Badge>
                    </td>
                    <td className="py-2 pr-4"><StatusBadge row={r} /></td>
                    <td className="py-2 pr-4 text-xs text-muted-foreground max-w-md">
                      {r.reason ?? '—'}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">{r.books_count}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{r.chapters_count}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{r.verses_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BibleTranslationsReadiness;
