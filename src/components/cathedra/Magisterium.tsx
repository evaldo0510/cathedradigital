import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Icons } from '../../constants';
import { supabase } from '@/integrations/supabase/client';

type DocCategory = 'all' | 'council' | 'encyclical' | 'exhortation' | 'letter' | 'constitution';

interface MagisteriumDoc {
  id: string;
  title: string;
  latinTitle?: string;
  author: string;
  year: number;
  category: DocCategory;
  summary: string;
  topics: string[];
  vaticanUrl?: string;
}

const DOCUMENTS: MagisteriumDoc[] = [
  // Councils / Constitutions - Vatican II
  { id: 'vat2-lg', title: 'Lumen Gentium', latinTitle: 'Lumen Gentium', author: 'Concílio Vaticano II', year: 1964, category: 'constitution', summary: 'Constituição dogmática sobre a Igreja. Define a natureza e missão universal da Igreja como sacramento de salvação.', topics: ['Eclesiologia', 'Povo de Deus', 'Colegialidade'], vaticanUrl: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19641121_lumen-gentium_pt.html' },
  { id: 'vat2-dv', title: 'Dei Verbum', latinTitle: 'Dei Verbum', author: 'Concílio Vaticano II', year: 1965, category: 'constitution', summary: 'Constituição dogmática sobre a Revelação Divina. Trata das Escrituras, Tradição e Magistério.', topics: ['Revelação', 'Escritura', 'Tradição'], vaticanUrl: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19651118_dei-verbum_pt.html' },
  { id: 'vat2-sc', title: 'Sacrosanctum Concilium', latinTitle: 'Sacrosanctum Concilium', author: 'Concílio Vaticano II', year: 1963, category: 'constitution', summary: 'Constituição sobre a Sagrada Liturgia. Promoveu a reforma litúrgica e a participação ativa dos fiéis.', topics: ['Liturgia', 'Sacramentos', 'Reforma'], vaticanUrl: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19631204_sacrosanctum-concilium_pt.html' },
  { id: 'vat2-gs', title: 'Gaudium et Spes', latinTitle: 'Gaudium et Spes', author: 'Concílio Vaticano II', year: 1965, category: 'constitution', summary: 'Constituição pastoral sobre a Igreja no mundo atual. Aborda temas como dignidade humana, cultura e vida social.', topics: ['Doutrina Social', 'Dignidade', 'Cultura'], vaticanUrl: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19651207_gaudium-et-spes_pt.html' },
  { id: 'vat2-na', title: 'Nostra Aetate', latinTitle: 'Nostra Aetate', author: 'Concílio Vaticano II', year: 1965, category: 'council', summary: 'Declaração sobre as relações da Igreja com as religiões não cristãs.', topics: ['Diálogo Inter-religioso', 'Judaísmo'], vaticanUrl: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decl_19651028_nostra-aetate_pt.html' },
  { id: 'vat2-dh', title: 'Dignitatis Humanae', latinTitle: 'Dignitatis Humanae', author: 'Concílio Vaticano II', year: 1965, category: 'council', summary: 'Declaração sobre a liberdade religiosa. Defende o direito à liberdade de consciência e religião.', topics: ['Liberdade Religiosa', 'Dignidade'], vaticanUrl: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decl_19651207_dignitatis-humanae_pt.html' },
  { id: 'vat2-ur', title: 'Unitatis Redintegratio', latinTitle: 'Unitatis Redintegratio', author: 'Concílio Vaticano II', year: 1964, category: 'council', summary: 'Decreto sobre o ecumenismo. Promove a unidade dos cristãos.', topics: ['Ecumenismo', 'Unidade'], vaticanUrl: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decree_19641121_unitatis-redintegratio_pt.html' },
  { id: 'vat2-ag', title: 'Ad Gentes', latinTitle: 'Ad Gentes', author: 'Concílio Vaticano II', year: 1965, category: 'council', summary: 'Decreto sobre a atividade missionária da Igreja.', topics: ['Missão', 'Evangelização'], vaticanUrl: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decree_19651207_ad-gentes_pt.html' },
  { id: 'trent', title: 'Concílio de Trento', author: 'Concílio Ecumênico', year: 1563, category: 'council', summary: 'Reforma da Igreja e resposta à Reforma Protestante. Definiu a doutrina sobre os sacramentos, a justificação e o cânon bíblico.', topics: ['Sacramentos', 'Justificação', 'Cânon Bíblico'] },
  { id: 'vat1', title: 'Concílio Vaticano I', author: 'Concílio Ecumênico', year: 1870, category: 'council', summary: 'Definiu o dogma da infalibilidade papal e a constituição dogmática Dei Filius sobre a fé católica.', topics: ['Infalibilidade', 'Fé e Razão'] },
  // Encyclicals
  { id: 'rn', title: 'Rerum Novarum', latinTitle: 'Rerum Novarum', author: 'Leão XIII', year: 1891, category: 'encyclical', summary: 'Sobre a condição dos operários. Marco fundador da Doutrina Social da Igreja, defende os direitos dos trabalhadores.', topics: ['Doutrina Social', 'Trabalho', 'Propriedade'], vaticanUrl: 'https://www.vatican.va/content/leo-xiii/pt/encyclicals/documents/hf_l-xiii_enc_15051891_rerum-novarum.html' },
  { id: 'qa', title: 'Quadragesimo Anno', latinTitle: 'Quadragesimo Anno', author: 'Pio XI', year: 1931, category: 'encyclical', summary: 'Sobre a restauração da ordem social. Desenvolve o princípio da subsidiariedade.', topics: ['Doutrina Social', 'Subsidiariedade'], vaticanUrl: 'https://www.vatican.va/content/pius-xi/pt/encyclicals/documents/hf_p-xi_enc_19310515_quadragesimo-anno.html' },
  { id: 'mbs', title: 'Mit brennender Sorge', author: 'Pio XI', year: 1937, category: 'encyclical', summary: 'Condenação do nazismo e do racismo. Escrita em alemão, foi lida em todas as igrejas da Alemanha.', topics: ['Nazismo', 'Direitos Humanos'] },
  { id: 'mc', title: 'Mystici Corporis Christi', latinTitle: 'Mystici Corporis Christi', author: 'Pio XII', year: 1943, category: 'encyclical', summary: 'Sobre o Corpo Místico de Cristo. Define a Igreja como corpo vivo de Cristo.', topics: ['Eclesiologia', 'Corpo Místico'], vaticanUrl: 'https://www.vatican.va/content/pius-xii/pt/encyclicals/documents/hf_p-xii_enc_29061943_mystici-corporis-christi.html' },
  { id: 'hv', title: 'Humanae Vitae', latinTitle: 'Humanae Vitae', author: 'Paulo VI', year: 1968, category: 'encyclical', summary: 'Sobre a regulação da natalidade. Reafirma a doutrina da Igreja sobre contracepção e abertura à vida.', topics: ['Moral', 'Família', 'Bioética'], vaticanUrl: 'https://www.vatican.va/content/paul-vi/pt/encyclicals/documents/hf_p-vi_enc_25071968_humanae-vitae.html' },
  { id: 'pp', title: 'Populorum Progressio', latinTitle: 'Populorum Progressio', author: 'Paulo VI', year: 1967, category: 'encyclical', summary: 'Sobre o desenvolvimento dos povos. Aborda justiça social e solidariedade internacional.', topics: ['Desenvolvimento', 'Justiça Social'], vaticanUrl: 'https://www.vatican.va/content/paul-vi/pt/encyclicals/documents/hf_p-vi_enc_26031967_populorum.html' },
  { id: 'rh', title: 'Redemptor Hominis', latinTitle: 'Redemptor Hominis', author: 'João Paulo II', year: 1979, category: 'encyclical', summary: 'Primeira encíclica de João Paulo II. Cristo como redentor do homem e centro do cosmos.', topics: ['Cristologia', 'Antropologia'], vaticanUrl: 'https://www.vatican.va/content/john-paul-ii/pt/encyclicals/documents/hf_jp-ii_enc_04031979_redemptor-hominis.html' },
  { id: 'le', title: 'Laborem Exercens', latinTitle: 'Laborem Exercens', author: 'João Paulo II', year: 1981, category: 'encyclical', summary: 'Sobre o trabalho humano. Dignidade do trabalho e direitos dos trabalhadores.', topics: ['Trabalho', 'Doutrina Social'], vaticanUrl: 'https://www.vatican.va/content/john-paul-ii/pt/encyclicals/documents/hf_jp-ii_enc_14091981_laborem-exercens.html' },
  { id: 'srs', title: 'Sollicitudo Rei Socialis', latinTitle: 'Sollicitudo Rei Socialis', author: 'João Paulo II', year: 1987, category: 'encyclical', summary: 'Sobre a questão social. Conceito de estruturas de pecado e solidariedade.', topics: ['Doutrina Social', 'Solidariedade'], vaticanUrl: 'https://www.vatican.va/content/john-paul-ii/pt/encyclicals/documents/hf_jp-ii_enc_30121987_sollicitudo-rei-socialis.html' },
  { id: 'ca', title: 'Centesimus Annus', latinTitle: 'Centesimus Annus', author: 'João Paulo II', year: 1991, category: 'encyclical', summary: 'No centenário da Rerum Novarum. Reflexão sobre capitalismo, socialismo e livre mercado.', topics: ['Doutrina Social', 'Economia'], vaticanUrl: 'https://www.vatican.va/content/john-paul-ii/pt/encyclicals/documents/hf_jp-ii_enc_01051991_centesimus-annus.html' },
  { id: 'vs', title: 'Veritatis Splendor', latinTitle: 'Veritatis Splendor', author: 'João Paulo II', year: 1993, category: 'encyclical', summary: 'Sobre questões fundamentais do ensinamento moral da Igreja. Defende a existência de normas morais absolutas.', topics: ['Moral', 'Verdade', 'Liberdade'], vaticanUrl: 'https://www.vatican.va/content/john-paul-ii/pt/encyclicals/documents/hf_jp-ii_enc_06081993_veritatis-splendor.html' },
  { id: 'ev', title: 'Evangelium Vitae', latinTitle: 'Evangelium Vitae', author: 'João Paulo II', year: 1995, category: 'encyclical', summary: 'Sobre o valor e a inviolabilidade da vida humana. Condena o aborto e a eutanásia.', topics: ['Vida', 'Bioética', 'Dignidade'], vaticanUrl: 'https://www.vatican.va/content/john-paul-ii/pt/encyclicals/documents/hf_jp-ii_enc_25031995_evangelium-vitae.html' },
  { id: 'fr', title: 'Fides et Ratio', latinTitle: 'Fides et Ratio', author: 'João Paulo II', year: 1998, category: 'encyclical', summary: 'Sobre as relações entre fé e razão. Defende a harmonia entre filosofia e teologia.', topics: ['Fé e Razão', 'Filosofia', 'Teologia'], vaticanUrl: 'https://www.vatican.va/content/john-paul-ii/pt/encyclicals/documents/hf_jp-ii_enc_14091998_fides-et-ratio.html' },
  { id: 'dce', title: 'Deus Caritas Est', latinTitle: 'Deus Caritas Est', author: 'Bento XVI', year: 2005, category: 'encyclical', summary: 'Sobre o amor cristão. Primeira encíclica de Bento XVI sobre a caridade como essência do cristianismo.', topics: ['Caridade', 'Amor', 'Eros e Ágape'], vaticanUrl: 'https://www.vatican.va/content/benedict-xvi/pt/encyclicals/documents/hf_ben-xvi_enc_20051225_deus-caritas-est.html' },
  { id: 'ss', title: 'Spe Salvi', latinTitle: 'Spe Salvi', author: 'Bento XVI', year: 2007, category: 'encyclical', summary: 'Sobre a esperança cristã. Reflexão sobre o sentido da esperança na vida e na história.', topics: ['Esperança', 'Escatologia'], vaticanUrl: 'https://www.vatican.va/content/benedict-xvi/pt/encyclicals/documents/hf_ben-xvi_enc_20071130_spe-salvi.html' },
  { id: 'cv2', title: 'Caritas in Veritate', latinTitle: 'Caritas in Veritate', author: 'Bento XVI', year: 2009, category: 'encyclical', summary: 'Sobre o desenvolvimento humano integral na caridade e na verdade.', topics: ['Doutrina Social', 'Desenvolvimento'], vaticanUrl: 'https://www.vatican.va/content/benedict-xvi/pt/encyclicals/documents/hf_ben-xvi_enc_20090629_caritas-in-veritate.html' },
  { id: 'lf', title: 'Lumen Fidei', latinTitle: 'Lumen Fidei', author: 'Francisco', year: 2013, category: 'encyclical', summary: 'Sobre a fé. Iniciada por Bento XVI e concluída por Francisco. A luz da fé que ilumina a existência.', topics: ['Fé', 'Verdade', 'Amor'], vaticanUrl: 'https://www.vatican.va/content/francesco/pt/encyclicals/documents/papa-francesco_20130629_enciclica-lumen-fidei.html' },
  { id: 'ls', title: 'Laudato Si\'', latinTitle: 'Laudato Si\'', author: 'Francisco', year: 2015, category: 'encyclical', summary: 'Sobre o cuidado da casa comum. Aborda ecologia integral, mudanças climáticas e justiça social.', topics: ['Ecologia', 'Criação', 'Justiça Social'], vaticanUrl: 'https://www.vatican.va/content/francesco/pt/encyclicals/documents/papa-francesco_20150524_enciclica-laudato-si.html' },
  { id: 'ft', title: 'Fratelli Tutti', latinTitle: 'Fratelli Tutti', author: 'Francisco', year: 2020, category: 'encyclical', summary: 'Sobre a fraternidade e a amizade social. Promoção do diálogo e da solidariedade universal.', topics: ['Fraternidade', 'Diálogo', 'Paz'], vaticanUrl: 'https://www.vatican.va/content/francesco/pt/encyclicals/documents/papa-francesco_20201003_enciclica-fratelli-tutti.html' },
  { id: 'dn', title: 'Dilexit Nos', latinTitle: 'Dilexit Nos', author: 'Francisco', year: 2024, category: 'encyclical', summary: 'Sobre o amor humano e divino do Coração de Jesus Cristo. Reflete sobre a devoção ao Sagrado Coração.', topics: ['Sagrado Coração', 'Amor Divino'], vaticanUrl: 'https://www.vatican.va/content/francesco/pt/encyclicals/documents/20241024-enciclica-dilexit-nos.html' },
  // Exhortations
  { id: 'eg', title: 'Evangelii Gaudium', latinTitle: 'Evangelii Gaudium', author: 'Francisco', year: 2013, category: 'exhortation', summary: 'Sobre o anúncio do Evangelho no mundo atual. Programa pastoral do pontificado de Francisco.', topics: ['Evangelização', 'Pastoral', 'Missão'], vaticanUrl: 'https://www.vatican.va/content/francesco/pt/apost_exhortations/documents/papa-francesco_esortazione-ap_20131124_evangelii-gaudium.html' },
  { id: 'al', title: 'Amoris Laetitia', latinTitle: 'Amoris Laetitia', author: 'Francisco', year: 2016, category: 'exhortation', summary: 'Sobre o amor na família. Reflexão sobre o matrimônio, a família e os desafios contemporâneos.', topics: ['Família', 'Matrimônio', 'Pastoral'], vaticanUrl: 'https://www.vatican.va/content/francesco/pt/apost_exhortations/documents/papa-francesco_esortazione-ap_20160319_amoris-laetitia.html' },
  { id: 'ge', title: 'Gaudete et Exsultate', latinTitle: 'Gaudete et Exsultate', author: 'Francisco', year: 2018, category: 'exhortation', summary: 'Sobre o chamado à santidade no mundo atual. A santidade como vocação universal.', topics: ['Santidade', 'Vocação'], vaticanUrl: 'https://www.vatican.va/content/francesco/pt/apost_exhortations/documents/papa-francesco_esortazione-ap_20180319_gaudete-et-exsultate.html' },
  { id: 'cv', title: 'Christus Vivit', latinTitle: 'Christus Vivit', author: 'Francisco', year: 2019, category: 'exhortation', summary: 'Aos jovens e a todo o Povo de Deus. Sobre a vocação e missão dos jovens na Igreja.', topics: ['Juventude', 'Vocação', 'Discernimento'], vaticanUrl: 'https://www.vatican.va/content/francesco/pt/apost_exhortations/documents/papa-francesco_esortazione-ap_20190325_christus-vivit.html' },
  { id: 'qd', title: 'Querida Amazônia', latinTitle: 'Querida Amazonia', author: 'Francisco', year: 2020, category: 'exhortation', summary: 'Sonhos para a Amazônia: social, cultural, ecológico e eclesial.', topics: ['Amazônia', 'Ecologia', 'Inculturação'], vaticanUrl: 'https://www.vatican.va/content/francesco/pt/apost_exhortations/documents/papa-francesco_esortazione-ap_20200202_querida-amazonia.html' },
  // Letters
  { id: 'mp-tc', title: 'Traditionis Custodes', latinTitle: 'Traditionis Custodes', author: 'Francisco', year: 2021, category: 'letter', summary: 'Motu Proprio sobre o uso da liturgia romana anterior à reforma de 1970.', topics: ['Liturgia', 'Missa Tridentina'], vaticanUrl: 'https://www.vatican.va/content/francesco/pt/motu_proprio/documents/20210716-motu-proprio-traditionis-custodes.html' },
];

const CATEGORY_LABELS: Record<DocCategory, string> = {
  all: 'Todos',
  council: 'Concílios',
  encyclical: 'Encíclicas',
  exhortation: 'Exortações',
  letter: 'Cartas',
  constitution: 'Constituições',
};

const CATEGORY_COLORS: Record<string, string> = {
  council: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  encyclical: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  exhortation: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  letter: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  constitution: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
};

const CACHE_PREFIX = 'cathedra_doc_';

const getCachedDoc = (docId: string): { text: string; title: string; cachedAt: string } | null => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + docId);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const setCachedDoc = (docId: string, text: string, title: string) => {
  try {
    localStorage.setItem(CACHE_PREFIX + docId, JSON.stringify({ text, title, cachedAt: new Date().toISOString() }));
  } catch (e) {
    console.warn('Cache storage full, clearing old docs');
    // Clear oldest cached docs if storage is full
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    if (keys.length > 0) {
      localStorage.removeItem(keys[0]);
      try { localStorage.setItem(CACHE_PREFIX + docId, JSON.stringify({ text, title, cachedAt: new Date().toISOString() })); } catch {}
    }
  }
};

const getCachedDocIds = (): string[] => {
  return Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX)).map(k => k.replace(CACHE_PREFIX, ''));
};

const Magisterium: React.FC = () => {
  const [category, setCategory] = useState<DocCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<MagisteriumDoc | null>(null);
  const [fullText, setFullText] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [textSearch, setTextSearch] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [cachedIds, setCachedIds] = useState<string[]>([]);

  const filteredDocs = useMemo(() => {
    let docs = DOCUMENTS;
    if (category !== 'all') docs = docs.filter(d => d.category === category);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.author.toLowerCase().includes(q) ||
        d.summary.toLowerCase().includes(q) ||
        d.topics.some(t => t.toLowerCase().includes(q))
      );
    }
    return docs.sort((a, b) => b.year - a.year);
  }, [category, searchQuery]);

  useEffect(() => {
    setCachedIds(getCachedDocIds());
  }, [fullText]);

  const fetchFullText = useCallback(async (doc: MagisteriumDoc) => {
    if (!doc.vaticanUrl) return;

    // Try cache first
    const cached = getCachedDoc(doc.id);
    if (cached) {
      setFullText(cached.text);
      setLoadingText(false);
      setTextError(null);
      return;
    }

    setLoadingText(true);
    setTextError(null);
    setFullText(null);

    try {
      const { data, error } = await supabase.functions.invoke('vatican-document', {
        body: { url: doc.vaticanUrl },
      });

      if (error) throw new Error(error.message);
      if (data?.text) {
        setFullText(data.text);
        setCachedDoc(doc.id, data.text, data.title || doc.title);
      } else {
        setTextError('Não foi possível extrair o texto do documento.');
      }
    } catch (err) {
      console.error('Error fetching Vatican document:', err);
      // Try cache as fallback even on error
      const fallback = getCachedDoc(doc.id);
      if (fallback) {
        setFullText(fallback.text);
        setTextError(null);
      } else {
        setTextError('Erro ao carregar o documento. Tente novamente.');
      }
    } finally {
      setLoadingText(false);
    }
  }, []);

  const clearDocCache = useCallback((docId: string) => {
    localStorage.removeItem(CACHE_PREFIX + docId);
    setCachedIds(getCachedDocIds());
    if (selectedDoc?.id === docId) setFullText(null);
  }, [selectedDoc]);

  const handleSelectDoc = useCallback((doc: MagisteriumDoc) => {
    setSelectedDoc(doc);
    setFullText(null);
    setTextError(null);
    setTextSearch('');
    setMatchCount(0);
  }, []);

  if (selectedDoc) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button onClick={() => { setSelectedDoc(null); setFullText(null); }} className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all">
            <Icons.ArrowDown className="w-5 h-5 rotate-90 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">{selectedDoc.title}</h1>
            <p className="text-sm text-muted-foreground">{selectedDoc.author} • {selectedDoc.year}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl p-8 md:p-12 space-y-6">
          {selectedDoc.latinTitle && (
            <p className="text-center text-sm font-serif italic text-muted-foreground">{selectedDoc.latinTitle}</p>
          )}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${CATEGORY_COLORS[selectedDoc.category] || 'bg-muted text-muted-foreground'}`}>
              {CATEGORY_LABELS[selectedDoc.category]}
            </span>
            <span className="text-xs text-muted-foreground">{selectedDoc.year}</span>
          </div>
          <div className="border-t border-border pt-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-3">Resumo</h3>
            <p className="text-foreground/90 leading-relaxed">{selectedDoc.summary}</p>
          </div>
          <div className="border-t border-border pt-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-3">Temas</h3>
            <div className="flex flex-wrap gap-2">
              {selectedDoc.topics.map(topic => (
                <span key={topic} className="px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-bold">
                  {topic}
                </span>
              ))}
            </div>
          </div>

          {/* Full text section */}
          <div className="border-t border-border pt-6 space-y-4">
            {!fullText && !loadingText && !textError && (
              <div className="flex flex-col items-center gap-4">
                {selectedDoc.vaticanUrl ? (
                  <>
                    <button
                      onClick={() => fetchFullText(selectedDoc)}
                      className="px-8 py-4 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary hover:text-primary-foreground transition-all"
                    >
                      {cachedIds.includes(selectedDoc.id) ? '📥 Abrir do Cache' : 'Carregar Texto Completo'}
                    </button>
                    {cachedIds.includes(selectedDoc.id) && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">✓ Disponível offline</span>
                    )}
                    <a
                      href={selectedDoc.vaticanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Icons.ExternalLink className="w-4 h-4" />
                      Abrir no site da Santa Sé
                    </a>
                  </>
                ) : (
                  <p className="text-muted-foreground italic text-center text-sm">
                    Texto completo ainda não disponível para este documento.
                  </p>
                )}
              </div>
            )}

            {loadingText && (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground italic">Carregando documento da Santa Sé...</p>
              </div>
            )}

            {textError && (
              <div className="text-center space-y-3">
                <p className="text-sm text-destructive">{textError}</p>
                {selectedDoc.vaticanUrl && (
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => fetchFullText(selectedDoc)}
                      className="px-6 py-3 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-all"
                    >
                      Tentar novamente
                    </button>
                    <a
                      href={selectedDoc.vaticanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Icons.ExternalLink className="w-4 h-4" />
                      Abrir diretamente no Vatican.va
                    </a>
                  </div>
                )}
              </div>
            )}

            {fullText && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary">Texto Integral</h3>
                    {cachedIds.includes(selectedDoc.id) && (
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 uppercase tracking-wider">
                        Salvo offline
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground italic">Fonte: Vatican.va</span>
                    {cachedIds.includes(selectedDoc.id) && (
                      <button
                        onClick={() => clearDocCache(selectedDoc.id)}
                        className="text-[10px] text-destructive hover:underline"
                      >
                        Limpar cache
                      </button>
                    )}
                  </div>
                </div>

                {/* Search within document */}
                <div className="relative">
                  <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={textSearch}
                    onChange={e => {
                      setTextSearch(e.target.value);
                      if (e.target.value && fullText) {
                        const regex = new RegExp(e.target.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                        const matches = fullText.match(regex);
                        setMatchCount(matches ? matches.length : 0);
                      } else {
                        setMatchCount(0);
                      }
                    }}
                    placeholder="Buscar no texto do documento..."
                    className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  {textSearch && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                      {matchCount} resultado{matchCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="bg-secondary/50 rounded-2xl p-6 md:p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="text-foreground/90 leading-relaxed whitespace-pre-line font-serif text-[15px]">
                    {textSearch ? (
                      fullText.split(new RegExp(`(${textSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')).map((part, i) =>
                        part.toLowerCase() === textSearch.toLowerCase()
                          ? <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">{part}</mark>
                          : part
                      )
                    ) : fullText}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Book className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Magisterium</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Magistério da Igreja</h1>
        <p className="text-muted-foreground font-serif italic">Encíclicas, Concílios e Documentos da Santa Sé — integrado ao repositório oficial do Vaticano.</p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar documento, autor ou tema..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 justify-center flex-wrap">
        {(Object.keys(CATEGORY_LABELS) as DocCategory[]).map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              category === cat ? 'bg-foreground text-background shadow-lg' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}>
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-6 text-center">
        <div>
          <p className="text-2xl font-serif font-bold text-foreground">{filteredDocs.length}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Documentos</p>
        </div>
        <div>
          <p className="text-2xl font-serif font-bold text-foreground">{new Set(filteredDocs.map(d => d.author)).size}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Autores</p>
        </div>
        <div>
          <p className="text-2xl font-serif font-bold text-foreground">{filteredDocs.filter(d => d.vaticanUrl).length}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Com texto integral</p>
        </div>
      </div>

      {/* Documents grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map(doc => (
          <button key={doc.id} onClick={() => handleSelectDoc(doc)}
            className="text-left p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${CATEGORY_COLORS[doc.category] || 'bg-muted text-muted-foreground'}`}>
                    {CATEGORY_LABELS[doc.category]}
                  </span>
                  {cachedIds.includes(doc.id) ? (
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 uppercase tracking-wider">
                      📥 Offline
                    </span>
                  ) : doc.vaticanUrl ? (
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-primary/10 text-primary uppercase tracking-wider">
                      Texto disponível
                    </span>
                  ) : null}
                </div>
                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{doc.title}</h3>
                {doc.latinTitle && doc.latinTitle !== doc.title && (
                  <p className="text-xs font-serif italic text-muted-foreground">{doc.latinTitle}</p>
                )}
              </div>
              <span className="text-sm font-bold text-primary shrink-0">{doc.year}</span>
            </div>
            <p className="text-xs text-muted-foreground">{doc.author}</p>
            <p className="text-sm text-foreground/70 line-clamp-2">{doc.summary}</p>
            <div className="flex flex-wrap gap-1.5">
              {doc.topics.slice(0, 3).map(t => (
                <span key={t} className="px-2 py-0.5 bg-muted text-muted-foreground rounded-lg text-[10px] font-bold">{t}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Magisterium;
