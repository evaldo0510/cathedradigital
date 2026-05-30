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
        <div className="flex flex-col items-center justify-center min-h-[60dvh] w-full p-xl text-center bg-background/50 backdrop-blur-sm rounded-[2.5rem] border border-border/10 space-y-8 animate-in fade-in duration-700">
          <div className="relative">
            <div className="w-3xl h-3xl rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center animate-pulse">
              <Icons.History className="w-lg h-lg text-primary/60" />
            </div>
          </div>

          <div className="space-y-4 max-w-md mx-auto">
            <h1 className="text-2xl md:text-3xl font-display text-primary tracking-tight">
              Santuário em <span className="italic font-serif text-secondary/60">Manutenção</span>
            </h1>
            <p className="text-xs font-serif italic text-muted-foreground leading-relaxed">
              Pedimos desculpas, peregrino. Algo interrompeu esta seção da sua jornada espiritual. 
              Nossos guardiões técnicos já foram alertados.
            </p>
          </div>

          <div className="flex flex-col gap-sm w-full max-w-xs pt-md">
            <Button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="rounded-full bg-primary/90 hover:bg-primary text-white h-xl text-[9px] font-bold uppercase tracking-[0.2em] shadow-premium hover:shadow-premium-hover transition-all"
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
                } catch (e) {
                  console.error('Failed to unregister service workers:', e);
                }
                window.location.href = '/';
              }}
              className="text-[8px] font-bold text-muted-foreground/40 hover:text-primary uppercase tracking-widest"
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