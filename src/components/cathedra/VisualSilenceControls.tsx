import React from 'react';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { Icons } from '@/constants';
import { motion } from 'framer-motion';
import { EyeOff, ZapOff, Contrast, Compass, VolumeX } from 'lucide-react';

export const VisualSilenceControls: React.FC = () => {
  const { settings, updateSettings } = useReadingSettings();

  const controls = [
    {
      id: 'visualSilence',
      label: 'Silêncio Visual',
      icon: EyeOff,
      active: settings.visualSilence,
      description: 'Oculta interface e foca no essencial'
    },
    {
      id: 'totalSilence',
      label: 'Silêncio Total',
      icon: VolumeX,
      active: settings.totalSilence,
      description: 'Oculta loaders, skeletons e desativa todos os áudios'
    },
    {
      id: 'reduceAnimations',
      label: 'Reduzir Animações',
      icon: ZapOff,
      active: settings.reduceAnimations,
      description: 'Torna a interface estática e calma'
    },
    {
      id: 'highContrast',
      label: 'Alto Contraste',
      icon: Contrast,
      active: settings.highContrast,
      description: 'Aumenta a legibilidade para leitura focada'
    },
    {
      id: 'contemplativeMode',
      label: 'Modo Contemplativo',
      icon: Compass,
      active: settings.contemplativeMode,
      description: 'Tons suaves e luz reduzida para oração'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md md:gap-lg">
      {controls.map((control) => (
        <motion.button
          key={control.id}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => updateSettings({ [control.id]: !control.active } as any)}
          className={`
            relative p-lg rounded-premium border text-left transition-all duration-300
            ${control.active 
              ? 'bg-primary border-primary text-primary-foreground shadow-premium' 
              : 'bg-card/50 border-border/40 text-foreground/70 hover:border-primary/20 hover:bg-card'}
          `}
        >
          <div className="flex flex-col gap-md">
            <control.icon className={`w-lg h-lg ${control.active ? 'text-primary-foreground' : 'text-primary/40'}`} strokeWidth={1.5} />
            <div className="space-y-2xs">
              <span className="text-xs font-bold uppercase tracking-widest block">
                {control.label}
              </span>
              <p className={`text-[10px] leading-relaxed ${control.active ? 'text-primary-foreground/60' : 'text-muted-foreground/60'}`}>
                {control.description}
              </p>
            </div>
          </div>
          
          {control.active && (
            <motion.div 
              layoutId="active-dot"
              className="absolute top-md right-md w-2xs h-2xs rounded-full bg-secondary shadow-[0_0_8px_rgba(212,175,55,0.8)]"
            />
          )}
        </motion.button>
      ))}
    </div>
  );
};
