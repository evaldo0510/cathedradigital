import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '@/constants';

interface HomeContinuarProps {
  nextUp: {
    type: string;
    label: string;
    route: string;
    subtitle: string;
  } | null;
}

const HomeContinuar: React.FC<HomeContinuarProps> = ({ nextUp }) => {
  const navigate = useNavigate();

  return (
    <section className="space-y-6">
      <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 flex items-center gap-4 px-2">
        <div className="h-px w-10 bg-primary/20" /> Continuar jornada
      </h2>
      {nextUp ? (
        <div 
          tabIndex={0}
          role="button"
          onClick={() => navigate(nextUp.route)}
          className="premium-card p-8 md:p-12 cursor-pointer transition-all duration-500 flex flex-col md:flex-row md:items-center justify-between group gap-8 border-primary/20"
        >
          <div className="flex items-center gap-6">
            <div className="premium-icon-box">
              {nextUp.type === 'bible' ? <Icons.Bible className="w-6 h-6" /> : 
               nextUp.type === 'catechism' ? <Icons.Catechism className="w-6 h-6" /> : 
               <Icons.Flame className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">{nextUp.subtitle}</p>
              <h3 className="text-xl md:text-2xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{nextUp.label}</h3>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all self-end md:self-center">
            <Icons.ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic px-6 font-serif">Inicie uma leitura para retomar aqui.</p>
      )}
    </section>
  );
};

export default HomeContinuar;