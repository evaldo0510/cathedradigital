import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { AppRoute } from '@/types';
import { useOfficialSaint, useSaintsToday } from '@/hooks/useSaints';
import SacredImage from './SacredImage';
import { SaintCardSkeleton } from './SacredSkeleton';
import { ChevronRight, Sparkles } from 'lucide-react';
import { CathedraCard } from './CathedraCard';

interface SaintOfTheDayCardProps {
  variant?: 'compact' | 'full';
  showReflectionLink?: boolean;
  className?: string;
}

const SaintOfTheDayCard: React.FC<SaintOfTheDayCardProps> = ({ 
  variant = 'full',
  showReflectionLink = true
}) => {
  const navigate = useNavigate();
  const { data: officialSaint, isLoading: loadingOfficial } = useOfficialSaint();
  const { data: allSaintsToday = [], isLoading: loadingSaints } = useSaintsToday();

  const isLoading = loadingOfficial || loadingSaints;

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
      <CathedraCard className="p-spacing-xl text-center opacity-60">
        <Icons.Saints className="w-spacing-xl h-spacing-xl text-muted-foreground mx-auto mb-spacing-sm" />
        <p className="text-premium-sm text-muted-foreground font-serif italic">Nenhum santo encontrado para hoje</p>
      </CathedraCard>
    );
  }

  const handleNavigate = () => {
    const targetId = saint.id === 'official-today' ? '' : `/${saint.id}`;
    const action = showReflectionLink ? '?action=reflect' : '';
    navigate(`${AppRoute.SAINTS}${targetId}${action}`);
  };

  if (variant === 'compact') {
    return (
      <CathedraCard
        as="button"
        variant="interactive"
        padding="none"
        onClick={handleNavigate}
        className="w-full flex items-center gap-spacing-lg group text-left p-spacing-md"
      >
        <div className="w-spacing-3xl h-spacing-3xl rounded-premium-sm overflow-hidden border border-border/20 shadow-premium-md shrink-0">
          <SacredImage
            src={saint.image}
            alt={saint.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        </div>
        <div className="flex-1 min-w-spacing-0">
          <p className="text-premium-xs font-black uppercase tracking-[0.2em] text-secondary/80 mb-spacing-2xs">
            {saint.title === 'Santo do Dia' ? 'Santidade Hoje' : (saint.title || 'Santo do Dia')}
          </p>
          <h3 className="text-premium-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors truncate">
            {saint.name}
          </h3>
          <p className="text-premium-xs text-muted-foreground mt-spacing-xs line-clamp-spacing-2xs leading-relaxed">
            {saint.bio?.slice(0, 100)}...
          </p>
        </div>
        <ChevronRight className="w-spacing-md h-spacing-md text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0" />
      </CathedraCard>
    );
  }

  return (
    <CathedraCard
      as={motion.div}
      variant="interactive"
      padding="none"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      tabIndex={0}
      role="button"
      aria-label={`Conhecer mais sobre ${saint.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNavigate();
        }
      }}
      onClick={handleNavigate}
      className="group p-spacing-0 overflow-hidden flex flex-col sm:flex-row h-full"
    >
      <div className="w-full sm:w-spacing-2xs/3 h-spacing-4xl sm:h-auto relative shrink-0 overflow-hidden">
        <SacredImage 
          src={saint.image} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          alt={saint.name} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-spacing-lg left-spacing-lg right-spacing-lg">
          <p className="text-premium-xs font-black uppercase tracking-widest text-white/70 mb-spacing-2xs">{saint.feastDay}</p>
          <h3 className="text-premium-2xl font-serif font-bold text-white leading-tight">{saint.name}</h3>
        </div>
      </div>
      <div className="flex-1 p-spacing-xl md:p-spacing-xl space-y-spacing-lg flex flex-col justify-center">
        <div className="space-y-spacing-md">
          <p className="text-premium-xl text-primary font-serif italic mb-spacing-xs">
            "{saint.title === 'Santo do Dia' ? 'Exemplo de Santidade' : (saint.title || 'Exemplo de Santidade')}"
          </p>
          <p className="text-premium-sm text-muted-foreground font-serif italic line-clamp-spacing-md leading-relaxed">
            {saint.quotes?.[0] || saint.bio}
          </p>
        </div>
        <div className="flex items-center justify-between pt-spacing-lg border-t border-border/40">
          <div className="flex gap-spacing-xs">
            {saint.virtues?.slice(0, 2).map((v: string) => (
              <span key={v} className="px-spacing-sm py-spacing-2xs bg-primary/5 text-primary text-premium-xs font-black uppercase rounded-premium-full tracking-wider">{v}</span>
            )) || (
              <span className="px-spacing-sm py-spacing-2xs bg-primary/5 text-primary text-premium-xs font-black uppercase rounded-premium-full tracking-wider">Fé</span>
            )}
          </div>
          <div className="flex items-center gap-spacing-sm">
            <div className="w-spacing-xl h-spacing-xl rounded-premium bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
              <Sparkles className="w-spacing-md h-spacing-md" />
            </div>
            <span className="text-premium-small font-black uppercase tracking-widest text-primary">Conhecer</span>
          </div>
        </div>
      </div>
    </CathedraCard>
  );
};

export default SaintOfTheDayCard;