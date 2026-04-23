import React from 'react';
import { motion } from 'framer-motion';
import { Hash, Sparkles } from 'lucide-react';
import { Heart, Church, Flame, Cross, BookOpen, Shield, Crown, Hand, Star, Globe, Eye, Users, Compass, Wine, Orbit, Mountain, RefreshCw, Frown, Bird, Droplets, Wheat, Target, Clock, Megaphone, Skull } from 'lucide-react';

const tagIconMap: Record<string, React.ReactNode> = {
  '❤️': <Heart className="w-inherit h-inherit" />,
  '💖': <Heart className="w-inherit h-inherit" />,
  '💔': <Heart className="w-inherit h-inherit" />,
  '💜': <Heart className="w-inherit h-inherit" />,
  '🤍': <Heart className="w-inherit h-inherit" />,
  '🫶': <Heart className="w-inherit h-inherit" />,
  '✝️': <Cross className="w-inherit h-inherit" />,
  '⛪': <Church className="w-inherit h-inherit" />,
  '🙏': <Hand className="w-inherit h-inherit" />,
  '🤲': <Hand className="w-inherit h-inherit" />,
  '🕊️': <Bird className="w-inherit h-inherit" />,
  '🔥': <Flame className="w-inherit h-inherit" />,
  '📖': <BookOpen className="w-inherit h-inherit" />,
  '📕': <BookOpen className="w-inherit h-inherit" />,
  '👑': <Crown className="w-inherit h-inherit" />,
  '🛡️': <Shield className="w-inherit h-inherit" />,
  '⭐': <Star className="w-inherit h-inherit" />,
  '🌍': <Globe className="w-inherit h-inherit" />,
  '🌎': <Globe className="w-inherit h-inherit" />,
  '👁️': <Eye className="w-inherit h-inherit" />,
  '👥': <Users className="w-inherit h-inherit" />,
  '👨‍👩‍👧‍👦': <Users className="w-inherit h-inherit" />,
  '🧭': <Compass className="w-inherit h-inherit" />,
  '🍷': <Wine className="w-inherit h-inherit" />,
  '💫': <Sparkles className="w-inherit h-inherit" />,
  '✨': <Sparkles className="w-inherit h-inherit" />,
  '🌹': <Heart className="w-inherit h-inherit" />,
  '🌱': <Flame className="w-inherit h-inherit" />,
  '💡': <Star className="w-inherit h-inherit" />,
  '🕯️': <Flame className="w-inherit h-inherit" />,
  '⚔️': <Shield className="w-inherit h-inherit" />,
  '🏛️': <Church className="w-inherit h-inherit" />,
  '🤝': <Users className="w-inherit h-inherit" />,
  '😢': <Frown className="w-inherit h-inherit" />,
  '😰': <Frown className="w-inherit h-inherit" />,
  '😔': <Frown className="w-inherit h-inherit" />,
  '😞': <Frown className="w-inherit h-inherit" />,
  '😨': <Frown className="w-inherit h-inherit" />,
  '💀': <Skull className="w-inherit h-inherit" />,
  '🎭': <Eye className="w-inherit h-inherit" />,
  '☀️': <Star className="w-inherit h-inherit" />,
  '🌙': <Orbit className="w-inherit h-inherit" />,
  '🏔️': <Mountain className="w-inherit h-inherit" />,
  '🔄': <RefreshCw className="w-inherit h-inherit" />,
  '📏': <Target className="w-inherit h-inherit" />,
  '💧': <Droplets className="w-inherit h-inherit" />,
  '🌾': <Wheat className="w-inherit h-inherit" />,
  '🦅': <Bird className="w-inherit h-inherit" />,
  '🥀': <Heart className="w-inherit h-inherit" />,
  '🌑': <Orbit className="w-inherit h-inherit" />,
  '🕳️': <Orbit className="w-inherit h-inherit" />,
  '⏰': <Clock className="w-inherit h-inherit" />,
  '🎯': <Target className="w-inherit h-inherit" />,
  '📢': <Megaphone className="w-inherit h-inherit" />,
};

export const getTagIcon = (emoji: string, className = "w-3.5 h-3.5") => {
  const icon = tagIconMap[emoji] || <Hash className="w-inherit h-inherit" />;
  return React.cloneElement(icon as React.ReactElement, { className });
};

export const bubbleVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: (index: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: index * 0.015,
      type: 'spring',
      damping: 15,
      stiffness: 100
    }
  }),
  hover: {
    scale: 1.1,
    y: -2,
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.95 }
};

interface BubbleTagProps {
  label: string;
  emoji: string;
  index: number;
  isSelected?: boolean;
  isSuggested?: boolean;
  onClick: () => void;
  className?: string;
  ariaLabel?: string;
}

export const BubbleTag: React.FC<BubbleTagProps> = ({
  label,
  emoji,
  index,
  isSelected,
  isSuggested,
  onClick,
  className = "",
  ariaLabel
}) => {
  return (
    <motion.button
      variants={bubbleVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      custom={index}
      onClick={onClick}
      aria-pressed={isSelected}
      aria-label={ariaLabel || `Tema: ${label}`}
      className={`
        relative px-3.5 py-2 rounded-full border transition-all shadow-sm flex items-center gap-1.5 group/tag focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none
        ${isSelected 
          ? 'border-primary/50 bg-primary/10 ring-2 ring-primary/10 text-primary' 
          : isSuggested
            ? 'border-secondary/40 bg-secondary/5 hover:border-secondary/60 hover:bg-secondary/10 text-secondary'
            : 'border-border bg-card/50 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md text-foreground/80'
        }
        ${className}
      `}
    >
      {isSuggested && !isSelected && (
        <div className="absolute -top-1 -right-1">
          <Sparkles className="w-2.5 h-2.5 text-secondary animate-pulse" />
        </div>
      )}
      <span className="text-sm group-hover/tag:scale-110 transition-transform opacity-80 group-hover/tag:opacity-100">
        {getTagIcon(emoji)}
      </span>
      <span className={`
        text-[11px] font-bold transition-colors tracking-tight
        ${isSelected ? 'text-primary' : 'group-hover/tag:text-primary'}
      `}>
        {label}
      </span>
    </motion.button>
  );
};
