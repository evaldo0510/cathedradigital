import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { cn } from '@/lib/utils';

interface ComingSoonItem {
  label: string;
  icon: React.ElementType;
  description: string;
}

const items: ComingSoonItem[] = [
  { 
    label: 'Jornadas', 
    icon: Icons.Journeys, 
    description: 'Trilhas personalizadas para sua vida espiritual.' 
  },
  { 
    label: 'Comunidade', 
    icon: Icons.Users, 
    description: 'Espaço de partilha e crescimento mútuo.' 
  },
  { 
    label: 'Quiz Avançado', 
    icon: Icons.Trophy, 
    description: 'Desafie seus conhecimentos sobre a fé.' 
  },
  { 
    label: 'Dashboard', 
    icon: Icons.Layout, 
    description: 'Acompanhamento detalhado do seu progresso.' 
  },
  { 
    label: 'Recursos Sociais', 
    icon: Icons.MessageCircle, 
    description: 'Conecte-se com outros peregrinos.' 
  },
];

export const ComingSoonSection: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <section className={cn("space-y-12", className)}>
      <div className="flex items-center gap-10">
        <div className="h-px flex-1 bg-border/30" />
        <h2 className="text-premium-tiny font-bold uppercase tracking-[0.6em] text-primary/30 whitespace-nowrap">
          Em Breve
        </h2>
        <div className="h-px flex-1 bg-border/30" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {items.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            viewport={{ once: true }}
            className="p-8 rounded-premium border border-border/20 bg-card/30 flex flex-col items-center text-center gap-6 group hover:bg-card/50 transition-all cursor-default"
          >
            <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground/40 group-hover:scale-110 transition-transform duration-500">
              <item.icon className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">{item.label}</h3>
              <p className="text-[10px] text-muted-foreground/30 leading-relaxed italic">{item.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/20 animate-pulse">
          Evolução constante sob a luz da tradição
        </p>
      </div>
    </section>
  );
};
