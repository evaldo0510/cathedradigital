import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { HomeCard } from './HomeCard';
import { Button } from '@/components/ui/button';

const SpiritualContinuity: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lastItem, setLastItem] = useState<{ title: string; route: string; type: 'reading' | 'journey' } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchLastActivity = async () => {
      setLoading(true);
      try {
        // Get last visited history
        const { data: historyData } = await supabase
          .from('user_history')
          .select('title, route, visited_at')
          .eq('user_id', user.id)
          .order('visited_at', { ascending: false })
          .limit(1);

        // Get last journey progress
        const { data: journeyData } = await supabase
          .from('journey_progress')
          .select('journey_id, journeys(title), completed_at')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(1);

        const history = historyData?.[0];
        const journey = journeyData?.[0];

        if (history && journey) {
          if (new Date(history.visited_at) > new Date(journey.completed_at)) {
            setLastItem({ title: history.title || 'Leitura', route: history.route, type: 'reading' });
          } else {
            setLastItem({ 
              title: (journey as any).journeys?.title || 'Jornada', 
              route: `/jornadas/${journey.journey_id}`, 
              type: 'journey' 
            });
          }
        } else if (history) {
          setLastItem({ title: history.title || 'Leitura', route: history.route, type: 'reading' });
        } else if (journey) {
          setLastItem({ 
            title: (journey as any).journeys?.title || 'Jornada', 
            route: `/jornadas/${journey.journey_id}`, 
            type: 'journey' 
          });
        }
      } catch (err) {
        console.error('Continuity Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLastActivity();
  }, [user]);

  if (loading || !lastItem) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto mb-16 px-6"
    >
      <HomeCard className="p-8 md:p-12 border-primary/5 bg-primary/[0.005] hover:border-primary/20 transition-all duration-700">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary/30">
              {lastItem.type === 'journey' ? <Icons.Compass className="w-6 h-6" /> : <Icons.BookOpen className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/20">Bem-vindo de volta</p>
              <h3 className="text-xl font-serif font-bold text-primary/80">
                {lastItem.type === 'journey' ? 'Retomar jornada:' : 'Continuar leitura:'} {lastItem.title}
              </h3>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="rounded-full px-10 h-12 border border-primary/10 hover:bg-primary/5 text-primary/60 font-bold uppercase tracking-widest text-[9px] transition-all duration-700"
            onClick={() => navigate(lastItem.route)}
          >
            Retomar agora
          </Button>
        </div>
      </HomeCard>
    </motion.div>
  );
};

export default SpiritualContinuity;
