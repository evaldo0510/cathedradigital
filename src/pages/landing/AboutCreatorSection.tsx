import { Button } from '@/components/ui/button';
import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';

const AboutCreatorSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Decorative background elements simplified */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/2 rounded-premium pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-20">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full md:w-1/3 flex justify-center"
          >
            <div className="relative">
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-premium border border-border/10 p-1 relative bg-background">
                <div className="w-full h-full rounded-premium bg-muted flex items-center justify-center overflow-hidden border border-border/10">
                  <Icons.User className="w-16 h-16 text-muted-foreground/30" />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full md:w-2/3 space-y-6 text-center md:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-premium">
              <span className="text-premium-tiny font-bold uppercase tracking-[0.3em] text-primary/60 italic">O Fundador</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground uppercase tracking-wider">
              Evaldo.os
            </h2>
            
            <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
              <p>
                Idealizador do Cathedra, buscador da Verdade e entusiasta da tecnologia. Minha missão é construir pontes entre o sagrado e o digital, permitindo que a profundidade da tradição católica floresça no mundo contemporâneo.
              </p>
              <p className="font-serif text-foreground/80">
                Acreditamos que a tecnologia, quando a serviço da fé, pode ser um instrumento poderoso de santificação e estudo.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Button 
                onClick={() => navigate(AppRoute.ABOUT)}
                className="w-full sm:w-auto px-10 py-3.5 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-[0.2em] shadow-none hover:bg-primary/90 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Ler o manifesto do Cathedra"
              >
                Manifesto
                <Icons.ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Button>
              <div className="flex items-center gap-4 px-4 py-2 text-muted-foreground">
                <div className="h-px w-8 bg-border" />
                <span className="text-sm font-medium">Unindo Fé e Inovação</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutCreatorSection;