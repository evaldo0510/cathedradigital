import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../constants';
import { AppRoute } from '../../types';
import { supabase } from '@/integrations/supabase/client';

interface CommandItem {
  label: string;
  description: string;
  path?: string;
  icon: React.ReactNode;
  keywords: string[];
  type: 'page' | 'bible' | 'community';
}

const PAGE_COMMANDS: CommandItem[] = [
  { label: 'Dashboard', description: 'Página inicial', path: AppRoute.DASHBOARD, icon: <Icons.Home className="w-4 h-4" />, keywords: ['início', 'home', 'painel'], type: 'page' },
  { label: 'Bíblia Sagrada', description: 'Leitura bíblica', path: AppRoute.BIBLE, icon: <Icons.Book className="w-4 h-4" />, keywords: ['biblia', 'escritura', 'evangelho', 'genesis', 'salmos'], type: 'page' },
  { label: 'Catecismo (CIC)', description: 'Catecismo da Igreja Católica', path: AppRoute.CATECHISM, icon: <Icons.Cross className="w-4 h-4" />, keywords: ['catecismo', 'cic', 'doutrina', 'fé'], type: 'page' },
  { label: 'Santos', description: 'Hagiografia', path: AppRoute.SAINTS, icon: <Icons.SaintHalo className="w-4 h-4" />, keywords: ['santos', 'santo', 'santa', 'hagiografia', 'mártir'], type: 'page' },
  { label: 'Magistério', description: 'Encíclicas e documentos', path: AppRoute.MAGISTERIUM, icon: <Icons.ScrollText className="w-4 h-4" />, keywords: ['magistério', 'encíclica', 'concílio', 'papa', 'vaticano'], type: 'page' },
  { label: 'Dogmas', description: 'Dogmas da fé católica', path: AppRoute.DOGMAS, icon: <Icons.Star className="w-4 h-4" />, keywords: ['dogma', 'doutrina', 'verdade', 'fé'], type: 'page' },
  { label: 'Liturgia Diária', description: 'Leituras do dia', path: `${AppRoute.LITURGIA}?tab=liturgia`, icon: <Icons.Star className="w-4 h-4" />, keywords: ['liturgia', 'leitura', 'missa', 'evangelho do dia'], type: 'page' },
  { label: 'Santo Rosário', description: 'Oração do terço', path: AppRoute.ROSARY, icon: <Icons.Heart className="w-4 h-4" />, keywords: ['rosário', 'terço', 'ave maria', 'mistérios'], type: 'page' },
  { label: 'Via Crucis', description: 'Caminho da Cruz', path: AppRoute.VIA_CRUCIS, icon: <Icons.Cross className="w-4 h-4" />, keywords: ['via crucis', 'cruz', 'estações', 'paixão'], type: 'page' },
  { label: 'Oração e Devoção', description: 'Orações tradicionais', path: AppRoute.ORACAO, icon: <Icons.Heart className="w-4 h-4" />, keywords: ['oração', 'rezar', 'devoção', 'pai nosso'], type: 'page' },
  { label: 'Confissão', description: 'Guia e exame de consciência', path: AppRoute.POENITENTIA, icon: <Icons.Cross className="w-4 h-4" />, keywords: ['confissão', 'pecado', 'exame', 'consciência', 'penitência'], type: 'page' },
  { label: 'Suma Teológica', description: 'Opera Omnia de São Tomás', path: AppRoute.AQUINAS_OPERA, icon: <Icons.Aquinas className="w-4 h-4" />, keywords: ['aquinas', 'tomás', 'suma', 'teológica', 'escolástica'], type: 'page' },
  { label: 'Certamen (Quiz)', description: 'Teste seus conhecimentos', path: AppRoute.CERTAMEN, icon: <Icons.Certamen className="w-4 h-4" />, keywords: ['quiz', 'certamen', 'teste', 'perguntas'], type: 'page' },
  { label: 'Missal', description: 'Ordo Missae', path: `${AppRoute.LITURGIA}?tab=missal`, icon: <Icons.Book className="w-4 h-4" />, keywords: ['missal', 'missa', 'ordo', 'eucaristia'], type: 'page' },
  { label: 'Lectio Divina', description: 'Leitura orante', path: AppRoute.LECTIO_DIVINA, icon: <Icons.Feather className="w-4 h-4" />, keywords: ['lectio', 'divina', 'meditação', 'contemplação'], type: 'page' },
  { label: 'Breviário', description: 'Liturgia das Horas', path: AppRoute.BREVIARY, icon: <Icons.History className="w-4 h-4" />, keywords: ['breviário', 'horas', 'laudes', 'vésperas', 'ofício'], type: 'page' },
  { label: 'Trilhas de Estudo', description: 'Formação estruturada', path: AppRoute.TRILHAS, icon: <Icons.Layout className="w-4 h-4" />, keywords: ['trilha', 'estudo', 'formação', 'curso'], type: 'page' },
  { label: 'Colloquium IA', description: 'Assistente teológico', path: AppRoute.STUDY_MODE, icon: <Icons.Search className="w-4 h-4" />, keywords: ['ia', 'colloquium', 'perguntar', 'assistente', 'estudo'], type: 'page' },
  { label: 'Favoritos', description: 'Itens salvos', path: AppRoute.FAVORITES, icon: <Icons.Heart className="w-4 h-4" />, keywords: ['favoritos', 'salvos', 'bookmark'], type: 'page' },
  { label: 'Sobre', description: 'Sobre o Cathedra', path: AppRoute.ABOUT, icon: <Icons.Globe className="w-4 h-4" />, keywords: ['sobre', 'manifesto', 'about'], type: 'page' },
  { label: 'Login', description: 'Acessar conta', path: AppRoute.LOGIN, icon: <Icons.Users className="w-4 h-4" />, keywords: ['login', 'conta', 'entrar', 'cadastro'], type: 'page' },
  { label: 'Litanias', description: 'Orações de invocação', path: AppRoute.LITANIES, icon: <Icons.Heart className="w-4 h-4" />, keywords: ['litania', 'invocação', 'sagrado coração', 'nossa senhora'], type: 'page' },
  { label: 'Calendário Litúrgico', description: 'Festas e cores litúrgicas', path: `${AppRoute.LITURGIA}?tab=calendario`, icon: <Icons.History className="w-4 h-4" />, keywords: ['calendário', 'litúrgico', 'festas', 'solenidade', 'cores'], type: 'page' },
  { label: 'Comunidade', description: 'Discussões teológicas', path: AppRoute.COMMUNITY, icon: <Icons.Message className="w-4 h-4" />, keywords: ['comunidade', 'discussão', 'pergunta', 'fórum', 'teologia'], type: 'page' },
];

