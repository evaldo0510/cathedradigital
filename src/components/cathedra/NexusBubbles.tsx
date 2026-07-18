import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getSpiritualInsight } from '@/services/aiService';
import { useNavigate } from 'react-router-dom';
import { normalizeText, cn } from '@/lib/utils';
import { getSearchTermsForTag } from '@/lib/tagNormalization';
import { type TagContent, fetchNexusTagContent } from '@/lib/nexusContent';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AppRoute } from '@/types';
import { supabase } from '@/integrations/supabase/client';

import { Icons } from '@/constants';
import { BubbleTag, getTagIcon } from './BubbleTag';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { type ProfileId, PROFILES } from './SpiritualQuiz';
import { useRovingTabindex } from './TabUtils';
import { useSpiritualProfile } from '@/hooks/useSpiritualProfile';
import { useIsMobile } from '@/hooks/use-mobile';
import BibleVersePopover from './BibleVersePopover';
import { NexusDebugPanel, type NexusDebugInfo } from './NexusDebugPanel';
import { NEXUS_KIND_PRESETS, NEXUS_HEADER, NEXUS_EMPTY, NEXUS_ERROR, type NexusKind } from './nexus/nexusPresets';
import {
  NEXUS_STATE_KEY,
  readPersistedState,
  writePersistedState,
  reduceSectionKeyboard,
  isFocusToggleKey,
  sectionLiveMessage,
  restoredLiveMessage,
  closedLiveMessage,
  focusModeLiveMessage,
  syncedSectionLiveMessage,
  syncedFocusModeLiveMessage,
  invalidDeepLinkLiveMessage,
  validateDeepLinkKind,
  parseNexusHash,
  buildNexusHash,
  buildNexusShareUrl,
  type PersistedNexusState,
} from '@/lib/nexusState';
import { useFocusTrap } from '@/lib/useFocusTrap';
import {
  trackNexusShown,
  trackNexusClick,
  trackNexusDestination,
  trackNexusFailed,
} from '@/lib/nexusTelemetry';




interface Tag {
  id: string;
  slug: string;
  label: string;
  emoji: string;
  category: string;
  priorityGroup?: string;
}

// Reusing TagContent from @/lib/nexusContent

interface NexusBubblesProps {
  profileId?: ProfileId | null;
}

interface TagBubbleProps {
  tag: Tag;
  index: number;
  isSuggested?: boolean;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  profileId?: ProfileId | null;
  navigateOnClick?: boolean;
  priorityGroup?: string;
  size?: 'xs' | 'sm' | 'md';
}


// Estado persistido, atalhos, deep-link e mensagens aria-live vivem em @/lib/nexusState
// (isolados para permitir testes unitários determinísticos).



