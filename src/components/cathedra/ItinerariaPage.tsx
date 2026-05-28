import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SEOHead from '@/components/SEOHead';

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
      <div className="app-container py-12 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-display font-bold text-primary">Itinerarium Mentis</h1>
          <p className="text-muted-foreground font-serif italic max-w-lg mx-auto">Uma caminhada espiritual guiada para aprofundamento interior.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {itineraria.map(item => (
              <motion.div key={item.id} whileHover={{ y: -5 }}>
                <Card className="premium-card overflow-hidden cursor-pointer h-full" onClick={() => navigate(`/itineraria/${item.id}`)}>
                  <CardContent className="p-6 space-y-4">
                    <Badge variant="outline" className="text-primary">{item.category}</Badge>
                    <h2 className="text-2xl font-bold font-serif">{item.title}</h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                    <div className="pt-4 flex justify-between items-center text-xs text-muted-foreground">
                      <span>{item.steps_count} passos</span>
                      <span>{item.estimated_days} dias</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ItinerariaPage;
