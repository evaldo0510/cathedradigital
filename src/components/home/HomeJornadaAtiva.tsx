import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '@/constants';
import { AppRoute } from '@/types';
import { Button } from '@/components/ui/button';

interface HomeJornadaAtivaProps {
  activeJourney: any;
  recommendedJourney: any;
}

const HomeJornadaAtiva: React.FC<HomeJornadaAtivaProps> = ({ activeJourney, recommendedJourney }) => {
  const navigate = useNavigate();

  const journeyProgress = activeJourney ? { 
    completed: activeJourney.completedSteps, 
    total: activeJourney.totalSteps 
  } : { completed: 0, total: 0 };

  return (
    <section className="space-y-6">
      <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 flex items-center gap-4 px-2">
        <div className="h-px w-10 bg-primary/20" /> Itinerarium Mentis
      </h2>
      {activeJourney ? (
        <div 
          className="premium-card group cursor-pointer p-8 shadow-sm border-primary/20"
          onClick={() => navigate(`/jornadas/${activeJourney.id}`)} 
        >
          <div className="flex items-center gap-6">
            <div className="premium-icon-box"><Icons.Flame className="w-6 h-6" /></div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">{activeJourney.title}</h3>
                <p className="text-[10px] uppercase font-black tracking-widest text-primary/60 mt-1">Sua Jornada Ativa</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${journeyProgress.total > 0 ? (journeyProgress.completed / journeyProgress.total) * 100 : 0}%` }} />
                </div>
                <span className="text-xs font-black text-primary uppercase tabular-nums tracking-widest">{journeyProgress.completed}/{journeyProgress.total}</span>
              </div>
            </div>
            <Icons.ChevronRight className="w-7 h-7 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
          </div>
        </div>
      ) : recommendedJourney ? (
        <div 
          onClick={() => navigate(`/jornadas/${recommendedJourney.id}`)} 
          className="premium-card group cursor-pointer p-8 shadow-sm"
        >
          <div className="flex items-center gap-6">
            <div className="premium-icon-box"><Icons.Compass className="w-6 h-6" /></div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground">{recommendedJourney.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 font-medium font-serif italic">Sugerido especialmente para seu perfil espiritual</p>
            </div>
            <Icons.ChevronRight className="w-7 h-7 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
          </div>
        </div>
      ) : (
        <Button 
          variant="outline" 
          onClick={() => navigate(AppRoute.JORNADAS)} 
          className="w-full h-24 rounded-[2rem] border-dashed border-2 hover:bg-primary/5"
        >
          <div className="flex items-center gap-4">
            <Icons.Route className="w-6 h-6 text-muted-foreground" />
            <span className="text-sm font-bold">Descobrir minha próxima Jornada</span>
          </div>
        </Button>
      )}
    </section>
  );
};

export default HomeJornadaAtiva;