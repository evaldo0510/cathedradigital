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
  variant?: 'default' | 'glass' | 'outline';
}

const SpiritualContinuity: React.FC<SpiritualContinuityProps> = ({ 
  data: propData, 
  isLoading: propLoading, 
  profile: propProfile,
  variant = 'default'
}) => {
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
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mb-8 md:mb-16"
    >
      <HomeCard variant={variant} className="p-4 md:p-12 border-primary/5 bg-primary/[0.005] hover:border-primary/20 transition-all duration-700 relative overflow-hidden group shadow-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/[0.01] rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary/[0.03] transition-all duration-1000" />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 relative z-10">
          <div className="flex items-center gap-3 md:gap-6">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary/5 flex items-center justify-center text-primary/60 border border-primary/5">
              <Icons.Compass className="w-6 h-6" strokeWidth={1} />
            </div>
            <div className="space-y-1 text-center md:text-left">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/40">
                {propProfile?.name ? `Paz e Bem, ${propProfile.name.split(' ')[0]}` : 'Bem-vindo de volta'}
              </p>
              <h3 className="text-lg md:text-2xl font-serif font-bold text-primary/80">
                {title}
              </h3>
              <p className="text-xs text-primary/60 italic font-serif">{subtitle}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <Button 
              variant="ghost" 
              className="rounded-full px-8 md:px-12 h-12 md:h-14 border border-primary/10 hover:bg-primary/5 text-primary/60 font-bold uppercase tracking-widest text-[9px] md:text-[10px] transition-all duration-700 w-full md:w-auto"
              onClick={() => navigate(route)}
            >
              Retomar Contemplação
            </Button>
          </div>
        </div>
      </HomeCard>
    </motion.div>
  );
};

export { SpiritualContinuity };
export default SpiritualContinuity;
