import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { useNavigate } from 'react-router-dom';
import { CathedraCard } from './CathedraCard';
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
      className="w-full mb-xl md:mb-3xl"
    >
      <CathedraCard variant={variant} padding="none" className="p-md md:p-2xl border-primary/5 bg-primary/[0.005] hover:border-primary/20 transition-all duration-700 relative overflow-hidden group shadow-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/[0.01] rounded-full -mr-4xl -mt-4xl blur-3xl group-hover:bg-primary/[0.03] transition-all duration-1000" />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-md md:gap-xl relative z-10">
          <div className="flex items-center gap-sm md:gap-lg">
            <div className="w-2xl h-2xl md:w-2xl md:h-2xl rounded-full bg-primary/5 flex items-center justify-center text-primary/60 border border-primary/5">
              <Icons.Compass className="w-lg h-lg" strokeWidth={1} />
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
          
          <div className="flex flex-col sm:flex-row items-center gap-md w-full md:w-auto">
            <Button 
              variant="ghost" 
              className="rounded-full px-xl md:px-2xl h-2xl md:h-2xl border border-primary/10 hover:bg-primary/5 text-primary/60 font-bold uppercase tracking-widest text-[9px] md:text-[10px] transition-all duration-700 w-full md:w-auto"
              onClick={() => navigate(route)}
            >
              Retomar Contemplação
            </Button>
          </div>
        </div>
      </CathedraCard>
    </motion.div>
  );
};

export { SpiritualContinuity };
export default SpiritualContinuity;