export const TagBubble: React.FC<TagBubbleProps> = ({ tag, index, isSuggested, tabIndex, onKeyDown, onClick, className, profileId, navigateOnClick, priorityGroup, size }) => {

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [content, setContent] = useState<TagContent[]>([]);
  const [logosInsight, setLogosInsight] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{ startTime: number; endTime?: number; source?: 'supabase' | 'ia' | 'both' }>({ startTime: 0 });
  const [debug, setDebug] = useState<NexusDebugInfo>({});

  // Navigation stack for context-to-context breadcrumbs
  const [navHistory, setNavHistory] = useState<Tag[]>([tag]);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [visitedKinds, setVisitedKinds] = useState<Set<string>>(new Set());
  const [liveMessage, setLiveMessage] = useState<string>('');
  const sectionRefs = React.useRef<Record<string, HTMLElement | null>>({});
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  // Guard: evita reentrada infinita entre "aplicar estado externo" e "persistir".
  const applyingExternalRef = React.useRef(false);
  const shareCopiedRef = React.useRef<number | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  useFocusTrap(panelRef, open);

  const currentTag = navHistory[navHistory.length - 1];


  const fetchContentForTag = async (targetTag: Tag) => {
    const startTime = performance.now();
    const correlationId = `nexus-${targetTag.slug || targetTag.id}-${Date.now()}`;
    setMetrics({ startTime });
    setStatus('loading');
    setErrorDetails(null);
    setContent([]);
    setLogosInsight(null);
    setDebug({ correlationId, startedAt: startTime, request: { tag: targetTag, profileId } });

    try {
      const uniqueResults = await fetchNexusTagContent(targetTag);
      setContent(uniqueResults);

      // IA Fetch
      try {
        const result = await getSpiritualInsight(targetTag.label, undefined, profileId);
        if (!result.error && result.content) {
          setLogosInsight(result.content);
        }
      } catch (iaErr) {
        console.error(`[Nexus Diagnostic] AI Fetch failed.`, iaErr);
      }

      const endedAt = performance.now();
      setMetrics(prev => ({ ...prev, endTime: endedAt, source: 'both' }));
      setDebug(prev => ({
        ...prev,
        endedAt,
        source: 'fetchNexusTagContent',
        response: { count: uniqueResults.length, sample: uniqueResults.slice(0, 3) },
      }));
      setStatus('success');
    } catch (e: any) {
      const endedAt = performance.now();
      console.error(`[Nexus Diagnostic] Error fetching ${targetTag.label}:`, e);
      setErrorDetails(e.message || 'Erro desconhecido');
      setMetrics(prev => ({ ...prev, endTime: endedAt }));
      setDebug(prev => ({ ...prev, endedAt, error: String(e?.message || e), response: null }));
      setStatus('error');
    }
  };


  const handlePushTag = (newTag: Tag) => {
    setNavHistory(prev => [...prev, newTag]);
    setActiveSectionIdx(0);
    setVisitedKinds(new Set());
    setLiveMessage(`Explorando ${newTag.label}`);
    fetchContentForTag(newTag);
  };

  const handlePopTag = (index: number) => {
    const newHistory = navHistory.slice(0, index + 1);
    setNavHistory(newHistory);
    setActiveSectionIdx(0);
    setLiveMessage(`Voltando para ${newHistory[newHistory.length - 1].label}`);
    fetchContentForTag(newHistory[newHistory.length - 1]);
  };



  const { data: allThemes } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('themes').select('*').order('name');
      if (error) throw error;
      return (data || []).map((t: any) => ({
        id: t.id,
        label: t.name,
        slug: t.slug,
        emoji: t.emoji || '⛪',
        category: t.category || 'Geral'
      })) as Tag[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const prefetchTag = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['tag-contents', tag.id, tag.label],
      queryFn: () => fetchNexusTagContent(tag),
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient, tag.id, tag.label]);

  const isMobile = useIsMobile();

  // STAB-NEXUS-P0 Etapa 2: resolveLink completo (bible/catechism/magisterium/
  // saint/theme/journey). Retorna null para tipos sem rota pública (father/
  // council/canon) — bubble será ocultado, nunca <span> morto.
  const resolveLink = useCallback((c: TagContent): string | null => {
    const meta = c.metadata ?? {};
    switch (c.type) {
      case 'bible': {
        if (meta.book && meta.chapter) {
          const verse = meta.verse ? `&verse=${meta.verse}` : '';
          return `/bible?book=${meta.book}&ch=${meta.chapter}${verse}`;
        }
        return null;
      }
      case 'catechism': {
        const p = meta.paragraph ?? meta.number;
        return p ? `${AppRoute.CATECHISM}?p=${p}` : null;
      }
      case 'magisterium': {
        const docId = meta.document_id ?? meta.documentId ?? meta.slug ?? c.id;
        return docId ? `/magisterium/${docId}` : null;
      }
      case 'saint': {
        const ident = meta.slug ?? meta.id ?? c.id;
        return ident ? `/santos/${ident}` : null;
      }
      case 'theme': {
        const slug = meta.slug ?? c.id;
        return slug ? `/temas/${slug}` : null;
      }
      case 'journey':
        return c.id ? `/jornadas/${c.id}` : null;
      default:
        return null;
    }
  }, []);

  // Agrupa o conteúdo já retornado pelo Knowledge Engine em capítulos narrativos.
  // Ordem estável seguindo NEXUS_KIND_PRESETS.order.
  // STAB-NEXUS-P0 Etapa 2/3: filtra itens sem rota resolvível (father/council/canon
  // ou nós órfãos) e emite `nexus.failed` — nenhum <span> morto chega ao render.
  const narrativeSections = useMemo(() => {
    const groups = new Map<NexusKind, TagContent[]>();
    for (const c of content) {
      const kind = (c.type as NexusKind);
      if (!NEXUS_KIND_PRESETS[kind]) {
        trackNexusFailed({
          tagId: currentTag.id,
          tagSlug: currentTag.slug,
          type: c.type,
          id: c.id,
          reason: 'no-preset',
        });
        continue;
      }
      // Item precisa de rota (resolveLink) OU popover Bíblia (book+chapter).
      const link = resolveLink(c);
      const canBiblePopover =
        c.type === 'bible' && !!c.metadata?.book && Number.isFinite(Number(c.metadata?.chapter));
      if (!link && !canBiblePopover) {
        trackNexusFailed({
          tagId: currentTag.id,
          tagSlug: currentTag.slug,
          type: c.type,
          id: c.id,
          reason: 'no-route',
        });
        continue;
      }
      const arr = groups.get(kind) ?? [];
      arr.push(c);
      groups.set(kind, arr);
    }
    return Array.from(groups.entries())
      .map(([kind, items]) => ({ kind, preset: NEXUS_KIND_PRESETS[kind], items }))
      .sort((a, b) => a.preset.order - b.preset.order);
  }, [content, resolveLink, currentTag.id, currentTag.slug]);

  const contextPath = navHistory.length > 1
    ? navHistory.map(t => t.label).join(' · ')
    : currentTag.label;

  // STAB-NEXUS-P0 Etapa 2: resolveLink completo.
  // Retorna string com rota válida ou null (bubble será ocultado — nunca <span> morto).



  // Snapshot da posição de leitura no momento em que o painel abre.
  // Ao fechar, restauramos o scroll — o leitor volta ao trecho exato.
  const savedScrollRef = React.useRef<number | null>(null);

  const persistReturn = useCallback(() => {
    try {
      sessionStorage.setItem(
        'nexus:return',
        JSON.stringify({
          path: window.location.pathname + window.location.search,
          scrollY: savedScrollRef.current ?? window.scrollY,
          tagId: currentTag.id,
          ts: Date.now(),
        }),
      );
    } catch {
      /* sessionStorage indisponível — ignoramos silenciosamente */
    }
  }, [currentTag.id]);

  const handleOpenChange = useCallback((val: boolean) => {
    if (navigateOnClick && val) {
      navigate(`${AppRoute.TEMAS}/${tag.slug}`);
      return;
    }
    if (val) {
      savedScrollRef.current = window.scrollY;
      persistReturn();
      fetchContentForTag(tag);
    } else if (savedScrollRef.current !== null) {
      const y = savedScrollRef.current;
      // Radix libera o body-scroll-lock após o próximo frame; agendamos depois.
      requestAnimationFrame(() => {
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    }
    setOpen(val);
    if (!val) {
      writePersistedState(null);
      setLiveMessage(closedLiveMessage());
      setFocusMode(false);
      // limpa hash de deep-link ao fechar
      if (window.location.hash && window.location.hash.includes('nexus=')) {
        const url = window.location.pathname + window.location.search;
        window.history.replaceState(null, '', url);
      }
    }
  }, [navigateOnClick, navigate, tag, fetchContentForTag, persistReturn]);

  const navigateInternal = useCallback((path: string) => {
    persistReturn();
    setOpen(false);
    requestAnimationFrame(() => {
      navigate(path);
      // STAB-NEXUS-P0 Etapa 5: destino resolvido.
      trackNexusDestination({
        tagId: currentTag.id,
        tagSlug: currentTag.slug,
        type: 'internal',
        url: path,
      });
    });
  }, [persistReturn, navigate, currentTag.id, currentTag.slug]);

  // STAB-NEXUS-P0 Etapa 5: registra `nexus.shown` uma vez por sessão de painel
  // aberto, quando há pelo menos um bubble navegável.
  const shownRef = React.useRef(false);
  useEffect(() => {
    if (!open) {
      shownRef.current = false;
      return;
    }
    if (shownRef.current || narrativeSections.length === 0) return;
    shownRef.current = true;
    trackNexusShown({
      tagId: currentTag.id,
      tagSlug: currentTag.slug,
      itemCount: narrativeSections.reduce((n, s) => n + s.items.length, 0),
      kinds: narrativeSections.map(s => s.kind),
    });
  }, [open, narrativeSections, currentTag.id, currentTag.slug]);

  // Restaura estado persistido OU abre via deep link (#nexus=slug[:kind]).
  useEffect(() => {
    // Deep link tem prioridade se corresponder a esta tag.
    const deep = parseNexusHash(window.location.hash);
    if (deep && deep.slug === tag.slug) {
      savedScrollRef.current = window.scrollY;
      setOpen(true);
      fetchContentForTag(tag);
      setLiveMessage(restoredLiveMessage(tag.label));
      return;
    }
    const saved = readPersistedState();
    if (!saved || saved.tagId !== tag.id) return;
    if (saved.path !== window.location.pathname + window.location.search) return;
    setVisitedKinds(new Set(saved.visitedKinds || []));
    setActiveSectionIdx(saved.activeSectionIdx || 0);
    setFocusMode(!!saved.focusMode);
    savedScrollRef.current = window.scrollY;
    setOpen(true);
    fetchContentForTag(tag);
    setLiveMessage(restoredLiveMessage(tag.label));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Após o conteúdo carregar, se veio deep-link com kind, seleciona a seção.
  // Se o kind for inválido, abre na seção padrão e anuncia via aria-live.
  useEffect(() => {
    if (!open || narrativeSections.length === 0) return;
    const deep = parseNexusHash(window.location.hash);
    if (!deep || deep.slug !== currentTag.slug || !deep.kind) return;
    const available = narrativeSections.map(s => s.kind);
    const { valid } = validateDeepLinkKind(deep.kind, available);
    if (!valid) {
      setActiveSectionIdx(0);
      setLiveMessage(invalidDeepLinkLiveMessage(deep.kind));
      // reescreve o hash para refletir a seção padrão
      const fallbackKind = available[0];
      if (fallbackKind) {
        const url = window.location.pathname + window.location.search +
          buildNexusHash(currentTag.slug, fallbackKind);
        window.history.replaceState(null, '', url);
      }
      return;
    }
    const idx = narrativeSections.findIndex(s => s.kind === deep.kind);
    if (idx >= 0 && idx !== activeSectionIdx) setActiveSectionIdx(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, narrativeSections.length]);

  // Persiste estado enquanto o painel está aberto (inclui focusMode).
  useEffect(() => {
    if (!open) return;
    if (applyingExternalRef.current) return; // evita eco do sync entre abas
    const currentKind = narrativeSections[activeSectionIdx]?.kind;
    writePersistedState({
      tagId: currentTag.id,
      tagSlug: currentTag.slug,
      path: window.location.pathname + window.location.search,
      historyIds: navHistory.map(h => h.id),
      activeSectionIdx,
      visitedKinds: Array.from(visitedKinds),
      focusMode,
      ts: Date.now(),
    });
    // Reflete a seção atual no hash para deep-link compartilhável.
    if (currentKind) {
      const newHash = buildNexusHash(currentTag.slug, currentKind);
      if (window.location.hash !== newHash) {
        const url = window.location.pathname + window.location.search + newHash;
        window.history.replaceState(null, '', url);
      }
    }
  }, [open, currentTag.id, currentTag.slug, navHistory, activeSectionIdx, visitedKinds, focusMode, narrativeSections]);

  // Sincronização entre abas via evento `storage` — com anúncios detalhados.
  useEffect(() => {
    if (!open) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== NEXUS_STATE_KEY || !e.newValue) return;
      try {
        const remote = JSON.parse(e.newValue) as PersistedNexusState;
        if (remote.tagId !== currentTag.id) return;
        applyingExternalRef.current = true;

        const remoteIdx = typeof remote.activeSectionIdx === 'number'
          ? remote.activeSectionIdx
          : activeSectionIdx;
        const sectionChanged = remoteIdx !== activeSectionIdx;
        const remoteFocus = !!remote.focusMode;
        const focusChanged = remoteFocus !== focusMode;

        if (typeof remote.activeSectionIdx === 'number') {
          setActiveSectionIdx(remote.activeSectionIdx);
        }
        setVisitedKinds(new Set(remote.visitedKinds || []));
        setFocusMode(remoteFocus);

        // Prioriza anúncio da mudança mais significativa.
        if (sectionChanged && narrativeSections[remoteIdx]) {
          setLiveMessage(
            syncedSectionLiveMessage(
              remoteIdx,
              narrativeSections.length,
              narrativeSections[remoteIdx].preset.eyebrow,
            ),
          );
        } else if (focusChanged) {
          setLiveMessage(syncedFocusModeLiveMessage(remoteFocus));
        } else {
          setLiveMessage('Painel sincronizado com outra aba.');
        }

        // libera guard no próximo tick para o efeito de persistência não reescrever
        setTimeout(() => { applyingExternalRef.current = false; }, 0);
      } catch {
        /* payload inválido — ignora */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [open, currentTag.id, activeSectionIdx, focusMode, narrativeSections]);

  // Marca seção ativa como visitada, faz scroll e anuncia via aria-live.
  useEffect(() => {
    if (!open || narrativeSections.length === 0) return;
    const current = narrativeSections[activeSectionIdx];
    if (!current) return;
    setVisitedKinds(prev => {
      if (prev.has(current.kind)) return prev;
      const next = new Set(prev);
      next.add(current.kind);
      return next;
    });
    setLiveMessage(sectionLiveMessage(activeSectionIdx, narrativeSections.length, current.preset.eyebrow));
    const el = sectionRefs.current[current.kind];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeSectionIdx, open, narrativeSections]);

  // Atalhos: Alt+←/→ ou [/] alternam seções; `f` alterna modo foco.
  const handlePanelKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isFocusToggleKey(e)) {
      // não sequestrar quando o foco está em input/textarea/contenteditable
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target?.isContentEditable) return;
      e.preventDefault();
      setFocusMode(prev => {
        const next = !prev;
        setLiveMessage(focusModeLiveMessage(next));
        return next;
      });
      return;
    }
    const next = reduceSectionKeyboard(e, activeSectionIdx, narrativeSections.length);
    if (next !== null && next !== activeSectionIdx) {
      e.preventDefault();
      setActiveSectionIdx(next);
    }
  }, [activeSectionIdx, narrativeSections.length]);

  const handleShareDeepLink = useCallback(async () => {
    const currentKind = narrativeSections[activeSectionIdx]?.kind;
    const url = buildNexusShareUrl(
      window.location.origin + window.location.pathname + window.location.search,
      currentTag.slug,
      currentKind,
    );
    try {
      if (navigator.share) {
        await navigator.share({ title: currentTag.label, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setCopiedShare(true);
      setLiveMessage('Link do Nexus copiado para a área de transferência.');
      if (shareCopiedRef.current) window.clearTimeout(shareCopiedRef.current);
      shareCopiedRef.current = window.setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      /* usuário cancelou ou clipboard indisponível */
    }
  }, [activeSectionIdx, currentTag.label, currentTag.slug, narrativeSections]);


  return (
    <Sheet open={navigateOnClick ? false : open} onOpenChange={handleOpenChange}>

      <SheetTrigger asChild>
        <BubbleTag
          label={tag.label}
          emoji={tag.emoji}
          index={index}
          isSelected={open}
          isSuggested={isSuggested}
          size={size}
          onClick={(e) => {
            if (onClick) {
              onClick(e);
            } else if (navigateOnClick) {
              navigate(`${AppRoute.TEMAS}/${tag.slug}`);
            }
          }}
          onKeyDown={onKeyDown}
          onMouseEnter={prefetchTag}
          tabIndex={tabIndex}
          data-roving-item={true}
          data-priority={priorityGroup}
          className={className}
        />
      </SheetTrigger>

      <SheetContent
        ref={panelRef}
        side={isMobile ? 'bottom' : 'right'}
        data-testid="nexus-popover"
        data-nexus-panel
        aria-labelledby={`nexus-title-${currentTag.id}`}
        aria-describedby={`nexus-desc-${currentTag.id}`}
        onEscapeKeyDown={() => handleOpenChange(false)}
        onKeyDown={handlePanelKeyDown}
        className={cn(
          'p-0 border-l border-primary/10 bg-background overflow-hidden',
          'flex flex-col',
          'transition-none',
          'data-[state=open]:duration-700 data-[state=closed]:duration-500',
          'data-[state=open]:ease-[cubic-bezier(0.22,1,0.36,1)]',
          'data-[state=closed]:ease-[cubic-bezier(0.4,0,0.2,1)]',
          'motion-reduce:transition-none motion-reduce:animate-none',
          isMobile
            ? 'h-[90vh] max-h-[90vh] rounded-t-[24px] border-t border-l-0'
            : 'w-full sm:max-w-[460px] md:max-w-[38vw]',
        )}
      >
        {/* Anúncios para leitores de tela — mudanças de seção, restauração, etc. */}
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {liveMessage}
        </div>

        {/* Cabeçalho editorial — margem do livro. Ocultado no modo foco. */}
        <header
          data-focus-mode={focusMode ? 'true' : 'false'}
          className={cn(
            'px-spacing-xl flex-shrink-0 transition-all',
            focusMode ? 'pt-spacing-lg pb-spacing-xs' : 'pt-spacing-2xl pb-spacing-lg',
          )}
        >
          {/* No modo foco reduzimos ao essencial: só um handle mínimo + toggles. */}
          {!focusMode && (
            <>
              <div className="flex items-baseline justify-between gap-spacing-sm mb-spacing-md">
                <div className="flex items-baseline gap-spacing-sm">
                  <Icons.Compass className="w-3 h-3 text-secondary" strokeWidth={1.4} aria-hidden="true" />
                  <span className="text-[10px] uppercase tracking-[0.32em] text-secondary font-medium">
                    {NEXUS_HEADER.eyebrow}
                  </span>
                </div>
                <div className="flex items-center gap-spacing-xs">
                  <button
                    type="button"
                    onClick={handleShareDeepLink}
                    data-testid="nexus-share-deeplink"
                    aria-label={
                      copiedShare
                        ? 'Link copiado'
                        : `Compartilhar seção atual do Nexus${
                            narrativeSections[activeSectionIdx]?.preset.eyebrow
                              ? `: ${narrativeSections[activeSectionIdx].preset.eyebrow}`
                              : ''
                          }`
                    }
                    className="inline-flex items-center justify-center h-11 min-w-11 px-spacing-xs text-[10px] uppercase tracking-[0.28em] text-primary/60 hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 rounded-sm"
                  >
                    {copiedShare ? '✓' : '⧉'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFocusMode(true);
                      setLiveMessage(focusModeLiveMessage(true));
                    }}
                    aria-label="Ativar modo foco (F)"
                    aria-pressed="false"
                    data-testid="nexus-focus-toggle"
                    className="inline-flex items-center justify-center h-11 min-w-11 px-spacing-xs text-[10px] uppercase tracking-[0.28em] text-primary/60 hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 rounded-sm"
                  >
                    Foco
                  </button>
                </div>
              </div>
              <SheetTitle asChild>
                <h2
                  id={`nexus-title-${currentTag.id}`}
                  className="font-serif italic text-primary text-2xl md:text-[1.75rem] leading-[1.15] tracking-tight font-normal"
                >
                  {NEXUS_HEADER.subtitle}
                </h2>
              </SheetTitle>
              <SheetDescription
                id={`nexus-desc-${currentTag.id}`}
                className="mt-spacing-sm text-[11px] uppercase tracking-[0.28em] text-primary/50"
              >
                <span className="sr-only">Conexões teológicas para </span>
                {contextPath}
              </SheetDescription>
              <div aria-hidden className="mt-spacing-md h-px w-[40px] bg-secondary/60" />

              {/* Indicador de seções visitadas + navegação por teclado */}
              {narrativeSections.length > 1 && (
                <nav
                  aria-label="Seções do Nexus"
                  data-testid="nexus-section-dots"
                  className="mt-spacing-md flex items-center gap-spacing-xs"
                >
                  {narrativeSections.map((s, i) => {
                    const visited = visitedKinds.has(s.kind);
                    const active = i === activeSectionIdx;
                    return (
                      <button
                        key={s.kind}
                        type="button"
                        onClick={() => setActiveSectionIdx(i)}
                        aria-current={active ? 'true' : undefined}
                        aria-label={`${s.preset.eyebrow}${visited ? ' (visitada)' : ''}`}
                        title={s.preset.eyebrow}
                        className={cn(
                          'group inline-flex items-center justify-center h-6 w-6 rounded-full transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60',
                        )}
                      >
                        <span
                          className={cn(
                            'block rounded-full transition-all',
                            active
                              ? 'h-[8px] w-[8px] bg-secondary'
                              : visited
                                ? 'h-[6px] w-[6px] bg-secondary/60'
                                : 'h-[6px] w-[6px] bg-primary/20 group-hover:bg-primary/40',
                          )}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-spacing-sm text-[9px] uppercase tracking-[0.28em] text-primary/40 hidden md:inline">
                    Alt+←/→
                  </span>
                </nav>
              )}
            </>
          )}

          {focusMode && (
            <div className="flex items-center justify-between gap-spacing-sm">
              {/* Título mínimo, exigido pelo Radix Dialog para a11y */}
              <SheetTitle asChild>
                <span
                  id={`nexus-title-${currentTag.id}`}
                  className="text-[10px] uppercase tracking-[0.32em] text-primary/60"
                >
                  {currentTag.label}
                  {narrativeSections[activeSectionIdx] && (
                    <> · <span className="text-secondary">{narrativeSections[activeSectionIdx].preset.eyebrow}</span></>
                  )}
                </span>
              </SheetTitle>
              <SheetDescription id={`nexus-desc-${currentTag.id}`} className="sr-only">
                Modo foco ativo. {contextPath}
              </SheetDescription>
              <button
                type="button"
                onClick={() => {
                  setFocusMode(false);
                  setLiveMessage(focusModeLiveMessage(false));
                }}
                aria-label="Sair do modo foco (F)"
                aria-pressed="true"
                data-testid="nexus-focus-exit"
                className="inline-flex items-center justify-center h-11 min-w-11 px-spacing-xs text-[10px] uppercase tracking-[0.28em] text-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 rounded-sm"
              >
                Sair
              </button>
            </div>
          )}
        </header>




        {/* Corpo — sequência editorial */}
        <div className="flex-1 overflow-y-auto px-spacing-xl pb-spacing-2xl scrollbar-none">
          {/* Contemplação Logos como pull-quote editorial, quando presente */}
          {logosInsight && !focusMode && (
            <motion.blockquote
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-spacing-2xl border-l-2 border-secondary/40 pl-spacing-lg"
            >
              <p className="font-serif italic text-primary/70 text-lg leading-relaxed">
                {logosInsight}
              </p>
              <footer className="mt-spacing-sm text-[10px] uppercase tracking-[0.28em] text-secondary/70">
                Contemplação Logos
              </footer>
            </motion.blockquote>
          )}

          {status === 'loading' && (
            <div className="py-spacing-2xl space-y-spacing-sm" aria-live="polite">
              <p className="text-[10px] uppercase tracking-[0.32em] text-primary/40 animate-pulse">
                Reunindo referências…
              </p>
              <div className="h-px w-1/3 bg-primary/10 animate-pulse" />
              <div className="h-px w-2/3 bg-primary/10 animate-pulse" />
              <div className="h-px w-1/2 bg-primary/10 animate-pulse" />
            </div>
          )}

          {status === 'error' && content.length === 0 && (
            <div className="py-spacing-2xl">
              <p className="text-[10px] uppercase tracking-[0.32em] text-secondary/80 mb-spacing-sm">
                {NEXUS_ERROR.title}
              </p>
              <p className="font-serif italic text-primary/70 text-lg leading-relaxed mb-spacing-lg">
                {NEXUS_ERROR.body}
              </p>
              <button
                type="button"
                onClick={() => fetchContentForTag(currentTag)}
                data-testid="retry-button"
                className="text-[11px] uppercase tracking-[0.28em] text-primary border-b border-primary pb-[3px] hover:text-secondary hover:border-secondary transition-colors"
              >
                {NEXUS_ERROR.cta} ↻
              </button>
              <NexusDebugPanel info={debug} />
            </div>
          )}

          {status !== 'loading' && narrativeSections.length > 0 && (
            <div className="space-y-spacing-2xl" data-testid="nexus-sections">
              {(focusMode
                ? narrativeSections.filter((_, i) => i === activeSectionIdx)
                : narrativeSections
              ).map((section, sIdx, arr) => (
                <motion.section
                  key={section.kind}
                  ref={(el) => { sectionRefs.current[section.kind] = el as unknown as HTMLElement | null; }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: sIdx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  aria-label={section.preset.eyebrow}
                  aria-current={sIdx === activeSectionIdx ? 'true' : undefined}
                  data-section-kind={section.kind}
                  data-testid={sIdx === activeSectionIdx ? 'nexus-active-section' : undefined}
                >
                  <header className="mb-spacing-md">
                    <span className="block text-[10px] uppercase tracking-[0.32em] text-secondary/80 font-medium">
                      {section.preset.eyebrow}
                    </span>
                    {section.preset.whisper && (
                      <span className="mt-spacing-xs block font-serif italic text-primary/50 text-sm leading-snug">
                        {section.preset.whisper}
                      </span>
                    )}
                  </header>


                  <ul className="space-y-spacing-lg">
                    {section.items.map((c, i) => {
                      const link = resolveLink(c);
                      const isBible = c.type === 'bible';
                      const bibleAbbr: string | undefined = isBible ? c.metadata?.book : undefined;
                      const bibleChapter: number | undefined = isBible ? Number(c.metadata?.chapter) : undefined;
                      const bibleVerse: number | undefined = isBible && c.metadata?.verse ? Number(c.metadata.verse) : undefined;
                      const canPopover = isBible && !!bibleAbbr && Number.isFinite(bibleChapter);
                      const meta = c.metadata?.author || c.metadata?.year || c.metadata?.date;

                      return (
                        <li key={c.id || i}>
                          <h3 className="font-serif italic text-primary text-xl md:text-2xl leading-[1.15] mb-spacing-xs">
                            {c.title}
                          </h3>
                          {meta && (
                            <p className="text-[10px] uppercase tracking-[0.28em] text-primary/45 mb-spacing-sm">
                              {[c.metadata?.author, c.metadata?.year || c.metadata?.date].filter(Boolean).join(' · ')}
                            </p>
                          )}
                          {c.content_text && (
                            <p className="font-serif italic text-primary/65 text-base leading-relaxed mb-spacing-md">
                              {c.content_text}
                            </p>
                          )}
                          <div className="flex items-baseline gap-spacing-md">
                            {canPopover ? (
                              <BibleVersePopover
                                abbr={bibleAbbr!}
                                chapter={bibleChapter!}
                                verse={bibleVerse}
                                label={section.preset.cta}
                              />
                            ) : link ? (
                              <button
                                type="button"
                                data-testid="nexus-bubble-cta"
                                data-nexus-type={c.type}
                                onClick={() => {
                                  trackNexusClick({
                                    tagId: currentTag.id,
                                    tagSlug: currentTag.slug,
                                    type: c.type,
                                    id: c.id,
                                    destination: link,
                                  });
                                  navigateInternal(link);
                                }}
                                className="text-[11px] uppercase tracking-[0.28em] text-primary border-b border-primary pb-[3px] hover:text-secondary hover:border-secondary transition-colors min-h-11"
                              >
                                {section.preset.cta} →
                              </button>
                            ) : null /* STAB-NEXUS-P0: nunca renderizar <span> morto */}
                          </div>

                          {/* Fio curatorial entre itens da mesma seção */}
                          {i < section.items.length - 1 && (
                            <div aria-hidden className="mt-spacing-lg h-px w-[24px] bg-primary/15" />
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  {/* Separador editorial entre capítulos */}
                  {sIdx < arr.length - 1 && (
                    <div aria-hidden className="mt-spacing-2xl mx-auto h-px w-[40px] bg-secondary/40" />
                  )}
                </motion.section>
              ))}
            </div>
          )}

          {/* Continue este caminho — sempre presente após as seções */}
          {status !== 'loading' && !focusMode && (
            <motion.section
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              aria-label="Continue este caminho"
              className="mt-spacing-3xl pt-spacing-xl border-t border-primary/10"
            >
              <span className="block text-[10px] uppercase tracking-[0.32em] text-secondary/80 font-medium mb-spacing-md">
                {NEXUS_KIND_PRESETS.theme.eyebrow}
              </span>
              <h3 className="font-serif italic text-primary text-2xl leading-[1.1] mb-spacing-xs">
                {currentTag.label}
              </h3>
              <p className="font-serif italic text-primary/55 text-base leading-relaxed mb-spacing-md">
                Percorra este tema em profundidade — Escritura, Catecismo, Magistério, Santos.
              </p>
              <button
                type="button"
                onClick={() => navigateInternal(`${AppRoute.TEMAS}/${currentTag.slug}`)}
                className="text-[11px] uppercase tracking-[0.28em] text-primary border-b border-primary pb-[3px] hover:text-secondary hover:border-secondary transition-colors min-h-11"
              >
                {NEXUS_KIND_PRESETS.theme.cta} →
              </button>

              {/* Temas convergentes — evocação, não grade */}
              {allThemes && allThemes.filter(t => t.category === currentTag.category && t.id !== currentTag.id).length > 0 && (
                <div className="mt-spacing-xl">
                  <span className="block text-[9px] uppercase tracking-[0.32em] text-primary/40 mb-spacing-sm">
                    A mesma luz em outros textos
                  </span>
                  <ul className="flex flex-col gap-spacing-xs">
                    {allThemes
                      .filter(t => t.category === currentTag.category && t.id !== currentTag.id)
                      .slice(0, 4)
                      .map((t) => (
                        <li key={t.id}>
                          <button
                            type="button"
                            onClick={() => handlePushTag(t)}
                            className="group inline-flex items-baseline gap-spacing-sm hover:text-secondary transition-colors min-h-11"
                          >
                            <span className="w-[2px] h-[14px] bg-secondary/40 group-hover:bg-secondary transition-colors" aria-hidden />
                            <span className="font-serif italic text-lg text-primary/85 group-hover:text-secondary">
                              {t.label}
                            </span>
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </motion.section>
          )}

          {/* Estado vazio — nunca esconde o painel */}
          {status === 'success' && content.length === 0 && !logosInsight && (
            <div className="py-spacing-xl">
              <span className="block text-[10px] uppercase tracking-[0.32em] text-secondary/80 mb-spacing-sm">
                {NEXUS_EMPTY.title}
              </span>
              <p className="font-serif italic text-primary/65 text-lg leading-relaxed mb-spacing-lg">
                {NEXUS_EMPTY.body}
              </p>
              <NexusDebugPanel info={debug} />
            </div>
          )}

          {/* Breadcrumb discreto — só quando o usuário navegou em profundidade */}
          {navHistory.length > 1 && !focusMode && (
            <nav aria-label="Caminho percorrido" className="mt-spacing-2xl pt-spacing-lg border-t border-primary/10">
              <span className="block text-[9px] uppercase tracking-[0.32em] text-primary/40 mb-spacing-sm">
                Caminho percorrido
              </span>
              <ol className="flex flex-wrap items-baseline gap-x-spacing-sm gap-y-spacing-xs">
                {navHistory.map((h, idx) => (
                  <li key={`${h.id}-${idx}`} className="flex items-baseline gap-spacing-xs">
                    {idx > 0 && <span className="text-primary/25 text-xs">·</span>}
                    <button
                      type="button"
                      onClick={() => handlePopTag(idx)}
                      disabled={idx === navHistory.length - 1}
                      data-bubble-nav="breadcrumb"
                      aria-current={idx === navHistory.length - 1 ? 'page' : undefined}
                      className={cn(
                        'font-serif italic text-sm min-h-11 transition-colors',
                        idx === navHistory.length - 1
                          ? 'text-secondary'
                          : 'text-primary/60 hover:text-secondary',
                      )}
                    >
                      {h.label}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};


const NexusBubbles: React.FC<NexusBubblesProps> = ({ profileId: propProfileId }) => {
  const { profileId: hookProfileId } = useSpiritualProfile();
  const profileId = propProfileId || hookProfileId;
  const navigate = useNavigate();
  const filteredRef = React.useRef<HTMLDivElement>(null);
  const suggestedRef = React.useRef<HTMLDivElement>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('name');
      
      if (!error && data) {
        // Icons.Map themes to the Icons.Tag interface expected by the component
        const mappedTags = data.map((t: any) => ({
          id: t.id,
          slug: t.slug,
          label: t.name,
          emoji: t.emoji || '⛪',
          category: t.category || 'Geral'
        })) as Tag[];
        setTags(mappedTags);
      }
      setLoading(false);
    };

    fetchTags();
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(tags.map(t => t.category))];
    return cats.sort();
  }, [tags]);

  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return tags;
    const query = normalizeText(searchQuery);
    return tags.filter(t => normalizeText(t.label).includes(query));
  }, [tags, searchQuery]);

  // Priority grouping for better visualization
  const priorityGroups = useMemo(() => {
    const suggested = tags.filter(t => t.priorityGroup === 'suggested');
    const essential = tags.filter(t => t.priorityGroup === 'essential');
    return { suggested, essential };
  }, [tags]);

  const { handleKeyDown } = useRovingTabindex(filteredTags.length);

  return (
    <div className="space-y-spacing-2xl">
      <div className="relative group max-w-spacing-md mx-auto">
        <div className="absolute inset-0 bg-primary/5 rounded-premium-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <Icons.Search className="absolute left-spacing-md top-spacing-2xs/2 -translate-y-1/2 w-spacing-md h-spacing-md text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input 
          type="text" 
          placeholder="Buscar temas e conexões..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-spacing-2xl pl-spacing-2xl pr-spacing-md rounded-premium-full bg-card border border-border/40 focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all text-premium-sm outline-none"
        />
      </div>

      <div className="space-y-spacing-3xl">
        {searchQuery.trim() ? (
          <div className="space-y-spacing-lg">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 text-center">Resultados da Busca</h3>
            <div 
              ref={filteredRef}
              className="flex flex-wrap justify-center gap-spacing-sm"
            >
              {filteredTags.map((tag, i) => (
                <TagBubble 
                  key={tag.id} 
                  tag={tag} 
                  index={i} 
                  profileId={profileId}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {categories.map((cat, idx) => {
              const catTags = tags.filter(t => t.category === cat);
              return (
                <section key={cat} className="space-y-spacing-lg">
                  <div className="flex items-center gap-spacing-lg">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 whitespace-nowrap">{cat}</h3>
                    <div className="h-px flex-1 bg-border/20" />
                  </div>
                  <div className="flex flex-wrap gap-spacing-sm">
                    {catTags.map((tag, i) => (
                      <TagBubble 
                        key={tag.id} 
                        tag={tag} 
                        index={i} 
                        profileId={profileId}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </div>

      {!loading && filteredTags.length === 0 && (
        <div className="text-center py-spacing-3xl space-y-spacing-md">
          <Icons.Search className="w-spacing-2xl h-spacing-2xl text-muted-foreground/60 mx-auto" />
          <p className="text-muted-foreground font-serif italic">Nenhum tema encontrado para "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
};

export default NexusBubbles;