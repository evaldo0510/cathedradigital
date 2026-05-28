import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HomeCard } from './HomeCard';
import ContemplativeLayout from './ContemplativeLayout';
import { getLevelInfo } from '@/lib/levels';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface JourneyProgress {
  id: string;
  title: string;
  progress: number;
  last_visited: string;
}

const SpiritualProfile: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [recentReadings, setRecentReadings] = useState<any[]>([]);
  const [activeJourneys, setActiveJourneys] = useState<JourneyProgress[]>([]);
  const [contemplatedThemes, setContemplatedThemes] = useState<string[]>([]);
  const [favoriteReflections, setFavoriteReflections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchSpiritualData = async () => {
      setLoading(true);
      try {
        // Fetch recent history
        const { data: historyData } = await supabase
          .from('user_history')
          .select('*')
          .eq('user_id', user.id)
          .order('visited_at', { ascending: false })
          .limit(5);

        // Fetch active journeys
        const { data: journeyData } = await supabase
          .from('journey_progress')
          .select('*, journeys(title)')
          .eq('user_id', user.id)
          .order('last_visited_at', { ascending: false })
          .limit(3);

        // Fetch favorite reflections
        const { data: reflectionsData } = await supabase
          .from('spiritual_journal')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        setRecentReadings(historyData || []);
        setActiveJourneys((journeyData || []).map(j => ({
          id: j.journey_id,
          title: j.journeys?.title || 'Jornada Sem Título',
          progress: j.progress_percent || 0,
          last_visited: j.last_visited_at
        })));
        setFavoriteReflections(reflectionsData || []);
        
        // Extract themes from history or reflections (mocked for now based on what we have)
        setContemplatedThemes(['Cristologia', 'Misericórdia', 'Liturgia', 'Vida Eterna']);

      } catch (error) {
        console.error('Error fetching spiritual profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpiritualData();
  }, [user]);

  if (!profile) return null;

  const { levelName, progress: xpProgress } = getLevelInfo(profile.xp || 0);

  return (
    <ContemplativeLayout
      subtitle="Itinerarium Animae"
      title="Perfil Espiritual"
      maxW="max-w-5xl"
    >
      <div className="space-y-24 md:space-y-32">
        {/* Header/Summary */}
        <section className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border border-primary/10 animate-pulse" />
            <div className="absolute -inset-4 rounded-full border border-primary/5 animate-slow-spin" />
            <div className="w-full h-full rounded-full bg-primary/5 flex items-center justify-center overflow-hidden border border-primary/10">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover opacity-80" />
              ) : (
                <Icons.User className="w-12 h-12 text-primary/20" strokeWidth={0.5} />
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-display font-bold text-primary">{profile.name || 'Peregrino'}</h2>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-primary/30">{levelName}</p>
          </div>

          <div className="flex justify-center gap-12 pt-8">
            <div className="text-center">
              <p className="text-2xl font-display text-primary">{profile.streak || 0}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-primary/30">Dias em Oração</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-display text-primary">{profile.xp || 0}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-primary/30">Graças (XP)</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
          {/* Continuar Jornada */}
          <section className="space-y-10">
            <div className="flex items-center gap-6 opacity-30">
              <Icons.Compass className="w-5 h-5" strokeWidth={1} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Itinerários Ativos</h3>
            </div>
            
            <div className="space-y-6">
              {activeJourneys.length > 0 ? (
                activeJourneys.map((j) => (
                  <HomeCard 
                    key={j.id} 
                    className="group cursor-pointer hover:border-primary/20 transition-all duration-700"
                    onClick={() => navigate(`/jornadas/${j.id}`)}
                  >
                    <div className="flex items-center justify-between gap-6">
                      <div className="space-y-2">
                        <p className="text-xs text-primary/40 font-bold uppercase tracking-widest">Em progresso</p>
                        <h4 className="text-lg font-serif font-bold text-primary">{j.title}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-display text-primary">{j.progress}%</p>
                        <div className="w-24 h-1 bg-primary/5 rounded-full mt-2 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${j.progress}%` }}
                            className="h-full bg-primary/20"
                          />
                        </div>
                      </div>
                    </div>
                  </HomeCard>
                ))
              ) : (
                <div className="p-12 border border-dashed border-primary/10 rounded-premium text-center opacity-30">
                  <p className="font-serif italic text-sm">Nenhuma jornada iniciada...</p>
                  <Button 
                    variant="ghost" 
                    className="mt-6 text-[10px] font-black uppercase tracking-widest"
                    onClick={() => navigate('/jornadas')}
                  >
                    Explorar Itinerários
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Temas Contemplados */}
          <section className="space-y-10">
            <div className="flex items-center gap-6 opacity-30">
              <Icons.Sparkles className="w-5 h-5" strokeWidth={1} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Temas Contemplados</h3>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {contemplatedThemes.map((theme) => (
                <div 
                  key={theme}
                  className="px-6 py-3 rounded-full bg-primary/[0.02] border border-primary/[0.05] text-[11px] font-bold text-primary/60 tracking-wider hover:bg-primary/5 hover:border-primary/20 transition-all duration-500 cursor-default"
                >
                  {theme}
                </div>
              ))}
            </div>
          </section>

          {/* Últimas Leituras */}
          <section className="space-y-10 md:col-span-2">
            <div className="flex items-center gap-6 opacity-30">
              <Icons.BookOpen className="w-5 h-5" strokeWidth={1} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Memória de Leitura</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {recentReadings.length > 0 ? (
                recentReadings.map((reading) => (
                  <div key={reading.id} className="space-y-4 p-8 rounded-premium bg-primary/[0.01] border border-primary/[0.03] group hover:bg-primary/[0.02] transition-all duration-700">
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary/20">
                      {format(new Date(reading.visited_at), "d 'de' MMM", { locale: ptBR })}
                    </p>
                    <h4 className="text-base font-serif font-bold text-primary/80 line-clamp-1">{reading.page_title || 'Leitura'}</h4>
                    <p className="text-xs text-primary/40 italic line-clamp-2">Continuar contemplação...</p>
                  </div>
                ))
              ) : (
                <p className="col-span-3 text-center py-12 font-serif italic text-primary/20">O silêncio das páginas aguarda sua visita.</p>
              )}
            </div>
          </section>

          {/* Reflexões Favoritas */}
          <section className="space-y-10 md:col-span-2">
            <div className="flex items-center gap-6 opacity-30">
              <Icons.Feather className="w-5 h-5" strokeWidth={1} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Reflexões Guardadas</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {favoriteReflections.length > 0 ? (
                favoriteReflections.map((ref) => (
                  <div key={ref.id} className="relative p-10 rounded-premium border border-primary/5 bg-primary/[0.01] hover:bg-primary/[0.03] transition-all duration-1000 group">
                    <Icons.Quote className="absolute top-6 left-6 w-8 h-8 text-primary/5 group-hover:text-primary/10 transition-colors" />
                    <p className="text-lg font-serif italic text-primary/70 leading-relaxed mb-6 pt-4">
                      "{ref.content.length > 150 ? `${ref.content.substring(0, 150)}...` : ref.content}"
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary/20">
                      {format(new Date(ref.created_at), "d 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="col-span-2 text-center py-12 font-serif italic text-primary/20">Suas reflexões serão guardadas aqui.</p>
              )}
            </div>
          </section>
        </div>

        {/* Logos Suggestion */}
        <section className="pt-24 border-t border-primary/5">
          <div className="premium-card p-12 md:p-20 bg-primary/[0.005] border-primary/[0.02] text-center space-y-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
            
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-full bg-primary/[0.02] border border-primary/[0.05] flex items-center justify-center mx-auto text-primary/30">
                <Icons.Sparkles className="w-5 h-5" strokeWidth={0.5} />
              </div>
              <h3 className="text-xl md:text-2xl font-serif font-bold text-primary/80">O que sua alma busca hoje?</h3>
              <p className="text-sm md:text-base text-primary/40 font-serif italic max-w-xl mx-auto">
                "A Logos IA pode ajudar a conectar os temas de sua jornada e sugerir novos caminhos de contemplação."
              </p>
            </div>

            <div className="flex justify-center pt-8">
              <Button 
                variant="ghost" 
                className="rounded-full px-12 h-14 border border-primary/10 hover:bg-primary/5 text-primary/60 font-bold uppercase tracking-widest text-[10px] transition-all duration-700"
                onClick={() => navigate('/logos')}
              >
                Conversar com Logos
              </Button>
            </div>
          </div>
        </section>
      </div>
    </ContemplativeLayout>
  );
};

export default SpiritualProfile;
