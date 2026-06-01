import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';


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
    label: 'Meditação', 
    icon: Icons.Compass, 
    description: 'Recursos para oração profunda.' 
  },
];


export const ComingSoonSection: React.FC<{ className?: string }> = ({ className }) => {
  const [email, setEmail] = useState('');
  const [interestType, setInterestType] = useState('all');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);


  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      toast.error("Por favor, insira um e-mail.");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      toast.error("Por favor, insira um e-mail válido.");
      return;
    }

    setLoading(true);
    
      try {
        const { error } = await supabase
          .from('coming_soon_leads')
          .insert([{ 
            email: trimmedEmail,
            interest_type: interestType 
          }]);


      if (error) {
        if (error.code === '23505') {
          toast.info("Você já está na nossa lista de espera.");
          setSubmitted(true);
        } else {
          throw error;
        }
      } else {
        setSubmitted(true);
        toast.success("Interesse registrado com sucesso.");
        setEmail('');
      }
    } catch (err) {
      console.error('Error registering lead:', err);
      toast.error("Erro ao registrar interesse.");
    } finally {
      setLoading(true);
      setTimeout(() => setLoading(false), 500);
    }
  };


  return (
    <div className={cn("space-y-spacing-3xl", className)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-mobile-stack)] md:gap-spacing-3xl max-w-5xl mx-auto">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center text-center gap-spacing-xl group cursor-default"
          >
            <div className="w-spacing-2xl h-spacing-2xl rounded-premium-full bg-primary/[0.03] border border-primary/10 flex items-center justify-center text-primary/60 group-hover:text-primary/50 transition-all duration-1000">
              <item.icon className="w-spacing-lg h-spacing-lg" strokeWidth={0.5} />
            </div>
            <div className="space-y-spacing-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 group-hover:text-primary/50 transition-colors duration-700">{item.label}</h3>
              <p className="text-[11px] text-muted-foreground/60 leading-relaxed font-serif italic tracking-wide group-hover:text-muted-foreground/50 transition-colors duration-700 max-w-[200px]">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="max-w-spacing-md mx-auto w-full pt-spacing-xl">
        {!submitted ? (
          <form onSubmit={handleSubmit} className="relative group">
            <div className="relative">
              <Input
                type="email"
                placeholder="Seu melhor e-mail para novidades..."
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-spacing-2xl pl-spacing-2xl pr-spacing-4xl rounded-premium-full border-border/10 bg-background/30 focus:bg-background/50 transition-all font-serif italic text-premium-base placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-primary/10"
              />
              <Icons.Mail className="absolute left-spacing-lg top-spacing-2xs/2 -translate-y-1/2 w-spacing-md h-spacing-md text-primary/60" />
              <button 
                type="submit" 
                disabled={loading}
                className="absolute right-spacing-2xs top-spacing-2xs/2 -translate-y-1/2 h-spacing-xl px-spacing-lg rounded-premium-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all duration-700 focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none"
              >
                {loading ? "..." : "Notificar"}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-spacing-sm text-primary/60 py-spacing-md px-spacing-xl rounded-premium-full bg-primary/[0.02] border border-primary/5 mx-auto w-fit transition-all duration-1000 animate-in fade-in zoom-in-95">
            <Icons.CheckCircle2 className="w-spacing-md h-spacing-md" />
            <span className="text-[9px] font-black uppercase tracking-widest">Inscrito no Santuário</span>
          </div>
        )}
      </div>
    </div>
  );
};
