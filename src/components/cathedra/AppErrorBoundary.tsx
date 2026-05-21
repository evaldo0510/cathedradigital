import { Button } from '@/components/ui/button';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icons } from '../../constants';
import * as Sentry from "@sentry/react";


interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    Sentry.captureException(error, { 
      extra: { 
        componentStack: errorInfo.componentStack,
        ...errorInfo 
      } 
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-8 bg-background space-y-8 animate-in fade-in duration-700">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center animate-pulse">
              <Icons.History className="w-10 h-10 text-primary/20" />
            </div>
          </div>

          <div className="space-y-4 max-w-lg mx-auto">
            <h1 className="text-4xl md:text-5xl font-display text-primary tracking-tight">
              Santuário em <span className="italic font-serif text-secondary/60">Manutenção</span>
            </h1>
            <p className="text-sm font-serif italic text-muted-foreground leading-relaxed">
              Pedimos desculpas, peregrino. Algo interrompeu sua jornada espiritual. 
              Nossos guardiões técnicos já foram alertados para restaurar o caminho.
            </p>
          </div>

          <div className="flex flex-col gap-4 w-full max-w-xs pt-8">
            <Button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="rounded-full bg-primary/90 hover:bg-primary text-primary-foreground h-14 text-[10px] font-black uppercase tracking-[0.2em] shadow-premium hover:shadow-premium-hover transition-all"
            >
              Tentar Novamente
            </Button>
            
            <Button
              variant="ghost"
              onClick={async () => {
                localStorage.clear();
                sessionStorage.clear();
                try {
                  const regs = await navigator.serviceWorker.getRegistrations();
                  for (const reg of regs) {
                    await reg.unregister();
                  }
                } catch (e) {}
                window.location.href = '/';
              }}
              className="text-[9px] font-bold text-muted-foreground/40 hover:text-primary uppercase tracking-widest"
            >
              Limpar Dados e Reiniciar
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;