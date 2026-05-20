import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
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
          toast.info("Você já está na nossa lista de espera. Obrigado pelo interesse!");
          setSubmitted(true); // Already registered
        } else {
          throw error;
        }
      } else {
        setSubmitted(true);
        toast.success("Interesse registrado com sucesso. Você será notificado das novidades.");
        setEmail('');
      }
    } catch (err) {
      console.error('Error registering lead:', err);
      toast.error("Erro ao registrar interesse. Tente novamente em instantes.");
    } finally {
      setLoading(true);
      // Brief artificial delay for better UX feel
      setTimeout(() => setLoading(false), 500);
    }
  };


  return (
    <section className={cn("space-y-16", className)}>
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
            className="p-8 rounded-premium border border-border/10 bg-card/[0.02] flex flex-col items-center text-center gap-6 group hover:bg-card/[0.05] transition-all cursor-default"
          >
            <div className="w-10 h-10 rounded-premium-sm bg-muted/20 flex items-center justify-center text-muted-foreground/20 group-hover:scale-105 transition-transform duration-500">
              <item.icon className="w-5 h-5" strokeWidth={1} />
            </div>
            <div className="space-y-2">
              <h3 className="text-[9px] font-bold uppercase tracking-[0.3em] text-foreground/20">{item.label}</h3>
              <p className="text-[9px] text-muted-foreground/20 leading-relaxed italic">{item.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="max-w-xl mx-auto w-full">
        <div className="p-8 md:p-12 rounded-premium border border-primary/5 bg-primary/[0.01] flex flex-col items-center gap-8 text-center">
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-primary/60">Seja notificado</h3>
            <p className="text-xs text-muted-foreground italic font-serif leading-relaxed">
              Junte-se à lista de espera para os novos módulos da biblioteca espiritual.
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">

              <div className="relative flex-1">
                <Input
                  type="email"
                  placeholder="Seu melhor e-mail..."
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-12 rounded-premium border-border/20 bg-background/50 focus:bg-background transition-all"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20" />
              </div>
              <Button 
                type="submit" 
                disabled={loading}
                className="h-12 px-8 rounded-premium bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px] hover:brightness-110"
              >
                {loading ? "Processando..." : (
                  <span className="flex items-center gap-2">
                    Indicar Interesse
                    <ArrowRight className="w-3 h-3" />
                  </span>
                )}
              </Button>
              </div>
              
              <div className="flex flex-wrap justify-center gap-2">
                <p className="w-full text-[9px] uppercase tracking-widest text-primary/30 mb-1">Interesse principal:</p>
                {['Geral', 'Jornadas', 'Comunidade', 'Quiz'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setInterestType(type.toLowerCase())}
                    className={cn(
                      "px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all border",
                      interestType === type.toLowerCase() 
                        ? "bg-primary/10 border-primary/20 text-primary shadow-sm" 
                        : "bg-transparent border-border/10 text-muted-foreground/40 hover:border-primary/10"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </form>

          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 text-secondary py-3 px-6 rounded-full bg-secondary/10 border border-secondary/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Inscrito com sucesso</span>
            </motion.div>
          )}
        </div>
      </div>
      
      <div className="text-center pt-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/20">
          Evolução constante sob a luz da tradição
        </p>
      </div>
    </section>
  );
};