interface UnifiedResult {
  type: 'page' | 'bible' | 'community';
  label: string;
  description: string;
  path?: string;
  icon: React.ReactNode;
}

const CommandCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchMode, setSearchMode] = useState<'pages' | 'global'>('pages');
  const [globalResults, setGlobalResults] = useState<UnifiedResult[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();

  // Page filter (instant)
  const filteredPages = query
    ? PAGE_COMMANDS.filter(c => {
        const q = query.toLowerCase();
        return c.label.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.keywords.some(k => k.includes(q));
      })
    : PAGE_COMMANDS;

  // Global search (debounced)
  const runGlobalSearch = useCallback(async (q: string) => {
    if (q.length < 3) { setGlobalResults([]); return; }
    setGlobalLoading(true);
    const results: UnifiedResult[] = [];

    try {
      // Bible search
      const { data: bibleData } = await supabase.functions.invoke('bible-search', {
        body: { query: q },
      });
      if (bibleData?.results) {
        bibleData.results.slice(0, 5).forEach((v: any) => {
          results.push({
            type: 'bible',
            label: `${v.bookAbbrev} ${v.chapter},${v.verse}`,
            description: v.text.substring(0, 80) + '...',
            path: `/bible?book=${v.bookAbbrev}&ch=${v.chapter}`,
            icon: <Icons.Book className="w-4 h-4" />,
          });
        });
      }
    } catch {}

    try {
      // Community search
      const { data: communityData } = await supabase
        .from('community_posts')
        .select('id, title, content, category')
        .is('parent_id', null)
        .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
        .limit(5);
      if (communityData) {
        communityData.forEach(p => {
          results.push({
            type: 'community',
            label: p.title || 'Discussão',
            description: p.content.substring(0, 80) + '...',
            path: AppRoute.COMMUNITY,
            icon: <Icons.Message className="w-4 h-4" />,
          });
        });
      }
    } catch {}

    try {
      // Themes/Tags search
      const { data: themeData } = await supabase
        .from('themes')
        .select('id, name, slug, description')
        .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(5);
      if (themeData) {
        themeData.forEach(t => {
          results.push({
            type: 'page' as any, // Using page type to trigger navigation
            label: `Tema: ${t.name}`,
            description: t.description?.substring(0, 80) + '...',
            path: `${AppRoute.TEMAS}?tema=${t.slug}`,
            icon: <Icons.Star className="w-4 h-4 text-primary" />,
          });
        });
      }
    } catch {}

    setGlobalResults(results);
    setGlobalLoading(false);
  }, []);

  useEffect(() => {
    if (searchMode === 'global' && query.length >= 3) {
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => runGlobalSearch(query), 400);
    } else {
      setGlobalResults([]);
    }
    return () => clearTimeout(searchTimer.current);
  }, [query, searchMode, runGlobalSearch]);

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
      setSearchMode('pages');
      setGlobalResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => { setSelectedIndex(0); }, [query, searchMode]);

  const allItems = searchMode === 'pages' ? filteredPages : [
    ...filteredPages.slice(0, 3),
    ...globalResults,
  ];

  const go = useCallback((path?: string) => {
    if (path) navigate(path);
    setIsOpen(false);
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, allItems.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && allItems[selectedIndex]) { go(allItems[selectedIndex].path); }
    else if (e.key === 'Tab') { e.preventDefault(); setSearchMode(m => m === 'pages' ? 'global' : 'pages'); }
  };

  if (!isOpen) return null;

  const typeLabel = (type: string) => {
    switch (type) {
      case 'bible': return 'Bíblia';
      case 'community': return 'Comunidade';
      default: return 'Página';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]" onClick={() => setIsOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Mode tabs */}
        <div className="flex border-b border-border">
          <button onClick={() => setSearchMode('pages')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
              searchMode === 'pages' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
            }`}>
            Páginas
          </button>
          <button onClick={() => setSearchMode('global')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
              searchMode === 'global' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
            }`}>
            Busca Global
          </button>
        </div>

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Icons.Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchMode === 'pages' ? 'Buscar seção ou página...' : 'Buscar em Bíblia, Comunidade...'}
            className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-mono font-bold">TAB</kbd>
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-mono font-bold">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {globalLoading && (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-xs text-muted-foreground">Buscando...</span>
            </div>
          )}
          {!globalLoading && allItems.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8 italic">
              {searchMode === 'global' && query.length < 3
                ? 'Digite ao menos 3 caracteres para buscar...'
                : 'Nenhum resultado encontrado.'}
            </p>
          )}
          {!globalLoading && allItems.map((item, i) => (
            <button
              key={`${item.type}-${item.label}-${i}`}
              onClick={() => go(item.path)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                i === selectedIndex ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
              }`}
            >
              <span className="opacity-60">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{item.label}</p>
                <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                item.type === 'bible' ? 'bg-primary/10 text-primary' : item.type === 'community' ? 'bg-accent/20 text-accent-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {typeLabel(item.type)}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/50">
          <span className="text-[9px] text-muted-foreground">↑↓ navegar · Enter abrir · Tab alternar modo</span>
          <span className="text-[9px] text-muted-foreground font-mono">⌘K</span>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
