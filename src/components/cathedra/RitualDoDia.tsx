import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, CheckCircle2, ArrowRight, Book, Heart, VolumeX, Bell, Download, Settings2, Clock, Map } from 'lucide-react';
import { DAILY_RITUALS } from '@/data/dailyRitual';
import { HomeCard } from './HomeCard';
import { Button } from '@/components/ui/button';
import AudioContentPlayer from './AudioContentPlayer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
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
    <HomeCard
      as={motion.div}
      initial={isSilent ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={isSilent ? { duration: 0 } : { duration: 1.5, ease: [0.2, 0.8, 0.2, 1] }}
      className={`relative overflow-hidden border-border/5 shadow-premium group ${isSilent ? 'font-serif' : ''}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.01] to-transparent pointer-events-none" />
      
      <div className="relative z-10 p-10 md:p-16 lg:p-24 space-y-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 border-b border-border/5 pb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/[0.02] border border-primary/5 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary/20" strokeWidth={1.2} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.6em] text-primary/20">
                ORATIO ET CONTEMPLATIO
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display text-primary tracking-tight leading-tight">
              Ritual do Dia
            </h2>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            <span className="text-xs font-serif italic text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            {progress > 0 && (
              <div className="flex items-center gap-3">
                <div className="h-1 w-20 bg-border/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={isSilent ? { width: `${progress}%` } : { width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={isSilent ? { duration: 0 } : { duration: 0.5 }}
                    className="h-full bg-primary/40"
                  />
                </div>
                <span className="text-[9px] font-bold text-primary/40 uppercase tracking-widest">{progress}% concluído</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className={`w-8 h-8 rounded-full transition-colors ${isSilent ? 'text-primary' : 'text-primary/30 hover:text-primary'}`}
                onClick={() => updateSettings(!isSilent, reminderTime)}
                title={isSilent ? "Desativar Modo Silencioso" : "Ativar Modo Silencioso"}
              >
                {isSilent ? <VolumeX className="w-4 h-4" /> : <Sparkles className="w-4 h-4" strokeWidth={1} />}
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                className="w-8 h-8 rounded-full text-primary/30 hover:text-primary transition-colors"
                onClick={exportPDF}
                title="Baixar PDF"
              >
                <Download className="w-4 h-4" />
              </Button>
              
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8 rounded-full text-primary/30 hover:text-primary transition-colors"
                    title="Configurações"
                  >
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] border-border/10 shadow-premium">
                  <DialogHeader>
                    <DialogTitle className="font-display text-2xl text-primary">Configurações do Ritual</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold uppercase tracking-widest text-primary/60">Modo Silencioso</Label>
                        <p className="text-xs text-muted-foreground font-serif italic">Desativa animações e simplifica a tipografia.</p>
                      </div>
                      <Switch 
                        checked={isSilent} 
                        onCheckedChange={(val) => updateSettings(val, reminderTime)}
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary/40" />
                        <Label className="text-sm font-bold uppercase tracking-widest text-primary/60">Lembrete Diário</Label>
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          type="time" 
                          value={reminderTime}
                          onChange={(e) => setReminderTime(e.target.value)}
                          className="font-mono text-sm border-border/20"
                        />
                        <Button 
                          onClick={() => updateSettings(isSilent, reminderTime)}
                          className="bg-primary/90 hover:bg-primary text-[10px] font-bold uppercase tracking-widest"
                        >
                          Salvar
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-serif italic">Defina o horário para sua prática espiritual diária.</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 gap-16">
          
          {/* 1. Bible Reading */}
          <section className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-primary/30" strokeWidth={1.5} />
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/10">I. Lectio Divina</span>
            </div>
            <div 
              className={`group cursor-pointer transition-all duration-1000 ${progress >= 25 ? 'opacity-30 grayscale' : 'opacity-100'} ${isSilent ? 'hover:opacity-80' : ''}`}
              onClick={() => handleProgress(25)}
            >
              <blockquote className="text-3xl md:text-4xl lg:text-5xl font-serif italic leading-relaxed text-primary/80 selection:bg-primary/5">
                "{ritual?.verse?.text || ''}"
              </blockquote>
              <p className="mt-6 text-[10px] font-black text-primary/20 uppercase tracking-[0.4em]">
                — {ritual?.verse?.ref || ''}
              </p>

            </div>
          </section>

          {/* 2. Reflection */}
          <section className="space-y-6 max-w-2xl ml-auto text-right">
            <div className="flex items-center gap-3 justify-end">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/30">II. Reflexão</span>
              <Sparkles className="w-4 h-4 text-primary/30" strokeWidth={1.5} />
            </div>
            <div 
              className={`group cursor-pointer transition-all duration-1000 ${progress >= 50 ? 'opacity-30' : 'opacity-100'} ${isSilent ? 'hover:opacity-80' : ''}`}
              onClick={() => handleProgress(50)}
            >
              <p className="text-xl md:text-2xl lg:text-3xl leading-relaxed text-foreground/60 font-serif italic selection:bg-primary/5">
                {ritual.reflection}
              </p>
            </div>
          </section>

          {/* 3. Catechism */}
          <section className="space-y-8 max-w-2xl border-l border-border/5 pl-12 py-4">
            <div className="flex items-center gap-3">
              <Book className="w-4 h-4 text-primary/10" strokeWidth={1.2} />
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/10">III. Traditio Sancta</span>
            </div>
            <div 
              className={`group cursor-pointer transition-all duration-1000 ${progress >= 75 ? 'opacity-30' : 'opacity-100'} ${isSilent ? 'hover:opacity-80' : ''}`}
              onClick={() => handleProgress(75)}
            >
              <p className="text-lg md:text-xl leading-relaxed text-foreground/50 font-serif tracking-tight selection:bg-primary/5">
                {ritual?.catechism?.text || ''}
              </p>
              <p className="mt-4 text-[9px] font-black text-primary/20 uppercase tracking-[0.4em]">
                Catechismus §{ritual?.catechism?.number || ''}
              </p>

            </div>
          </section>

          {/* 4. Prayer */}
          <section className="space-y-12 max-w-3xl mx-auto text-center py-20 bg-primary/[0.005] rounded-[3rem] border border-primary/[0.02]">
            <div className="flex flex-col items-center gap-6">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/10 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.8em] text-primary/20">IV. Oratio</span>
            </div>
            <div 
              className={`group cursor-pointer transition-all duration-1000 px-12 ${progress >= 100 ? 'opacity-30' : 'opacity-100'} ${isSilent ? 'hover:opacity-80' : ''}`}
              onClick={() => handleProgress(100)}
            >
              <p className="text-3xl md:text-4xl lg:text-5xl leading-tight text-primary/70 font-serif italic selection:bg-primary/5">
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
          
          <div className="flex gap-4">
            {progress > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-primary transition-all"
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
                Recomeçar
              </Button>
            )}
            {progress < 100 && (
              <Button 
                className="rounded-full bg-primary/90 hover:bg-primary text-white px-8 h-12 text-[10px] font-bold uppercase tracking-[0.2em] shadow-premium hover:shadow-premium-hover transition-all"
                onClick={() => {
                  const sections = [25, 50, 75, 100];
                  const nextProgress = sections.find(s => s > progress) || 100;
                  handleProgress(nextProgress);
                }}
              >
                {progress === 0 ? 'Iniciar Ritual' : 'Próximo Passo'}
                <ArrowRight className="ml-2 w-3 h-3" />
              </Button>
            )}
            {progress === 100 && (
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px] px-6 py-3 bg-primary/5 rounded-full">
                <CheckCircle2 className="w-4 h-4" />
                Concluído por hoje
              </div>
            )}
          </div>
        </div>
      </div>
    </HomeCard>
  );
};

export default RitualDoDia;
