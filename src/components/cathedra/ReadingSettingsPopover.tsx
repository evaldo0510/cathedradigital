import React, { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface ReadingSettingsPopoverProps {
  children?: React.ReactNode;
  triggerClassName?: string;
}

const ReadingSettingsPopover: React.FC<ReadingSettingsPopoverProps> = ({
  children,
  triggerClassName
}) => {
  const { settings, updateSettings } = useReadingSettings();
  const [open, setOpen] = useState(false);

  const themes = [
    { id: 'paper', label: 'Claro', color: 'bg-[#FEFDFB]', text: 'text-stone-900' },
    { id: 'sepia', label: 'Pergaminho', color: 'bg-[#E8E2D2]', text: 'text-stone-800' },
    { id: 'dark', label: 'Escuro', color: 'bg-[#1A1C1E]', text: 'text-stone-200' },
    { id: 'night', label: 'Noite', color: 'bg-[#000000]', text: 'text-stone-100' },
  ] as const;

  const fontSizes = [
    { id: 'small', label: 'A', className: 'text-xs' },
    { id: 'medium', label: 'A', className: 'text-sm' },
    { id: 'large', label: 'A', className: 'text-lg' },
    { id: 'extra-large', label: 'A', className: 'text-xl' },
  ] as const;

  const lineSpacings = [
    { id: 'tight', icon: Icons.AlignLeft, label: 'Compacto' },
    { id: 'normal', icon: Icons.AlignCenter, label: 'Normal' },
    { id: 'wide', icon: Icons.AlignJustify, label: 'Amplo' },
  ] as const;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            size="icon"
            className={cn("rounded-premium-full", triggerClassName)}
            title="Configurações de Leitura"
            aria-label="Configurações de Leitura"
            aria-expanded={open}
          >
            <Icons.Type className="w-spacing-md h-spacing-md text-primary/40" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        data-testid="reading-settings-popover"
        className="w-[min(20rem,calc(100vw-1.5rem))] max-w-sm p-spacing-lg bg-background/80 backdrop-blur-3xl border-primary/10 shadow-premium rounded-premium-lg z-[100]"
        align="end"
        sideOffset={8}
        collisionPadding={12}
      >
        <div className="space-y-spacing-xl">
          <div
            data-testid="reading-settings-header"
            className="flex items-center justify-between gap-spacing-sm flex-wrap"
          >
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/30">Aparência</h4>
            <div className="flex items-center gap-spacing-xs">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateSettings({ immersiveMode: !settings.immersiveMode })}
                className={cn("text-[9px] uppercase tracking-tighter h-7 px-2 rounded-full whitespace-nowrap", settings.immersiveMode && "bg-primary/10 text-primary")}
              >
                Modo Imersivo
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Fechar configurações"
                title="Fechar"
                className="h-7 w-7 rounded-full text-primary/50 hover:text-primary hover:bg-primary/5"
              >
                <Icons.X className="w-4 h-4" />
              </Button>
            </div>
          </div>


          {/* Temas */}
          <div className="grid grid-cols-4 gap-spacing-sm">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => updateSettings({ theme: t.id })}
                className={cn(
                  "group flex flex-col items-center gap-spacing-xs p-1 rounded-premium transition-all border-2",
                  settings.theme === t.id ? "border-primary/20 scale-105" : "border-transparent hover:border-primary/5"
                )}
              >
                <div className={cn("w-full aspect-square rounded-full shadow-inner border border-black/5", t.color)} />
                <span className="text-[8px] font-medium uppercase tracking-tighter opacity-40 group-hover:opacity-100">{t.label}</span>
              </button>
            ))}
          </div>

          <Separator className="bg-primary/5" />

          {/* Tamanho da Fonte */}
          <div className="space-y-spacing-md">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/30">Tamanho do Texto</h4>
            <div className="flex bg-primary/[0.03] p-1 rounded-premium-full border border-primary/5">
              {fontSizes.map((f) => (
                <button
                  key={f.id}
                  onClick={() => updateSettings({ fontSize: f.id })}
                  className={cn(
                    "flex-1 py-spacing-xs rounded-premium-full transition-all text-center",
                    settings.fontSize === f.id ? "bg-background text-primary shadow-premium-sm" : "text-primary/30 hover:text-primary/60"
                  )}
                >
                  <span className={cn("font-serif font-bold", f.className)}>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Contraste e Acessibilidade */}
          <div className="space-y-spacing-md">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/30">Acessibilidade</h4>
            <div className="flex gap-spacing-sm">
              {[
                { id: 'normal', label: 'Normal', icon: Icons.Circle },
                { id: 'soft', label: 'Suave', icon: Icons.Droplets },
                { id: 'high', label: 'Alto Contraste', icon: Icons.Contrast },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => updateSettings({ contrast: c.id as any })}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-spacing-xs p-spacing-sm rounded-premium transition-all border",
                    settings.contrast === c.id ? "bg-primary/5 border-primary/20 shadow-inner" : "border-primary/5 hover:bg-primary/[0.02]"
                  )}
                  title={c.label}
                >
                  <c.icon className={cn("w-spacing-md h-spacing-md", settings.contrast === c.id ? "text-primary" : "text-primary/20")} />
                  <span className="text-[8px] font-bold uppercase tracking-tighter opacity-60">{c.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Espaçamento */}
          <div className="space-y-spacing-md">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/30">Espaçamento</h4>
            <div className="flex gap-spacing-sm">
              {lineSpacings.map((s) => (
                <button
                  key={s.id}
                  onClick={() => updateSettings({ lineSpacing: s.id })}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-spacing-xs p-spacing-sm rounded-premium transition-all border",
                    settings.lineSpacing === s.id ? "bg-primary/5 border-primary/20 shadow-inner" : "border-primary/5 hover:bg-primary/[0.02]"
                  )}
                >
                  <s.icon className={cn("w-spacing-md h-spacing-md", settings.lineSpacing === s.id ? "text-primary" : "text-primary/20")} />
                  <span className="text-[8px] font-bold uppercase tracking-tighter opacity-60">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          
          <div className="pt-spacing-sm">
            <button 
              onClick={() => updateSettings({ fontFamily: settings.fontFamily === 'serif' ? 'sans' : 'serif' })}
              className="w-full flex items-center justify-between p-spacing-md rounded-premium bg-primary/[0.02] border border-primary/5 hover:bg-primary/[0.04] transition-all group"
            >
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary/40">Tipografia</span>
                <span className="text-premium-xs font-serif italic text-primary/70">{settings.fontFamily === 'serif' ? 'Serifada (Clássica)' : 'Sem Serifa (Moderna)'}</span>
              </div>
              <Icons.Shuffle className="w-spacing-sm h-spacing-sm text-primary/20 group-hover:text-primary transition-colors" />
            </button>
          </div>

          <Separator className="bg-primary/5" />

          <div className="pt-spacing-xs">
            <div className="flex items-center justify-between p-spacing-sm">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">Recursos</span>
                <span className="text-premium-xs font-serif italic text-primary/70">Margens de Estudo</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => updateSettings({ showStudyMarginalia: !settings.showStudyMarginalia })}
                className={cn(
                  "h-7 px-3 rounded-full text-[9px] uppercase tracking-tighter border border-primary/5 transition-all",
                  settings.showStudyMarginalia ? "bg-primary/10 text-primary border-primary/20" : "text-primary/40"
                )}
              >
                {settings.showStudyMarginalia ? 'Ativo' : 'Inativo'}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ReadingSettingsPopover;
