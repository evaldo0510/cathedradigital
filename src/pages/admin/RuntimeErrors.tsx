/**
 * /admin/runtime-errors — inspeção local dos últimos runtime errors
 * capturados pelo runtimeErrorLogger (window.onerror + unhandledrejection).
 * Mostra mensagem, stacktrace, rota, timestamp e contexto (tema, viewport,
 * elemento em foco, user agent) para reprodução rápida.
 */
import { useEffect, useState } from "react";
import {
  getRuntimeErrors,
  clearRuntimeErrors,
  subscribeRuntimeErrors,
  type RuntimeErrorRecord,
} from "@/lib/runtimeErrorLogger";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function RuntimeErrors() {
  const [items, setItems] = useState<RuntimeErrorRecord[]>(() => getRuntimeErrors());

  useEffect(() => {
    const unsub = subscribeRuntimeErrors(setItems);
    return () => {
      unsub();
    };
  }, []);

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(items, null, 2));
    } catch {
      /* noop */
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display">Runtime Errors</h1>
          <p className="text-sm text-muted-foreground">
            Últimos {items.length} erros capturados neste navegador
            (window.onerror + unhandledrejection).
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={copyAll} disabled={!items.length}>
            Copiar JSON
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => clearRuntimeErrors()}
            disabled={!items.length}
          >
            Limpar
          </Button>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="rounded-lg border border-border/40 bg-background/40 p-8 text-center text-sm text-muted-foreground">
          Nenhum runtime error registrado nesta sessão.
        </div>
      ) : (
        <ul className="space-y-3" data-testid="runtime-errors-list">
          {items.map((it) => (
            <li
              key={it.id}
              data-testid="runtime-error-item"
              className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-2"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="destructive">{it.type}</Badge>
                <span className="font-mono text-muted-foreground">
                  {new Date(it.timestamp).toLocaleString()}
                </span>
                <span className="font-mono text-muted-foreground">· {it.route}</span>
                <span className="font-mono text-muted-foreground">· {it.theme}</span>
                <span className="font-mono text-muted-foreground">
                  · {it.viewport.w}×{it.viewport.h}
                </span>
              </div>
              <p className="font-mono text-sm text-destructive break-words">
                {it.message}
              </p>
              {it.focused && (
                <p className="text-[11px] text-muted-foreground font-mono">
                  focus: {it.focused.tag}
                  {it.focused.id && `#${it.focused.id}`}
                  {it.focused.role && ` [role=${it.focused.role}]`}
                  {it.focused.ariaLabel && ` "${it.focused.ariaLabel}"`}
                </p>
              )}
              {it.stack && (
                <details>
                  <summary className="cursor-pointer text-[11px] uppercase tracking-widest text-muted-foreground">
                    Stack
                  </summary>
                  <pre className="mt-2 max-h-64 overflow-auto text-[11px] font-mono whitespace-pre-wrap text-muted-foreground">
                    {it.stack}
                  </pre>
                </details>
              )}
              <p className="text-[10px] font-mono opacity-50">
                {it.userAgent}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
