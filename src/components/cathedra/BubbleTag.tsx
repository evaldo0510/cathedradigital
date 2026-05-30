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

export const getTagIcon = (emoji: string, className = "w-spacing-sm h-spacing-sm") => {
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
      type: 'spring' as const,
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
  size?: 'xs' | 'sm' | 'md';
  onClick: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onMouseEnter?: () => void;
  className?: string;
  ariaLabel?: string;
  tabIndex?: number;
  "data-roving-item"?: boolean;
  [key: string]: any;
}

export const BubbleTag = React.forwardRef<HTMLButtonElement, BubbleTagProps>(({
  label,
  emoji,
  index,
  isSelected,
  isSuggested,
  size = 'md',
  onClick,
  onKeyDown,
  onMouseEnter,
  className = "",
  ariaLabel,
  tabIndex,
  "data-roving-item": dataRovingItem,
  ...props
}, ref) => {
  const sizeClasses = {
    xs: 'px-spacing-xs py-spacing-3xs text-xs gap-spacing-2xs',
    sm: 'px-spacing-xs py-spacing-2xs text-xs gap-spacing-2xs',
    md: 'px-spacing-sm py-spacing-xs text-premium-small gap-spacing-2xs'
  };

  const iconSizes = {
    xs: 'w-spacing-xs h-spacing-xs',
    sm: 'w-spacing-sm h-spacing-sm',
    md: 'w-spacing-sm h-spacing-sm'
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      onKeyDown={onKeyDown}
      onMouseEnter={onMouseEnter}
      tabIndex={tabIndex}
      data-roving-item={dataRovingItem}
      variants={bubbleVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      layout="position"
      custom={index}
      {...props}
      aria-pressed={isSelected}
      aria-label={`${ariaLabel || `Tema: ${label}`}${isSelected ? ' (Selecionado)' : ''}${isSuggested ? ' (Sugerido)' : ''}`}
      className={`
        relative rounded-full border transition-all shadow-md flex items-center group/tag focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:outline-none
        ${sizeClasses[size]}
        ${isSelected 
          ? 'border-primary bg-primary/15 ring-4 ring-primary/5 text-primary shadow-premium scale-105' 
          : isSuggested
            ? 'border-secondary/50 bg-secondary/10 hover:border-secondary/80 hover:bg-secondary/20 text-secondary hover:scale-105'
            : 'border-border bg-card hover:border-primary/60 hover:bg-primary/5 hover:shadow-premium text-foreground/80 hover:scale-105 hover:text-foreground'
        }
        ${className}
      `}
    >
      {isSuggested && !isSelected && (
        <div className="absolute -top-spacing-2xs -right-spacing-2xs">
          <Sparkles className={`text-secondary animate-pulse ${size === 'xs' ? 'w-spacing-xs h-spacing-xs' : 'w-spacing-xs h-spacing-xs'}`} />
        </div>
      )}
      <span className="group-hover/tag:scale-110 transition-transform opacity-80 group-hover/tag:opacity-100">
        {getTagIcon(emoji, iconSizes[size])}
      </span>
      <span className={`
        font-bold transition-colors tracking-tight
        ${isSelected ? 'text-primary' : 'group-hover/tag:text-primary'}
      `}>
        {label}
      </span>
    </motion.button>
  );
});

BubbleTag.displayName = 'BubbleTag';