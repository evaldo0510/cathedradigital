/**
 * /admin/editorial-closure-validator
 *
 * Ferramenta editorial: cola um `editorial_closure` (objeto, JSON string
 * ou texto legado), roda a validação Zod com retries e mostra:
 *   - Estratégia usada (strict / aliases / string-fallback / none)
 *   - Warnings acumulados
 *   - Preview renderizado idêntico ao ReaderShell
 */
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { validateEditorialClosure } from '@/lib/editorial/closureSchema';
import { EditorialClosure } from '@/components/reader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const SAMPLE = JSON.stringify(
  {
    reflection: 'Onde, hoje, minha inquietude ainda foge do silêncio?',
    application: 'Reservar dez minutos de silêncio antes do último ofício do dia.',
    prayer: 'Senhor, dai-me o repouso que só em Vós existe.\nAmém.',
    nexus: [{ kind: 'saint', ref: 'agostinho', label: 'Santo Agostinho' }],
    source: 'cathedra-editorial',
  },
  null,
  2,
);

const LEGACY_SAMPLE = JSON.stringify(
  { reflexao: 'R legado', aplicacao: 'A legado', oracao: 'P legado', next: { title: 'Ler', url: '/glossario/graca' } },
  null,
  2,
);

const EditorialClosureValidator: React.FC = () => {
  const [input, setInput] = React.useState<string>(SAMPLE);

  const parsedInput = React.useMemo<unknown>(() => {
    const t = input.trim();
    if (!t) return null;
    try {
      return JSON.parse(t);
    } catch {
      return t; // string pura
    }
  }, [input]);

  const report = React.useMemo(
    () => validateEditorialClosure(parsedInput),
    [parsedInput],
  );

  const strategyTone: Record<string, 'default' | 'secondary' | 'destructive'> = {
    strict: 'default',
    aliases: 'secondary',
    'string-fallback': 'secondary',
    none: 'destructive',
  };

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <Helmet>
        <title>Validador de Editorial Closure — Cathedra Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <header className="space-y-1">
        <h1 className="text-3xl font-serif">Validador de Editorial Closure</h1>
        <p className="text-sm text-muted-foreground">
          Cole um <code>editorial_closure</code> (objeto, JSON ou texto). A validação Zod aplica
          retries com aliases legados e mostra o resultado renderizado.
        </p>
      </header>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setInput(SAMPLE)}>
          Exemplo canônico
        </Button>
        <Button variant="outline" size="sm" onClick={() => setInput(LEGACY_SAMPLE)}>
          Exemplo legado (aliases)
        </Button>
        <Button variant="outline" size="sm" onClick={() => setInput('"Uma reflexão antiga em texto puro."')}>
          String pura
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setInput('')}>
          Limpar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entrada</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="font-mono text-xs min-h-[420px]"
              spellCheck={false}
              placeholder='{"reflection":"...","application":"...","prayer":"..."}'
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                {report.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                )}
                Diagnóstico
              </CardTitle>
              <Badge variant={strategyTone[report.strategy] ?? 'default'}>
                {report.strategy}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.warnings.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum warning.</p>
              ) : (
                <ul className="space-y-1">
                  {report.warnings.map((w, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              )}
              {report.data && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">
                    Objeto normalizado (canônico)
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded overflow-auto">
                    {JSON.stringify(report.data, null, 2)}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview renderizado</CardTitle>
            </CardHeader>
            <CardContent>
              {report.data ? (
                <EditorialClosure
                  reflection={report.data.reflection || undefined}
                  application={report.data.application || undefined}
                  prayer={report.data.prayer || undefined}
                  next={report.data.next as React.ComponentProps<typeof EditorialClosure>['next']}
                  nexus={report.data.nexus as React.ComponentProps<typeof EditorialClosure>['nexus']}
                  source={report.data.source}
                />
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nada a renderizar — closure inválido ou vazio.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EditorialClosureValidator;
