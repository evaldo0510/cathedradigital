import { Button   } from '@/components/cathedra/Button';
import React from 'react';
import { Icons } from '@/constants';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';

interface ProGateProps {
  isPremium: boolean;
  isLoggedIn: boolean;
  onLogin: () => void;
  children: React.ReactNode;
}

const ProGate: React.FC<ProGateProps> = ({ isPremium, isLoggedIn, onLogin, children }) => {
  const navigate = useNavigate();

  if (isPremium) return <>{children}</>;
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 page-enter">
      <div className="w-20 h-20 rounded-premium-sm bg-primary/10 flex items-center justify-center">
        <Icons.Star className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Recurso PRO</h1>
      <p className="text-muted-foreground font-serif italic text-lg max-w-lg">
        Este recurso requer uma assinatura PRO. {!isLoggedIn && 'Faça login primeiro.'}
      </p>
      
      <div className="bg-card border border-border p-6 rounded-premium-sm max-w-sm w-full space-y-4 shadow-sm">
        
        {!isLoggedIn ? (
          <Button onClick={onLogin} className="w-full py-4 bg-foreground text-background rounded-full font-black uppercase text-premium-tiny tracking-widest shadow-premium hover:bg-primary hover:text-primary-foreground transition-all">
            Fazer Login
          </Button>
        ) : (
          <Button
            onClick={() => navigate(AppRoute.UPGRADE)}
            className="w-full py-4 bg-primary text-primary-foreground rounded-full font-black uppercase text-premium-tiny tracking-widest shadow-premium hover:opacity-90 transition-all"
          >
            Assinar PRO
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProGate;
