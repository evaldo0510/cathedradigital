import React from 'react';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { Icons } from '@/constants';
import { motion } from 'framer-motion';
import { EyeOff, ZapOff, Contrast, Compass, VolumeX, Sliders, Layers, Sparkles } from 'lucide-react';

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
    <div className="space-y-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        {controls.map((control) => (
          <motion.button
            key={control.id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => updateSettings({ [control.id]: !control.active } as any)}
            className={`
              relative p-6 rounded-premium border text-left transition-all duration-300
              ${control.active 
                ? 'bg-primary border-primary text-primary-foreground shadow-premium' 
                : 'bg-card/50 border-border/40 text-foreground/70 hover:border-primary/20 hover:bg-card'}
            `}
          >
            <div className="flex flex-col gap-4">
              <control.icon className={`w-6 h-6 ${control.active ? 'text-primary-foreground' : 'text-primary/40'}`} strokeWidth={1.5} />
              <div className="space-y-1">
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
                className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(212,175,55,0.8)]"
              />
            )}
          </motion.button>
        ))}
      </div>

      <div className="pt-8 border-t border-primary/5 space-y-8">
        <div className="flex flex-col items-center text-center space-y-2 mb-8">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/30">Refinamento de Atmosfera</p>
          <h3 className="text-xl font-display font-light uppercase tracking-widest">Controle de Imersão</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-4 h-4 text-primary/40" />
              <div className="flex-1">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-bold uppercase tracking-widest">Intensidade da Luz</p>
                  <span className="text-[10px] font-mono text-primary/60">{Math.round((settings.atmosphere?.atmosphereIntensity || 0) * 100)}%</span>
                </div>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={settings.atmosphere?.atmosphereIntensity || 0}
              onChange={(e) => updateSettings({ 
                atmosphere: { ...settings.atmosphere, atmosphereIntensity: Number(e.target.value) } 
              })}
              className="w-full h-1 bg-primary/10 rounded-full appearance-none accent-primary cursor-pointer hover:accent-primary/80 transition-all"
            />
            <p className="text-[9px] text-muted-foreground italic leading-relaxed">Ajusta a presença luminosa e o brilho da atmosfera divina.</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <EyeOff className="w-4 h-4 text-primary/40" />
              <div className="flex-1">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-bold uppercase tracking-widest">Profundidade do Blur</p>
                  <span className="text-[10px] font-mono text-primary/60">{Math.round((settings.atmosphere?.blurIntensity || 0) * 100)}%</span>
                </div>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={settings.atmosphere?.blurIntensity || 0}
              onChange={(e) => updateSettings({ 
                atmosphere: { ...settings.atmosphere, blurIntensity: Number(e.target.value) } 
              })}
              className="w-full h-1 bg-primary/10 rounded-full appearance-none accent-primary cursor-pointer hover:accent-primary/80 transition-all"
            />
            <p className="text-[9px] text-muted-foreground italic leading-relaxed">Define o nível de suavização e desfoque das camadas de fundo.</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Layers className="w-4 h-4 text-primary/40" />
              <div className="flex-1">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-bold uppercase tracking-widest">Densidade de Camadas</p>
                  <span className="text-[10px] font-mono text-primary/60">{Math.round((settings.atmosphere?.darkOpacity || 0) * 100)}%</span>
                </div>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={settings.atmosphere?.darkOpacity || 0}
              onChange={(e) => updateSettings({ 
                atmosphere: { ...settings.atmosphere, darkOpacity: Number(e.target.value) } 
              })}
              className="w-full h-1 bg-primary/10 rounded-full appearance-none accent-primary cursor-pointer hover:accent-primary/80 transition-all"
            />
            <p className="text-[9px] text-muted-foreground italic leading-relaxed">Controla a opacidade e o contraste das camadas arquitetônicas.</p>
          </div>
        </div>

        {settings.visualSilence && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-8 mt-8 border-t border-primary/5 space-y-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Sliders className="w-4 h-4 text-primary/40" />
              <div className="flex-1">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-bold uppercase tracking-widest">Opacidade da Interface (Silêncio Visual)</p>
                  <span className="text-[10px] font-mono text-primary/60">{Math.round((settings.atmosphere?.uiOpacity || 0) * 100)}%</span>
                </div>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={0.5}
              step={0.01}
              value={settings.atmosphere?.uiOpacity || 0}
              onChange={(e) => updateSettings({ 
                atmosphere: { ...settings.atmosphere, uiOpacity: Number(e.target.value) } 
              })}
              className="w-full h-1 bg-primary/10 rounded-full appearance-none accent-primary cursor-pointer hover:accent-primary/80 transition-all"
            />
            <p className="text-[9px] text-muted-foreground italic leading-relaxed">Ajusta quão visível a interface permanece durante o Silêncio Visual.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
