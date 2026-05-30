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
import { LogosContextualSuggestions } from './LogosContextualSuggestions';
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
  const [logosAIInitialQuery, setLogosAIInitialQuery] = useState('');
  const [logosSelectionsCount, setLogosSelectionsCount] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeHighlight, setActiveHighlight] = useState<UserNote | null>(null);
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [sessionResumeUsed, setSessionResumeUsed] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { saveLastRead, getLastRead } = useReadingMarks();
  const [lastReadMark, setLastReadMark] = useState<any>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { notes: docNotes, addNote, updateNote, deleteNote: deleteDocNote } = useNotes('magisterium');

  // Update history
  useEffect(() => {
    const currentUrl = window.location.pathname + window.location.search;
    setHistory(prev => {
      if (prev[historyIndex] === currentUrl) return prev;
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(currentUrl);
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [location.pathname, location.search, historyIndex]);
  
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

  // Track visible paragraph for bookmarking
  useEffect(() => {
    if (loading || !content) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveParagraphId(entry.target.id);
          }
        });
      },
      { threshold: 0.5, rootMargin: '-10% 0px -70% 0px' }
    );

    const paragraphElements = document.querySelectorAll('[id^="para-"]');
    paragraphElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [loading, content]);

  const handleReturnToParagraph = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-primary/10');
      setTimeout(() => el.classList.remove('bg-primary/10'), 2000);
    }
  };

  const handleBookmarkCurrent = () => {
    if (activeParagraphId && id && content) {
      const pIdx = parseInt(activeParagraphId.replace('para-', ''));
      saveLastRead({
        content_type: 'magisterium',
        content_id: id,
        position: pIdx,
        label: `${content.title} §${pIdx + 1}`,
        url: `/magisterium/${id}?p=${pIdx}`,
        is_last_read: true
      });
      toast.success('Posição salva', {
        description: `Você parou no parágrafo ${pIdx + 1}`
      });
    }
  };

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
       await updateNote(activeHighlight.id, text, color);
       setActiveHighlight(null);
    } else {
      await addNote(id, text, color);
    }
    setIsNoteModalOpen(false);
  }, [id, activeHighlight, addNote]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing or modal is open
      const activeElement = document.activeElement;
      const isTyping = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA' || (activeElement as HTMLElement)?.isContentEditable;
      if (isTyping || isNoteModalOpen) return;
      
      // Accessibility: Reading shortcuts
      if (id) {
        if (e.key.toLowerCase() === (settings.shortcuts?.highlight || 'h')) {
          e.preventDefault();
          handleAddNoteOrHighlight('yellow', 'Destacado via atalho');
        }
        if (e.key.toLowerCase() === (settings.shortcuts?.note || 'n')) {
          e.preventDefault();
          setIsNoteModalOpen(true);
        }
        if (e.key === (settings.shortcuts?.clear || 'Escape')) {
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
          
          const behavior = settings.resumeBehavior || 'confirm';
          let shouldResume = true;
          
          if (behavior === 'confirm') {
            shouldResume = confirm(`Deseja retomar a leitura em: ${lastReadMark.label}?`);
          } else if (behavior === 'once') {
            if (!sessionResumeUsed) {
              shouldResume = confirm(`Deseja retomar a leitura em: ${lastReadMark.label}?`);
              if (shouldResume) setSessionResumeUsed(true);
            }
          } else if (behavior === 'never') {
            shouldResume = false;
          }

          if (shouldResume) {
            navigate(lastReadMark.url);
          }
        }

        // History navigation (Alt + Left/Right)
        if (e.altKey && e.key === 'ArrowLeft' && historyIndex > 0) {
          e.preventDefault();
          const prevUrl = history[historyIndex - 1];
          setHistoryIndex(prev => prev - 1);
          navigate(prevUrl);
        }
        if (e.altKey && e.key === 'ArrowRight' && historyIndex < history.length - 1) {
          e.preventDefault();
          const nextUrl = history[historyIndex + 1];
          setHistoryIndex(prev => prev + 1);
          navigate(nextUrl);
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
    <div className="w-full max-w-[70ch] mx-auto pb-32 relative reader-container overflow-x-hidden">
      <SEOHead 
        title={`${content.title} | Magistério`}
        description={`Leia o documento completo: ${content.title}`}
        path={`/magisterium/${id}`}
      />

      {/* Atmospheric Header - More minimal on mobile */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-3xl py-3 px-4 sm:px-6 mb-8 md:mb-16 border-b border-primary/5 flex items-center justify-between gap-4 header-reading-auto-hide transition-all duration-700">
        <div className="flex items-center gap-2 min-w-0">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-primary/5 h-9 w-9 shrink-0"
          >
            <Icons.ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 truncate leading-none mb-1">{content.title}</h1>
            <p className="text-[8px] text-muted-foreground/60 uppercase tracking-widest font-bold">Magistério</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 mr-2">
            <AudioButton variant="outline" className="rounded-full h-9 w-9 p-0 border-primary/10" />
            <ReadingMark contentType="magisterium" contentId={id || ''} label={content.title} />
          </div>
          <ReadingControlPanel />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowLogosAI(!showLogosAI)}
            className={`rounded-full h-9 w-9 p-0 transition-all ${showLogosAI ? 'bg-primary text-white scale-110' : 'hover:bg-primary/5 text-primary/40'}`}
            title="Logos IA"
          >
            <Icons.Sparkles className="w-4 h-4" />
          </Button>
        </div>
      </div>


      <div className="flex flex-col gap-12 lg:gap-24 items-start">


        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 w-full max-w-[70ch] mx-auto relative"
        >
            {/* Visual Indicator for Keyboard Shortcuts */}
            {settings.totalSilence && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[160] px-4 py-2 bg-primary/80 backdrop-blur-md text-primary-foreground rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-3 border border-white/10 shadow-2xl"
              >
                <span className="flex items-center gap-1.5"><kbd className="bg-white/20 px-1.5 py-0.5 rounded">{settings.shortcuts?.highlight?.toUpperCase() || 'H'}</kbd> Destacar</span>
                <div className="w-px h-3 bg-white/20" />
                <span className="flex items-center gap-1.5"><kbd className="bg-white/20 px-1.5 py-0.5 rounded">{settings.shortcuts?.note?.toUpperCase() || 'N'}</kbd> Nota</span>
                <div className="w-px h-3 bg-white/20" />
                <span className="flex items-center gap-1.5"><kbd className="bg-white/20 px-1.5 py-0.5 rounded">Esc</kbd> Limpar</span>
              </motion.div>
            )}
            <div className="w-full relative">
            <div 
              ref={contentRef}
              onScroll={() => {
                if (id) localStorage.setItem(`cathedra_last_magisterium_scroll_${id}`, window.scrollY.toString());
              }}
              className={`py-8 md:py-24 prose prose-slate dark:prose-invert max-w-none reader-text
                font-size-${settings.fontSize} font-family-${settings.fontFamily}
                prose-p:leading-[1.8] prose-p:mb-8
                prose-headings:font-serif prose-headings:text-primary prose-headings:mb-8
                prose-blockquote:border-primary/10 prose-blockquote:bg-primary/[0.01] prose-blockquote:p-8 prose-blockquote:rounded-3xl prose-blockquote:italic
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
              onScrollToPercentage={(p) => {
                const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
                window.scrollTo({ top: (p / 100) * totalHeight, behavior: 'smooth' });
              }}
              showResume={lastReadMark && lastReadMark.url !== window.location.pathname + window.location.search}
              onResumeLast={() => {
                const behavior = settings.resumeBehavior || 'confirm';
                if (behavior === 'always' || (behavior === 'once' && sessionResumeUsed)) {
                   navigate(lastReadMark.url);
                } else if (behavior === 'never') {
                   toast.info('Retomada automática desativada nas configurações.');
                } else if (confirm(`Deseja retomar a leitura em: ${lastReadMark.label}?`)) {
                   if (behavior === 'once') setSessionResumeUsed(true);
                   navigate(lastReadMark.url);
                }
              }}
              label={content.title}
              isSubtle={settings.visualSilence}
              lastParagraphId={activeParagraphId || undefined}
              onBookmarkCurrent={handleBookmarkCurrent}
              onReturnToParagraph={handleReturnToParagraph}
            />

        </motion.div>
      </div>


      {content && (
        <div className="w-full max-w-[70ch] mx-auto mb-12 space-y-12">
          <ChapterNotesList 
            notes={currentDocNotes} 
            onDeleteNote={deleteDocNote}
            title="Minhas Notas neste Documento"
          />

          {!settings.totalSilence && (
            <LogosContextualSuggestions
              type="magisterium"
              context={`Documento do Magistério: ${content.title}`}
              isVisible={settings.logosSuggestions === 'always' || (settings.logosSuggestions === 'first_selection' && logosSelectionsCount === 0)}
              onSelectSuggestion={(prompt) => {
                setLogosAIInitialQuery(prompt);
                setShowLogosAI(true);
                setLogosSelectionsCount(prev => prev + 1);
              }}
            />
          )}
          <Relatio 
            context={{
              type: 'magisterium',
              id: id,
              tags: [content.title, 'Magisterio', 'Tradicao', 'Igreja']
            }}
            onNavigateToBible={(abbr, ch) => navigate(`/bible?book=${abbr}&chapter=${ch}`)}
            onNavigateToCIC={(p) => navigate(`/catechism?p=${p}`)}
            onNavigateToDoc={(docId) => navigate(`/magisterium/${docId}`)}
            onSelectLogosQuery={(prompt) => {
              setLogosAIInitialQuery(prompt);
              setShowLogosAI(true);
              setLogosSelectionsCount(prev => prev + 1);
            }}
          />
        </div>
      )}


      <div className="mt-32 pt-16 border-t border-primary/5 flex flex-col items-center gap-12">
        <div className="text-center space-y-4">
          <Icons.CheckCircle2 className="w-12 h-12 text-primary/60 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-xl font-display text-primary uppercase tracking-widest">Contemplação Concluída</h3>
            <p className="text-xs text-muted-foreground italic">"A leitura busca, a meditação encontra."</p>
          </div>
          <Button 
            onClick={() => {
              saveLastRead({
                content_type: 'magisterium',
                content_id: id || '',
                label: content.title,
                url: window.location.pathname,
                position: document.documentElement.scrollHeight
              });
              toast.success("Progresso salvo com sucesso", {
                icon: '✨'
              });
              navigate(-1);
            }}
            className="rounded-full px-12 py-6 bg-primary text-primary-foreground hover:scale-105 transition-all shadow-premium"
          >
            Concluir e Voltar
          </Button>
        </div>

        <Button 
          variant="ghost" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="rounded-full px-8 py-6 text-muted-foreground/40 hover:text-primary transition-all group"
        >
          <Icons.ChevronUp className="w-4 h-4 mr-2 group-hover:-translate-y-1 transition-transform" /> 
          Voltar ao Topo do Documento
        </Button>
      </div>


      {!settings.totalSilence && showLogosAI && (
        <div className="w-full max-w-[70ch] mx-auto mt-24 mb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <LogosAI 
            isOpen={showLogosAI} 
            onClose={() => {
              setShowLogosAI(false);
              setLogosAIInitialQuery('');
            }} 
            context={`Documento do Magistério: ${content.title}`}
            initialQuery={logosAIInitialQuery}
            type="magisterium"
            variant="integrated"
          />
        </div>
      )}
    </div>
  );
};

export default MagisteriumViewer;
