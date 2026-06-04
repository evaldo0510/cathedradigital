import { Button } from '@/components/ui/button';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icons } from '../../constants';
import * as Sentry from "@sentry/react";
import { trackNavigationError } from '@/lib/telemetry';



interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorId?: string;
}


class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = trackNavigationError(error, { componentStack: errorInfo.componentStack });
    this.setState({ errorId });
    
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
        <div className="flex flex-col items-center justify-center min-h-[60dvh] w-full p-spacing-xl text-center bg-background/50 backdrop-blur-sm rounded-[2.5rem] border border-border/10 space-y-spacing-xl animate-in fade-in duration-700">
          <div className="relative">
            <div className="w-spacing-3xl h-spacing-3xl rounded-premium-full bg-primary/5 border border-primary/10 flex items-center justify-center animate-pulse">
              <Icons.History className="w-spacing-lg h-spacing-lg text-primary/60" />
            </div>
          </div>

          <div className="space-y-spacing-md max-w-spacing-md mx-auto">
            <h1 className="text-premium-2xl md:text-premium-3xl font-display text-primary tracking-tight">
              Santuário em <span className="italic font-serif text-secondary/60">Manutenção</span>
            </h1>
            <p className="text-premium-xs font-serif italic text-muted-foreground leading-relaxed">
              Pedimos desculpas, peregrino. Algo interrompeu esta seção da sua jornada espiritual. 
              Nossos guardiões técnicos já foram alertados.
            </p>
            {this.state.errorId && (
              <p className="text-[9px] font-mono opacity-20 uppercase tracking-widest mt-spacing-md">
                Ref ID: {this.state.errorId}
              </p>
            )}
          </div>


          <div className="flex flex-col gap-spacing-sm w-full max-w-spacing-xs pt-spacing-md">
            <Button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="rounded-premium-full bg-primary/90 hover:bg-primary text-white h-spacing-xl text-[9px] font-bold uppercase tracking-[0.2em] shadow-premium hover:shadow-premium-hover transition-all"
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