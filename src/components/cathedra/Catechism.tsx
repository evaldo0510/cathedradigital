import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import ShareButton from './ShareButton';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';
import CrossReferencePanel from './CrossReferencePanel';
import NotesPanel from './NotesPanel';
import BibleVersePopover from './BibleVersePopover';
import { getCatechismCrossRefs } from '@/data/cross-references';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFavorites } from '@/hooks/useFavorites';
import { useCatechismParagraph, usePrefetchCatechismParagraph } from '@/hooks/useCatechismParagraph';

// Map of common Bible book names/abbreviations in Portuguese to API abbreviations
const BIBLE_BOOK_MAP: Record<string, string> = {
  'Gn': 'gn', 'Gên': 'gn', 'Gênesis': 'gn',
  'Ex': 'ex', 'Êx': 'ex', 'Êxodo': 'ex',
  'Lv': 'lv', 'Levítico': 'lv',
  'Nm': 'nm', 'Números': 'nm',
  'Dt': 'dt', 'Deuteronômio': 'dt',
  'Js': 'js', 'Josué': 'js',
  'Jz': 'jz', 'Juízes': 'jz',
  'Rt': 'rt', 'Rute': 'rt',
  '1Sm': '1sm', '1 Sm': '1sm', '1Samuel': '1sm',
  '2Sm': '2sm', '2 Sm': '2sm', '2Samuel': '2sm',
  '1Rs': '1rs', '1 Rs': '1rs', '1Reis': '1rs',
  '2Rs': '2rs', '2 Rs': '2rs', '2Reis': '2rs',
  '1Cr': '1cr', '1 Cr': '1cr', '1Crônicas': '1cr',
  '2Cr': '2cr', '2 Cr': '2cr', '2Crônicas': '2cr',
  'Esd': 'esd', 'Esdras': 'esd',
  'Ne': 'ne', 'Neemias': 'ne',
  'Tb': 'tb', 'Tobias': 'tb',
  'Jt': 'jt', 'Judite': 'jt',
  'Est': 'est', 'Ester': 'est',
  '1Mc': '1mc', '1 Mc': '1mc', '1Macabeus': '1mc',
  '2Mc': '2mc', '2 Mc': '2mc', '2Macabeus': '2mc',
  'Jó': 'job', 'Job': 'job',
  'Sl': 'sl', 'Salmos': 'sl', 'Salmo': 'sl',
  'Pr': 'pr', 'Provérbios': 'pr',
  'Ecl': 'ecl', 'Eclesiastes': 'ecl', 'Qo': 'ecl',
  'Ct': 'ct', 'Cânticos': 'ct', 'Cântico': 'ct',
  'Sb': 'sb', 'Sabedoria': 'sb',
  'Eclo': 'eclo', 'Eclesiástico': 'eclo', 'Sir': 'eclo',
  'Is': 'is', 'Isaías': 'is',
  'Jr': 'jr', 'Jeremias': 'jr',
  'Lm': 'lm', 'Lamentações': 'lm',
  'Br': 'br', 'Baruc': 'br',
  'Ez': 'ez', 'Ezequiel': 'ez',
  'Dn': 'dn', 'Daniel': 'dn',
  'Os': 'os', 'Oseias': 'os',
  'Jl': 'jl', 'Joel': 'jl',
  'Am': 'am', 'Amós': 'am',
  'Ab': 'ab', 'Abdias': 'ab',
  'Jn': 'jn', 'Jonas': 'jn',
  'Mq': 'mq', 'Miqueias': 'mq',
  'Na': 'na', 'Naum': 'na',
  'Hab': 'hab', 'Habacuc': 'hab',
  'Sf': 'sf', 'Sofonias': 'sf',
  'Ag': 'ag', 'Ageu': 'ag',
  'Zc': 'zc', 'Zacarias': 'zc',
  'Ml': 'ml', 'Malaquias': 'ml',
  'Mt': 'mt', 'Mateus': 'mt',
  'Mc': 'mc', 'Marcos': 'mc',
  'Lc': 'lc', 'Lucas': 'lc',
  'Jo': 'jo', 'João': 'jo',
  'At': 'at', 'Atos': 'at',
  'Rm': 'rm', 'Romanos': 'rm',
  '1Cor': '1co', '1 Cor': '1co', '1Co': '1co', '1 Co': '1co', '1Coríntios': '1co',
  '2Cor': '2co', '2 Cor': '2co', '2Co': '2co', '2 Co': '2co', '2Coríntios': '2co',
  'Gl': 'gl', 'Gálatas': 'gl',
  'Ef': 'ef', 'Efésios': 'ef',
  'Fl': 'fl', 'Filipenses': 'fl',
  'Cl': 'cl', 'Colossenses': 'cl',
  '1Ts': '1ts', '1 Ts': '1ts', '1Tessalonicenses': '1ts',
  '2Ts': '2ts', '2 Ts': '2ts', '2Tessalonicenses': '2ts',
  '1Tm': '1tm', '1 Tm': '1tm', '1Timóteo': '1tm',
  '2Tm': '2tm', '2 Tm': '2tm', '2Timóteo': '2tm',
  'Tt': 'tt', 'Tito': 'tt',
  'Fm': 'fm', 'Filemon': 'fm', 'Filêmon': 'fm',
  'Hb': 'hb', 'Hebreus': 'hb',
  'Tg': 'tg', 'Tiago': 'tg',
  '1Pd': '1pe', '1 Pd': '1pe', '1Pe': '1pe', '1 Pe': '1pe', '1Pedro': '1pe',
  '2Pd': '2pe', '2 Pd': '2pe', '2Pe': '2pe', '2 Pe': '2pe', '2Pedro': '2pe',
  '1Jo': '1jo', '1 Jo': '1jo', '1João': '1jo',
  '2Jo': '2jo', '2 Jo': '2jo', '2João': '2jo',
  '3Jo': '3jo', '3 Jo': '3jo', '3João': '3jo',
  'Jd': 'jd', 'Judas': 'jd',
  'Ap': 'ap', 'Apocalipse': 'ap',
};

