/**
 * PrayerErrorBoundary — captura falhas dentro do leitor de oração e exibe
 * mensagem amigável, preservando o contexto (slug, params, hierarquia).
 *
 * Encapsula o `AppErrorBoundary` global adicionando payload específico do
 * Prayer Engine para diagnóstico de erros como React #300 em rotas
 * `/oracao/:slug` (ex.: contemplative do Rosário).
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { reportPrayerError, type PrayerErrorContext } from '@/lib/prayer/telemetry';

interface Props {
  children: ReactNode;
  /** Contexto do Prayer no momento do render — snapshot atualizado a cada render. */
  context: PrayerErrorContext;
}

interface State {
  hasError: boolean;
  errorId?: string;
  errorMessage?: string;
  reactErrorCode?: string | null;
}

export class PrayerErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    const m = error.message.match(/Minified React error #(\d+)/);
    return {
      hasError: true,
      errorMessage: error.message,
      reactErrorCode: m ? `#${m[1]}` : null,
    };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    const refId = reportPrayerError(error, this.props.context, {
      componentStack: info.componentStack ?? undefined,
    });
    this.setState({ errorId: refId });
  }

  private reset = () => {
    this.setState({ hasError: false, errorId: undefined, errorMessage: undefined });
  };

  public render() {
    if (!this.state.hasError) return this.props.children;

    const { slug } = this.props.context;

    return (
      <div
        role="alert"
        aria-live="assertive"
        data-testid="prayer-error-boundary"
        className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 py-16 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden />
        </div>
        <h1 className="font-stitch-display text-2xl text-stitch-on-surface">
          Não conseguimos abrir esta oração
        </h1>
        <p className="max-w-md font-stitch-body text-sm text-stitch-on-surface-variant">
          Algo interrompeu o carregamento
          {slug ? <> de <span className="font-semibold">{slug}</span></> : null}.
          A equipe já foi notificada. Você pode tentar novamente ou voltar ao livro de orações.
        </p>

        {this.state.reactErrorCode && (
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            React {this.state.reactErrorCode}
          </p>
        )}
        {this.state.errorId && (
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Ref: {this.state.errorId}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Button type="button" variant="pill" size="pill" onClick={this.reset}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Tentar de novo
          </Button>
          <Button asChild variant="pill-toned" size="pill">
            <Link to="/oracao">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Livro de orações
            </Link>
          </Button>
        </div>
      </div>
    );
  }
}

export default PrayerErrorBoundary;
