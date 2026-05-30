import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Book, 
  Cross, 
  Scroll, 
  History, 
  ChevronRight, 
  Trash2, 
  Edit3, 
  Download,
  Calendar,
  Filter,
  ArrowRight,
  Bookmark,
  Zap,
  Target,
  CheckCircle2
} from 'lucide-react';
import { useReadingMarks, ReadingMark } from '@/hooks/useReadingMarks';
import { useNotes, UserNote } from '@/hooks/useNotes';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import SEOHead from '@/components/SEOHead';

const ReadingJournal: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { marks, deleteMark } = useReadingMarks();
  const { notes, deleteNote, updateNote } = useNotes('all'); // All notes
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('history');
  
  const weeklyGoal = profile?.weekly_goal || 5;
  const streak = profile?.streak || 0;
  
  // Calculate this week's progress (mock for now or derive from marks/notes)
  const daysActiveThisWeek = useMemo(() => {
    // Simple logic: unique days in history/notes this week
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);

    const markDates = marks.map(m => new Date(m.updated_at).toISOString().split('T')[0]);
    const noteDates = notes.map(n => new Date(n.created_at).toISOString().split('T')[0]);
    const allDates = [...new Set([...markDates, ...noteDates])];
    
    return allDates.filter(d => new Date(d) >= startOfWeek).length;
  }, [marks, notes]);
  
  const filteredMarks = useMemo(() => {
    return marks.filter(m => 
      m.label?.toLowerCase().includes(search.toLowerCase()) ||
      m.content_type.toLowerCase().includes(search.toLowerCase())
    );
  }, [marks, search]);

  const filteredNotes = useMemo(() => {
    return notes.filter(n => 
      n.note_text.toLowerCase().includes(search.toLowerCase()) ||
      n.content_type.toLowerCase().includes(search.toLowerCase())
    );
  }, [notes, search]);

  const exportPDF = () => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(22);
    doc.text("Meu Diário Espiritual - Cathedra", 20, y);
    y += 15;

    doc.setFontSize(12);
    doc.text(`Exportado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, y);
    y += 20;

    notes.forEach((note, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`${note.content_type.toUpperCase()} - ${new Date(note.created_at).toLocaleDateString()}`, 20, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(note.note_text, 170);
      doc.text(lines, 20, y);
      y += (lines.length * 6) + 10;
    });

    doc.save("cathedra-diario-espiritual.pdf");
    toast.success("PDF gerado com sucesso!");
  };

  return (
    <div className="max-w-spacing-4xl mx-auto py-spacing-2xl px-spacing-md space-y-spacing-xl min-h-screen pb-spacing-4xl">
      <SEOHead title="Diário & Histórico | Cathedra" description="Gerencie suas marcas de leitura, histórico e anotações espirituais." path="/diario" />
      
      <div className="text-center space-y-spacing-md">
        <div className="inline-flex items-center gap-spacing-xs px-spacing-sm py-spacing-2xs bg-primary/10 rounded-premium-full text-primary text-[10px] font-black uppercase tracking-widest">
          <History className="w-spacing-sm h-spacing-sm" /> Memória da Alma
      </div>

      {/* Streak and Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-lg max-w-spacing-2xl mx-auto w-full">
        <Card className="bg-primary/[0.03] border-primary/10 rounded-[3rem] overflow-hidden shadow-premium-md group hover:bg-primary/[0.05] transition-all">
          <CardContent className="p-spacing-xl flex flex-col items-center text-center gap-spacing-md">
            <div className="w-spacing-3xl h-spacing-3xl rounded-premium-full bg-primary/10 flex items-center justify-center relative">
              <Zap className="w-spacing-xl h-spacing-xl text-primary group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 rounded-premium-full border border-primary/20 animate-ping opacity-20" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 mb-spacing-xs">Sequência de Graça</p>
              <h3 className="text-premium-5xl font-display text-primary">{streak}</h3>
              <p className="text-premium-xs font-bold text-primary/60 mt-spacing-2xs uppercase tracking-widest">{streak === 1 ? 'Dia' : 'Dias'} Consecutivos</p>
            </div>
            <div className="pt-spacing-md border-t border-primary/5 w-full">
              <p className="text-[9px] font-black uppercase tracking-widest text-primary/60">Recorde: {profile?.max_streak || streak} dias</p>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-1">
          <Card className="bg-secondary/[0.02] border-secondary/10 rounded-[4rem] overflow-hidden shadow-premium-md group hover:bg-secondary/[0.04] transition-all duration-1000">
            <CardContent className="p-spacing-2xl flex flex-col items-center gap-spacing-xl">
              <div className="w-spacing-4xl h-spacing-4xl rounded-premium-full bg-secondary/5 flex items-center justify-center relative">
                <Target className={`w-spacing-2xl h-spacing-2xl text-secondary/60 group-hover:rotate-12 transition-transform duration-700 ${daysActiveThisWeek >= weeklyGoal ? 'animate-bounce' : ''}`} />
                {daysActiveThisWeek >= weeklyGoal && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-spacing-xs -right-spacing-xs bg-secondary text-white p-spacing-xs rounded-premium-full shadow-premium"
                  >
                    <CheckCircle2 className="w-spacing-md h-spacing-md" />
                  </motion.div>
                )}
              </div>
              <div className="w-full text-center space-y-spacing-md">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-secondary/30">Meta da Semana</p>
                <h3 className="text-premium-6xl font-display text-secondary leading-none">{daysActiveThisWeek} <span className="text-premium-2xl opacity-20">/ {weeklyGoal}</span></h3>
                <p className="text-premium-sm font-serif italic text-secondary/60">Dias em contemplação</p>
              </div>
              <div className="w-full space-y-spacing-md">
                <div className="h-spacing-xs w-full bg-secondary/5 rounded-premium-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (daysActiveThisWeek / weeklyGoal) * 100)}%` }}
                    transition={{ duration: 1.5, ease: [0.2, 0.8, 0.2, 1] }}
                    className="h-full bg-secondary/40 rounded-premium-full shadow-premium"
                  />
                </div>
                
                {/* Histórico Semanal Detalhado */}
                <div className="pt-spacing-lg flex justify-between px-spacing-xs">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => {
                    const today = new Date();
                    const dayDate = new Date(today.setDate(today.getDate() - today.getDay() + i));
                    const dateStr = dayDate.toISOString().split('T')[0];
                    const isActive = [...marks, ...notes].some(item => 
                      new Date(item.created_at || (item as any).updated_at).toISOString().split('T')[0] === dateStr
                    );
                    const isToday = i === new Date().getDay();
                    
                    return (
                      <div key={i} className="flex flex-col items-center gap-spacing-sm">
                        <span className={`text-[8px] font-black uppercase tracking-widest ${isToday ? 'text-secondary' : 'text-secondary/20'}`}>{day}</span>
                        <div className={`w-spacing-xl h-spacing-xl rounded-premium-full border flex items-center justify-center transition-all duration-700 ${
                          isActive 
                            ? 'bg-secondary/20 border-secondary/20 text-secondary' 
                            : 'bg-transparent border-secondary/5 text-secondary/10'
                        } ${isToday ? 'ring-2 ring-secondary/20 ring-offset-2' : ''}`}>
                          {isActive && <CheckCircle2 className="w-spacing-sm h-spacing-sm" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-secondary/20 text-center pt-spacing-md">
                  {daysActiveThisWeek >= weeklyGoal ? 'Propósito cumprido!' : `Siga firme por mais ${weeklyGoal - daysActiveThisWeek} dias.`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
        <h1 className="text-premium-4xl md:text-premium-5xl font-display text-primary">Diário de Jornada</h1>
        <p className="text-muted-foreground font-serif italic">"Guarda o que viste, para que não se apague do teu coração."</p>
      </div>

      <div className="relative group max-w-spacing-xl mx-auto">
        <Search className="absolute left-spacing-md top-spacing-2xs/2 -translate-y-1/2 w-spacing-md h-spacing-md text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input 
          placeholder="Pesquisar em marcas e anotações..." 
          className="h-spacing-2xl pl-spacing-2xl rounded-premium-full bg-card border-border/40 focus:ring-primary/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs defaultValue="history" className="w-full" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-spacing-md mb-spacing-xl">
          <TabsList className="bg-muted/50 p-spacing-2xs rounded-premium-full">
            <TabsTrigger value="history" className="rounded-premium-full px-spacing-lg py-spacing-xs text-premium-xs font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
              Histórico
            </TabsTrigger>
            <TabsTrigger value="notes" className="rounded-premium-full px-spacing-lg py-spacing-xs text-premium-xs font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
              Anotações
            </TabsTrigger>
          </TabsList>
          
          {activeTab === 'notes' && notes.length > 0 && (
            <Button onClick={exportPDF} variant="outline" size="sm" className="rounded-premium-full gap-spacing-xs text-premium-xs uppercase tracking-widest font-bold border-primary/20 hover:bg-primary/5">
              <Download className="w-spacing-md h-spacing-md" /> PDF
            </Button>
          )}
        </div>

        <TabsContent value="history" className="space-y-spacing-md">
          {filteredMarks.length === 0 ? (
            <div className="text-center py-spacing-3xl bg-muted/20 rounded-[2rem] border-2 border-dashed border-border/40">
              <History className="w-spacing-2xl h-spacing-2xl text-muted-foreground/60 mx-auto mb-spacing-md" />
              <p className="text-muted-foreground font-serif italic">Nenhuma marca de leitura encontrada.</p>
            </div>
          ) : (
            filteredMarks.map((mark) => (
              <Card key={mark.id} className="group overflow-hidden hover:border-primary/30 transition-all border-border/40 bg-card/60 backdrop-blur-sm rounded-premium shadow-premium-md hover:shadow-premium">
                <CardContent className="p-spacing-md sm:p-spacing-lg flex items-center justify-between gap-spacing-md">
                  <div className="flex items-center gap-spacing-md min-w-spacing-0">
                    <div className={`w-spacing-xl h-spacing-xl rounded-premium-full flex items-center justify-center shrink-0 ${
                      mark.content_type === 'bible' ? 'bg-blue-500/10 text-blue-600' :
                      mark.content_type === 'catechism' ? 'bg-amber-500/10 text-amber-600' :
                      'bg-emerald-500/10 text-emerald-600'
                    }`}>
                      {mark.content_type === 'bible' ? <Book className="w-spacing-md h-spacing-md" /> :
                       mark.content_type === 'catechism' ? <Cross className="w-spacing-md h-spacing-md" /> :
                       <Scroll className="w-spacing-md h-spacing-md" />}
                    </div>
                    <div className="min-w-spacing-0">
                      <div className="flex items-center gap-spacing-xs mb-spacing-3xs">
                        <h3 className="font-bold text-foreground truncate">{mark.label}</h3>
                        {mark.is_last_read && <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[8px] h-spacing-md">ÚLTIMO PONTO</Badge>}
                      </div>
                      <div className="flex items-center gap-spacing-xs text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                         <Calendar className="w-spacing-sm h-spacing-sm" /> {new Date(mark.updated_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-spacing-xs">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-premium-full text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      onClick={() => deleteMark(mark.id)}
                    >
                      <Trash2 className="w-spacing-md h-spacing-md" />
                    </Button>
                    <Button 
                      onClick={() => navigate(mark.url || '/')}
                      className="rounded-premium-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all h-spacing-xl px-spacing-md text-[10px] font-black uppercase tracking-widest gap-spacing-xs"
                    >
                      Voltar <ChevronRight className="w-spacing-sm h-spacing-sm" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-spacing-md">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-spacing-3xl bg-muted/20 rounded-[2rem] border-2 border-dashed border-border/40">
              <Edit3 className="w-spacing-2xl h-spacing-2xl text-muted-foreground/60 mx-auto mb-spacing-md" />
              <p className="text-muted-foreground font-serif italic">Nenhuma anotação encontrada.</p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <Card key={note.id} className="overflow-hidden hover:border-primary/30 transition-all border-border/40 bg-card rounded-premium shadow-premium-md">
                <CardContent className="p-spacing-lg space-y-spacing-md">
                  <div className="flex items-start justify-between gap-spacing-md">
                    <div className="flex items-center gap-spacing-xs">
                       <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-black uppercase tracking-widest">
                         {note.content_type}
                       </Badge>
                       <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                         {new Date(note.created_at).toLocaleDateString('pt-BR')}
                       </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-premium-full text-muted-foreground hover:text-destructive h-spacing-xl w-spacing-xl"
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash2 className="w-spacing-md h-spacing-md" />
                    </Button>
                  </div>
                  <p className="text-premium-sm font-serif leading-relaxed text-foreground/90 whitespace-pre-line">
                    {note.note_text}
                  </p>
                  <div className="pt-spacing-md border-t border-border/10 flex justify-end">
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-[10px] uppercase font-black tracking-widest text-primary gap-spacing-2xs"
                      onClick={() => {
                        const url = note.content_type === 'bible' ? `/bible?book=${note.book_abbr}&ch=${note.chapter}` : 
                                  note.content_type === 'catechism' ? `/catechism?p=${note.paragraph}` : '/';
                        navigate(url);
                      }}
                    >
                      Ver Contexto <ArrowRight className="w-spacing-sm h-spacing-sm" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReadingJournal;