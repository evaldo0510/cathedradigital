import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { AppRoute } from '@/types';
import { useOfficialSaint, useSaintsToday } from '@/hooks/useSaints';
import SacredImage from './SacredImage';
import { SaintCardSkeleton } from './SacredSkeleton';
import { ChevronRight, Sparkles } from 'lucide-react';

interface SaintOfTheDayCardProps {
  variant?: 'compact' | 'full';
  showReflectionLink?: boolean;
}

const SaintOfTheDayCard: React.FC<SaintOfTheDayCardProps> = ({ 
  variant = 'full',
  showReflectionLink = true
}) => {
  const navigate = useNavigate();
  const { data: officialSaint, isLoading: loadingOfficial } = useOfficialSaint();
  const { data: allSaintsToday = [], isLoading: loadingSaints } = useSaintsToday();

  const isLoading = loadingOfficial && loadingSaints;

  const saint = useMemo(() => {
    if (officialSaint && officialSaint.name && officialSaint.name !== "Santo do Dia" && officialSaint.name !== "Menu") {
      const match = allSaintsToday.find((s: any) => {
        const officialName = (officialSaint.name || "").toLowerCase();
        const saintName = (s.name || "").toLowerCase();
        return officialName.includes(saintName) || saintName.includes(officialName);
      });
      
      if (match) {
        const fallbackImages = [
          officialSaint.image,
          match.image,
          `https://source.unsplash.com/featured/?saint,${match.name.split(' ').join(',')}`,
          `https://source.unsplash.com/featured/?catholic,${match.name.split(' ').join(',')}`
        ].filter(Boolean) as string[];

        return { 
          ...match, 
          ...officialSaint,
          id: match.id,
          image: fallbackImages,
          fullBio: (officialSaint.fullBio && officialSaint.fullBio.length > 50) ? 
                   officialSaint.fullBio : 
                   (match.fullBio || match.bio || officialSaint.description || officialSaint.fullBio)
        };
      }
      
      return { 
        id: 'official-today',
        name: officialSaint.name,
        title: officialSaint.title || 'Santo do Dia',
        bio: officialSaint.description,
        fullBio: officialSaint.fullBio || officialSaint.description,
        image: [
          officialSaint.image,
          `https://source.unsplash.com/featured/?saint,${officialSaint.name.split(' ').join(',')}`,
          'https://images.unsplash.com/photo-1548625361-195fe6144dfc?q=80&w=1000&auto=format&fit=crop' // Default Catholic image
        ].filter(Boolean) as string[],
        url: officialSaint.url,
        category: 'confessor',
        feastDay: '',
      };
    }

    if (allSaintsToday.length > 0) return allSaintsToday[0];
    
    return null;
  }, [allSaintsToday, officialSaint]);

  if (isLoading) return <SaintCardSkeleton />;

  if (!saint) {
    return (
      <div className="p-8 rounded-3xl border border-border bg-muted/10 text-center">
        <Icons.Saints className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground font-serif italic">Nenhum santo encontrado para hoje</p>
      </div>
    );
  }

  const handleNavigate = () => {
    const targetId = saint.id === 'official-today' ? '' : `/${saint.id}`;
    const action = showReflectionLink ? '?action=reflect' : '';
    navigate(`${AppRoute.SAINTS}${targetId}${action}`);
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleNavigate}
        className="w-full flex items-center gap-4 group text-left p-4 rounded-3xl border border-border bg-card/50 hover:bg-card transition-all"
      >
        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-secondary/20 shadow-md shrink-0">
          <SacredImage
            src={saint.image}
            alt={saint.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-secondary/80 mb-0.5">{saint.title || 'Santo do Dia'}</p>
          <h3 className="text-base font-bold text-foreground leading-tight group-hover:text-primary transition-colors truncate">
            {saint.name}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1 leading-relaxed">
            {saint.bio?.slice(0, 100)}...
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
      </button>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={handleNavigate}
      className="group cursor-pointer p-0 rounded-3xl border border-border bg-card overflow-hidden shadow-sm hover:border-primary/30 transition-all flex flex-col sm:flex-row h-full"
    >
      <div className="w-full sm:w-1/3 h-48 sm:h-auto relative shrink-0 overflow-hidden">
        <SacredImage 
          src={saint.image} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          alt={saint.name} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">{saint.feastDay}</p>
          <h3 className="text-xl font-serif font-bold text-white leading-tight">{saint.name}</h3>
        </div>
      </div>
      <div className="flex-1 p-6 space-y-4 flex flex-col justify-center">
        <div className="space-y-2">
          <p className="text-lg text-primary font-serif italic mb-2">"{saint.title || 'Exemplo de Santidade'}"</p>
          <p className="text-xs text-muted-foreground font-serif italic line-clamp-3 leading-relaxed">
            {saint.quotes?.[0] || saint.bio}
          </p>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex gap-1">
            {saint.virtues?.slice(0, 2).map((v: string) => (
              <span key={v} className="px-2 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase rounded-lg">{v}</span>
            )) || (
              <span className="px-2 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase rounded-lg">Fé</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Conhecer</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SaintOfTheDayCard;