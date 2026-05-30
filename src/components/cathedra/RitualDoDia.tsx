import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, CheckCircle2, ArrowRight, Book, Heart, VolumeX, Bell, Download, Settings2, Clock, Map } from 'lucide-react';
import { DAILY_RITUALS } from '@/data/dailyRitual';
import { CathedraButton } from './CathedraButton';
import AudioContentPlayer from './AudioContentPlayer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const RitualDoDia: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [progress, setProgress] = useState(0);
  const [isSilent, setIsSilent] = useState(false);
  const [reminderTime, setReminderTime] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const loadProgress = React.useCallback(async () => {
    if (user) {
      const { data, error } = await supabase
        .from('ritual_progress')
        .select('progress_percent')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      
      if (data) {
        setProgress(data.progress_percent);
      } else {
        setProgress(0);
      }
    } else {
      const savedProgress = localStorage.getItem(`cathedra_daily_progress_${today}`);
      if (savedProgress) {
        setProgress(parseInt(savedProgress));
      } else {
        setProgress(0);
      }
    }
  }, [user, today]);

  useEffect(() => {
    loadProgress();

    if (profile) {
      setIsSilent(!!(profile as any).ritual_silent_mode);
      setReminderTime((profile as any).ritual_reminder_time || "");
    }
  }, [profile, loadProgress]);

  // Real-time sync for ritual progress
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('ritual_progress_sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ritual_progress',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData && newData.date === today) {
            setProgress(newData.progress_percent);
          } else if (payload.eventType === 'DELETE') {
            setProgress(0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, today]);

  const handleProgress = async (val: number) => {
    const newVal = Math.max(progress, val);
    setProgress(newVal);
    
    if (user) {
      const { error } = await supabase
        .from('ritual_progress')
        .upsert({
          user_id: user.id,
          date: today,
          progress_percent: newVal,
          completed: newVal === 100
        }, { onConflict: 'user_id, date' });
      
      if (error) console.error('Error saving progress:', error);
    } else {
      localStorage.setItem(`cathedra_daily_progress_${today}`, newVal.toString());
    }
  };

  const updateSettings = async (silent: boolean, time: string) => {
    if (!user) {
      setIsSilent(silent);
      setReminderTime(time);
      toast.info("Configurações salvas localmente. Entre para sincronizar.");
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        ritual_silent_mode: silent,
        ritual_reminder_time: time
      })
      .eq('id', user.id);

    if (!error) {
      setIsSilent(silent);
      setReminderTime(time);
      refreshProfile();
      toast.success("Configurações atualizadas!");
    } else {
      toast.error("Erro ao salvar configurações.");
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 30;

    // Title
    doc.setFont("times", "bold");
    doc.setFontSize(24);
    doc.text("Ritual do Dia - Cathedra", margin, y);
    y += 15;

    doc.setFontSize(12);
    doc.setFont("times", "italic");
    doc.text(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), margin, y);
    y += 20;

    // 1. Bible
    doc.setFont("times", "bold");
    doc.text("I. Palavra de Deus", margin, y);
    y += 10;
    doc.setFont("times", "italic");
    doc.setFontSize(14);
    const verseLines = doc.splitTextToSize(`"${ritual.verse.text}"`, 170);
    doc.text(verseLines, margin, y);
    y += (verseLines.length * 7) + 5;
    doc.setFontSize(10);
    doc.setFont("times", "bold");
    doc.text(`— ${ritual.verse.ref}`, margin, y);
    y += 20;

    // 2. Reflection
    doc.setFontSize(12);
    doc.text("II. Reflexão", margin, y);
    y += 10;
    doc.setFont("times", "italic");
    doc.setFontSize(13);
    const reflectionLines = doc.splitTextToSize(ritual.reflection, 170);
    doc.text(reflectionLines, margin, y);
    y += (reflectionLines.length * 7) + 20;

    // 3. Catechism
    doc.setFontSize(12);
    doc.setFont("times", "bold");
    doc.text("III. Catecismo", margin, y);
    y += 10;
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    const catechismLines = doc.splitTextToSize(ritual.catechism.text, 170);
    doc.text(catechismLines, margin, y);
    y += (catechismLines.length * 6) + 5;
    doc.setFontSize(10);
    doc.text(`CIC §${ritual.catechism.number}`, margin, y);
    y += 20;

    // 4. Prayer
    doc.setFontSize(12);
    doc.setFont("times", "bold");
    doc.text("IV. Oração Breve", margin, y);
    y += 10;
    doc.setFont("times", "italic");
    doc.setFontSize(16);
    const prayerLines = doc.splitTextToSize(ritual.prayer, 170);
    doc.text(prayerLines, margin, y);

    doc.save(`ritual-do-dia-${today}.pdf`);
    toast.success("PDF gerado com sucesso!");
  };

  const dayOfYear = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now.getTime() - start.getTime()) / 86400000);
  }, []);

  const ritual = DAILY_RITUALS[dayOfYear % DAILY_RITUALS.length] || DAILY_RITUALS[0];

  const audioText = ritual ? `Versículo: ${ritual.verse?.text || ''} (${ritual.verse?.ref || ''}). Reflexão: ${ritual.reflection || ''}. Catecismo: ${ritual.catechism?.text || ''}. Oração: ${ritual.prayer || ''}` : '';

  return (
    <div
      id="ritual-do-dia"
      className={cn(
        "relative overflow-hidden transition-all duration-1000",
        isSilent ? 'font-serif' : ''
      )}
    >
      
      <div className="relative z-10 p-spacing-2xs md:padding-rhythm stack-rhythm-sm max-w-7xl mx-auto pt-spacing-2xs md:pt-0">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-spacing-xs md:gap-spacing-2xl pb-spacing-xs md:pb-spacing-2xl">
          <div className="flex flex-col gap-spacing-xs md:gap-spacing-md">
            <span className="text-[7.5px] md:text-[9px] font-bold uppercase tracking-[0.4em] md:tracking-[0.5em] text-primary/30 leading-none">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <div className="flex items-center gap-spacing-lg md:gap-spacing-xl">
              {progress > 0 && (
                <div className="flex items-center gap-spacing-md md:gap-spacing-md">
                  <div className="h-spacing-2xs w-spacing-4xl md:w-spacing-4xl bg-primary/[0.03] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-primary/20"
                    />
                  </div>
                  <span className="text-[7px] md:text-[8px] font-black text-primary/80 uppercase tracking-[0.5em]">{progress}%</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-spacing-md">
            <CathedraButton 
              variant="ghost" 
              size="sm" 
              className={cn("w-spacing-xl h-spacing-xl p-0 rounded-full transition-colors", isSilent ? 'text-primary' : 'text-primary/60 hover:text-primary')}
              onClick={() => updateSettings(!isSilent, reminderTime)}
            >
              {isSilent ? <VolumeX className="w-spacing-md h-spacing-md" strokeWidth={1.2} /> : <Sparkles className="w-spacing-md h-spacing-md" strokeWidth={1} />}
            </CathedraButton>

            <CathedraButton 
              variant="ghost" 
              size="sm" 
              className="w-spacing-xl h-spacing-xl p-0 rounded-full text-primary/60 hover:text-primary transition-colors"
              onClick={exportPDF}
            >
              <Download className="w-spacing-md h-spacing-md" strokeWidth={1.2} />
            </CathedraButton>
            
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <CathedraButton 
                  variant="ghost" 
                  size="sm" 
                  className="w-spacing-xl h-spacing-xl p-0 rounded-full text-primary/60 hover:text-primary transition-colors"
                >
                  <Settings2 className="w-spacing-md h-spacing-md" strokeWidth={1.2} />
                </CathedraButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] border-primary/5 bg-card/95 backdrop-blur-xl shadow-premium rounded-[2.5rem] dark:border-primary/20">
                <DialogHeader>
                  <DialogTitle className="font-display text-3xl text-primary">Configurações</DialogTitle>
                </DialogHeader>
                <div className="grid gap-spacing-xl py-spacing-xl">
                  <div className="flex items-center justify-between">
                    <div className="space-y-spacing-2xs">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Modo Silencioso</Label>
                      <p className="text-xs text-muted-foreground/40 font-serif italic">Foco absoluto na leitura.</p>
                    </div>
                    <Switch 
                      checked={isSilent} 
                      onCheckedChange={(val) => updateSettings(val, reminderTime)}
                    />
                  </div>
                  <div className="space-y-spacing-md">
                    <div className="flex items-center gap-spacing-sm">
                      <Clock className="w-spacing-md h-spacing-md text-primary/40" />
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Lembrete</Label>
                    </div>
                    <div className="flex gap-spacing-sm">
                      <Input 
                        type="time" 
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="font-mono text-sm border-primary/10 bg-background/50 rounded-full h-spacing-2xl px-spacing-lg focus:ring-1 focus:ring-primary/20"
                      />
                      <CathedraButton 
                        onClick={() => updateSettings(isSilent, reminderTime)}
                        variant="primary"
                        size="sm"
                        className="h-spacing-2xl px-spacing-xl"
                      >
                        Salvar
                      </CathedraButton>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 gap-spacing-md md:gap-spacing-2xl lg:gap-spacing-3xl">
          
          {/* 1. Bible Reading */}
          <section className="space-y-spacing-xs md:space-y-spacing-md max-w-spacing-4xl mx-auto text-center" aria-labelledby="lectio-heading">
            <h4 id="lectio-heading" className="text-[6.5px] md:text-[10px] font-bold uppercase tracking-[0.4em] md:tracking-[0.6em] text-primary/15 md:text-primary/60">I. Lectio</h4>
            <button 
              className={cn(
                "w-full text-center group transition-all duration-1000 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-8 rounded-premium outline-none",
                progress >= 25 ? 'opacity-30 grayscale scale-[0.98]' : 'opacity-100'
              )}
              onClick={() => handleProgress(25)}
              aria-label={`Ler versículo: ${ritual?.verse?.text}. Clique para marcar como lido.`}
            >
              <blockquote className="text-[16px] md:text-4xl lg:text-5xl font-serif italic leading-[1.3] text-primary/80 dark:text-foreground/90 selection:bg-primary/5 tracking-tight px-spacing-md md:px-spacing-xs transition-all duration-[2000ms] group-hover:text-primary">
                "{ritual?.verse?.text || ''}"
              </blockquote>
              <p className="mt-spacing-md md:mt-spacing-lg text-[7.5px] md:text-[10px] font-bold text-primary/20 uppercase tracking-[0.4em]">
                — {ritual?.verse?.ref || ''}
              </p>
            </button>
          </section>

          {/* 2. Reflection */}
          <section className="space-y-spacing-xs md:space-y-spacing-lg max-w-spacing-3xl mx-auto text-center" aria-labelledby="meditatio-heading">
            <h4 id="meditatio-heading" className="text-[6.5px] md:text-[10px] font-bold uppercase tracking-[0.4em] text-primary/10 md:text-primary/60">II. Meditatio</h4>
            <button 
              className={cn(
                "w-full text-center group transition-all duration-1000 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-8 rounded-premium outline-none",
                progress >= 50 ? 'opacity-30 scale-[0.98]' : 'opacity-100'
              )}
              onClick={() => handleProgress(50)}
              aria-label={`Reflexão do dia. Clique para marcar como lido.`}
            >
              <p className="text-[14px] md:text-2xl lg:text-3xl leading-relaxed text-foreground/80 dark:text-foreground/85 font-serif italic selection:bg-primary/5 px-spacing-md transition-colors duration-[2000ms]">
                {ritual.reflection}
              </p>
            </button>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-md md:gap-spacing-2xl lg:gap-spacing-3xl items-stretch">
            {/* 3. Catechism */}
            <section className="space-y-spacing-sm md:space-y-spacing-xl text-center p-spacing-sm md:p-spacing-xl lg:p-spacing-3xl bg-transparent border-none rounded-[1.5rem] lg:rounded-[5rem] transition-all duration-1000 hover:bg-primary/[0.005]" aria-labelledby="traditio-heading">
              <h4 id="traditio-heading" className="text-[6.5px] md:text-[10px] font-bold uppercase tracking-[0.4em] text-primary/10 md:text-primary/60">III. Traditio</h4>
              <button 
                className={cn(
                  "w-full text-center group transition-all duration-1000 h-full flex flex-col justify-center focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-8 rounded-premium outline-none",
                  progress >= 75 ? 'opacity-30' : 'opacity-100'
                )}
                onClick={() => handleProgress(75)}
                aria-label={`Trecho do Catecismo. Clique para marcar como lido.`}
              >
                <p className="text-[12px] md:text-xl lg:text-2xl leading-relaxed text-foreground/70 font-serif tracking-tight selection:bg-primary/5 px-spacing-xs">
                  {ritual?.catechism?.text || ''}
                </p>
                <p className="mt-spacing-xl md:mt-spacing-xl text-[8px] md:text-[9px] font-bold text-primary/40 uppercase tracking-[0.6em]">
                  §{ritual?.catechism?.number || ''}
                </p>
              </button>
            </section>

            {/* 4. Prayer */}
            <section className="space-y-spacing-sm md:space-y-spacing-xl text-center p-spacing-sm md:p-spacing-xl lg:p-spacing-3xl bg-transparent border-none rounded-[1.5rem] lg:rounded-[5rem] transition-all duration-1000 hover:bg-primary/[0.005]" aria-labelledby="oratio-heading">
              <h4 id="oratio-heading" className="text-[6.5px] md:text-[9px] font-bold uppercase tracking-[0.4em] text-primary/10 md:text-primary/60">IV. Oratio</h4>
              <button 
                className={cn(
                  "w-full text-center group transition-all duration-1000 px-spacing-xs md:px-spacing-md h-full flex flex-col justify-center focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-8 rounded-premium outline-none",
                  progress >= 100 ? 'opacity-30' : 'opacity-100'
                )}
                onClick={() => handleProgress(100)}
                aria-label={`Oração do dia. Clique para marcar como concluída.`}
              >
                <p className="text-[16px] md:text-3xl lg:text-4xl leading-tight text-primary/80 font-serif italic selection:bg-primary/5">
                  {ritual?.prayer || ''}
                </p>
              </button>
            </section>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-spacing-xl flex flex-col sm:flex-row items-center justify-between gap-spacing-lg border-t border-primary/[0.01]">
          <AudioContentPlayer
            text={audioText}
            title="Ouvir Ritual Completo"
            variant="ghost"
            className="text-primary/40 hover:text-primary transition-colors"
          />
          
          <div className="flex gap-spacing-lg">
            {progress > 0 && (
              <CathedraButton 
                variant="ghost" 
                size="sm"
                className="text-[10px] font-bold uppercase tracking-[0.5em] text-muted-foreground/60 hover:text-primary transition-all"
                onClick={() => {
                  setProgress(0);
                  if (user) {
                    supabase.from('ritual_progress').delete().eq('user_id', user.id).eq('date', today).then(() => {
                      toast.info("Ritual reiniciado.");
                    });
                  } else {
                    localStorage.removeItem(`cathedra_daily_progress_${today}`);
                  }
                }}
              >
                Reiniciar
              </CathedraButton>
            )}
            {progress < 100 && (
              <CathedraButton 
                variant="primary"
                size="md"
                className="px-spacing-2xl"
                onClick={() => {
                  const sections = [25, 50, 75, 100];
                  const nextProgress = sections.find(s => s > progress) || 100;
                  handleProgress(nextProgress);
                }}
              >
                {progress === 0 ? 'Iniciar' : 'Continuar'}
                <ArrowRight className="ml-spacing-sm w-spacing-md h-spacing-md" />
              </CathedraButton>
            )}
            {progress === 100 && (
              <div className="flex items-center gap-spacing-sm text-primary/60 font-bold uppercase tracking-[0.5em] text-[10px] px-spacing-xl py-spacing-md bg-primary/[0.01] rounded-full border border-primary/5 shadow-sm">
                <CheckCircle2 className="w-spacing-md h-spacing-md" />
                Concluído
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MemoizedRitualDoDia = React.memo(RitualDoDia);
export default MemoizedRitualDoDia;