import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';

import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { useReadingMarks } from '@/hooks/useReadingMarks';
import { toast } from 'sonner';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

const ReadingControlPanel: React.FC = memo(() => {
  const { settings, updateSettings, resetSettings } = useReadingSettings();
  const navigate = useNavigate();

  const themes = [
    { id: 'paper', label: 'Papel', color: 'bg-[#F8F5EE] border-[#E8E2D2]' },
    { id: 'sepia', label: 'Sépia', color: 'bg-[#E1D7C1] border-[#C5B89C]' },
    { id: 'dark', label: 'Escuro', color: 'bg-[#0F172A] border-[#1E293B]' },
    { id: 'night', label: 'Noite', color: 'bg-black border-zinc-800' },
  ];

  const SettingsContent = () => (
    <div className="space-y-spacing-xl py-spacing-lg">
      <div className="text-center space-y-spacing-xs">
        <p className="text-[8px] text-primary/30 uppercase tracking-[0.5em] font-bold">Atmosphæra</p>
        <h2 className="text-premium-2xl font-display font-light text-primary uppercase tracking-[0.25em] leading-tight">Leitura</h2>
      </div>
      
      <div className="space-y-spacing-md">
        <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground/60 px-spacing-2xs text-center">Tons da Alma</p>
        <div className="grid grid-cols-4 gap-spacing-md">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => updateSettings({ theme: t.id as any })}
              className={`w-full aspect-square rounded-premium-full border-2 transition-all duration-500 ${t.color} ${
                settings.theme === t.id ? 'ring-4 ring-primary/20 ring-offset-4 scale-110' : 'hover:scale-105 opacity-80'
              }`}
              title={t.label}
            >
               {settings.theme === t.id && <Icons.Check className={`w-spacing-md h-spacing-md mx-auto ${t.id === 'dark' || t.id === 'night' ? 'text-white' : 'text-primary'}`} />}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-spacing-md">
        <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground/60 px-spacing-2xs text-center">Escala Tipográfica</p>
        <div className="flex bg-primary/[0.01] rounded-premium-full p-spacing-2xs gap-spacing-2xs">
          {(['small', 'medium', 'large', 'extra-large'] as const).map((s) => (
            <button
              key={s}
              onClick={() => updateSettings({ fontSize: s })}
              className={`flex-1 py-spacing-sm text-premium-xs font-bold rounded-premium transition-all duration-500 ${
                settings.fontSize === s ? 'bg-background text-primary shadow-premium scale-105' : 'text-muted-foreground/40 hover:text-primary'
              }`}
            >
              {s === 'small' ? 'A' : s === 'medium' ? 'A+' : s === 'large' ? 'A++' : 'A+++'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-spacing-lg">
        <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground/60 px-spacing-2xs text-center">Estilo & Ritmo</p>
        <div className="grid grid-cols-2 gap-spacing-sm">
          <button
            onClick={() => updateSettings({ fontFamily: 'serif' })}
            className={`flex items-center justify-center gap-spacing-xs py-spacing-md rounded-premium-full transition-all duration-700 font-serif ${
              settings.fontFamily === 'serif' ? 'bg-primary text-primary-foreground shadow-premium scale-[1.02]' : 'bg-primary/[0.01] text-primary/40 hover:bg-primary/[0.03]'
            }`}
          >
            <Icons.Feather className="w-spacing-md h-spacing-md" /> Serifada
          </button>
          <button
            onClick={() => updateSettings({ fontFamily: 'sans' })}
            className={`flex items-center justify-center gap-spacing-xs py-spacing-md rounded-premium-full transition-all duration-700 ${
              settings.fontFamily === 'sans' ? 'bg-primary text-primary-foreground shadow-premium scale-[1.02]' : 'bg-primary/[0.01] text-primary/40 hover:bg-primary/[0.03]'
            }`}
          >
            <Icons.Type className="w-spacing-md h-spacing-md" /> Sans
          </button>
        </div>
        
        <div className="grid grid-cols-1 gap-spacing-lg">
          <div className="space-y-spacing-sm">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 px-spacing-2xs">Espaçamento Entre Linhas</p>
            <div className="flex bg-muted/20 rounded-premium-full p-spacing-2xs border border-primary/5">
              {(['tight', 'normal', 'wide'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => updateSettings({ lineSpacing: l })}
                  className={`flex-1 py-spacing-xs text-[9px] font-black uppercase tracking-widest rounded-premium-full transition-all duration-500 ${
                    settings.lineSpacing === l ? 'bg-background text-primary shadow-premium-md' : 'text-muted-foreground/40 hover:text-primary'
                  }`}
                >
                  {l === 'tight' ? 'Snug' : l === 'normal' ? 'Std' : 'Wide'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-spacing-md pt-spacing-md border-t border-primary/5">
        <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground/60 px-spacing-2xs text-center">Foco Contemplativo</p>
        <div className="grid grid-cols-1 gap-spacing-xs">
          <div className="flex items-center justify-between p-spacing-md rounded-premium bg-muted/20 border border-transparent hover:border-primary/10 transition-all duration-500">
            <div className="space-y-spacing-3xs">
              <p className="text-premium-xs font-bold">Silêncio Visual</p>
              <p className="text-[10px] text-muted-foreground italic leading-none">Oculta distrações ao rolar</p>
            </div>
            <input
              type="checkbox"
              checked={settings.visualSilence}
              onChange={(e) => updateSettings({ visualSilence: e.target.checked })}
              className="w-spacing-md h-spacing-md rounded-premium-full border-primary/20 text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-spacing-md rounded-premium bg-muted/20 border border-transparent hover:border-primary/10 transition-all duration-500">
            <div className="space-y-spacing-3xs">
              <p className="text-premium-xs font-bold">Modo Contemplativo</p>
              <p className="text-[10px] text-muted-foreground italic leading-none">Tons quentes e suaves</p>
            </div>
            <input
              type="checkbox"
              checked={settings.contemplativeMode}
              onChange={(e) => updateSettings({ contemplativeMode: e.target.checked })}
              className="w-spacing-md h-spacing-md rounded-premium-full border-primary/20 text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-spacing-md rounded-premium bg-muted/20 border border-transparent hover:border-primary/10 transition-all duration-500">
            <div className="space-y-spacing-3xs">
              <p className="text-premium-xs font-bold">Auto-ocultar Interface</p>
              <p className="text-[10px] text-muted-foreground italic leading-none">Mobile: toque para revelar</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoHideUI}
              onChange={(e) => updateSettings({ autoHideUI: e.target.checked })}
              className="w-spacing-md h-spacing-md rounded-premium-full border-primary/20 text-primary focus:ring-primary cursor-pointer"
            />
          </div>
          </div>
          
          <div className="flex items-center justify-between p-spacing-md rounded-premium bg-muted/20 border border-transparent hover:border-primary/10 transition-all duration-500">
            <div className="space-y-spacing-3xs">
              <p className="text-premium-xs font-bold">Modo Imersivo</p>
              <p className="text-[10px] text-muted-foreground italic leading-none">Oculta tudo exceto a Palavra</p>
            </div>
            <input
              type="checkbox"
              checked={settings.immersiveMode}
              onChange={(e) => updateSettings({ immersiveMode: e.target.checked })}
              className="w-spacing-md h-spacing-md rounded-premium-full border-primary/20 text-primary focus:ring-primary cursor-pointer"
            />
          </div>
      </div>

      {/* Largura da Coluna */}
      <div className="space-y-spacing-sm pt-spacing-md border-t border-primary/5">
        <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground/60 px-spacing-2xs text-center">Largura da Coluna</p>
        <div className="px-spacing-xs">
          <input
            type="range"
            min={45}
            max={90}
            step={1}
            value={settings.columnWidth}
            onChange={(e) => updateSettings({ columnWidth: Number(e.target.value) })}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[9px] uppercase tracking-widest text-muted-foreground/60 mt-spacing-xs">
            <span>Estreita</span>
            <span className="text-primary font-bold">{settings.columnWidth}ch</span>
            <span>Larga</span>
          </div>
        </div>
      </div>

      {/* Modo Noturno Agendado */}
      <div className="space-y-spacing-sm pt-spacing-md border-t border-primary/5">
        <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground/60 px-spacing-2xs text-center">Noite Contemplativa</p>
        <div className="flex items-center justify-between p-spacing-md rounded-premium bg-muted/20">
          <div className="space-y-spacing-3xs">
            <p className="text-premium-xs font-bold">Ativar por Horário</p>
            <p className="text-[10px] text-muted-foreground italic leading-none">Transição gradual</p>
          </div>
          <input
            type="checkbox"
            checked={settings.nightSchedule.enabled}
            onChange={(e) => updateSettings({ nightSchedule: { ...settings.nightSchedule, enabled: e.target.checked } })}
            className="w-spacing-md h-spacing-md rounded-premium-full border-primary/20 text-primary focus:ring-primary cursor-pointer"
          />
        </div>
        {settings.nightSchedule.enabled && (
          <div className="grid grid-cols-2 gap-spacing-sm">
            <label className="flex flex-col gap-spacing-2xs">
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60">Início</span>
              <input
                type="time"
                value={settings.nightSchedule.start}
                onChange={(e) => updateSettings({ nightSchedule: { ...settings.nightSchedule, start: e.target.value } })}
                className="bg-muted/30 border border-primary/10 rounded-premium px-spacing-sm py-spacing-xs text-premium-sm"
              />
            </label>
            <label className="flex flex-col gap-spacing-2xs">
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60">Fim</span>
              <input
                type="time"
                value={settings.nightSchedule.end}
                onChange={(e) => updateSettings({ nightSchedule: { ...settings.nightSchedule, end: e.target.value } })}
                className="bg-muted/30 border border-primary/10 rounded-premium px-spacing-sm py-spacing-xs text-premium-sm"
              />
            </label>
          </div>
        )}
      </div>

      <div className="space-y-spacing-md pt-spacing-md">
        <Button 
          onClick={() => window.print()}
          variant="outline"
          className="w-full rounded-premium flex items-center justify-center gap-spacing-sm py-spacing-xl border-dashed border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-700"
        >
          <Icons.Printer className="w-spacing-md h-spacing-md text-primary/40" />
          <div className="text-left">
            <p className="text-premium-xs font-bold uppercase tracking-widest">Gerar PDF Premium</p>
            <p className="text-[10px] text-muted-foreground italic">Otimizado para arquivo</p>
          </div>
        </Button>
        
        <Button 
          onClick={resetSettings}
          variant="ghost"
          className="w-full rounded-premium-full py-spacing-md text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-primary transition-all"
        >
          <Icons.RotateCcw className="w-spacing-sm h-spacing-sm mr-spacing-xs" /> Restaurar Padrões
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Trigger (Drawer/Sheet) */}
      <div className="sm:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-premium-full h-spacing-xl w-spacing-xl text-primary/40 hover:text-primary hover:bg-primary/5 transition-all">
              <Icons.Settings2 className="w-spacing-md h-spacing-md" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-[2.5rem] border-t-primary/10 bg-background/95 backdrop-blur-2xl px-spacing-lg">
            <ScrollArea className="h-full pr-spacing-0">
              <SettingsContent />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Trigger (Dropdown) */}
      <div className="hidden sm:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-premium-full h-spacing-xl px-spacing-md flex items-center gap-spacing-xs border-primary/10 hover:border-primary/30 transition-all bg-card/40 backdrop-blur-md shadow-premium-md">
              <Icons.Settings2 className="w-spacing-sm h-spacing-sm" />
              <span className="text-[10px] font-black uppercase tracking-widest">Estética</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[400px] p-spacing-xl space-y-spacing-xl rounded-[3rem] shadow-premium-hover border-primary/5 bg-background/95 backdrop-blur-2xl" align="end">
            <ScrollArea className="max-h-[70vh] pr-spacing-md">
              <SettingsContent />
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
});

export default ReadingControlPanel;
