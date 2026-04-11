import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '@/types';

const AboutCreatorSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-background border-y border-border/40 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-20">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full md:w-1/3 flex justify-center"
          >
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="w-48 h-48 md:w-64 md:h-64 rounded-full border-2 border-border p-2 relative bg-background">
                <div className="w-full h-full rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
                  <Icons.User className="w-24 h-24 text-muted-foreground/30" />
                  {/* If the creator has a photo, replace the Icon with an img tag:
                  <img src="/creator-photo.jpg" alt="eevaldo.os" className="w-full h-full object-cover" />
                  */}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-primary text-white p-3 rounded-full shadow-lg border-4 border-background">
                  <Icons.Feather className="w-5 h-5" />
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
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">O Fundador</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              eevaldo.os
            </h2>
            
            <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
              <p>
                Idealizador do Cathedra, buscador da Verdade e entusiasta da tecnologia. Minha missão é construir pontes entre o sagrado e o digital, permitindo que a profundidade da tradição católica floresça no mundo contemporâneo.
              </p>
              <p className="font-serif italic text-foreground/80">
                "Acreditamos que a tecnologia, quando a serviço da fé, pode ser um instrumento poderoso de santificação e estudo."
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <button 
                onClick={() => navigate(AppRoute.ABOUT)}
                className="w-full sm:w-auto px-8 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group shadow-sm"
              >
                Conhecer o Manifesto
                <Icons.ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
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