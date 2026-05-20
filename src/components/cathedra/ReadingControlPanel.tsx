import React from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

const ReadingControlPanel: React.FC = () => {
  const { settings, updateSettings } = useReadingSettings();

  const themes = [
    { id: 'paper', label: 'Papel', color: 'bg-[#F8F5EE] border-[#E8E2D2]' },
    { id: 'sepia', label: 'Sépia', color: 'bg-[#E1D7C1] border-[#C5B89C]' },
    { id: 'dark', label: 'Escuro', color: 'bg-[#0F172A] border-[#1E293B]' },
    { id: 'night', label: 'Noite', color: 'bg-black border-zinc-800' },
  ];

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="rounded-full flex items-center gap-2">
            <Icons.Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Configurações</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 p-4 space-y-4" align="end">
          <DropdownMenuLabel className="px-0 pt-0 text-premium-tiny font-black uppercase tracking-widest">Aparência do Texto</DropdownMenuLabel>
          
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Temas</p>
            <div className="grid grid-cols-4 gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => updateSettings({ theme: t.id as any })}
                  className={`w-full aspect-square rounded-full border-2 ${t.color} ${
                    settings.theme === t.id ? 'ring-2 ring-primary ring-offset-2' : ''
                  }`}
                  title={t.label}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Tamanho da Fonte</p>
            <div className="flex bg-muted rounded-full p-1">
              {(['small', 'medium', 'large', 'extra-large'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => updateSettings({ fontSize: s })}
                  className={`flex-1 py-1 text-xs font-bold rounded-full transition-all ${
                    settings.fontSize === s ? 'bg-background shadow-soft' : 'text-muted-foreground'
                  }`}
                >
                  {s === 'small' ? 'A' : s === 'medium' ? 'A+' : s === 'large' ? 'A++' : 'A+++'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Tipografia</p>
            <div className="flex bg-muted rounded-full p-1">
              <button
                onClick={() => updateSettings({ fontFamily: 'serif' })}
                className={`flex-1 py-1 text-xs font-bold rounded-full transition-all ${
                  settings.fontFamily === 'serif' ? 'bg-background shadow-soft' : 'text-muted-foreground'
                }`}
              >
                Serifada
              </button>
              <button
                onClick={() => updateSettings({ fontFamily: 'sans' })}
                className={`flex-1 py-1 text-xs font-bold rounded-full transition-all ${
                  settings.fontFamily === 'sans' ? 'bg-background shadow-soft' : 'text-muted-foreground'
                }`}
              >
                Sem Serifa
              </button>
            </div>
          </div>

          <DropdownMenuSeparator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-bold">Silêncio Visual</p>
                <p className="text-[10px] text-muted-foreground">Oculta distrações laterais</p>
              </div>
              <input
                type="checkbox"
                checked={settings.visualSilence}
                onChange={(e) => updateSettings({ visualSilence: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-bold">Reduzir Animações</p>
                <p className="text-[10px] text-muted-foreground">Movimento mais calmo</p>
              </div>
              <input
                type="checkbox"
                checked={settings.reduceAnimations}
                onChange={(e) => updateSettings({ reduceAnimations: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ReadingControlPanel;
