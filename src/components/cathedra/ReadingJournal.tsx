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
    <div className="max-w-4xl mx-auto py-2xl px-md space-y-8 min-h-screen pb-4xl">
      <SEOHead title="Diário & Histórico | Cathedra" description="Gerencie suas marcas de leitura, histórico e anotações espirituais." path="/diario" />
      
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-xs px-sm py-2xs bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-widest">
          <History className="w-sm h-sm" /> Memória da Alma
      </div>

      {/* Streak and Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg max-w-2xl mx-auto w-full">
        <Card className="bg-primary/[0.03] border-primary/10 rounded-[3rem] overflow-hidden shadow-soft group hover:bg-primary/[0.05] transition-all">
          <CardContent className="p-xl flex flex-col items-center text-center gap-md">
            <div className="w-3xl h-3xl rounded-full bg-primary/10 flex items-center justify-center relative">
              <Zap className="w-xl h-xl text-primary group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-20" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 mb-xs">Sequência de Graça</p>
              <h3 className="text-5xl font-display text-primary">{streak}</h3>
              <p className="text-xs font-bold text-primary/60 mt-2xs uppercase tracking-widest">{streak === 1 ? 'Dia' : 'Dias'} Consecutivos</p>
            </div>
            <div className="pt-md border-t border-primary/5 w-full">
              <p className="text-[9px] font-black uppercase tracking-widest text-primary/60">Recorde: {profile?.max_streak || streak} dias</p>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-1">
          <Card className="bg-secondary/[0.02] border-secondary/10 rounded-[4rem] overflow-hidden shadow-soft group hover:bg-secondary/[0.04] transition-all duration-1000">
            <CardContent className="p-2xl flex flex-col items-center gap-xl">
              <div className="w-4xl h-4xl rounded-full bg-secondary/5 flex items-center justify-center relative">
                <Target className={`w-2xl h-2xl text-secondary/60 group-hover:rotate-12 transition-transform duration-700 ${daysActiveThisWeek >= weeklyGoal ? 'animate-bounce' : ''}`} />
                {daysActiveThisWeek >= weeklyGoal && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-xs -right-xs bg-secondary text-white p-xs rounded-full shadow-premium"
                  >
                    <CheckCircle2 className="w-md h-md" />
                  </motion.div>
                )}
              </div>
              <div className="w-full text-center space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-secondary/30">Meta da Semana</p>
                <h3 className="text-6xl font-display text-secondary leading-none">{daysActiveThisWeek} <span className="text-2xl opacity-20">/ {weeklyGoal}</span></h3>
                <p className="text-sm font-serif italic text-secondary/60">Dias em contemplação</p>
              </div>
              <div className="w-full space-y-4">
                <div className="h-xs w-full bg-secondary/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (daysActiveThisWeek / weeklyGoal) * 100)}%` }}
                    transition={{ duration: 1.5, ease: [0.2, 0.8, 0.2, 1] }}
                    className="h-full bg-secondary/40 rounded-full shadow-premium"
                  />
                </div>
                
                {/* Histórico Semanal Detalhado */}
                <div className="pt-lg flex justify-between px-xs">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => {
                    const today = new Date();
                    const dayDate = new Date(today.setDate(today.getDate() - today.getDay() + i));
                    const dateStr = dayDate.toISOString().split('T')[0];
                    const isActive = [...marks, ...notes].some(item => 
                      new Date(item.created_at || (item as any).updated_at).toISOString().split('T')[0] === dateStr
                    );
                    const isToday = i === new Date().getDay();
                    
                    return (
                      <div key={i} className="flex flex-col items-center gap-sm">
                        <span className={`text-[8px] font-black uppercase tracking-widest ${isToday ? 'text-secondary' : 'text-secondary/20'}`}>{day}</span>
                        <div className={`w-xl h-xl rounded-full border flex items-center justify-center transition-all duration-700 ${
                          isActive 
                            ? 'bg-secondary/20 border-secondary/20 text-secondary' 
                            : 'bg-transparent border-secondary/5 text-secondary/10'
                        } ${isToday ? 'ring-2 ring-secondary/20 ring-offset-2' : ''}`}>
                          {isActive && <CheckCircle2 className="w-sm h-sm" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-secondary/20 text-center pt-md">
                  {daysActiveThisWeek >= weeklyGoal ? 'Propósito cumprido!' : `Siga firme por mais ${weeklyGoal - daysActiveThisWeek} dias.`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
        <h1 className="text-4xl md:text-5xl font-display text-primary">Diário de Jornada</h1>
        <p className="text-muted-foreground font-serif italic">"Guarda o que viste, para que não se apague do teu coração."</p>
      </div>

      <div className="relative group max-w-xl mx-auto">
        <Search className="absolute left-md top-2xs/2 -translate-y-1/2 w-md h-md text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input 
          placeholder="Pesquisar em marcas e anotações..." 
          className="h-2xl pl-2xl rounded-full bg-card border-border/40 focus:ring-primary/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs defaultValue="history" className="w-full" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-md mb-xl">
          <TabsList className="bg-muted/50 p-2xs rounded-full">
            <TabsTrigger value="history" className="rounded-full px-lg py-xs text-xs font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
              Histórico
            </TabsTrigger>
            <TabsTrigger value="notes" className="rounded-full px-lg py-xs text-xs font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
              Anotações
            </TabsTrigger>
          </TabsList>
          
          {activeTab === 'notes' && notes.length > 0 && (
            <Button onClick={exportPDF} variant="outline" size="sm" className="rounded-full gap-xs text-xs uppercase tracking-widest font-bold border-primary/20 hover:bg-primary/5">
              <Download className="w-md h-md" /> PDF
            </Button>
          )}
        </div>

        <TabsContent value="history" className="space-y-4">
          {filteredMarks.length === 0 ? (
            <div className="text-center py-3xl bg-muted/20 rounded-[2rem] border-2 border-dashed border-border/40">
              <History className="w-2xl h-2xl text-muted-foreground/60 mx-auto mb-md" />
              <p className="text-muted-foreground font-serif italic">Nenhuma marca de leitura encontrada.</p>
            </div>
          ) : (
            filteredMarks.map((mark) => (
              <Card key={mark.id} className="group overflow-hidden hover:border-primary/30 transition-all border-border/40 bg-card/60 backdrop-blur-sm rounded-premium shadow-soft hover:shadow-premium">
                <CardContent className="p-md sm:p-lg flex items-center justify-between gap-md">
                  <div className="flex items-center gap-md min-w-0">
                    <div className={`w-xl h-xl rounded-full flex items-center justify-center shrink-0 ${
                      mark.content_type === 'bible' ? 'bg-blue-500/10 text-blue-600' :
                      mark.content_type === 'catechism' ? 'bg-amber-500/10 text-amber-600' :
                      'bg-emerald-500/10 text-emerald-600'
                    }`}>
                      {mark.content_type === 'bible' ? <Book className="w-md h-md" /> :
                       mark.content_type === 'catechism' ? <Cross className="w-md h-md" /> :
                       <Scroll className="w-md h-md" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-xs mb-3xs">
                        <h3 className="font-bold text-foreground truncate">{mark.label}</h3>
                        {mark.is_last_read && <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[8px] h-md">ÚLTIMO PONTO</Badge>}
                      </div>
                      <div className="flex items-center gap-xs text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                         <Calendar className="w-sm h-sm" /> {new Date(mark.updated_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-xs">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      onClick={() => deleteMark(mark.id)}
                    >
                      <Trash2 className="w-md h-md" />
                    </Button>
                    <Button 
                      onClick={() => navigate(mark.url || '/')}
                      className="rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all h-xl px-md text-[10px] font-black uppercase tracking-widest gap-xs"
                    >
                      Voltar <ChevronRight className="w-sm h-sm" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-3xl bg-muted/20 rounded-[2rem] border-2 border-dashed border-border/40">
              <Edit3 className="w-2xl h-2xl text-muted-foreground/60 mx-auto mb-md" />
              <p className="text-muted-foreground font-serif italic">Nenhuma anotação encontrada.</p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <Card key={note.id} className="overflow-hidden hover:border-primary/30 transition-all border-border/40 bg-card rounded-premium shadow-soft">
                <CardContent className="p-lg space-y-4">
                  <div className="flex items-start justify-between gap-md">
                    <div className="flex items-center gap-xs">
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
                      className="rounded-full text-muted-foreground hover:text-destructive h-xl w-xl"
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash2 className="w-md h-md" />
                    </Button>
                  </div>
                  <p className="text-sm font-serif leading-relaxed text-foreground/90 whitespace-pre-line">
                    {note.note_text}
                  </p>
                  <div className="pt-md border-t border-border/10 flex justify-end">
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-[10px] uppercase font-black tracking-widest text-primary gap-2xs"
                      onClick={() => {
                        const url = note.content_type === 'bible' ? `/bible?book=${note.book_abbr}&ch=${note.chapter}` : 
                                  note.content_type === 'catechism' ? `/catechism?p=${note.paragraph}` : '/';
                        navigate(url);
                      }}
                    >
                      Ver Contexto <ArrowRight className="w-sm h-sm" />
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