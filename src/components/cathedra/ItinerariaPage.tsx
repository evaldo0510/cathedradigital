import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SEOHead from '@/components/SEOHead';
import SpiritualGoals from './SpiritualGoals';

const ItinerariaPage: React.FC = () => {
  const navigate = useNavigate();
  const [itineraria, setItineraria] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItineraria();
  }, []);

  const loadItineraria = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('view_itineraria_with_stats')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (data) setItineraria(data);
    setLoading(false);
  };

  return (
    <>
      <SEOHead title="Trilhas Espirituais" description="Caminhadas contemplativas para aprofundamento na vida espiritual." path="/itineraria" />
      <div className="app-container py-2xl md:py-4xl space-y-3xl md:space-y-4xl">
        <motion.div 
          className="text-center space-y-xl max-w-3xl mx-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-sm px-md py-xs bg-primary/[0.03] rounded-full border border-primary/10 mb-xs">
            <Icons.Compass className="w-md h-md text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Itinerarium Mentis</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-primary tracking-tight leading-[0.9]">Trilhas</h1>
          <p className="text-muted-foreground font-serif italic text-lg md:text-xl leading-relaxed">
            "Aquele que me segue não andará em trevas, mas terá a luz da vida." — João 8,12
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <SpiritualGoals />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
            {[1, 2].map(i => (
              <div key={i} className="h-4xl rounded-[2.5rem] bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
          >
            {itineraria.map(item => (
              <motion.div 
                key={item.id} 
                whileHover={{ y: -8, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
              >
                <Card 
                  className="premium-card overflow-hidden cursor-pointer h-full border-primary/5 bg-card/50 hover:bg-card hover:border-primary/20 transition-all duration-700 rounded-[2.5rem] shadow-none hover:shadow-premium-hover relative" 
                  onClick={() => navigate(`/itineraria/${item.id}`)}
                >
                  <div className="absolute top-0 right-0 p-xl opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000">
                    <Icons.Compass className="w-4xl h-4xl text-primary" />
                  </div>
                  
                  <CardContent className="p-xl md:p-2xl space-y-lg relative z-10">
                    <div className="flex items-center gap-sm">
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.2em] px-sm py-2xs bg-primary/5 border-primary/10 text-primary">
                        {item.category}
                      </Badge>
                      <div className="w-2xs h-2xs rounded-full bg-primary/20" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{item.difficulty}</span>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground leading-tight">{item.title}</h2>
                    <p className="text-muted-foreground/80 font-serif italic text-lg leading-relaxed line-clamp-3">{item.description}</p>
                    
                    <div className="pt-xl flex items-center justify-between">
                      <div className="flex items-center gap-lg">
                        <div className="flex flex-col">
                          <span className="text-xl font-bold text-primary">{item.steps_count}</span>
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Passos</span>
                        </div>
                        <div className="w-px h-xl bg-border/50" />
                        <div className="flex flex-col">
                          <span className="text-xl font-bold text-primary">{item.estimated_days}</span>
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Dias</span>
                        </div>
                      </div>
                      
                      <div className="w-2xl h-2xl rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                        <Icons.ChevronRight className="w-md h-md" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </>
  );
};

export default ItinerariaPage;
