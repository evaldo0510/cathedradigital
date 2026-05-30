import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Icons } from '@/constants';
import { ChevronRight, ArrowLeft, Check, Lock, Clock, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

const ItinerariumDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [itinerarium, setItinerarium] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadData();
  }, [id, user]);

  const loadData = async () => {
    setLoading(true);
    const [itRes, stepsRes] = await Promise.all([
      supabase.from('itineraria').select('*').eq('id', id!).single(),
      supabase.from('itineraria_steps').select('*').eq('itinerarium_id', id!).order('step_order', { ascending: true })
    ]);

    if (itRes.data) setItinerarium(itRes.data);
    if (stepsRes.data) setSteps(stepsRes.data);

    if (user && id) {
      const { data: progress } = await supabase
        .from('itineraria_progress')
        .select('step_id, reflection')
        .eq('user_id', user.id)
        .eq('itinerarium_id', id);
      
      if (progress) {
        setCompletedSteps(new Set(progress.map(p => p.step_id)));
        const reflectionsMap: Record<string, string> = {};
        progress.forEach(p => {
          if (p.reflection) reflectionsMap[p.step_id] = p.reflection;
        });
        setReflections(reflectionsMap);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user || !id) return;

    const channel = supabase
      .channel('itinerarium_detail_sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'itineraria_progress',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newData = payload.new as any;
          if (payload.eventType === 'INSERT') {
            if (newData?.step_id) {
              setCompletedSteps(prev => new Set([...Array.from(prev), newData.step_id]));
              if (newData.reflection) {
                setReflections(prev => ({ ...prev, [newData.step_id]: newData.reflection }));
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            if (newData?.step_id && newData.reflection) {
              setReflections(prev => ({ ...prev, [newData.step_id]: newData.reflection }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, id]);

  const exportFullPDF = () => {
    if (!itinerarium || !steps.length) return;
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(26);
    doc.setTextColor(41, 128, 185);
    doc.text(itinerarium.title, 20, 30);
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    const splitDesc = doc.splitTextToSize(itinerarium.description, 170);
    doc.text(splitDesc, 20, 45);
    
    doc.setFontSize(12);
    doc.text(`Progresso: ${Math.round((completedSteps.size / steps.length) * 100)}%`, 20, 70);
    
    // Reflections Table
    const tableData = steps.map((step, idx) => [
      `Passo ${step.step_order}: ${step.title}`,
      completedSteps.has(step.id) ? 'Concluído' : 'Pendente',
      reflections[step.id] || '-'
    ]);

    autoTable(doc, {
      startY: 80,
      head: [['Passo', 'Status', 'Minhas Reflexões']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { font: 'helvetica', fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30 },
        2: { cellWidth: 100 }
      }
    });
    
    doc.save(`jornada-${itinerarium.title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    toast.success("PDF da trilha gerado com sucesso!");
  };

  if (loading || !itinerarium) return <div className="p-spacing-4xl text-center">Carregando jornada...</div>;

  const progress = (completedSteps.size / steps.length) * 100;

  return (
    <div className="max-w-spacing-2xl mx-auto py-spacing-2xl md:py-spacing-4xl space-y-spacing-3xl">
      <motion.div 
        initial={{ opacity: 0, x: -10 }} 
        animate={{ opacity: 1, x: 0 }}
      >
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/itineraria')} 
          className="group gap-spacing-xs text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-spacing-sm h-spacing-sm group-hover:-translate-x-0.5 transition-transform" /> Voltar para Trilhas
        </Button>
      </motion.div>

      <div className="space-y-spacing-lg">
        <div className="flex items-center justify-between gap-spacing-md flex-wrap">
          <div className="flex items-center gap-spacing-sm">
            <div className="w-spacing-2xs h-spacing-lg bg-primary/20 rounded-full" />
            <h1 className="text-4xl md:text-5xl font-display font-bold text-primary tracking-tight">{itinerarium.title}</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-spacing-xs border-primary/10 text-[10px] font-black uppercase tracking-widest"
            onClick={exportFullPDF}
          >
            <FileDown className="w-spacing-md h-spacing-md" /> Exportar Reflexões
          </Button>
        </div>
        <p className="text-lg md:text-xl text-muted-foreground/80 font-serif italic leading-relaxed">{itinerarium.description}</p>
      </div>

      <Card className="premium-card bg-primary/[0.01] border-primary/5 rounded-[2.5rem] shadow-none overflow-hidden relative">
        <div className="absolute top-0 right-0 p-spacing-xl opacity-[0.03]">
          <Icons.Compass className="w-spacing-4xl h-spacing-4xl text-primary" />
        </div>
        <CardContent className="p-spacing-xl md:p-spacing-xl space-y-spacing-lg relative z-10">
          <div className="flex justify-between items-end">
            <div className="space-y-spacing-2xs">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Progresso Atual</p>
              <h4 className="text-2xl font-bold font-serif">{Math.round(progress)}% Concluído</h4>
            </div>
            <span className="text-sm font-bold text-primary/60">{completedSteps.size} de {steps.length} passos</span>
          </div>
          <Progress value={progress} className="h-spacing-2xs bg-primary/5" />
        </CardContent>
      </Card>

      <div className="space-y-spacing-lg">
        <div className="flex items-center gap-spacing-sm mb-spacing-xl">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Caminho de Contemplação</span>
          <div className="flex-1 h-px bg-primary/5" />
        </div>
        
        {steps.map((step, idx) => {
          const isCompleted = completedSteps.has(step.id);
          const isLocked = !isCompleted && idx > 0 && !completedSteps.has(steps[idx-1].id);

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card 
                className={`premium-card transition-all duration-700 border-primary/5 rounded-[2rem] shadow-none group ${
                  isLocked ? 'opacity-30 grayscale pointer-events-none' : 'hover:border-primary/20 hover:bg-primary/[0.01]'
                } ${isCompleted ? 'bg-primary/[0.02]' : ''}`}
              >
                <CardContent className="p-spacing-lg md:p-spacing-xl flex items-center justify-between gap-spacing-lg">
                  <div className="flex items-center gap-spacing-lg flex-1 min-w-0">
                    <div className={`w-spacing-2xl h-spacing-2xl rounded-premium flex-shrink-0 flex items-center justify-center transition-all duration-700 ${
                      isCompleted 
                        ? 'bg-primary text-primary-foreground shadow-premium' 
                        : 'bg-primary/5 text-primary/40 border border-primary/10'
                    }`}>
                      {isCompleted ? <Check className="w-spacing-md h-spacing-md" /> : <span className="text-sm font-bold">{idx + 1}</span>}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-spacing-xs mb-spacing-2xs">
                        <h3 className="text-lg md:text-xl font-bold font-serif text-foreground truncate">{step.title}</h3>
                        {!step.is_free && <Icons.Lock className="w-spacing-sm h-spacing-sm text-primary/60" />}
                      </div>
                      <div className="flex items-center gap-spacing-sm text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                        <span className="flex items-center gap-spacing-2xs"><Clock className="w-spacing-sm h-spacing-sm" /> {step.duration_minutes} MIN</span>
                        <div className="w-spacing-2xs h-spacing-2xs rounded-full bg-border" />
                        <span>{step.step_type}</span>
                      </div>
                    </div>
                  </div>

                  {!isLocked && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate(`/itineraria/${id}/step?step=${step.id}`)}
                      className="group/btn h-spacing-2xl px-spacing-lg rounded-full border border-primary/5 hover:bg-primary hover:text-primary-foreground transition-all duration-500 text-[10px] font-black uppercase tracking-widest"
                    >
                      {isCompleted ? 'Revisitar' : 'Iniciar'}
                      <ChevronRight className="w-spacing-md h-spacing-md ml-spacing-2xs group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ItinerariumDetailPage;