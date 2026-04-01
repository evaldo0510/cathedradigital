import React from 'react';
import { Icons } from '@/constants';

interface ProGateProps {
  isPremium: boolean;
  isLoggedIn: boolean;
  onLogin: () => void;
  children: React.ReactNode;
}

const ProGate: React.FC<ProGateProps> = ({ isPremium, isLoggedIn, onLogin, children }) => {
  if (isPremium) return <>{children}</>;
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 page-enter">
      <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
        <Icons.Star className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Recurso PRO</h1>
      <p className="text-muted-foreground font-serif italic text-lg max-w-lg">
        Este recurso requer uma assinatura PRO. {!isLoggedIn && 'Faça login primeiro.'}
      </p>
      {!isLoggedIn ? (
        <button onClick={onLogin} className="px-8 py-4 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary hover:text-primary-foreground transition-all">
          Fazer Login
        </button>
      ) : (
        <div className="px-6 py-3 border border-primary rounded-2xl text-xs font-bold text-primary">
          Em breve — Assinatura PRO
        </div>
      )}
    </div>
  );
};

export default ProGate;
