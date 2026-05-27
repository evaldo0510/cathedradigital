import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Icons } from '@/constants';
import { supabase } from '@/integrations/supabase/client';
import { MAGISTERIUM_URLS } from '@/data/magisterium-urls';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import SEOHead from '@/components/SEOHead';
import AudioButton from './AudioButton';
import ReadingControlPanel from './ReadingControlPanel';
import ReadingMark from './ReadingMark';
import NotesPanel from './NotesPanel';
import LogosAI from './LogosAI';
import Relatio from './Relatio';
import ChapterNotesList from './ChapterNotesList';
import { useNotes, UserNote } from '@/hooks/useNotes';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { useReadingMarks } from '@/hooks/useReadingMarks';
import useReadingAutoHide from '@/hooks/useReadingAutoHide';
import { ReadingProgress } from './ReadingProgress';
import { TextSelectionToolbar } from './TextSelectionToolbar';
import { NoteEditModal } from './NoteEditModal';



const MagisteriumViewer: React.FC = () => {
  const { settings, updateSettings } = useReadingSettings();
  useReadingAutoHide(settings.visualSilence);
  const { id } = useParams<{ id: string }>();

  const [searchParams] = useSearchParams();
  const highlight = searchParams.get('highlight') || searchParams.get('text');
  const navigate = useNavigate();
  
  const [content, setContent] = useState<{ title: string; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogosAI, setShowLogosAI] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeHighlight, setActiveHighlight] = useState<UserNote | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const { saveLastRead, getLastRead } = useReadingMarks();
  const [lastReadMark, setLastReadMark] = useState<any>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { notes: docNotes, addNote, deleteNote: deleteDocNote } = useNotes('magisterium');
  
  const currentDocNotes = useMemo(() => {
    if (!id) return [];
    return docNotes.filter(n => n.content_id === id || n.content_id.startsWith(`${id}:`));
  }, [docNotes, id]);


  useEffect(() => {
    const fetchLastRead = async () => {
      const lr = await getLastRead();
      setLastReadMark(lr);
    };
    fetchLastRead();
  }, [getLastRead]);

  useEffect(() => {
    const fetchDoc = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      
      const isOfflineMode = localStorage.getItem('cathedra_offline_mode') === 'true';
      const url = MAGISTERIUM_URLS[id];
      if (!url) {
        setError('Documento não encontrado ou URL não configurada.');
        setLoading(false);
        return;
      }

      if (isOfflineMode) {
        setError('Modo Somente-Cache ativo: Documentos do Vaticano não estão disponíveis offline.');
        setLoading(false);
        return;
      }

      try {
        const { data, error: invokeError } = await supabase.functions.invoke('vatican-document', {
          body: { url },
        });

        if (invokeError) throw invokeError;
        if (!data?.text) throw new Error('Conteúdo não retornado pela função.');

        setContent({
          title: data.title || id,
          text: data.text,
        });
      } catch (err: any) {
        console.error('Error fetching document:', err);
        window.dispatchEvent(new CustomEvent('supabase-unreachable'));
        setError(err.message || 'Erro ao carregar o documento do Vaticano. Verifique sua conexão.');
        toast.error('Não foi possível carregar o documento.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [id]);

  // Auto-save scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (id && content) {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (window.scrollY / totalHeight) * 100;
        setReadingProgress(Math.min(100, Math.max(0, progress)));
        
        localStorage.setItem(`cathedra_last_magisterium_scroll_${id}`, window.scrollY.toString());
      }
    };
    
    // Save to DB on unmount or every few seconds
    const interval = setInterval(() => {
      if (id && content) {
        saveLastRead({
          content_type: 'magisterium',
          content_id: id,
          label: content.title,
          url: window.location.pathname + window.location.search,
          position: window.scrollY
        });
      }
    }, 10000); // every 10s

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, [id, content, saveLastRead]);

  const handleAddNoteOrHighlight = useCallback(async (color: string, text: string) => {
    if (!id) return;
    
    if (activeHighlight) {
       await supabase.from('user_notes').update({ 
         note_text: text, 
         highlight_color: color 
       }).eq('id', activeHighlight.id);
       setActiveHighlight(null);
    } else {
      await addNote(id, text, color);
    }
    setIsNoteModalOpen(false);
  }, [id, activeHighlight, addNote]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isNoteModalOpen) return;
      
      // Accessibility: Reading shortcuts
      if (id) {
        if (e.key.toLowerCase() === 'h') {
          e.preventDefault();
          handleAddNoteOrHighlight('yellow', 'Destacado via atalho');
        }
        if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          setIsNoteModalOpen(true);
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setActiveHighlight(null);
        }
        // Progress navigation (Alt + Up/Down)
        if (e.altKey && e.key === 'ArrowUp') {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        if (e.altKey && e.key === 'ArrowDown' && lastReadMark?.url) {
          e.preventDefault();
          navigate(lastReadMark.url);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, isNoteModalOpen, handleAddNoteOrHighlight, lastReadMark, navigate]);

  // Restore scroll position
  useEffect(() => {
    if (content && id) {
      const savedScroll = localStorage.getItem(`cathedra_last_magisterium_scroll_${id}`);
      if (savedScroll && !highlight) {
        setTimeout(() => {
          window.scrollTo({ top: parseInt(savedScroll), behavior: 'smooth' });
          toast('Documento restaurado do último ponto', { icon: '📖', duration: 2000 });
        }, 800);
      }
    }
  }, [content, id, highlight]);


  // Scroll to highlight when content is loaded
  useEffect(() => {
    if (content && highlight && contentRef.current) {
      setTimeout(() => {
        const text = contentRef.current?.innerText;
        if (text) {
          const index = text.toLowerCase().indexOf(highlight.toLowerCase());
          if (index !== -1) {
            // Find all elements that might contain the text
            // Simple strategy: find the first element that contains the text
            const walker = document.createTreeWalker(contentRef.current!, NodeFilter.SHOW_TEXT);
            let node;
            while ((node = walker.nextNode())) {
              if (node.textContent?.toLowerCase().includes(highlight.toLowerCase())) {
                const parent = node.parentElement;
                if (parent) {
                  parent.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  parent.classList.add('bg-primary/20', 'rounded', 'transition-colors', 'duration-1000');
                  setTimeout(() => parent.classList.remove('bg-primary/20'), 3000);
                  break;
                }
              }
            }
          }
        }
      }, 500);
    }
  }, [content, highlight]);

  const processedText = useMemo(() => {
    if (!content?.text) return '';
    if (!highlight) return content.text;

    // We don't want to break markdown by highlighting inside tags, 
    // but for simple text highlighting in the viewer, this is a challenge with ReactMarkdown.
    // Instead of modifying the markdown, we'll rely on the scrollIntoView logic above.
    return content.text;
  }, [content, highlight]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-premium bg-primary/10 animate-pulse border-2 border-primary/20" />
          <Icons.Loader className="absolute inset-0 w-16 h-16 text-primary animate-spin p-4" />
        </div>
        <p className="text-muted-foreground font-serif italic animate-pulse">Buscando documento nos arquivos do Vaticano...</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-destructive/10 rounded-premium flex items-center justify-center mx-auto">
          <Icons.AlertTriangle className="w-10 h-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-bold">Ops! Algo deu errado</h2>
          <p className="text-muted-foreground">{error || 'Documento não disponível.'}</p>
        </div>
        <Button onClick={() => navigate(-1)} variant="outline" className="rounded-full">
          <Icons.ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-24 px-4 sm:px-6 relative">
      <SEOHead 
        title={`${content.title} | Magistério`}
        description={`Leia o documento completo: ${content.title}`}
        path={`/magisterium/${id}`}
      />

      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md py-4 mb-12 border-b border-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-muted"
          >
            <Icons.ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm font-black uppercase tracking-widest text-primary truncate">{content.title}</h1>
            <p className="text-premium-tiny text-muted-foreground uppercase tracking-tighter">Magistério da Igreja</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {lastReadMark && lastReadMark.url !== window.location.pathname + window.location.search && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => navigate(lastReadMark.url)}
              className="rounded-full flex items-center gap-2 border-secondary/20 shadow-premium animate-in fade-in slide-in-from-right-4 duration-700"
            >
              <Icons.History className="w-4 h-4" />
              <span className="hidden sm:inline">Continuar de onde parei</span>
            </Button>
          )}
          <AudioButton variant="outline" className="rounded-full h-10 w-10 p-0" />
          <ReadingControlPanel />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowLogosAI(!showLogosAI)}
            className={`rounded-full flex items-center gap-2 ${showLogosAI ? 'bg-primary text-white' : ''}`}
          >
            <Icons.Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Logos IA</span>
          </Button>
          <Button variant="outline" size="icon" className="rounded-full h-10 w-10 p-0" onClick={() => window.print()} title="Imprimir / PDF">
            <Icons.Printer className="w-4 h-4" />
          </Button>
          <ReadingMark contentType="magisterium" contentId={id || ''} label={content.title} />
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-12 lg:gap-24 items-start mt-12 md:mt-24">
        {/* Elegant side navigation for documents can be implemented if the text has anchors. 
            For now, we'll keep the side column for balance and potential future TOC. */}
        <aside className="reader-navigation-aside space-y-12">
          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 space-y-4">
            <Icons.Scroll className="w-8 h-8 text-primary/40 mx-auto" />
            <p className="text-center text-premium-tiny font-black uppercase tracking-widest text-primary/60">Biblioteca do Magistério</p>
            <p className="text-xs text-muted-foreground italic text-center leading-relaxed">"O Magistério não está acima da Palavra de Deus, mas ao seu serviço." (Dei Verbum, 10)</p>
          </div>

          {currentDocNotes.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-1000">
              <p className="text-premium-tiny font-black uppercase tracking-widest text-primary/40 px-4">Minhas Marcações</p>
              <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                {currentDocNotes.map(note => {
                  const pIdx = note.content_id.includes(':') ? parseInt(note.content_id.split(':')[1]) : null;
                  
                  return (
                    <button
                      key={note.id}
                      onClick={() => {
                        if (pIdx !== null) {
                          const el = document.getElementById(`para-${pIdx}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                      className={`flex flex-col gap-1.5 px-4 py-3 rounded-2xl border text-left transition-all hover:bg-primary/5
                        ${note.highlight_color ? `bg-${note.highlight_color}-50/50 border-${note.highlight_color}-200/30` : 'bg-card border-primary/5'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary/40">Parágrafo {pIdx !== null ? pIdx + 1 : ''}</span>
                        {note.highlight_color && (
                          <div className={`w-2 h-2 rounded-full highlight-${note.highlight_color}`} />
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed line-clamp-2 italic text-muted-foreground">
                        {note.note_text === 'Destacado para meditação' ? 'Destaque visual' : note.note_text}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 w-full max-w-[75ch] mx-auto"
        >
          <div className="reader-container bg-card border border-border/40 shadow-soft overflow-hidden rounded-[3rem] md:rounded-[5rem] relative">
            <div 
              ref={contentRef}
              onScroll={() => {
                if (id) localStorage.setItem(`cathedra_last_magisterium_scroll_${id}`, window.scrollY.toString());
              }}
              className={`p-8 md:p-16 lg:p-24 prose prose-slate dark:prose-invert max-w-none reader-text
                font-size-${settings.fontSize} font-family-${settings.fontFamily}
                prose-headings:font-serif prose-headings:text-primary 
                prose-blockquote:border-primary/20 prose-blockquote:bg-primary/5 prose-blockquote:p-6 prose-blockquote:rounded-full prose-blockquote:italic
                prose-strong:text-primary prose-strong:font-bold transition-all duration-300`}
            >
              {processedText.split('\n\n').map((para, idx) => {
                const note = currentDocNotes.find(n => n.content_id === `${id}:${idx}` && n.highlight_color);
                
                return (
                  <div key={idx} className="group relative mb-4" id={`para-${idx}`}>
                    <div className={cn(note ? `highlight-${note.highlight_color} px-1 rounded-sm cursor-pointer` : '')}
                         onClick={() => note && setActiveHighlight(note)}>
                      <ReactMarkdown>{para}</ReactMarkdown>
                    </div>
                    <div className="absolute top-0 -right-12 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                      <NotesPanel contentType="magisterium" contentId={`${id}:${idx}`} contentLabel={`${content.title} §${idx + 1}`} />
                      <ReadingMark contentType="magisterium" contentId={`${id}:${idx}`} label={`${content.title} Parágrafo ${idx + 1}`} />
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
            
            <TextSelectionToolbar 
              activeHighlightId={activeHighlight?.id}
              activeColor={activeHighlight?.highlight_color}
              onHighlight={(color) => {
                if (activeHighlight) {
                  supabase.from('user_notes').update({ highlight_color: color }).eq('id', activeHighlight.id).then(() => setActiveHighlight(null));
                } else if (id) {
                  addNote(id, 'Destacado para meditação', color);
                }
              }}
              onDeleteHighlight={() => {
                if (activeHighlight) {
                  deleteDocNote(activeHighlight.id);
                  setActiveHighlight(null);
                }
              }}
              onAddNote={() => {
                if (id || activeHighlight) {
                  setIsNoteModalOpen(true);
                }
              }}
            />

            <NoteEditModal 
              isOpen={isNoteModalOpen}
              onClose={() => setIsNoteModalOpen(false)}
              onSave={handleAddNoteOrHighlight}
              onDelete={() => {
                if (activeHighlight) {
                  deleteDocNote(activeHighlight.id);
                  setActiveHighlight(null);
                  setIsNoteModalOpen(false);
                }
              }}
              initialText={activeHighlight?.note_text === 'Destacado para meditação' ? '' : activeHighlight?.note_text}
              initialColor={activeHighlight?.highlight_color || 'yellow'}
              title={activeHighlight ? 'Editar Reflexão' : 'Nova Reflexão'}
              isEditing={!!activeHighlight}
            />

            <ReadingProgress 
              progress={readingProgress}
              onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              showResume={lastReadMark && lastReadMark.url !== window.location.pathname + window.location.search}
              onResumeLast={() => navigate(lastReadMark.url)}
              label={content.title}
            />
        </motion.div>
      </div>


      {content && (
        <div className="w-full max-w-[72ch] mx-auto mb-12 space-y-12">
          <ChapterNotesList 
            notes={currentDocNotes} 
            onDeleteNote={deleteDocNote}
            title="Minhas Notas neste Documento"
          />

          <Relatio 
            context={{
              type: 'magisterium',
              id: id,
              tags: [content.title, 'Magisterio', 'Tradicao', 'Igreja']
            }}
            onNavigateToBible={(abbr, ch) => navigate(`/bible?book=${abbr}&chapter=${ch}`)}
            onNavigateToCIC={(p) => navigate(`/catechism?p=${p}`)}
            onNavigateToDoc={(docId) => navigate(`/magisterium/${docId}`)}
          />
        </div>
      )}


      <div className="mt-12 flex justify-center">
        <Button 
          variant="outline" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="rounded-full px-6"
        >
          <Icons.ChevronUp className="w-4 h-4 mr-2" /> Topo do Documento
        </Button>
      </div>

      {showLogosAI && (
        <div className="w-full max-w-[72ch] mx-auto mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <LogosAI 
            isOpen={showLogosAI} 
            onClose={() => setShowLogosAI(false)} 
            context={`Documento do Magistério: ${content.title}`}
            type="magisterium"
            variant="integrated"
          />
        </div>
      )}
    </div>
  );
};

export default MagisteriumViewer;
