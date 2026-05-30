import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../constants';
import { AppRoute } from '../../types';
import { supabase } from '@/integrations/supabase/client';
import { useSearchSaints } from '@/hooks/useSaints';
import { CATECHISM_LOCAL_DATA } from '@/data/catechism';

interface CommandItem {
  label: string;
  description: string;
  path?: string;
  icon: React.ReactNode;
  keywords: string[];
  type: 'page' | 'bible' | 'community' | 'saint' | 'catechism' | 'journey' | 'glossary' | 'theme';
}

const PAGE_COMMANDS: CommandItem[] = [
  { label: 'Hoje', description: 'Liturgia e jornada diária', path: AppRoute.HOJE, icon: <Icons.Home className="w-spacing-md h-spacing-md" />, keywords: ['início', 'home', 'painel', 'hoje'], type: 'page' },
  { label: 'Bíblia Sagrada', description: 'Leitura bíblica', path: AppRoute.BIBLE, icon: <Icons.Book className="w-spacing-md h-spacing-md" />, keywords: ['biblia', 'escritura', 'evangelho', 'genesis', 'salmos'], type: 'page' },
  { label: 'Catecismo (CIC)', description: 'Catecismo da Igreja Católica', path: AppRoute.CATECHISM, icon: <Icons.Cross className="w-spacing-md h-spacing-md" />, keywords: ['catecismo', 'cic', 'doutrina', 'fé'], type: 'page' },
  { label: 'Explorar Catecismo', description: 'Busca e temas do Catecismo', path: AppRoute.CATECHISM_EXPLORER, icon: <Icons.Search className="w-spacing-md h-spacing-md" />, keywords: ['catecismo', 'explorar', 'tags', 'temas'], type: 'page' },
  { label: 'Santos', description: 'Hagiografia', path: AppRoute.SAINTS, icon: <Icons.SaintHalo className="w-spacing-md h-spacing-md" />, keywords: ['santos', 'santo', 'santa', 'hagiografia', 'mártir'], type: 'page' },
  { label: 'Magistério', description: 'Encíclicas e documentos', path: AppRoute.MAGISTERIUM, icon: <Icons.ScrollText className="w-spacing-md h-spacing-md" />, keywords: ['magistério', 'encíclica', 'concílio', 'papa', 'vaticano'], type: 'page' },
  { label: 'Dogmas', description: 'Dogmas da fé católica', path: AppRoute.DOGMAS, icon: <Icons.Star className="w-spacing-md h-spacing-md" />, keywords: ['dogma', 'doutrina', 'verdade', 'fé'], type: 'page' },
  { label: 'Enciclopédia', description: 'Glossário completo da fé', path: AppRoute.ENCYCLOPEDIA, icon: <Icons.Library className="w-spacing-md h-spacing-md" />, keywords: ['enciclopédia', 'glossário', 'termos', 'fé'], type: 'page' },
  { label: 'Aparições', description: 'Manifestações de Nossa Senhora', path: AppRoute.APARICOES, icon: <Icons.Heart className="w-spacing-md h-spacing-md" />, keywords: ['aparição', 'nossa senhora', 'maria', 'milagre'], type: 'page' },
  { label: 'Liturgia Diária', description: 'Leituras do dia', path: `${AppRoute.LITURGIA}?tab=liturgia`, icon: <Icons.Star className="w-spacing-md h-spacing-md" />, keywords: ['liturgia', 'leitura', 'missa', 'evangelho do dia'], type: 'page' },
  { label: 'Santo Rosário', description: 'Oração do terço', path: AppRoute.ROSARY, icon: <Icons.Heart className="w-spacing-md h-spacing-md" />, keywords: ['rosário', 'terço', 'ave maria', 'mistérios'], type: 'page' },
  { label: 'Via Crucis', description: 'Caminho da Cruz', path: AppRoute.VIA_CRUCIS, icon: <Icons.Cross className="w-spacing-md h-spacing-md" />, keywords: ['via crucis', 'cruz', 'estações', 'paixão'], type: 'page' },
  { label: 'Oração e Devoção', description: 'Orações tradicionais', path: AppRoute.ORACAO, icon: <Icons.Heart className="w-spacing-md h-spacing-md" />, keywords: ['oração', 'rezar', 'devoção', 'pai nosso'], type: 'page' },
  { label: 'Confissão', description: 'Guia e exame de consciência', path: AppRoute.POENITENTIA, icon: <Icons.Cross className="w-spacing-md h-spacing-md" />, keywords: ['confissão', 'pecado', 'exame', 'consciência', 'penitência'], type: 'page' },
  { label: 'Suma Teológica', description: 'Opera Omnia de São Tomás', path: AppRoute.AQUINAS_OPERA, icon: <Icons.Aquinas className="w-spacing-md h-spacing-md" />, keywords: ['aquinas', 'tomás', 'suma', 'teológica', 'escolástica'], type: 'page' },
  { label: 'Certamen (Quiz)', description: 'Teste seus conhecimentos', path: AppRoute.CERTAMEN, icon: <Icons.Certamen className="w-spacing-md h-spacing-md" />, keywords: ['quiz', 'certamen', 'teste', 'perguntas'], type: 'page' },
  { label: 'Missal', description: 'Ordo Missae', path: `${AppRoute.LITURGIA}?tab=missal`, icon: <Icons.Book className="w-spacing-md h-spacing-md" />, keywords: ['missal', 'missa', 'ordo', 'eucaristia'], type: 'page' },
  { label: 'Lectio Divina', description: 'Leitura orante', path: AppRoute.LECTIO_DIVINA, icon: <Icons.Feather className="w-spacing-md h-spacing-md" />, keywords: ['lectio', 'divina', 'meditação', 'contemplação'], type: 'page' },
  { label: 'Breviário', description: 'Liturgia das Horas', path: AppRoute.BREVIARY, icon: <Icons.History className="w-spacing-md h-spacing-md" />, keywords: ['breviário', 'horas', 'laudes', 'vésperas', 'ofício'], type: 'page' },
  { label: 'Trilhas de Estudo', description: 'Formação estruturada', path: AppRoute.TRILHAS, icon: <Icons.Layout className="w-spacing-md h-spacing-md" />, keywords: ['trilha', 'estudo', 'formação', 'curso'], type: 'page' },
  { label: 'Logos IA', description: 'Sua dúvida iluminada pela fé', path: AppRoute.STUDY_MODE, icon: <Icons.Search className="w-spacing-md h-spacing-md" />, keywords: ['ia', 'logos', 'perguntar', 'ajuda', 'estudo'], type: 'page' },
  { label: 'Favoritos', description: 'Itens salvos', path: AppRoute.FAVORITES, icon: <Icons.Heart className="w-spacing-md h-spacing-md" />, keywords: ['favoritos', 'salvos', 'bookmark'], type: 'page' },
  { label: 'Jornadas', description: 'Jornadas espirituais guiadas', path: AppRoute.JORNADAS, icon: <Icons.Compass className="w-spacing-md h-spacing-md" />, keywords: ['jornadas', 'jornada', 'espiritual', 'caminhada'], type: 'page' },
  { label: 'Sobre', description: 'Sobre o Cathedra', path: AppRoute.ABOUT, icon: <Icons.Globe className="w-spacing-md h-spacing-md" />, keywords: ['sobre', 'manifesto', 'about'], type: 'page' },
  { label: 'Login', description: 'Acessar conta', path: AppRoute.LOGIN, icon: <Icons.Users className="w-spacing-md h-spacing-md" />, keywords: ['login', 'conta', 'entrar', 'cadastro'], type: 'page' },
  { label: 'Litanias', description: 'Orações de invocação', path: AppRoute.LITANIES, icon: <Icons.Heart className="w-spacing-md h-spacing-md" />, keywords: ['litania', 'invocação', 'sagrado coração', 'nossa senhora'], type: 'page' },
  { label: 'Calendário Litúrgico', description: 'Festas e cores litúrgicas', path: `${AppRoute.LITURGIA}?tab=calendario`, icon: <Icons.History className="w-spacing-md h-spacing-md" />, keywords: ['calendário', 'litúrgico', 'festas', 'solenidade', 'cores'], type: 'page' },
  { label: 'Comunidade', description: 'Discussões teológicas', path: AppRoute.COMMUNITY, icon: <Icons.Message className="w-spacing-md h-spacing-md" />, keywords: ['comunidade', 'discussão', 'pergunta', 'fórum', 'teologia'], type: 'page' },
  { label: 'Busca Global', description: 'Pesquisar em todos os módulos', path: AppRoute.BUSCAR, icon: <Icons.Search className="w-spacing-md h-spacing-md" />, keywords: ['buscar', 'pesquisar', 'procurar', 'busca', 'global', 'search'], type: 'page' },
];

