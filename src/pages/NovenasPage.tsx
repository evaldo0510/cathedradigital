import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Icons } from '@/constants';
import { EditorialHero } from '@/components/editorial/harmony/EditorialHero';
import { EditorialCard } from '@/components/editorial/harmony/EditorialCard';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { NOVENAS, type Novena } from '@/data/novenas';
import {
  downloadJson,
  exportAllProgress,
  findContinueTarget,
  importProgressPayload,
  loadAllProgress,
  type ImportMode,
} from '@/lib/novenas/progress';
import { toast } from 'sonner';

const FILTERS_STORAGE_KEY = 'cathedra:novenas:filters';


const CATEGORY_LABEL: Record<string, string> = {
  'Jesus Cristo': 'Cristo',
  'Virgem Maria': 'Maria',
  Santos: 'Santos',
  'Espírito Santo': 'Espírito',
};

type DurationBucket = 'curta' | 'media' | 'longa';

function estimateMinutesPerDay(n: Novena): number {
  // ~900 caracteres por minuto de leitura contemplativa.
  const avgChars =
    n.days.reduce((sum, d) => sum + d.meditation.length + (d.scripture?.length ?? 0), 0) /
    n.days.length;
  const readingMin = avgChars / 900;
  // + 3 min de orações fixas (abertura + final).
  return Math.max(3, Math.round(readingMin + 3));
}

function durationBucket(n: Novena): DurationBucket {
  const m = estimateMinutesPerDay(n);
  if (m <= 5) return 'curta';
  if (m <= 9) return 'media';
  return 'longa';
}

type StoredFilters = {
  q?: string;
  category?: string;
  patron?: string;
  duration?: 'all' | DurationBucket;
};

function readStoredFilters(): StoredFilters {
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredFilters;
  } catch {
    return {};
  }
}

const NovenasPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Prioridade: URL → localStorage → default.
  const initial = useMemo(() => {
    const stored = readStoredFilters();
    const get = (k: string, fallback = 'all') => searchParams.get(k) ?? stored[k as keyof StoredFilters] ?? fallback;
    return {
      query: (searchParams.get('q') ?? stored.q ?? '') as string,
      category: get('category'),
      patron: get('patron'),
      duration: get('duration') as 'all' | DurationBucket,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [query, setQuery] = useState(initial.query);
  const [category, setCategory] = useState<string>(initial.category);
  const [patron, setPatron] = useState<string>(initial.patron);
  const [duration, setDuration] = useState<'all' | DurationBucket>(initial.duration);
  const [showFilters, setShowFilters] = useState(
    initial.category !== 'all' || initial.patron !== 'all' || initial.duration !== 'all',
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingImportRef = useRef<unknown>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(NOVENAS.map((n) => n.category))).sort(),
    [],
  );
  const patrons = useMemo(
    () => Array.from(new Set(NOVENAS.map((n) => n.patron))).sort(),
    [],
  );

  // Sincroniza URL + localStorage sempre que filtros mudam.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const setOrDel = (k: string, v: string, empty: string) => {
      if (v === empty || v === '') next.delete(k);
      else next.set(k, v);
    };
    setOrDel('q', query, '');
    setOrDel('category', category, 'all');
    setOrDel('patron', patron, 'all');
    setOrDel('duration', duration, 'all');
    setSearchParams(next, { replace: true });

    try {
      localStorage.setItem(
        FILTERS_STORAGE_KEY,
        JSON.stringify({ q: query, category, patron, duration } satisfies StoredFilters),
      );
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, patron, duration]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return NOVENAS.filter((n) => {
      if (category !== 'all' && n.category !== category) return false;
      if (patron !== 'all' && n.patron !== patron) return false;
      if (duration !== 'all' && durationBucket(n) !== duration) return false;
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.patron.toLowerCase().includes(q) ||
        n.category.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q)
      );
    });
  }, [query, category, patron, duration]);

  const activeFilters =
    (category !== 'all' ? 1 : 0) + (patron !== 'all' ? 1 : 0) + (duration !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setQuery('');
    setCategory('all');
    setPatron('all');
    setDuration('all');
  };

  const continueTarget = useMemo(() => findContinueTarget(), []);
  const continueNovena = continueTarget
    ? NOVENAS.find((n) => n.slug === continueTarget.slug)
    : undefined;

  const allProgress = useMemo(() => loadAllProgress(), []);

  const handleExport = () => {
    const payload = exportAllProgress();
    if (Object.keys(payload.entries).length === 0) {
      toast.info('Nenhum progresso salvo para exportar.');
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(payload, `cathedra-novenas-${date}.json`);
    toast.success('Progresso exportado.');
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      pendingImportRef.current = parsed;
      setImportDialogOpen(true);
    } catch {
      toast.error('Arquivo JSON inválido.');
    }
  };

  const runImport = (mode: ImportMode) => {
    const parsed = pendingImportRef.current;
    pendingImportRef.current = null;
    setImportDialogOpen(false);
    if (!parsed) return;
    const result = importProgressPayload(parsed, { mode });
    if (result.errors.length) {
      toast.error(result.errors.join(' '));
      return;
    }
    const total = result.imported + result.merged;
    if (total === 0) {
      toast.info('Nenhum progresso compatível encontrado.');
      return;
    }
    const parts: string[] = [];
    if (result.imported) parts.push(`${result.imported} importada(s)`);
    if (result.merged) parts.push(`${result.merged} mesclada(s)`);
    if (result.skipped) parts.push(`${result.skipped} ignorada(s)`);
    toast.success(parts.join(' · '));
    setTimeout(() => window.location.reload(), 600);
  };



  return (
    <div className="w-full space-y-[var(--sp-xl)] pb-[var(--sp-xxl)]">
      <EditorialHero align="center" density="balanced">
        <EditorialHero.Eyebrow>Novenae</EditorialHero.Eyebrow>
        <EditorialHero.Title>Novenas</EditorialHero.Title>
        <EditorialHero.Subtitle>
          Nove dias de oração perseverante — no ritmo dos Apóstolos que esperavam com Maria o dom do Espírito.
        </EditorialHero.Subtitle>
      </EditorialHero>

      {/* Continuar */}
      {continueTarget && continueNovena && (
        <div className="max-w-2xl mx-auto">
          <EditorialCard
            as="button"
            interactive
            onClick={() => navigate(`/novenas/${continueTarget.slug}`)}
            className="w-full text-left border-[hsl(var(--rule-gold))]/40"
          >
            <EditorialCard.Eyebrow>Continuar onde parou</EditorialCard.Eyebrow>
            <EditorialCard.Title>{continueNovena.title}</EditorialCard.Title>
            <EditorialCard.Description>
              Dia {continueTarget.day} de {continueNovena.days.length} · {continueTarget.progress.completedDays.length} concluído(s)
            </EditorialCard.Description>
            <EditorialCard.CTA>
              <span className="inline-flex items-center gap-[var(--sp-xs)] type-rubrica text-primary">
                Retomar oração
                <Icons.ChevronRight className="w-3.5 h-3.5" />
              </span>
            </EditorialCard.CTA>
          </EditorialCard>
        </div>
      )}

      {/* Busca + toggle filtros */}
      <div className="w-full max-w-2xl mx-auto space-y-[var(--sp-s)]">
        <div className="relative group">
          <Icons.Search className="absolute left-[var(--sp-m)] top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar novena por título, padroeiro ou categoria..."
            aria-label="Buscar novena"
            className="w-full pl-[var(--sp-xl)] pr-[var(--sp-m)] py-[var(--sp-s)] rounded-[var(--radius)] border border-border bg-card text-foreground type-body focus:outline-none focus:ring-2 focus:ring-[hsl(var(--rule-gold))]/40 transition-all"
          />
        </div>

        <div className="flex items-center justify-between gap-[var(--sp-s)] flex-wrap">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center gap-[var(--sp-xs)] type-caption text-muted-foreground hover:text-primary transition-colors"
            aria-expanded={showFilters}
          >
            <Icons.Filter className="w-3.5 h-3.5" />
            Filtros
            {activeFilters > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
                {activeFilters}
              </span>
            )}
          </button>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="type-caption text-muted-foreground hover:text-primary transition-colors"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-[var(--sp-s)] p-[var(--sp-m)] rounded-[var(--radius)] border border-border/60 bg-card/40">
            <label className="space-y-1">
              <span className="type-rubrica text-muted-foreground">Tema</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-[var(--sp-s)] py-[var(--sp-xs)] rounded-md border border-border bg-background text-foreground type-caption focus:outline-none focus:ring-2 focus:ring-[hsl(var(--rule-gold))]/40"
              >
                <option value="all">Todos os temas</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="type-rubrica text-muted-foreground">Santo / Padroeiro</span>
              <select
                value={patron}
                onChange={(e) => setPatron(e.target.value)}
                className="w-full px-[var(--sp-s)] py-[var(--sp-xs)] rounded-md border border-border bg-background text-foreground type-caption focus:outline-none focus:ring-2 focus:ring-[hsl(var(--rule-gold))]/40"
              >
                <option value="all">Todos</option>
                {patrons.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="type-rubrica text-muted-foreground">Duração por dia</span>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value as typeof duration)}
                className="w-full px-[var(--sp-s)] py-[var(--sp-xs)] rounded-md border border-border bg-background text-foreground type-caption focus:outline-none focus:ring-2 focus:ring-[hsl(var(--rule-gold))]/40"
              >
                <option value="all">Qualquer duração</option>
                <option value="curta">Curta (até 5 min)</option>
                <option value="media">Média (6–9 min)</option>
                <option value="longa">Longa (10+ min)</option>
              </select>
            </label>
          </div>
        )}
      </div>

      {/* Lista */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--sp-m)]">
        {filtered.map((n) => {
          const mins = estimateMinutesPerDay(n);
          const prog = allProgress[n.slug];
          const done = prog?.completedDays.length ?? 0;
          return (
            <EditorialCard key={n.slug} as="a" href={`/novenas/${n.slug}`} interactive>
              <EditorialCard.Eyebrow>
                {CATEGORY_LABEL[n.category] ?? n.category} · ≈ {mins} min/dia
              </EditorialCard.Eyebrow>
              <EditorialCard.Title>{n.title}</EditorialCard.Title>
              <EditorialCard.Description>{n.summary}</EditorialCard.Description>
              {prog && (
                <p className="type-caption text-muted-foreground pt-[var(--sp-xs)]">
                  {done === n.days.length
                    ? 'Concluída'
                    : `Em andamento · dia ${prog.currentDay} · ${done}/${n.days.length}`}
                </p>
              )}
              <EditorialCard.CTA>
                <span className="inline-flex items-center gap-[var(--sp-xs)] type-rubrica text-primary">
                  {prog ? 'Continuar novena' : 'Começar novena'}
                  <Icons.ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </EditorialCard.CTA>
            </EditorialCard>
          );
        })}
        {filtered.length === 0 && (
          <p className="type-caption text-muted-foreground text-center col-span-full py-[var(--sp-l)]">
            Nenhuma novena encontrada com esses filtros.
          </p>
        )}
      </div>

      {/* Export/Import */}
      <div className="max-w-2xl mx-auto pt-[var(--sp-l)] border-t border-border/40 space-y-[var(--sp-s)]">
        <p className="type-rubrica text-muted-foreground text-center">Migrar entre dispositivos</p>
        <div className="flex flex-col sm:flex-row gap-[var(--sp-s)] justify-center">
          <Button variant="outline" onClick={handleExport} className="type-caption">
            <Icons.Download className="w-4 h-4 mr-2" />
            Exportar meu progresso
          </Button>
          <Button variant="outline" onClick={handleImportClick} className="type-caption">
            <Icons.Upload className="w-4 h-4 mr-2" />
            Importar progresso
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <p className="type-caption text-muted-foreground text-center">
          O arquivo JSON contém apenas seu progresso local — nada é enviado ao servidor.
        </p>
      </div>

      <p className="type-caption text-muted-foreground text-center pt-[var(--sp-l)]">
        Todas as novenas seguem a estrutura tradicional: abertura, meditação do dia, oração final e súplica pela intenção.
        <br />
        Voltar para <Link to="/oracao" className="text-primary hover:underline">Livro de Orações</Link>.
      </p>

      <AlertDialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Como importar este progresso?</AlertDialogTitle>
            <AlertDialogDescription>
              Você pode <strong>mesclar</strong> com o progresso atual (mantém os dias já concluídos e une com o arquivo) ou <strong>substituir</strong> tudo pelo conteúdo do arquivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-[var(--sp-xs)]">
            <AlertDialogCancel onClick={() => (pendingImportRef.current = null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => runImport('replace')}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Substituir
            </AlertDialogAction>
            <AlertDialogAction onClick={() => runImport('merge')}>
              Mesclar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NovenasPage;
