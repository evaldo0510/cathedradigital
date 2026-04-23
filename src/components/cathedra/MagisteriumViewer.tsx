import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { supabase } from '@/integrations/supabase/client';
import { MAGISTERIUM_URLS } from '@/data/magisterium-urls';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import SEOHead from '@/components/SEOHead';
import AudioButton from './AudioButton';

const MagisteriumViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const highlight = searchParams.get('highlight') || searchParams.get('text');
  const navigate = useNavigate();
  
  const [content, setContent] = useState<{ title: string; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDoc = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      
      const url = MAGISTERIUM_URLS[id];
      if (!url) {
        setError('Documento não encontrado ou URL não configurada.');
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
        setError(err.message || 'Erro ao carregar o documento do Vaticano.');
        toast.error('Não foi possível carregar o documento.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [id]);

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
          <div className="w-16 h-16 rounded-2xl bg-primary/10 animate-pulse border-2 border-primary/20" />
          <Icons.Loader className="absolute inset-0 w-16 h-16 text-primary animate-spin p-4" />
        </div>
        <p className="text-muted-foreground font-serif italic animate-pulse">Buscando documento nos arquivos do Vaticano...</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <Icons.AlertTriangle className="w-10 h-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-bold">Ops! Algo deu errado</h2>
          <p className="text-muted-foreground">{error || 'Documento não disponível.'}</p>
        </div>
        <Button onClick={() => navigate(-1)} variant="outline" className="rounded-xl">
          <Icons.ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4 sm:px-6">
      <SEOHead 
        title={`${content.title} | Magistério`}
        description={`Leia o documento completo: ${content.title}`}
        path={`/magisterium/${id}`}
      />

      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md py-4 mb-8 border-b border-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-xl hover:bg-muted"
          >
            <Icons.ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm font-black uppercase tracking-widest text-primary truncate">{content.title}</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Magistério da Igreja</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <AudioButton variant="outline" className="rounded-xl h-10 w-10 p-0" />
          <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 p-0" onClick={() => window.print()}>
            <Icons.Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 shadow-sm"
      >
        <div 
          ref={contentRef}
          className="prose prose-slate dark:prose-invert max-w-none 
            prose-headings:font-serif prose-headings:text-primary 
            prose-p:font-serif prose-p:text-foreground/90 prose-p:leading-[1.8]
            prose-blockquote:border-primary/20 prose-blockquote:bg-primary/5 prose-blockquote:p-6 prose-blockquote:rounded-2xl prose-blockquote:italic
            prose-strong:text-primary prose-strong:font-bold"
        >
          <ReactMarkdown>{processedText}</ReactMarkdown>
        </div>
      </motion.div>

      <div className="mt-12 flex justify-center">
        <Button 
          variant="outline" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="rounded-full px-6"
        >
          <Icons.ChevronUp className="w-4 h-4 mr-2" /> Topo do Documento
        </Button>
      </div>
    </div>
  );
};

export default MagisteriumViewer;
