import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Compass, Calendar as CalendarIcon, 
  Sparkles, CheckCircle2, Circle, Flame, 
  ChevronRight, ArrowLeft, History, Star, Download, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppRoute } from '@/types';
import { HomeCard as Card } from './HomeCard';
import { Button } from './Button';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { PROFILES, ProfileId } from './SpiritualQuiz';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SEOHead from '@/components/SEOHead';
import { BADGE_DEFINITIONS } from '@/lib/badges';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

const SpiritualProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trailHistory, setTrailHistory] = useState<any[]>([]);
  const [quizData, setQuizData] = useState<any>(null);
  const [activeJourneys, setActiveJourneys] = useState<any[]>([]);
  const [reflections, setReflections] = useState<any[]>([]);
  const [month, setMonth] = useState<Date>(new Date());
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch trail history for the current month
        const start = startOfMonth(month).toISOString();
        const end = endOfMonth(month).toISOString();
        
        const [trailRes, quizRes, journeysRes, reflectionsRes] = await Promise.all([
          supabase
            .from('trail_progress')
            .select('completed_at, step_index, trail_id')
            .eq('user_id', user.id)
            .gte('completed_at', start)
            .lte('completed_at', end),
          supabase
            .from('user_sensitive_data')
            .select('diagnosis_result')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('journey_progress')
            .select('journey_id, completed_at')
            .eq('user_id', user.id),
          supabase
            .from('user_notes')
            .select('*')
            .eq('user_id', user.id)
            .eq('content_type', 'quiz_deepening')
            .order('created_at', { ascending: false })
        ]);

        if (trailRes.data) setTrailHistory(trailRes.data);
        if (quizRes.data) setQuizData(quizRes.data.diagnosis_result);
        if (reflectionsRes.data) setReflections(reflectionsRes.data);

        if (journeysRes.data) {
          const journeyIds = [...new Set(journeysRes.data.map(j => j.journey_id))];
          const { data: journeyDetails } = await supabase
            .from('journeys')
            .select('id, title')
            .in('id', journeyIds);
            
          if (journeyDetails) {
            setActiveJourneys(journeyDetails.map(jd => ({
              ...jd,
              completedAt: journeysRes.data.find(j => j.journey_id === jd.id)?.completed_at
            })));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, month]);

  const completedDays = useMemo(() => {
    const days = new Set<string>();
    trailHistory.forEach(t => {
      days.add(format(new Date(t.completed_at), 'yyyy-MM-dd'));
    });
    return Array.from(days).map(d => new Date(d));
  }, [trailHistory]);

  const quizProfile = quizData?.spiritual_profile as ProfileId | undefined;
  const p = quizProfile ? PROFILES[quizProfile] : null;

  const earnedBadges = useMemo(() => new Set(profile?.badges || []), [profile?.badges]);

  const handleExport = async () => {
    if (!user || !profile) return;
    setExporting(true);
    try {
      const doc = new jsPDF();
      const timestamp = format(new Date(), 'dd/MM/yyyy HH:mm');
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(43, 64, 46); // Primary color approx
      doc.text('Relatório de Progresso Espiritual', 20, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Cathedra Digital - Gerado em ${timestamp}`, 20, 28);
      
      // User Info
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Peregrino:', 20, 45);
      doc.setFontSize(12);
      doc.text(`${profile.name} (${user.email})`, 60, 45);
      
      doc.setFontSize(14);
      doc.text('Perfil Espiritual:', 20, 55);
      doc.setFontSize(12);
      doc.text(p?.title || 'Não definido', 60, 55);

      // Stats
      doc.setFontSize(14);
      doc.text('Estatísticas:', 20, 70);
      autoTable(doc, {
        startY: 75,
        head: [['Métrica', 'Valor']],
        body: [
          ['Streak Atual', `${profile.streak || 0} dias`],
          ['XP Total', `${profile.xp || 0}`],
          ['Minutos em Oração/Estudo', `${(profile as any).total_minutes_read || 0} min`],
          ['Passos da Trilha (Mês)', `${completedDays.length}`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [43, 64, 46] }
      });

      // Reflections
      if (reflections.length > 0) {
        doc.addPage();
        doc.setFontSize(18);
        doc.text('Reflexões Profundas', 20, 20);
        
        let y = 35;
        reflections.forEach((ref, index) => {
          if (y > 250) {
            doc.addPage();
            y = 20;
          }
          
          doc.setFontSize(10);
          doc.setTextColor(150);
          doc.text(format(new Date(ref.created_at), 'dd/MM/yyyy'), 20, y);
          
          doc.setFontSize(11);
          doc.setTextColor(50);
          const questionText = doc.splitTextToSize(`Questão: ${ref.content_id}`, 170);
          doc.text(questionText, 20, y + 7);
          
          doc.setFontSize(12);
          doc.setTextColor(0);
          doc.setFont('helvetica', 'italic');
          const reflectionText = doc.splitTextToSize(`"${ref.note_text}"`, 170);
          doc.text(reflectionText, 20, y + 15 + (questionText.length * 5));
          
          y += 30 + (questionText.length * 5) + (reflectionText.length * 5);
        });
      }

      doc.save(`progresso-espiritual-${profile.name}.pdf`);
      toast.success('Relatório exportado com sucesso!');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Erro ao gerar PDF.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="app-container py-12 md:py-24 space-y-16">
      <SEOHead title="Progresso Espiritual" description="Acompanhe sua jornada de fé e autoconhecimento." path="/progresso" />
      
      <header className="space-y-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-primary/40 hover:text-primary gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <div className="text-center space-y-4">
          <div className="premium-tag mx-auto">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span>Itinerarium Mentis</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-primary tracking-tight">Sua Jornada</h1>
          <p className="text-lg text-primary/60 italic font-serif">"Aquele que começou em vós esta boa obra, há de completá-la."</p>
          <div className="flex justify-center pt-4">
            <Button 
              onClick={handleExport} 
              disabled={exporting}
              className="rounded-full gap-2 bg-primary/5 text-primary border border-primary/10 hover:bg-primary hover:text-primary-foreground transition-all"
            >
              {exporting ? 'Gerando...' : <><Download className="w-4 h-4" /> Exportar Resumo em PDF</>}
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Section */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quiz Status */}
          <Card padding="lg" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                  <Compass className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary">Diagnóstico Espiritual</h3>
                  <p className="text-xs text-primary/40 uppercase tracking-widest">
                    {p ? 'Completado' : 'Em andamento'}
                  </p>
                </div>
              </div>
              {p ? (
                <div className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Perfil: {p.title}
                </div>
              ) : (
                <Button size="sm" onClick={() => navigate(AppRoute.DIAGNOSTICO)}>
                  Continuar <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              )}
            </div>
            
            {p && (
              <div className="space-y-4 pt-4 border-t border-primary/5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-primary/60">Trilha Diária Sugerida</span>
                  <span className="text-primary/30 uppercase tracking-widest text-[10px]">{p.journeyName}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {p.steps.slice(0, 2).map((step, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-primary/[0.02] border border-primary/5">
                      <step.icon className="w-4 h-4 text-primary/40" />
                      <span className="text-xs font-medium text-primary/70">{step.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Activity Calendar */}
          <Card padding="lg" className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary">Calendário de Purificação</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Concluído</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary/5 border border-primary/10" />
                  <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Pendente</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
              <Calendar
                mode="multiple"
                selected={completedDays}
                onMonthChange={setMonth}
                month={month}
                className="rounded-[2rem] border border-primary/5 bg-primary/[0.01] p-6"
                classNames={{
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-full",
                }}
              />
              
              <div className="space-y-6 text-center md:text-left">
                <div className="space-y-1">
                  <p className="text-4xl font-black text-primary">{completedDays.length}</p>
                  <p className="text-xs font-bold text-primary/30 uppercase tracking-widest">Dias ativos este mês</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Flame className="w-5 h-5 text-secondary fill-current" />
                    <p className="text-4xl font-black text-secondary">{profile?.streak || 0}</p>
                  </div>
                  <p className="text-xs font-bold text-secondary/40 uppercase tracking-widest">Dias consecutivos (Streak)</p>
                </div>
                <Button variant="outline" className="w-full rounded-full" onClick={() => navigate(AppRoute.HOJE)}>
                  Ver Trilha de Hoje
                </Button>
              </div>
            </div>
          </Card>

          {/* History */}
          <Card padding="lg" className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                <History className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-primary">Histórico de Jornadas</h3>
            </div>
            
            <div className="space-y-4">
              {activeJourneys.length > 0 ? activeJourneys.map((j) => (
                <div key={j.id} className="flex items-center justify-between p-4 rounded-2xl bg-primary/[0.01] border border-primary/5 group hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary/40 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">{j.title}</p>
                      <p className="text-[10px] text-primary/30 uppercase tracking-widest">
                        {j.completedAt ? `Concluída em ${format(new Date(j.completedAt), 'dd/MM/yy')}` : 'Em andamento'}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0" onClick={() => navigate(`/jornadas/${j.id}`)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )) : (
                <div className="text-center py-8 opacity-20">
                  <p className="italic font-serif">Nenhuma jornada iniciada ainda.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar Section */}
        <div className="space-y-8">
          {/* Achievements Snippet */}
          <Card padding="lg" className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary">Badges</h3>
              </div>
              <span className="text-[10px] font-black text-primary/30 uppercase tracking-widest">
                {earnedBadges.size} / {BADGE_DEFINITIONS.length}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {BADGE_DEFINITIONS.slice(0, 9).map((b) => {
                const isEarned = earnedBadges.has(b.id);
                return (
                  <div 
                    key={b.id} 
                    className={`aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      isEarned 
                        ? 'bg-primary/5 border-primary/20 shadow-soft scale-105' 
                        : 'bg-muted/10 border-border/50 opacity-40 grayscale'
                    }`}
                    title={b.name}
                  >
                    <span className="text-xl">{b.icon}</span>
                  </div>
                );
              })}
            </div>
            
            <Button variant="outline" className="w-full rounded-full gap-2" onClick={() => navigate(AppRoute.ACHIEVEMENTS)}>
              Ver Todas <ChevronRight className="w-4 h-4" />
            </Button>
          </Card>

          {/* Stats Snippet */}
          <Card padding="lg" className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary/40">Estatísticas Totais</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-xl font-black text-primary">{profile?.streak || 0}</p>
                  <p className="text-[10px] font-bold text-primary/30 uppercase tracking-widest">Dias de Streak</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xl font-black text-primary">{profile?.xp || 0}</p>
                  <p className="text-[10px] font-bold text-primary/30 uppercase tracking-widest">XP Acumulado</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SpiritualProgressPage;
