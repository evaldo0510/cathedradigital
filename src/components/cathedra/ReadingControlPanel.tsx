import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Icons } from '@/constants';
import { Highlighter, FileText } from 'lucide-react';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { useReadingMarks } from '@/hooks/useReadingMarks';
import { toast } from 'sonner';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

const ReadingControlPanel: React.FC = () => {
  const { settings, updateSettings } = useReadingSettings();
  const { marks } = useReadingMarks();
  const navigate = useNavigate();
  const [includeNotes, setIncludeNotes] = useState(true);

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
        <DropdownMenuContent className="w-80 p-6 space-y-8 rounded-[2rem] shadow-premium-hover border-border/40" align="end">
          <div className="text-center space-y-1">
            <DropdownMenuLabel className="px-0 pt-0 text-premium-tiny font-black uppercase tracking-[0.2em] text-primary">Sanctuarium Scriptis</DropdownMenuLabel>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest italic">Ajustes de Leitura</p>
          </div>
          
          <div className="space-y-4">
            <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground/60 px-1">Temas Atmosféricos</p>
            <div className="grid grid-cols-4 gap-4">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => updateSettings({ theme: t.id as any })}
                  className={`w-full aspect-square rounded-full border-2 transition-all duration-300 ${t.color} ${
                    settings.theme === t.id ? 'ring-4 ring-primary/20 ring-offset-2 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  title={t.label}
                >
                   {settings.theme === t.id && <Icons.Check className={`w-4 h-4 mx-auto ${t.id === 'dark' || t.id === 'night' ? 'text-white' : 'text-primary'}`} />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground/60 px-1">Escala Tipográfica</p>
            <div className="flex bg-muted/50 rounded-full p-1.5 gap-1">
              {(['small', 'medium', 'large', 'extra-large'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => updateSettings({ fontSize: s })}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
                    settings.fontSize === s ? 'bg-background text-primary shadow-soft scale-105' : 'text-muted-foreground/60 hover:text-primary hover:bg-background/40'
                  }`}
                >
                  {s === 'small' ? 'A' : s === 'medium' ? 'A+' : s === 'large' ? 'A++' : 'A+++'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground/60 px-1">Estilo & Ritmo</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateSettings({ fontFamily: 'serif' })}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all font-serif ${
                  settings.fontFamily === 'serif' ? 'bg-primary/5 border-primary/30 text-primary shadow-soft' : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <Icons.Feather className="w-4 h-4" /> Serifada
              </button>
              <button
                onClick={() => updateSettings({ fontFamily: 'sans' })}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all ${
                  settings.fontFamily === 'sans' ? 'bg-primary/5 border-primary/30 text-primary shadow-soft' : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <Icons.Type className="w-4 h-4" /> Sem Serifa
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-1">Espaçamento de Linha</p>
                <div className="flex bg-muted/50 rounded-full p-1 gap-1">
                  {(['tight', 'normal', 'wide'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => updateSettings({ lineSpacing: l })}
                      className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full transition-all ${
                        settings.lineSpacing === l ? 'bg-background text-primary shadow-soft' : 'text-muted-foreground/60 hover:text-primary'
                      }`}
                    >
                      {l === 'tight' ? 'Snug' : l === 'normal' ? 'Std' : 'Wide'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-1">Espaçamento de Letra</p>
                <div className="flex bg-muted/50 rounded-full p-1 gap-1">
                  {(['tight', 'normal', 'wide'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => updateSettings({ letterSpacing: l })}
                      className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full transition-all ${
                        settings.letterSpacing === l ? 'bg-background text-primary shadow-soft' : 'text-muted-foreground/60 hover:text-primary'
                      }`}
                    >
                      {l === 'tight' ? 'Tight' : l === 'normal' ? 'Std' : 'Wide'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-1">Espaçamento Lateral</p>
                <div className="flex bg-muted/50 rounded-full p-1 gap-1">
                  {(['standard', 'comfortable', 'wide'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => updateSettings({ sideMargins: m })}
                      className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full transition-all ${
                        settings.sideMargins === m ? 'bg-background text-primary shadow-soft' : 'text-muted-foreground/60 hover:text-primary'
                      }`}
                    >
                      {m === 'standard' ? 'Std' : m === 'comfortable' ? 'Médio' : 'Largo'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-1">Contraste</p>
                <div className="flex bg-muted/50 rounded-full p-1 gap-1">
                  {(['soft', 'normal', 'high'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => updateSettings({ contrast: c })}
                      className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full transition-all ${
                        settings.contrast === c ? 'bg-background text-primary shadow-soft' : 'text-muted-foreground/60 hover:text-primary'
                      }`}
                    >
                      {c === 'soft' ? 'Suave' : c === 'normal' ? 'Padrão' : 'Alto'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DropdownMenuSeparator className="bg-border/20" />

          <div className="space-y-4">
            <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground/60 px-1">Lembretes & Hábito</p>
            <div className="p-4 rounded-3xl bg-muted/20 border border-border/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold">Lembrete Diário</p>
                  <p className="text-[10px] text-muted-foreground italic">Constância espiritual</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reminders?.enabled}
                  onChange={(e) => updateSettings({ reminders: { ...settings.reminders, enabled: e.target.checked } })}
                  className="w-4 h-4 rounded-full border-primary/20 text-primary focus:ring-primary cursor-pointer"
                />
              </div>
              
              {settings.reminders?.enabled && (
                <div className="flex items-center justify-between pt-2 border-t border-border/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Horário</p>
                  <input 
                    type="time" 
                    value={settings.reminders.time}
                    onChange={(e) => updateSettings({ reminders: { ...settings.reminders, time: e.target.value } })}
                    className="bg-transparent text-xs font-bold text-primary border-none focus:ring-0 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground/60 px-1">Ambiente & Silêncio</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-transparent hover:border-border/20 transition-all">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold">Silêncio Visual</p>
                  <p className="text-[10px] text-muted-foreground italic">Reduz poluição visual</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.visualSilence}
                  onChange={(e) => updateSettings({ visualSilence: e.target.checked })}
                  className="w-4 h-4 rounded-full border-primary/20 text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-transparent hover:border-border/20 transition-all">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold">Modo Contemplativo</p>
                  <p className="text-[10px] text-muted-foreground italic">Cores mais quentes e suaves</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.contemplativeMode}
                  onChange={(e) => updateSettings({ contemplativeMode: e.target.checked })}
                  className="w-4 h-4 rounded-full border-primary/20 text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-transparent hover:border-border/20 transition-all">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold">Modo de Leitura Focada</p>
                  <p className="text-[10px] text-muted-foreground italic">Esconde menus e distrações</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.fullScreen}
                  onChange={(e) => updateSettings({ fullScreen: e.target.checked })}
                  className="w-4 h-4 rounded-full border-primary/20 text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-transparent hover:border-border/20 transition-all">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold">Reduzir Animações</p>
                  <p className="text-[10px] text-muted-foreground italic">Para uma navegação instantânea</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reduceAnimations}
                  onChange={(e) => updateSettings({ reduceAnimations: e.target.checked })}
                  className="w-4 h-4 rounded-full border-primary/20 text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-transparent hover:border-border/20 transition-all">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold">Silêncio Total</p>
                  <p className="text-[10px] text-muted-foreground italic">Oculta inclusive loaders/skeletons e desativa todos os áudios</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.totalSilence}
                  onChange={(e) => updateSettings({ totalSilence: e.target.checked })}
                  className="w-4 h-4 rounded-full border-primary/20 text-primary focus:ring-primary cursor-pointer"
                />
              </div>


              <div className="pt-2 space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Checkbox 
                    id="include-notes" 
                    checked={includeNotes} 
                    onCheckedChange={(checked) => setIncludeNotes(!!checked)}
                    className="rounded-full"
                  />
                  <label htmlFor="include-notes" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer">
                    Incluir minhas anotações
                  </label>
                </div>
                <Button 
                  onClick={() => {
                    if (includeNotes) {
                      document.body.classList.add('print-with-notes');
                    } else {
                      document.body.classList.remove('print-with-notes');
                    }
                    window.print();
                  }}
                  variant="outline"
                  className="w-full rounded-2xl flex items-center justify-center gap-2 py-6 border-dashed border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <Icons.Printer className="w-4 h-4" />
                  <div className="text-left">
                    <p className="text-xs font-bold">Imprimir ou PDF</p>
                    <p className="text-[10px] text-muted-foreground">Layout premium otimizado</p>
                  </div>
                </Button>
              </div>
            </div>
          </div>
          
            <div className="space-y-4">
              <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground/60 px-1">Logos IA & Memória</p>
              <div className="p-4 rounded-3xl bg-muted/20 border border-border/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">Sugestões Contextuais</p>
                    <p className="text-[10px] text-muted-foreground italic">Exibição de prompts</p>
                  </div>
                  <select
                    value={settings.logosSuggestions}
                    onChange={(e) => updateSettings({ logosSuggestions: e.target.value as any })}
                    className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-primary border-none focus:ring-0 cursor-pointer text-right"
                  >
                    <option value="always">Sempre</option>
                    <option value="first_selection">1ª Vez</option>
                    <option value="never">Nunca</option>
                  </select>
                </div>
                
                <Button 
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('reset-logos-history'));
                    toast.success("Histórico da seção limpo");
                  }}
                  variant="ghost"
                  className="w-full rounded-2xl flex items-center justify-center gap-2 py-4 border border-dashed border-primary/10 hover:border-primary/30 hover:bg-primary/5 transition-all"
                >
                  <Icons.RotateCcw className="w-3 h-3 text-primary/40" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Limpar Seção Atual</span>
                </Button>
              </div>
            </div>

            <div className="space-y-4">
            <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground/60 px-1">Conexões Relatio</p>
            <div className="p-4 rounded-3xl bg-muted/20 border border-border/10 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold">Ativar Relatio</p>
                <input
                  type="checkbox"
                  checked={settings.relatio?.enabled}
                  onChange={(e) => updateSettings({ relatio: { ...settings.relatio, enabled: e.target.checked } })}
                  className="w-4 h-4 rounded-full border-primary/20 text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              {settings.relatio?.enabled && (
                <div className="space-y-4 pt-2 border-t border-border/5">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-1">Intensidade</p>
                    <div className="flex bg-muted/50 rounded-full p-1 gap-1">
                      {(['subtle', 'standard', 'deep'] as const).map((i) => (
                        <button
                          key={i}
                          onClick={() => updateSettings({ relatio: { ...settings.relatio, intensity: i } })}
                          className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full transition-all ${
                            settings.relatio.intensity === i ? 'bg-background text-primary shadow-soft' : 'text-muted-foreground/60 hover:text-primary'
                          }`}
                        >
                          {i === 'subtle' ? 'Sutil' : i === 'standard' ? 'Normal' : 'Profunda'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {[
                      { id: 'showBible', label: 'Bíblia' },
                      { id: 'showCatechism', label: 'Catecismo' },
                      { id: 'showMagisterium', label: 'Magistério' },
                      { id: 'showSaints', label: 'Santos' },
                    ].map((source) => (
                      <div key={source.id} className="flex items-center gap-2">
                        <Checkbox 
                          id={`relatio-${source.id}`} 
                          checked={(settings.relatio as any)[source.id]} 
                          onCheckedChange={(checked) => updateSettings({ relatio: { ...settings.relatio, [source.id]: !!checked } })}
                          className="w-3 h-3 rounded-sm"
                        />
                        <label htmlFor={`relatio-${source.id}`} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 cursor-pointer">
                          {source.label}
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/5">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest">Relevância Inteligente</p>
                      <p className="text-[8px] text-muted-foreground italic">Com base no seu progresso e virtudes</p>
                    </div>
                    <Checkbox 
                      id="relatio-relevance"
                      checked={settings.relatio?.relevanceByProgress} 
                      onCheckedChange={(checked) => updateSettings({ relatio: { ...settings.relatio, relevanceByProgress: !!checked } })}
                      className="w-3 h-3 rounded-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DropdownMenuSeparator className="bg-border/20" />

          
          <div className="space-y-4">
            <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground/60 px-1">Comportamento de Retomada</p>
            <div className="flex bg-muted/50 rounded-full p-1 gap-1">
              {(['always', 'confirm', 'once', 'never'] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => updateSettings({ resumeBehavior: b })}
                  className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-full transition-all ${
                    settings.resumeBehavior === b ? 'bg-background text-primary shadow-soft' : 'text-muted-foreground/60 hover:text-primary'
                  }`}
                  title={b === 'always' ? 'Sempre' : b === 'confirm' ? 'Confirmar' : b === 'once' ? 'Uma vez' : 'Nunca'}
                >
                  {b === 'always' ? 'Sim' : b === 'confirm' ? 'Conf' : b === 'once' ? '1x' : 'Não'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground/60 px-1">Personalizar Atalhos</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'highlight', label: 'Destaque', icon: <Highlighter className="w-3 h-3" /> },
                { id: 'note', label: 'Nota', icon: <FileText className="w-3 h-3" /> },
              ].map((s) => (
                <div key={s.id} className="flex flex-col gap-1">
                  <p className="text-[8px] font-bold uppercase text-muted-foreground/40 px-1">{s.label}</p>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-transparent">
                    {s.icon}
                    <input 
                      type="text"
                      maxLength={1}
                      value={settings.shortcuts[s.id as keyof typeof settings.shortcuts]}
                      onChange={(e) => updateSettings({ shortcuts: { ...settings.shortcuts, [s.id]: e.target.value.toLowerCase() } })}
                      className="w-full bg-transparent text-[10px] font-black uppercase text-primary border-none focus:ring-0 p-0 text-center"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DropdownMenuSeparator className="bg-border/20" />
          
          <div className="space-y-4">
            <p className="text-premium-tiny font-black uppercase tracking-widest text-muted-foreground/60 px-1">Marcas de Leitura</p>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {(() => {
                const marksData = JSON.parse(localStorage.getItem('cathedra_reading_marks') || '{}');
                const entries = Object.entries(marksData);
                if (entries.length === 0) return <p className="text-[10px] text-muted-foreground italic text-center py-2">Nenhuma marca recente</p>;
                return entries.map(([key, mark]: [string, any]) => (
                  <button
                    key={key}
                    onClick={() => navigate(mark.url)}
                    className="w-full text-left p-2.5 rounded-xl bg-muted/20 hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <Icons.Bookmark className="w-3 h-3 text-primary/40 group-hover:text-primary transition-colors" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold truncate">{mark.label}</p>
                        <p className="text-[9px] text-muted-foreground">{new Date(mark.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </button>
                ));
              })()}
            </div>
          </div>
        </DropdownMenuContent>

      </DropdownMenu>
    </div>
  );
};

export default ReadingControlPanel;
