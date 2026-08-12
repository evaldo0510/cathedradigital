import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';
import * as Sentry from "@sentry/react";
import { trackNavigationError } from '@/lib/telemetry';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCcw, Home, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorId?: string;
  errorMessage?: string;
  errorStack?: string;
}

export class PreviewFallback extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message, errorStack: error?.stack };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = trackNavigationError(error, { componentStack: errorInfo.componentStack });
    console.error('[PreviewFallback]', error, errorInfo);
    
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack, ...errorInfo }
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[80dvh] w-full p-6 text-center bg-background space-y-6 animate-in fade-in duration-500">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-display text-primary tracking-tight">
              Preview em Restauração
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Não conseguimos carregar esta parte da experiência. Isso pode ser um problema temporário de conexão ou um erro inesperado.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <Button
              onClick={() => window.location.reload()}
              className="flex-1 gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Recarregar Preview
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="flex-1 gap-2"
            >
              <Home className="w-4 h-4" />
              Ir para o Início
            </Button>
          </div>

          {this.state.errorMessage && (
            <details className="text-left w-full max-w-md mt-4 opacity-50 hover:opacity-100 transition-opacity">
              <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Informação técnica
              </summary>
              <p className="mt-2 text-xs font-mono text-destructive bg-destructive/5 p-2 rounded border border-destructive/10">
                {this.state.errorMessage}
              </p>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
