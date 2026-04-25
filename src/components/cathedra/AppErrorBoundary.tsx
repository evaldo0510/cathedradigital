import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icons } from '../../constants';

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
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-8 bg-background space-y-6">
          <Icons.History className="w-16 h-16 text-primary opacity-20" />
          <h1 className="text-3xl font-serif font-bold text-foreground">Santuário em Manutenção</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Pedimos desculpas, mas algo deu errado ao carregar o aplicativo. 
            Nossa equipe técnica já foi notificada.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl focus-visible:ring-4 focus-visible:ring-primary outline-none"
            >
              Tentar Novamente
            </button>
            <button
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
              className="px-8 py-3 bg-muted text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted/80 transition-all border border-border focus-visible:ring-4 focus-visible:ring-primary outline-none"
            >
              Limpar Dados e Reiniciar
            </button>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;