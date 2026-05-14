import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';

interface HomeQuickAccessProps {
  sections: Array<{
    title: string;
    icon: React.ReactNode;
    route: string;
  }>;
}

const HomeQuickAccess: React.FC<HomeQuickAccessProps> = ({ sections }) => {
  const navigate = useNavigate();

  return (
    <section className="space-y-6 pb-12">
      <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 flex items-center gap-4 px-2">
        <div className="h-px w-10 bg-primary/20" /> Acesso Rápido
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
        {sections.map((section) => (
          <div 
            key={section.title} 
            onClick={() => navigate(section.route)} 
            className="premium-card group cursor-pointer p-6 shadow-sm text-center space-y-4 rounded-3xl"
          >
            <div className="premium-icon-box mx-auto group-hover:scale-105 transition-transform duration-500">
              {section.icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors block leading-tight">
              {section.title}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HomeQuickAccess;