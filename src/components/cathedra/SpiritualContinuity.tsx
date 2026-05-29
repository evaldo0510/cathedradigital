import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { useNavigate } from 'react-router-dom';
import { HomeCard } from './HomeCard';
import { Button } from '@/components/ui/button';
import { Profile, useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SpiritualContinuityProps {
  data?: any;
  isLoading?: boolean;
  profile?: Profile | null;
}

const SpiritualContinuity: React.FC<SpiritualContinuityProps> = ({ data: propData, isLoading: propLoading, profile: propProfile }) => {
  const navigate = useNavigate();
  const [internalData, setInternalData] = React.useState<any>(null);
  const [internalLoading, setInternalLoading] = React.useState(false);
  const { user } = useAuth();

  const fetchContinuity = React.useCallback(async () => {
    if (!user) return;
    setInternalLoading(true);
    try {
      const { data: continuityData, error } = await supabase.functions.invoke('spiritual-continuity');
      
      if (!error && continuityData) {
        setInternalData(continuityData);
      } else {
        // Fallback to basic history if AI fails
        const { data: historyData } = await supabase
          .from('user_history')
          .select('title, route, visited_at')
          .eq('user_id', user.id)
          .order('visited_at', { ascending: false })
          .limit(1);
        
        if (historyData?.[0]) {
          setInternalData({ recommendations: [{
            title: historyData[0].title,
            route: historyData[0].route,
            description: 'Onde você parou'
          }] });
        }
      }
    } catch (err) {
      console.error('Continuity Internal Error:', err);
    } finally {
      setInternalLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (propData || !user) return;
    fetchContinuity();
  }, [propData, user, fetchContinuity]);

  // Realtime sync for continuity
  React.useEffect(() => {
    if (!user || propData) return;

    const channel = supabase
      .channel('spiritual_continuity_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_history', filter: `user_id=eq.${user.id}` },
        () => fetchContinuity()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'itineraria_progress', filter: `user_id=eq.${user.id}` },
        () => fetchContinuity()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reading_marks', filter: `user_id=eq.${user.id}` },
        () => fetchContinuity()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, propData, fetchContinuity]);

  const isLoading = propLoading || internalLoading;
  const data = propData || internalData;

  if (isLoading || !data) return null;

  // Extract relevant item from data
  const nextItem = data.recommendations?.[0];

  if (!nextItem) return null;

  const title = nextItem.title || 'Continuação';
  const subtitle = nextItem.description || 'Onde você parou';
  const route = nextItem.route || '/';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 2, ease: [0.19, 1, 0.22, 1] }}
      className="w-full mb-20 md:mb-40"
    >
      <div className="p-8 md:p-16 bg-transparent border-none transition-all duration-1000 relative overflow-hidden group text-center md:text-left">
        <div className="absolute inset-0 bg-primary/[0.002] rounded-[4rem] group-hover:bg-primary/[0.005] transition-all duration-[2000ms]" />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/[0.01] flex items-center justify-center text-primary/10 border border-primary/[0.03] group-hover:scale-105 group-hover:text-primary/30 transition-all duration-[1500ms]">
              <Icons.Compass className="w-8 h-8 md:w-10 md:h-10" strokeWidth={0.5} />
            </div>
            <div className="space-y-4 text-center md:text-left">
              <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.8em] md:tracking-[1em] text-primary/15 group-hover:text-primary/40 transition-colors duration-[1500ms]">
                {propProfile?.name ? `Paz e Bem, ${propProfile.name.split(' ')[0]}` : 'Retomada'}
              </p>
              <h3 className="text-2xl md:text-4xl font-serif font-light text-primary/70 group-hover:text-primary/90 transition-colors duration-[1500ms]">
                {title}
              </h3>
              <p className="text-[13px] md:text-[15px] text-primary/30 italic font-serif tracking-widest group-hover:text-primary/50 transition-colors duration-[1500ms]">{subtitle}</p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="rounded-full px-10 md:px-16 h-14 md:h-16 bg-primary/[0.02] border border-primary/5 hover:bg-primary/5 text-primary/40 hover:text-primary/80 font-black uppercase tracking-[0.4em] text-[10px] md:text-[11px] transition-all duration-[1500ms] w-full md:w-auto"
            onClick={() => navigate(route)}
          >
            Continuar
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export { SpiritualContinuity };
export default SpiritualContinuity;
