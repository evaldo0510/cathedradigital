import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../constants';
import { AppRoute } from '../../types';

interface CommandItem {
  label: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  keywords: string[];
}

const COMMANDS: CommandItem[] = [
  { label: 'Dashboard', description: 'Página inicial', path: AppRoute.DASHBOARD, icon: <Icons.Home className="w-4 h-4" />, keywords: ['início', 'home', 'painel'] },
  { label: 'Bíblia Sagrada', description: 'Leitura bíblica', path: AppRoute.BIBLE, icon: <Icons.Book className="w-4 h-4" />, keywords: ['biblia', 'escritura', 'evangelho', 'genesis', 'salmos'] },
  { label: 'Catecismo (CIC)', description: 'Catecismo da Igreja Católica', path: AppRoute.CATECHISM, icon: <Icons.Cross className="w-4 h-4" />, keywords: ['catecismo', 'cic', 'doutrina', 'fé'] },
  { label: 'Santos', description: 'Hagiografia', path: AppRoute.SAINTS, icon: <Icons.Users className="w-4 h-4" />, keywords: ['santos', 'santo', 'santa', 'hagiografia', 'mártir'] },
  { label: 'Magistério', description: 'Encíclicas e documentos', path: AppRoute.MAGISTERIUM, icon: <Icons.Globe className="w-4 h-4" />, keywords: ['magistério', 'encíclica', 'concílio', 'papa', 'vaticano'] },
  { label: 'Dogmas', description: 'Dogmas da fé católica', path: AppRoute.DOGMAS, icon: <Icons.Star className="w-4 h-4" />, keywords: ['dogma', 'doutrina', 'verdade', 'fé'] },
  { label: 'Liturgia Diária', description: 'Leituras do dia', path: AppRoute.DAILY_LITURGY, icon: <Icons.Star className="w-4 h-4" />, keywords: ['liturgia', 'leitura', 'missa', 'evangelho do dia'] },
  { label: 'Santo Rosário', description: 'Oração do terço', path: AppRoute.ROSARY, icon: <Icons.Heart className="w-4 h-4" />, keywords: ['rosário', 'terço', 'ave maria', 'mistérios'] },
  { label: 'Via Crucis', description: 'Caminho da Cruz', path: AppRoute.VIA_CRUCIS, icon: <Icons.Cross className="w-4 h-4" />, keywords: ['via crucis', 'cruz', 'estações', 'paixão'] },
  { label: 'Oração e Devoção', description: 'Orações tradicionais', path: AppRoute.ORACAO, icon: <Icons.Heart className="w-4 h-4" />, keywords: ['oração', 'rezar', 'devoção', 'pai nosso'] },
  { label: 'Suma Teológica', description: 'Opera Omnia de São Tomás', path: AppRoute.AQUINAS_OPERA, icon: <Icons.History className="w-4 h-4" />, keywords: ['aquinas', 'tomás', 'suma', 'teológica', 'escolástica'] },
  { label: 'Certamen (Quiz)', description: 'Teste seus conhecimentos', path: AppRoute.CERTAMEN, icon: <Icons.Star className="w-4 h-4" />, keywords: ['quiz', 'certamen', 'teste', 'perguntas'] },
  { label: 'Missal', description: 'Ordo Missae', path: AppRoute.MISSAL, icon: <Icons.Book className="w-4 h-4" />, keywords: ['missal', 'missa', 'ordo', 'eucaristia'] },
  { label: 'Lectio Divina', description: 'Leitura orante', path: AppRoute.LECTIO_DIVINA, icon: <Icons.Feather className="w-4 h-4" />, keywords: ['lectio', 'divina', 'meditação', 'contemplação'] },
  { label: 'Breviário', description: 'Liturgia das Horas', path: AppRoute.BREVIARY, icon: <Icons.History className="w-4 h-4" />, keywords: ['breviário', 'horas', 'laudes', 'vésperas', 'ofício'] },
  { label: 'Trilhas de Estudo', description: 'Formação estruturada', path: AppRoute.TRILHAS, icon: <Icons.Layout className="w-4 h-4" />, keywords: ['trilha', 'estudo', 'formação', 'curso'] },
  { label: 'Colloquium IA', description: 'Assistente teológico', path: AppRoute.STUDY_MODE, icon: <Icons.Search className="w-4 h-4" />, keywords: ['ia', 'colloquium', 'perguntar', 'assistente', 'estudo'] },
  { label: 'Favoritos', description: 'Itens salvos', path: AppRoute.FAVORITES, icon: <Icons.Heart className="w-4 h-4" />, keywords: ['favoritos', 'salvos', 'bookmark'] },
  { label: 'Sobre', description: 'Sobre o Cathedra', path: AppRoute.ABOUT, icon: <Icons.Globe className="w-4 h-4" />, keywords: ['sobre', 'manifesto', 'about'] },
  { label: 'Login', description: 'Acessar conta', path: AppRoute.LOGIN, icon: <Icons.Users className="w-4 h-4" />, keywords: ['login', 'conta', 'entrar', 'cadastro'] },
];

const CommandCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filtered = query
    ? COMMANDS.filter(c => {
        const q = query.toLowerCase();
        return c.label.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.keywords.some(k => k.includes(q));
      })
    : COMMANDS;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  const go = useCallback((path: string) => {
    navigate(path);
    setIsOpen(false);
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && filtered[selectedIndex]) { go(filtered[selectedIndex].path); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]" onClick={() => setIsOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Icons.Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar seção, página ou recurso..."
            className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-mono font-bold">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8 italic">Nenhum resultado encontrado.</p>
          )}
          {filtered.map((item, i) => (
            <button
              key={item.path}
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
              {i === selectedIndex && (
                <kbd className="text-[9px] text-muted-foreground font-mono">↵</kbd>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/50">
          <span className="text-[9px] text-muted-foreground">Navegue com ↑↓ · Enter para abrir</span>
          <span className="text-[9px] text-muted-foreground font-mono">⌘K</span>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
