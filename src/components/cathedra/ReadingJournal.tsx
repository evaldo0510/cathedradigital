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
  Bookmark
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
  const { user } = useAuth();
  const { marks, deleteMark } = useReadingMarks();
  const { notes, deleteNote, updateNote } = useNotes('all'); // All notes
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('history');
  
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
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8 min-h-screen pb-32">
      <SEOHead title="Diário & Histórico | Cathedra" description="Gerencie suas marcas de leitura, histórico e anotações espirituais." />
      
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-widest">
          <History className="w-3 h-3" /> Memória da Alma
        </div>
        <h1 className="text-4xl md:text-5xl font-display text-primary">Diário de Jornada</h1>
        <p className="text-muted-foreground font-serif italic">"Guarda o que viste, para que não se apague do teu coração."</p>
      </div>

      <div className="relative group max-w-xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input 
          placeholder="Pesquisar em marcas e anotações..." 
          className="h-12 pl-12 rounded-full bg-card border-border/40 focus:ring-primary/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs defaultValue="history" className="w-full" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-4 mb-8">
          <TabsList className="bg-muted/50 p-1 rounded-full">
            <TabsTrigger value="history" className="rounded-full px-6 py-2 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
              Histórico
            </TabsTrigger>
            <TabsTrigger value="notes" className="rounded-full px-6 py-2 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
              Anotações
            </TabsTrigger>
          </TabsList>
          
          {activeTab === 'notes' && notes.length > 0 && (
            <Button onClick={exportPDF} variant="outline" size="sm" className="rounded-full gap-2 text-xs uppercase tracking-widest font-bold border-primary/20 hover:bg-primary/5">
              <Download className="w-4 h-4" /> PDF
            </Button>
          )}
        </div>

        <TabsContent value="history" className="space-y-4">
          {filteredMarks.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-[2rem] border-2 border-dashed border-border/40">
              <History className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground font-serif italic">Nenhuma marca de leitura encontrada.</p>
            </div>
          ) : (
            filteredMarks.map((mark) => (
              <Card key={mark.id} className="group overflow-hidden hover:border-primary/30 transition-all border-border/40 bg-card/60 backdrop-blur-sm rounded-2xl shadow-soft hover:shadow-premium">
                <CardContent className="p-4 sm:p-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      mark.content_type === 'bible' ? 'bg-blue-500/10 text-blue-600' :
                      mark.content_type === 'catechism' ? 'bg-amber-500/10 text-amber-600' :
                      'bg-emerald-500/10 text-emerald-600'
                    }`}>
                      {mark.content_type === 'bible' ? <Book className="w-5 h-5" /> :
                       mark.content_type === 'catechism' ? <Cross className="w-5 h-5" /> :
                       <Scroll className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-foreground truncate">{mark.label}</h3>
                        {mark.is_last_read && <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[8px] h-4">ÚLTIMO PONTO</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                         <Calendar className="w-3 h-3" /> {new Date(mark.updated_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      onClick={() => deleteMark(mark.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={() => navigate(mark.url || '/')}
                      className="rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all h-9 px-4 text-[10px] font-black uppercase tracking-widest gap-2"
                    >
                      Voltar <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-[2rem] border-2 border-dashed border-border/40">
              <Edit3 className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground font-serif italic">Nenhuma anotação encontrada.</p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <Card key={note.id} className="overflow-hidden hover:border-primary/30 transition-all border-border/40 bg-card rounded-2xl shadow-soft">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
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
                      className="rounded-full text-muted-foreground hover:text-destructive h-8 w-8"
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm font-serif leading-relaxed text-foreground/90 whitespace-pre-line">
                    {note.note_text}
                  </p>
                  <div className="pt-4 border-t border-border/10 flex justify-end">
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-[10px] uppercase font-black tracking-widest text-primary gap-1"
                      onClick={() => {
                        const url = note.content_type === 'bible' ? `/bible?book=${note.book_abbr}&ch=${note.chapter}` : 
                                  note.content_type === 'catechism' ? `/catechism?p=${note.paragraph}` : '/';
                        navigate(url);
                      }}
                    >
                      Ver Contexto <ArrowRight className="w-3 h-3" />
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