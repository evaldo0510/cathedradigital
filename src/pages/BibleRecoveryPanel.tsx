import React, { useEffect, useState } from 'react';
import { bibleRecoveryStore, RecoveryEvent } from '@/lib/bibleRecoveryStore';
import { runRecoveryCheck, summarize, ValidationRow } from '@/lib/bibleRecoveryRunner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, FileWarning, Languages, PlayCircle, Loader2 } from 'lucide-react';

const typeLabel: Record<RecoveryEvent['type'], { label: string; icon: React.ReactNode; tone: string }> = {
  navigation_error: { label: 'Erro de Navegação', icon: <AlertCircle className="h-4 w-4" />, tone: 'destructive' },
  empty_chapter: { label: 'Capítulo Vazio', icon: <FileWarning className="h-4 w-4" />, tone: 'destructive' },
  incomplete_chapter: { label: 'Capítulo Incompleto', icon: <FileWarning className="h-4 w-4" />, tone: 'secondary' },
  english_text: { label: 'Texto em Inglês', icon: <Languages className="h-4 w-4" />, tone: 'destructive' },
};

const BibleRecoveryPanel: React.FC = () => {
  const [events, setEvents] = useState<RecoveryEvent[]>(bibleRecoveryStore.list());
  const [rows, setRows] = useState<ValidationRow[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  useEffect(() => bibleRecoveryStore.subscribe(setEvents), []);

  const start = async () => {
    setRunning(true);
    setRows([]);
    setProgress({ done: 0, total: 0 });
    try {
      const result = await runRecoveryCheck((done, total) => {
        setProgress({ done, total });
      });
      setRows(result);
    } finally {
      setRunning(false);
    }
  };

  const sum = summarize(rows);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Bible Recovery Mode — Painel de Diagnóstico</h1>
          <p className="text-sm text-muted-foreground">
            Eventos em tempo real e validação completa do cânone bíblico.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => bibleRecoveryStore.clear()}>Limpar eventos</Button>
          <Button onClick={start} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
            {running ? `Validando ${progress.done}/${progress.total}` : 'Executar checagem completa'}
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: sum.total },
          { label: 'OK', value: sum.ok },
          { label: 'Vazios', value: sum.empty },
          { label: 'Inglês', value: sum.english },
          { label: 'Lentos', value: sum.slow },
          { label: 'Erros', value: sum.error },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-2xl font-semibold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Eventos em tempo real ({events.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" /> Nenhum evento capturado.
            </div>
          ) : (
            <ul className="divide-y">
              {events.slice(0, 50).map((e) => {
                const meta = typeLabel[e.type];
                return (
                  <li key={e.id} className="py-2 flex items-start gap-3">
                    <Badge variant={meta.tone as any} className="gap-1">{meta.icon}{meta.label}</Badge>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{e.message}</div>
                      {e.evidence && <div className="text-xs text-muted-foreground truncate">{e.evidence}</div>}
                    </div>
                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(e.timestamp).toLocaleTimeString('pt-BR')}
                    </time>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Tabela de validação ({rows.length})
            {sum.avgMs > 0 && <span className="ml-2 text-xs text-muted-foreground">média {sum.avgMs}ms</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">Livro</th>
                <th className="py-2 pr-3">Capítulo</th>
                <th className="py-2 pr-3">Idioma</th>
                <th className="py-2 pr-3">Tempo</th>
                <th className="py-2 pr-3">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.abbr}-${r.chapter}`} className="border-b last:border-0">
                  <td className="py-1.5 pr-3">{r.book}</td>
                  <td className="py-1.5 pr-3">{r.chapter}</td>
                  <td className="py-1.5 pr-3">{r.language}</td>
                  <td className="py-1.5 pr-3">{r.openMs}ms</td>
                  <td className="py-1.5 pr-3">
                    <Badge variant={r.result === 'OK' ? 'secondary' : 'destructive'}>{r.result}</Badge>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="py-3 text-muted-foreground">Execute a checagem para gerar a tabela.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BibleRecoveryPanel;
