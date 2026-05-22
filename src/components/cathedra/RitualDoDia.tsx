import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, CheckCircle2, ArrowRight, Book, Heart, VolumeX, Bell, Download, Settings2, Clock, Map } from 'lucide-react';
import { DAILY_RITUALS } from '@/data/dailyRitual';
import { Button } from '@/components/ui/button';
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

  useEffect(() => {
    const loadProgress = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('ritual_progress')
          .select('progress_percent')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();
        
        if (data) {
          setProgress(data.progress_percent);
        }
      } else {
        const savedProgress = localStorage.getItem(`cathedra_daily_progress_${today}`);
        if (savedProgress) {
          setProgress(parseInt(savedProgress));
        }
      }
    };

    if (profile) {
      setIsSilent(!!(profile as any).ritual_silent_mode);
      setReminderTime((profile as any).ritual_reminder_time || "");
    }

    loadProgress();
  }, [today, user, profile]);

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
      className={cn(
        "relative overflow-hidden border-border/5 bg-card/5 backdrop-blur-md rounded-[3rem] shadow-premium transition-all duration-1000",
        isSilent ? 'font-serif' : ''
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.01] to-transparent pointer-events-none" />
      
      <div className="relative z-10 p-12 md:p-20 lg:p-32 space-y-24">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 border-b border-border/5 pb-20">
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary/20">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <div className="flex items-center gap-6">
              {progress > 0 && (
                <div className="flex items-center gap-4">
                  <div className="h-1 w-24 bg-border/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-primary/20"
                    />
                  </div>
                  <span className="text-[9px] font-bold text-primary/30 uppercase tracking-[0.4em]">{progress}%</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("w-10 h-10 rounded-full transition-colors", isSilent ? 'text-primary' : 'text-primary/20 hover:text-primary')}
              onClick={() => updateSettings(!isSilent, reminderTime)}
            >
              {isSilent ? <VolumeX className="w-5 h-5" /> : <Sparkles className="w-5 h-5" strokeWidth={0.5} />}
            </Button>

            <Button 
              variant="ghost" 
              size="icon" 
              className="w-10 h-10 rounded-full text-primary/20 hover:text-primary transition-colors"
              onClick={exportPDF}
            >
              <Download className="w-5 h-5" />
            </Button>
            
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-10 h-10 rounded-full text-primary/20 hover:text-primary transition-colors"
                >
                  <Settings2 className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] border-border/5 bg-card/95 backdrop-blur-xl shadow-premium rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle className="font-display text-3xl text-primary">Configurações</DialogTitle>
                </DialogHeader>
                <div className="grid gap-8 py-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Modo Silencioso</Label>
                      <p className="text-xs text-muted-foreground/40 font-serif italic">Foco absoluto na leitura.</p>
                    </div>
                    <Switch 
                      checked={isSilent} 
                      onCheckedChange={(val) => updateSettings(val, reminderTime)}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-primary/40" />
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Lembrete</Label>
                    </div>
                    <div className="flex gap-3">
                      <Input 
                        type="time" 
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="font-mono text-sm border-border/10 bg-background/50 rounded-full h-12 px-6"
                      />
                      <Button 
                        onClick={() => updateSettings(isSilent, reminderTime)}
                        className="bg-primary/90 hover:bg-primary text-[10px] font-bold uppercase tracking-widest rounded-full h-12 px-8"
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 gap-24">
          
          {/* 1. Bible Reading */}
          <section className="space-y-10 max-w-3xl mx-auto text-center">
            <span className="text-[9px] font-bold uppercase tracking-[0.6em] text-primary/10">I. Lectio</span>
            <div 
              className={cn(
                "group cursor-pointer transition-all duration-1000",
                progress >= 25 ? 'opacity-20 grayscale' : 'opacity-100'
              )}
              onClick={() => handleProgress(25)}
            >
              <blockquote className="text-4xl md:text-5xl lg:text-6xl font-serif italic leading-[1.3] text-primary/80 selection:bg-primary/5">
                "{ritual?.verse?.text || ''}"
              </blockquote>
              <p className="mt-8 text-[10px] font-bold text-primary/20 uppercase tracking-[0.5em]">
                — {ritual?.verse?.ref || ''}
              </p>
            </div>
          </section>

          {/* 2. Reflection */}
          <section className="space-y-10 max-w-2xl mx-auto text-center">
            <span className="text-[9px] font-bold uppercase tracking-[0.6em] text-primary/10">II. Meditatio</span>
            <div 
              className={cn(
                "group cursor-pointer transition-all duration-1000",
                progress >= 50 ? 'opacity-20' : 'opacity-100'
              )}
              onClick={() => handleProgress(50)}
            >
              <p className="text-2xl md:text-3xl leading-relaxed text-foreground/40 font-serif italic selection:bg-primary/5">
                {ritual.reflection}
              </p>
            </div>
          </section>

          {/* 3. Catechism */}
          <section className="space-y-10 max-w-2xl mx-auto text-center">
            <span className="text-[9px] font-bold uppercase tracking-[0.6em] text-primary/10">III. Traditio</span>
            <div 
              className={cn(
                "group cursor-pointer transition-all duration-1000",
                progress >= 75 ? 'opacity-20' : 'opacity-100'
              )}
              onClick={() => handleProgress(75)}
            >
              <p className="text-xl md:text-2xl leading-relaxed text-foreground/30 font-serif tracking-tight selection:bg-primary/5">
                {ritual?.catechism?.text || ''}
              </p>
              <p className="mt-6 text-[9px] font-bold text-primary/10 uppercase tracking-[0.5em]">
                §{ritual?.catechism?.number || ''}
              </p>
            </div>
          </section>

          {/* 4. Prayer */}
          <section className="space-y-12 max-w-3xl mx-auto text-center py-24 bg-primary/[0.01] rounded-[4rem] border border-primary/[0.05]">
            <span className="text-[9px] font-bold uppercase tracking-[1em] text-primary/20">IV. Oratio</span>
            <div 
              className={cn(
                "group cursor-pointer transition-all duration-1000 px-16",
                progress >= 100 ? 'opacity-20' : 'opacity-100'
              )}
              onClick={() => handleProgress(100)}
            >
              <p className="text-4xl md:text-5xl lg:text-6xl leading-tight text-primary/60 font-serif italic selection:bg-primary/5">
                {ritual?.prayer || ''}
              </p>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-8 border-t border-border/10">
          <AudioContentPlayer
            text={audioText}
            title="Ouvir Ritual Completo"
            variant="ghost"
            className="text-primary/40 hover:text-primary transition-colors"
          />
          
          <div className="flex gap-6">
            {progress > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                className="text-[10px] font-bold uppercase tracking-[0.5em] text-muted-foreground/20 hover:text-primary transition-all"
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
              </Button>
            )}
            {progress < 100 && (
              <Button 
                className="rounded-full bg-primary/90 hover:bg-primary text-white px-10 h-14 text-[10px] font-bold uppercase tracking-[0.3em] shadow-premium hover:shadow-premium-hover transition-all"
                onClick={() => {
                  const sections = [25, 50, 75, 100];
                  const nextProgress = sections.find(s => s > progress) || 100;
                  handleProgress(nextProgress);
                }}
              >
                {progress === 0 ? 'Iniciar' : 'Continuar'}
                <ArrowRight className="ml-3 w-4 h-4" />
              </Button>
            )}
            {progress === 100 && (
              <div className="flex items-center gap-3 text-primary/40 font-bold uppercase tracking-[0.5em] text-[10px] px-8 py-4 bg-primary/[0.02] rounded-full border border-primary/5">
                <CheckCircle2 className="w-4 h-4" />
                Concluído
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RitualDoDia;