function lookupAbbr(raw: string): string | null {
  const trimmed = raw.trim();
  if (BIBLE_BOOK_MAP[trimmed]) return BIBLE_BOOK_MAP[trimmed];
  // Try normalized
  for (const [key, val] of Object.entries(BIBLE_BOOK_MAP)) {
    if (key.toLowerCase() === trimmed.toLowerCase()) return val;
  }
  return null;
}

interface ParsedSegment {
  type: 'text' | 'bibleRef';
  value: string;
  abbr?: string;
  chapter?: number;
  verse?: number;
}

function parseBibleReferences(text: string): ParsedSegment[] {
  // Match patterns like: "Jo 3,16", "1 Cor 13,1-13", "Rm 8,28", "cf. Gn 1,1", "Sl 23"
  const bookNames = Object.keys(BIBLE_BOOK_MAP).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(
    `(?:cf\\.?\\s*)?\\b(${bookNames.join('|')})\\s+(\\d{1,3})(?:[,.:](\\d{1,3})(?:\\s*[-–]\\s*\\d{1,3})?)?`,
    'g'
  );

  const segments: ParsedSegment[] = [];
  let lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    const bookRaw = match[1];
    const chapter = parseInt(match[2]);
    const verse = match[3] ? parseInt(match[3]) : undefined;
    const abbr = lookupAbbr(bookRaw);

    if (abbr) {
      segments.push({
        type: 'bibleRef',
        value: match[0],
        abbr,
        chapter,
        verse,
      });
    } else {
      segments.push({ type: 'text', value: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', value: text }];
}

const CatechismContent: React.FC<{ paragraph: number; onNavigateToBible?: (abbr: string, chapter: number) => void }> = ({ paragraph, onNavigateToBible }) => {
  const { data, isLoading, isError } = useCatechismParagraph(paragraph);
  const prefetch = usePrefetchCatechismParagraph();

  useEffect(() => {
    if (paragraph < 2865) prefetch(paragraph + 1);
    if (paragraph > 1) prefetch(paragraph - 1);
  }, [paragraph, prefetch]);

  const segments = useMemo(() => {
    if (!data?.content) return [];
    return parseBibleReferences(data.content);
  }, [data?.content]);

  if (isLoading) {
    return (
      <div className="reader-text text-foreground/90 leading-[2] text-lg md:text-xl space-y-3 py-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="reader-text text-destructive font-serif text-base py-8">
        Erro ao carregar o parágrafo §{paragraph}. Verifique sua conexão.
      </div>
    );
  }

  return (
    <div className="reader-text text-foreground/90 leading-[2] text-lg md:text-xl">
      <p className="font-serif">
        {segments.map((seg, i) =>
          seg.type === 'bibleRef' && seg.abbr ? (
            <BibleVersePopover
              key={i}
              abbr={seg.abbr}
              chapter={seg.chapter!}
              verse={seg.verse}
              label={seg.value}
              onNavigate={onNavigateToBible}
            />
          ) : (
            <React.Fragment key={i}>{seg.value}</React.Fragment>
          )
        )}
      </p>
    </div>
  );
};


type ViewMode = 'parts' | 'sections' | 'reading';

const Catechism: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('parts');
  const [selectedPart, setSelectedPart] = useState<typeof CIC_SECTIONS[0] | null>(null);
  const [selectedSection, setSelectedSection] = useState<typeof CIC_SECTIONS[0]['sections'][0] | null>(null);
  const [currentParagraph, setCurrentParagraph] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCrossRefs, setShowCrossRefs] = useState(true);
  const { toggleFavorite, isFavorite } = useFavorites();

  const crossRefs = getCatechismCrossRefs(currentParagraph);

  // Handle deep-link from Bible cross-references (?p=1324)
  useEffect(() => {
    const p = searchParams.get('p');
    if (p) {
      const num = parseInt(p);
      if (!isNaN(num) && num >= 1 && num <= 2865) {
        navigateToParagraph(num);
      }
    }
  }, [searchParams]);

  const navigateToParagraph = useCallback((num: number) => {
    for (const part of CIC_SECTIONS) {
      for (const sec of part.sections) {
        if (num >= sec.paragraphs[0] && num <= sec.paragraphs[1]) {
          setSelectedPart(part);
          setSelectedSection(sec);
          setCurrentParagraph(num);
          setViewMode('reading');
          return;
        }
      }
    }
  }, []);

  const handleSearch = () => {
    const num = parseInt(searchQuery);
    if (!isNaN(num) && num >= 1 && num <= 2865) {
      navigateToParagraph(num);
    }
  };

  const handleNavigateToBible = useCallback((abbr: string, chapter: number) => {
    navigate(`/bible?book=${abbr}&ch=${chapter}`);
  }, [navigate]);

  const goBack = () => {
    if (viewMode === 'reading') { setViewMode('sections'); setSelectedSection(null); }
    else if (viewMode === 'sections') { setViewMode('parts'); setSelectedPart(null); }
  };

  // Reading view
  if (viewMode === 'reading' && selectedSection && selectedPart) {
    const [start, end] = selectedSection.paragraphs;
    const fromDashboard = searchParams.get('from') === 'dashboard';
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {fromDashboard && (
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Dashboard
          </button>
        )}
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all">
            <Icons.ArrowDown className="w-5 h-5 rotate-90 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">{selectedPart.part}</span>
            <h1 className="text-xl font-serif font-bold text-foreground truncate">{selectedSection.title}</h1>
            <p className="text-sm text-muted-foreground">§{start} — §{end}</p>
          </div>
          {crossRefs.length > 0 && (
            <button onClick={() => setShowCrossRefs(!showCrossRefs)}
              className={`p-2 rounded-xl border transition-all ${showCrossRefs ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground'}`}
              title="Nexus Theologicus">
              <Icons.Cross className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Paragraph navigator */}
        <div className="flex items-center gap-3 justify-center">
          <button disabled={currentParagraph <= start} onClick={() => setCurrentParagraph(currentParagraph - 1)}
            className="px-3 py-2 rounded-xl bg-card border border-border text-sm font-bold disabled:opacity-30 hover:bg-primary/10 transition-all">
            ← Anterior
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl">
            <span className="text-[10px] font-black text-primary">§</span>
            <input
              type="number" min={start} max={end} value={currentParagraph}
              onChange={e => { const v = parseInt(e.target.value); if (v >= start && v <= end) setCurrentParagraph(v); }}
              className="w-16 text-center bg-transparent text-foreground font-bold text-sm focus:outline-none"
            />
          </div>
          <button disabled={currentParagraph >= end} onClick={() => setCurrentParagraph(currentParagraph + 1)}
            className="px-3 py-2 rounded-xl bg-card border border-border text-sm font-bold disabled:opacity-30 hover:bg-primary/10 transition-all">
            Próximo →
          </button>
        </div>

        {/* Cross references */}
        {showCrossRefs && crossRefs.length > 0 && (
          <CrossReferencePanel
            type="catechism"
            bibleRefs={crossRefs}
            onNavigateToBible={handleNavigateToBible}
          />
        )}

        {/* Content */}
        <div className="bg-card border border-border rounded-3xl p-8 md:p-12 space-y-6">
          <div className="text-center space-y-2 pb-6 border-b border-border">
            <span className="text-3xl font-serif font-bold text-primary">§{currentParagraph}</span>
            <button
              onClick={() => toggleFavorite({ type: 'catechism', title: `CIC §${currentParagraph}`, content: `Catecismo da Igreja Católica, parágrafo §${currentParagraph}` })}
              className="ml-3 inline-flex align-middle"
              title={isFavorite('catechism', `CIC §${currentParagraph}`) ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
            >
              <Icons.Heart className={`w-5 h-5 transition-all ${isFavorite('catechism', `CIC §${currentParagraph}`) ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-primary'}`} />
            </button>
            <ShareButton
              title={`Catecismo §${currentParagraph}`}
              text={`Leia o Catecismo da Igreja Católica, §${currentParagraph} — Cathedra Digital`}
              url={`${window.location.origin}/catechism?p=${currentParagraph}`}
              className="border-0 p-0 hover:bg-transparent"
            />
            <NotesPanel contentType="catechism" contentId={`${currentParagraph}`} contentLabel={`§${currentParagraph}`} />
          </div>
          <CatechismContent paragraph={currentParagraph} />
        </div>

        {/* Quick nav */}
        <div className="flex flex-wrap gap-1 justify-center">
          {Array.from({ length: Math.min(20, end - start + 1) }, (_, i) => start + i).map(p => (
            <button key={p} onClick={() => setCurrentParagraph(p)}
              className={`w-10 h-10 rounded-lg text-xs font-bold transition-all ${
                currentParagraph === p ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}>
              {p}
            </button>
          ))}
          {end - start + 1 > 20 && <span className="self-center text-muted-foreground text-sm">...</span>}
        </div>
      </div>
    );
  }

  // Section selection
  if (viewMode === 'sections' && selectedPart) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all">
            <Icons.ArrowDown className="w-5 h-5 rotate-90 text-foreground" />
          </button>
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">{selectedPart.part}</span>
            <h1 className="text-3xl font-serif font-bold text-foreground">{selectedPart.title}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedPart.sections.map(sec => (
            <button key={sec.id} onClick={() => { setSelectedSection(sec); setCurrentParagraph(sec.paragraphs[0]); setViewMode('reading'); }}
              className="text-left p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Seção {sec.id}</span>
              <h3 className="text-lg font-serif font-bold text-foreground mt-2 group-hover:text-primary transition-colors">{sec.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">§{sec.paragraphs[0]} — §{sec.paragraphs[1]}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Parts overview
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Cross className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Codex Fidei</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Catecismo da Igreja Católica</h1>
        <p className="text-muted-foreground font-serif italic">2.865 parágrafos organizados em 4 partes fundamentais.</p>
      </div>

      {/* Search by paragraph */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar por número do parágrafo (ex: 1324)..."
            className="w-full pl-11 pr-20 py-3 rounded-2xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button onClick={handleSearch} className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-foreground text-background rounded-xl text-xs font-bold">
            Ir
          </button>
        </div>
      </div>

      {/* Parts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CIC_SECTIONS.map(part => (
          <button key={part.part} onClick={() => { setSelectedPart(part); setViewMode('sections'); }}
            className="text-left p-5 md:p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{part.part}</span>
            <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground mt-3 group-hover:text-primary transition-colors">{part.title}</h2>
            <p className="text-sm text-muted-foreground mt-2">{part.sections.length} seções</p>
            <div className="flex flex-wrap gap-1 mt-4">
              {part.sections.map(s => (
                <span key={s.id} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-lg text-[10px] font-bold">{s.title.split(' ').slice(0, 3).join(' ')}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Catechism;