interface UnifiedResult {
  type: 'page' | 'bible' | 'community' | 'saint' | 'catechism' | 'journey' | 'glossary' | 'theme';
  label: string;
  description: string;
  path?: string;
  icon: React.ReactNode;
}

const TYPE_LABELS: Record<string, string> = {
  bible: 'Bíblia',
  community: 'Comunidade',
  saint: 'Santo',
  catechism: 'Catecismo',
  journey: 'Jornada',
  glossary: 'Glossário',
  theme: 'Tema',
  page: 'Página',
};

const TYPE_STYLES: Record<string, string> = {
  bible: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  community: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  saint: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  catechism: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  journey: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  glossary: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  theme: 'bg-primary/10 text-primary',
  page: 'bg-muted text-muted-foreground',
};

const CommandCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [globalResults, setGlobalResults] = useState<UnifiedResult[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [lastBible, setLastBible] = useState<{ book_abbr: string; chapter: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadLastRead = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await (supabase as any)
        .from('bible_chapters_read')
        .select('book_abbr, chapter')
        .eq('user_id', user.id)
        .order('read_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setLastBible(data);
    };
    loadLastRead();
  }, []);

  // Page filter (instant)
  const filteredPages = useMemo(() => {
    const commands = PAGE_COMMANDS.map(c => {
      if (c.path === AppRoute.BIBLE && lastBible) {
        return {
          ...c,
          path: `${AppRoute.BIBLE}?book=${lastBible.book_abbr}&ch=${lastBible.chapter}`,
          description: `Continuar em ${lastBible.book_abbr} ${lastBible.chapter}`,
        };
      }
      return c;
    });
    
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter(c => 
      c.label.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.keywords.some(k => k.includes(q))
    );
  }, [query, lastBible]);

  // Saints search via DB hook
  const { data: dbSaintsResults = [] } = useSearchSaints(query);
  
  const filteredSaints = useMemo(() => {
    if (query.length < 2 || !dbSaintsResults.length) return [];
    
    const results: UnifiedResult[] = dbSaintsResults.slice(0, 8).map(s => ({
      type: 'saint' as const,
      label: s.name,
      description: `${s.title} • Festa: ${s.feastDay}`,
      path: `${AppRoute.SAINTS}?saint=${s.id}`,
      icon: s.image ? (
        <img src={s.image} alt={s.name} className="w-spacing-md h-spacing-md rounded-premium-full object-cover" />
      ) : (
        <Icons.SaintHalo className="w-spacing-md h-spacing-md" />
      ),
    }));

    return results;
  }, [query, dbSaintsResults]);

  // Global search (debounced DB queries)
  const runGlobalSearch = useCallback(async (q: string) => {
    if (q.length < 3) { setGlobalResults([]); return; }
    setGlobalLoading(true);
    const results: UnifiedResult[] = [];

    const promises: Promise<void>[] = [
      // Bible search
      supabase.functions.invoke('bible-search', { body: { query: q } })
        .then(({ data }) => {
          if (data?.results) {
            data.results.slice(0, 4).forEach((v: any) => {
              results.push({
                type: 'bible',
                label: `${v.bookAbbrev} ${v.chapter},${v.verse}`,
                description: v.text?.substring(0, 80) + '...',
                path: `/bible?book=${v.bookAbbrev}&ch=${v.chapter}`,
                icon: <Icons.Book className="w-spacing-md h-spacing-md" />,
              });
            });
          }
        }).catch(() => {}),

      // Catechism search
      (async () => {
        // Search in local data
        const localMatches = Object.values(CATECHISM_LOCAL_DATA)
          .filter((p: any) => p.conteudo.toLowerCase().includes(q.toLowerCase()) || p.titulo.toLowerCase().includes(q.toLowerCase()))
          .slice(0, 4)
          .map((p: any) => ({
            type: 'catechism' as const,
            label: `§${p.paragraph} (Local)`,
            description: p.conteudo.substring(0, 80) + '...',
            path: `${AppRoute.CATECHISM}?p=${p.paragraph}`,
            icon: <Icons.Cross className="w-spacing-md h-spacing-md" />,
          }));
        
        results.push(...localMatches);

        // Search in DB cache (if not enough local matches or to get more)
        if (results.filter(r => r.type === 'catechism').length < 4) {
          const { data } = await supabase.from('catechism_cache')
            .select('paragraph, content')
            .ilike('content', `%${q}%`)
            .limit(4);
          
          data?.forEach((p: any) => {
            // Avoid duplicates
            if (!results.some(r => r.type === 'catechism' && r.label.includes(`§${p.paragraph}`))) {
              results.push({
                type: 'catechism',
                label: `§${p.paragraph}`,
                description: p.content.substring(0, 80) + '...',
                path: `${AppRoute.CATECHISM}?p=${p.paragraph}`,
                icon: <Icons.Cross className="w-spacing-md h-spacing-md" />,
              });
            }
          });
        }
      })().catch(() => {}),

      // Journeys search
      Promise.resolve(
        supabase.from('journeys')
          .select('id, title, description, category')
          .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
          .eq('is_active', true)
          .limit(4)
      ).then(({ data }) => {
          data?.forEach(j => {
            results.push({
              type: 'journey',
              label: j.title,
              description: j.description?.substring(0, 80) + '...',
              path: `/jornadas/${j.id}`,
              icon: <Icons.Compass className="w-spacing-md h-spacing-md" />,
            });
          });
        }).catch(() => {}),

      // Glossary search
      Promise.resolve(
        supabase.from('glossary')
          .select('term, definition, category')
          .or(`term.ilike.%${q}%,definition.ilike.%${q}%`)
          .limit(4)
      ).then(({ data }) => {
          data?.forEach(g => {
            results.push({
              type: 'glossary',
              label: g.term,
              description: g.definition.substring(0, 80) + '...',
              path: `${AppRoute.GLOSSARY}?q=${encodeURIComponent(g.term)}`,
              icon: <Icons.Glossary className="w-spacing-md h-spacing-md" />,
            });
          });
        }).catch(() => {}),

      // Themes search
      Promise.resolve(
        supabase.from('themes')
          .select('id, name, slug, description')
          .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
          .limit(4)
      ).then(({ data }) => {
          data?.forEach(t => {
            results.push({
              type: 'theme',
              label: t.name,
              description: t.description?.substring(0, 80) + '...',
              path: `${AppRoute.TEMAS}/${t.slug}`,
              icon: <Icons.Tag className="w-spacing-md h-spacing-md" />,
            });
          });
        }).catch(() => {}),

      // Community search
      Promise.resolve(
        supabase.from('community_posts')
          .select('id, title, content, category')
          .is('parent_id', null)
          .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
          .limit(3)
      ).then(({ data }) => {
          data?.forEach(p => {
            results.push({
              type: 'community',
              label: p.title || 'Discussão',
              description: p.content.substring(0, 80) + '...',
              path: AppRoute.COMMUNITY,
              icon: <Icons.Message className="w-spacing-md h-spacing-md" />,
            });
          });
        }).catch(() => {}),
    ];

    await Promise.allSettled(promises);
    setGlobalResults(results);
    setGlobalLoading(false);
  }, []);

  useEffect(() => {
    if (query.length >= 3) {
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => runGlobalSearch(query), 400);
    } else {
      setGlobalResults([]);
    }
    return () => clearTimeout(searchTimer.current);
  }, [query, runGlobalSearch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };

    const openHandler = () => setIsOpen(true);
    window.addEventListener('keydown', handler);
    window.addEventListener('open-command-center', openHandler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('open-command-center', openHandler);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setGlobalResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  // Unified results: pages first, then saints (local), then DB results
  const allItems = useMemo(() => {
    if (query.length < 2) return filteredPages;
    return [
      ...filteredPages.slice(0, 5),
      ...filteredSaints,
      ...globalResults,
    ];
  }, [filteredPages, filteredSaints, globalResults, query]);

  const go = useCallback((path?: string) => {
    if (path) navigate(path);
    setIsOpen(false);
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, allItems.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && allItems[selectedIndex]) { go(allItems[selectedIndex].path); }
  };

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  const resultCount = allItems.length;
  const hasGlobalResults = globalResults.length > 0;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh]" 
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Central de comandos e busca"
    >
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      <div
        className="relative w-full max-w-spacing-xl bg-card border border-border rounded-[2rem] shadow-premium overflow-hidden animate-in fade-in slide-in-from-top-spacing-md duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-spacing-sm px-spacing-md py-spacing-md border-b border-border" role="combobox" aria-haspopup="listbox" aria-expanded={isOpen} aria-owns="command-list">
          <Icons.Search className="w-spacing-md h-spacing-md text-primary shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar em tudo: Bíblia, Catecismo, Santos, Jornadas..."
            className="flex-1 bg-transparent text-foreground text-premium-sm placeholder:text-muted-foreground focus:outline-none"
            aria-autocomplete="list"
            aria-controls="command-list"
            aria-activedescendant={allItems[selectedIndex] ? `item-${selectedIndex}` : undefined}
          />

          {query && (
            <Button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground transition-colors">
              <Icons.X className="w-spacing-md h-spacing-md" />
            </Button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-spacing-xs py-spacing-3xs rounded bg-muted text-muted-foreground text-premium-xs font-mono font-bold">ESC</kbd>
        </div>

        {/* Loading indicator */}
        {globalLoading && (
          <div className="h-spacing-3xs w-full bg-muted overflow-hidden">
            <div className="h-full w-spacing-2xs/3 bg-primary animate-[shimmer_1s_ease-in-out_infinite] rounded-premium" 
                 style={{ animation: 'shimmer 1s ease-in-out infinite', animationName: 'none' }} />
            <div className="h-full bg-primary/60 animate-pulse rounded-premium" />
          </div>
        )}

        {/* Results */}
        <div ref={listRef} id="command-list" role="listbox" className="max-h-[55vh] overflow-y-auto py-spacing-2xs">
          {query.length >= 2 && !globalLoading && resultCount > 0 && (
            <div className="px-spacing-md py-spacing-xs text-premium-xs font-black uppercase tracking-widest text-muted-foreground" aria-live="polite">
              {resultCount} resultado{resultCount !== 1 ? 's' : ''} encontrado{resultCount !== 1 ? 's' : ''}
            </div>
          )}

          {allItems.length === 0 && !globalLoading && (
            <p className="text-center text-premium-sm text-muted-foreground py-spacing-xl italic">
              {query.length < 2
                ? 'Digite para buscar em todos os módulos...'
                : 'Nenhum resultado encontrado.'}
            </p>
          )}

          {allItems.map((item, i) => {
            // Group header
            const prevType = i > 0 ? allItems[i - 1].type : null;
            const showGroupHeader = item.type !== prevType && query.length >= 2;

            return (
              <React.Fragment key={`${item.type}-${item.label}-${i}`}>
                {showGroupHeader && (
                  <div className="px-spacing-md pt-spacing-sm pb-spacing-2xs text-premium-xs font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-spacing-xs" role="presentation">
                    <div className="w-spacing-md h-px bg-border" />
                    {TYPE_LABELS[item.type] || item.type}
                  </div>
                )}
                <Button
                  id={`item-${i}`}
                  role="option"
                  aria-selected={i === selectedIndex}
                  onClick={() => go(item.path)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full flex items-center gap-spacing-sm px-spacing-md py-spacing-xs text-left transition-all outline-none focus:ring-0 ${
                    i === selectedIndex 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-foreground hover:bg-muted/50'
                  }`}
                >
                  <span className={`p-spacing-2xs rounded-premium-full ${i === selectedIndex ? 'bg-primary/20' : 'bg-muted'}`}>
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-premium-sm font-semibold truncate">{item.label}</p>
                    <p className="text-premium-xs text-muted-foreground truncate">{item.description}</p>
                  </div>
                  <span className={`text-premium-xs font-black uppercase tracking-widest px-spacing-xs py-spacing-3xs rounded-premium-full ${
                    TYPE_STYLES[item.type] || 'bg-muted text-muted-foreground'
                  }`}>
                    {TYPE_LABELS[item.type] || item.type}
                  </span>
                </Button>
              </React.Fragment>
            );
          })}
        </div>


        {/* Footer */}
        <div className="flex items-center justify-between px-spacing-md py-spacing-xs border-t border-border bg-muted/30">
          <div className="flex items-center gap-spacing-sm">
            <span className="text-premium-xs text-muted-foreground">↑↓ navegar</span>
            <span className="text-premium-xs text-muted-foreground">↵ abrir</span>
          </div>
          <div className="flex items-center gap-spacing-xs">
            {hasGlobalResults && (
              <span className="text-premium-xs text-primary font-medium">
                Buscando em {new Set(globalResults.map(r => r.type)).size} módulos
              </span>
            )}
            <span className="text-premium-xs text-muted-foreground font-mono">⌘K</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
