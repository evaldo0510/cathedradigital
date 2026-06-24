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
import MagisteriumDiagnosticPanel from './MagisteriumDiagnosticPanel';
import { logMagisteriumDiag } from '@/lib/magisteriumDiagnostics';

const MIN_DOC_LEN = 500;




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
  const [retryNonce, setRetryNonce] = useState(0);
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
        logMagisteriumDiag({ docId: id, step: 'final_error', message: 'URL não configurada' });
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

        const meta = (data as { meta?: { step?: string; content_length?: number } })?.meta;
        const text: string = data.text;
        const isThin = text.length < MIN_DOC_LEN;

        if (isThin) {
          logMagisteriumDiag({
            docId: id,
            url,
            step: (meta?.step as any) ?? 'fetch_thin',
            contentLength: text.length,
            message: 'Conteúdo abaixo do mínimo legível',
          });
          throw new Error(
            `Documento retornou apenas ${text.length} caracteres — abaixo do mínimo legível (${MIN_DOC_LEN}). Pode ser uma página de redirecionamento do vatican.va.`,
          );
        }

        logMagisteriumDiag({
          docId: id,
          url,
          step: (meta?.step as any) ?? 'fetch_ok',
          contentLength: text.length,
        });

        setContent({ title: data.title || id, text });
      } catch (err: any) {
        console.error('Error fetching document:', err);
        window.dispatchEvent(new CustomEvent('supabase-unreachable'));
        const msg = err?.message || 'Erro ao carregar o documento do Vaticano. Verifique sua conexão.';
        setError(msg);
        logMagisteriumDiag({ docId: id, url, step: 'final_error', message: msg });
        toast.error('Não foi possível carregar o documento.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [id, retryNonce]);


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
      <div className="max-w-spacing-4xl mx-auto px-spacing-md py-spacing-3xl flex flex-col items-center justify-center space-y-spacing-lg">
        <div className="relative">
          <div className="w-spacing-3xl h-spacing-3xl rounded-premium bg-primary/10 animate-pulse border-2 border-primary/20" />
          <Icons.Loader className="absolute inset-0 w-spacing-3xl h-spacing-3xl text-primary animate-spin p-spacing-md" />
        </div>
        <p className="text-muted-foreground font-serif italic animate-pulse">Buscando documento nos arquivos do Vaticano...</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="max-w-spacing-2xl mx-auto px-spacing-md py-spacing-3xl text-center space-y-spacing-lg">
        <div className="w-spacing-3xl h-spacing-3xl bg-destructive/10 rounded-premium flex items-center justify-center mx-auto">
          <Icons.AlertTriangle className="w-spacing-xl h-spacing-xl text-destructive" />
        </div>
        <div className="space-y-spacing-xs">
          <h2 className="text-premium-2xl font-serif font-bold">Ops! Algo deu errado</h2>
          <p className="text-muted-foreground">{error || 'Documento não disponível.'}</p>
        </div>
        <Button onClick={() => navigate(-1)} variant="outline" className="rounded-premium-full">
          <Icons.ArrowLeft className="w-spacing-md h-spacing-md mr-spacing-xs" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full pb-spacing-4xl relative overflow-x-hidden">
      <SEOHead 
        title={`${content.title} | Magistério`}
        description={`Leia o documento completo: ${content.title}`}
        path={`/magisterium/${id}`}
      />

      {/* Atmospheric Header - More minimal on mobile */}
      <div className="sticky top-spacing-0 z-40 bg-background/80 backdrop-blur-3xl py-spacing-sm px-spacing-md sm:px-spacing-lg mb-spacing-xl md:mb-spacing-3xl border-b border-primary/5 flex items-center justify-between gap-spacing-md header-reading-auto-hide transition-all duration-700">
        <div className="flex items-center gap-spacing-xs min-w-spacing-0">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-premium-full hover:bg-primary/5 h-spacing-xl w-spacing-xl shrink-0"
          >
            <Icons.ArrowLeft className="w-spacing-md h-spacing-md" />
          </Button>
          <div className="min-w-spacing-0">
            <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 truncate leading-none mb-spacing-2xs">{content.title}</h1>
            <p className="text-[8px] text-muted-foreground/60 uppercase tracking-widest font-bold">Magistério</p>
          </div>
        </div>
        
        <div className="flex items-center gap-spacing-2xs shrink-0">
          <div className="hidden sm:flex items-center gap-spacing-2xs mr-spacing-xs">
            <AudioButton variant="outline" className="rounded-premium-full h-spacing-xl w-spacing-xl p-spacing-0 border-primary/10" />
            <ReadingMark contentType="magisterium" contentId={id || ''} label={content.title} />
          </div>
          <ReadingControlPanel />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowLogosAI(!showLogosAI)}
            className={`rounded-premium-full h-spacing-xl w-spacing-xl p-spacing-0 transition-all ${showLogosAI ? 'bg-primary text-white scale-110' : 'hover:bg-primary/5 text-primary/40'}`}
            title="Logos IA"
          >
            <Icons.Sparkles className="w-spacing-md h-spacing-md" />
          </Button>
        </div>
      </div>


      <div className="flex flex-col gap-spacing-2xl lg:gap-spacing-4xl items-start">


        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 w-full relative"
        >
            {/* Visual Indicator for Keyboard Shortcuts */}
            {settings.totalSilence && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed bottom-spacing-4xl left-spacing-2xs/2 -translate-x-1/2 z-[160] px-spacing-md py-spacing-xs bg-primary/80 backdrop-blur-md text-primary-foreground rounded-premium-full text-[9px] font-black uppercase tracking-widest flex items-center gap-spacing-sm border border-white/10 shadow-premium"
              >
                <span className="flex items-center gap-spacing-2xs"><kbd className="bg-white/20 px-spacing-2xs py-spacing-3xs rounded">{settings.shortcuts?.highlight?.toUpperCase() || 'H'}</kbd> Destacar</span>
                <div className="w-px h-spacing-sm bg-white/20" />
                <span className="flex items-center gap-spacing-2xs"><kbd className="bg-white/20 px-spacing-2xs py-spacing-3xs rounded">{settings.shortcuts?.note?.toUpperCase() || 'N'}</kbd> Nota</span>
                <div className="w-px h-spacing-sm bg-white/20" />
                <span className="flex items-center gap-spacing-2xs"><kbd className="bg-white/20 px-spacing-2xs py-spacing-3xs rounded">Esc</kbd> Limpar</span>
              </motion.div>
            )}
            <div className="w-full relative">
            <div 
              ref={contentRef}
              onScroll={() => {
                if (id) localStorage.setItem(`cathedra_last_magisterium_scroll_${id}`, window.scrollY.toString());
              }}
              className={`py-spacing-xl md:py-spacing-4xl prose prose-slate dark:prose-invert max-w-none reader-text
                font-size-${settings.fontSize} font-family-${settings.fontFamily}
                prose-p:leading-[1.8] prose-p:mb-spacing-xl
                prose-headings:font-serif prose-headings:text-primary prose-headings:mb-spacing-xl
                prose-blockquote:border-primary/10 prose-blockquote:bg-primary/[0.01] prose-blockquote:p-spacing-xl prose-blockquote:rounded-premium prose-blockquote:italic
                prose-strong:text-primary prose-strong:font-bold transition-all duration-300`}
            >

              {processedText.split('\n\n').map((para, idx) => {
                const note = currentDocNotes.find(n => n.content_id === `${id}:${idx}` && n.highlight_color);
                
                return (
                  <div key={idx} className="group relative mb-spacing-md" id={`para-${idx}`}>
                    <div className={cn(note ? `highlight-${note.highlight_color} px-spacing-2xs rounded-premium-sm cursor-pointer` : '')}
                         onClick={() => note && setActiveHighlight(note)}>
                      <ReactMarkdown>{para}</ReactMarkdown>
                    </div>
                    <div className="absolute top-spacing-0 -right-spacing-2xl flex flex-col gap-spacing-xs opacity-0 group-hover:opacity-100 transition-opacity no-print">
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
        <div className="w-full max-w-[70ch] mx-auto mb-spacing-2xl space-y-spacing-2xl">
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


      <div className="mt-spacing-4xl pt-spacing-3xl border-t border-primary/5 flex flex-col items-center gap-spacing-2xl">
        <div className="text-center space-y-spacing-md">
          <Icons.CheckCircle2 className="w-spacing-2xl h-spacing-2xl text-primary/60 mx-auto" />
          <div className="space-y-spacing-2xs">
            <h3 className="text-premium-xl font-display text-primary uppercase tracking-widest">Contemplação Concluída</h3>
            <p className="text-premium-xs text-muted-foreground italic">"A leitura busca, a meditação encontra."</p>
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
            className="rounded-premium-full px-spacing-2xl py-spacing-lg bg-primary text-primary-foreground hover:scale-105 transition-all shadow-premium"
          >
            Concluir e Voltar
          </Button>
        </div>

        <Button 
          variant="ghost" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="rounded-premium-full px-spacing-xl py-spacing-lg text-muted-foreground/40 hover:text-primary transition-all group"
        >
          <Icons.ChevronUp className="w-spacing-md h-spacing-md mr-spacing-xs group-hover:-translate-y-1 transition-transform" /> 
          Voltar ao Topo do Documento
        </Button>
      </div>


      {!settings.totalSilence && showLogosAI && (
        <div className="w-full max-w-[70ch] mx-auto mt-spacing-4xl mb-spacing-4xl animate-in fade-in slide-in-from-bottom-spacing-md duration-1000">
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
