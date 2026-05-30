import { Button } from '@/components/ui/button';
import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';

const AboutCreatorSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-4xl px-lg relative overflow-hidden">
      {/* Decorative background elements simplified */}
      <div className="absolute top-2xs/2 left-2xs/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/2 rounded-premium pointer-events-none" />

      <div className="container mx-auto px-lg relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-2xl md:gap-3xl">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full md:w-2xs/3 flex justify-center"
          >
            <div className="relative">
              <div className="w-4xl h-4xl md:w-4xl md:h-4xl rounded-premium border border-border/10 p-2xs relative bg-background">
                <div className="w-full h-full rounded-premium bg-muted flex items-center justify-center overflow-hidden border border-border/10">
                  <Icons.User className="w-3xl h-3xl text-muted-foreground/30" />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full md:w-xs/3 space-y-lg text-center md:text-left"
          >
            <div className="inline-flex items-center gap-xs px-sm py-2xs bg-primary/5 rounded-premium">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary/60 italic">O Fundador</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground uppercase tracking-wider">
              Evaldo.os
            </h2>
            
            <div className="space-y-md text-muted-foreground text-lg leading-relaxed">
              <p>
                Idealizador do Cathedra, buscador da Verdade e entusiasta da tecnologia. Minha missão é construir pontes entre o sagrado e o digital, permitindo que a profundidade da tradição católica floresça no mundo contemporâneo.
              </p>
              <p className="font-serif text-foreground/80">
                Acreditamos que a tecnologia, quando a serviço da fé, pode ser um instrumento poderoso de santificação e estudo.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-md pt-md">
              <Button 
                onClick={() => navigate(AppRoute.ABOUT)}
                className="w-full sm:w-auto px-xl py-sm bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-[0.2em] shadow-none hover:bg-primary/90 transition-all flex items-center justify-center gap-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Ler o manifesto do Cathedra"
              >
                Manifesto
                <Icons.ArrowRight className="w-md h-md" aria-hidden="true" />
              </Button>
              <div className="flex items-center gap-md px-md py-xs text-muted-foreground">
                <div className="h-px w-xl bg-border" />
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