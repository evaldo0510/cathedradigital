import React from 'react';
import { motion } from 'framer-motion';
import { Hash, Sparkles, ScrollText } from 'lucide-react';
import { Heart, Church, Flame, Cross, BookOpen, Shield, Crown, Hand, Star, Globe, Eye, Users, Compass, Wine, Orbit, Mountain, RefreshCw, Frown, Bird, Droplets, Wheat, Target, Clock, Megaphone, Skull, Scroll } from 'lucide-react';

const tagIconMap: Record<string, React.ReactNode> = {
  '❤️': <Heart className="w-inherit h-inherit text-red-500" />,
  '💖': <Heart className="w-inherit h-inherit text-pink-500" />,
  '💔': <Heart className="w-inherit h-inherit text-muted-foreground" />,
  '💜': <Heart className="w-inherit h-inherit text-purple-500" />,
  '🤍': <Heart className="w-inherit h-inherit text-slate-100" />,
  '🫶': <Heart className="w-inherit h-inherit text-orange-400" />,
  '✝️': <Cross className="w-inherit h-inherit" />,
  '⛪': <Church className="w-inherit h-inherit" />,
  '🙏': <Hand className="w-inherit h-inherit" />,
  '🤲': <Hand className="w-inherit h-inherit" />,
  '🕊️': <Bird className="w-inherit h-inherit text-sky-400" />,
  '🔥': <Flame className="w-inherit h-inherit text-orange-600" />,
  '📖': <BookOpen className="w-inherit h-inherit text-blue-600" />,
  '📕': <BookOpen className="w-inherit h-inherit text-red-600" />,
  '👑': <Crown className="w-inherit h-inherit text-amber-500" />,
  '🛡️': <Shield className="w-inherit h-inherit text-slate-500" />,
  '⭐': <Star className="w-inherit h-inherit text-yellow-400" />,
  '🌍': <Globe className="w-inherit h-inherit text-green-600" />,
  '🌎': <Globe className="w-inherit h-inherit text-green-600" />,
  '👁️': <Eye className="w-inherit h-inherit text-blue-400" />,
  '👥': <Users className="w-inherit h-inherit" />,
  '👨‍👩‍👧‍👦': <Users className="w-inherit h-inherit" />,
  '🧭': <Compass className="w-inherit h-inherit text-teal-600" />,
  '🍷': <Wine className="w-inherit h-inherit text-red-800" />,
  '💫': <Sparkles className="w-inherit h-inherit text-amber-400" />,
  '✨': <Sparkles className="w-inherit h-inherit text-yellow-300" />,
  '🌹': <Heart className="w-inherit h-inherit text-rose-600" />,
  '🌱': <Flame className="w-inherit h-inherit text-green-500" />,
  '💡': <Star className="w-inherit h-inherit text-yellow-400" />,
  '🕯️': <Flame className="w-inherit h-inherit text-amber-600" />,
  '⚔️': <Shield className="w-inherit h-inherit text-slate-600" />,
  '🏛️': <Church className="w-inherit h-inherit" />,
  '🤝': <Users className="w-inherit h-inherit text-blue-500" />,
  '😢': <Frown className="w-inherit h-inherit text-blue-500" />,
  '😰': <Frown className="w-inherit h-inherit text-slate-500" />,
  '😔': <Frown className="w-inherit h-inherit text-indigo-500" />,
  '😞': <Frown className="w-inherit h-inherit text-gray-500" />,
  '😨': <Frown className="w-inherit h-inherit text-zinc-500" />,
  '💀': <Skull className="w-inherit h-inherit text-zinc-700" />,
  '🎭': <Eye className="w-inherit h-inherit text-purple-600" />,
  '☀️': <Star className="w-inherit h-inherit text-yellow-500" />,
  '🌙': <Orbit className="w-inherit h-inherit text-indigo-400" />,
  '🏔️': <Mountain className="w-inherit h-inherit text-slate-500" />,
  '🔄': <RefreshCw className="w-inherit h-inherit text-blue-500" />,
  '📏': <Target className="w-inherit h-inherit text-slate-500" />,
  '💧': <Droplets className="w-inherit h-inherit text-blue-400" />,
  '🌾': <Wheat className="w-inherit h-inherit text-amber-600" />,
  '🦅': <Bird className="w-inherit h-inherit text-slate-700" />,
  '🥀': <Heart className="w-inherit h-inherit text-red-900" />,
  '🌑': <Orbit className="w-inherit h-inherit text-slate-900" />,
  '🕳️': <Orbit className="w-inherit h-inherit text-black" />,
  '⏰': <Clock className="w-inherit h-inherit text-slate-600" />,
  '🎯': <Target className="w-inherit h-inherit text-red-600" />,
  '📢': <Megaphone className="w-inherit h-inherit text-blue-600" />,
  '📜': <ScrollText className="w-inherit h-inherit text-amber-700" />,
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
    xs: 'px-2 py-0.5 text-[8px] gap-1',
    sm: 'px-2.5 py-1 text-[9px] gap-1.5',
    md: 'px-3.5 py-2 text-[11px] gap-1.5'
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5'
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
        relative rounded-full border transition-all shadow-sm flex items-center group/tag focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:outline-none
        ${sizeClasses[size]}
        ${isSelected 
          ? 'border-primary bg-primary/15 ring-4 ring-primary/5 text-primary shadow-lg scale-105' 
          : isSuggested
            ? 'border-secondary/50 bg-secondary/10 hover:border-secondary/80 hover:bg-secondary/20 text-secondary hover:scale-105'
            : 'border-border bg-card/50 hover:border-primary/60 hover:bg-primary/5 hover:shadow-md text-foreground/80 hover:scale-105 hover:text-foreground'
        }
        ${className}
      `}
    >
      {isSuggested && !isSelected && (
        <div className="absolute -top-1 -right-1">
          <Sparkles className={`text-secondary animate-pulse ${size === 'xs' ? 'w-2 h-2' : 'w-2.5 h-2.5'}`} />
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