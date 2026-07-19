import { Icons } from '@/constants';
import { Button } from '@/components/ui/button';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useDevotionalReader } from '@/components/mobile/DevotionalReaderContext';


interface Litany {
  id: string;
  title: string;
  latin?: string;
  category: string;
  invocations: { call: string; response: string }[];
  opening?: string;
  closing?: string;
}

const LITANIES: Litany[] = [
  {
    id: 'sagrado-coracao',
    title: 'Litania do Sagrado Coração de Jesus',
    latin: 'Litaniae Sacratissimi Cordis Iesu',
    category: 'Jesus Cristo',
    opening: 'Senhor, tende piedade de nós.\nCristo, tende piedade de nós.\nSenhor, tende piedade de nós.\nCristo, ouvi-nos.\nCristo, atendei-nos.',
    invocations: [
      { call: 'Pai celeste, que sois Deus', response: 'tende piedade de nós.' },
      { call: 'Filho, Redentor do mundo, que sois Deus', response: 'tende piedade de nós.' },
      { call: 'Espírito Santo, que sois Deus', response: 'tende piedade de nós.' },
      { call: 'Santíssima Trindade, que sois um só Deus', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, Filho do Eterno Pai', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, formado pelo Espírito Santo no seio da Virgem Mãe', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, unido substancialmente ao Verbo de Deus', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, de majestade infinita', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, templo santo de Deus', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, tabernáculo do Altíssimo', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, casa de Deus e porta do Céu', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, fornalha ardente de caridade', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, santuário da justiça e do amor', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, cheio de bondade e de amor', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, abismo de todas as virtudes', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, digníssimo de todo louvor', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, Rei e centro de todos os corações', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, em quem estão todos os tesouros da sabedoria e da ciência', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, em quem habita toda a plenitude da divindade', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, em quem o Pai pôs todas as suas complacências', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, de cuja plenitude todos nós recebemos', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, desejado das colinas eternas', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, paciente e cheio de misericórdia', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, liberal para todos os que Vos invocam', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, fonte de vida e de santidade', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, propiciação pelos nossos pecados', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, saturado de opróbrios', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, esmagado por causa dos nossos pecados', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, feito obediente até a morte', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, traspassado pela lança', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, fonte de toda consolação', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, nossa vida e ressurreição', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, nossa paz e reconciliação', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, víctima dos pecadores', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, salvação dos que em Vós esperam', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, esperança dos que em Vós morrem', response: 'tende piedade de nós.' },
      { call: 'Coração de Jesus, delícia de todos os Santos', response: 'tende piedade de nós.' },
    ],
    closing: 'Cordeiro de Deus, que tirais os pecados do mundo, perdoai-nos, Senhor.\nCordeiro de Deus, que tirais os pecados do mundo, ouvi-nos, Senhor.\nCordeiro de Deus, que tirais os pecados do mundo, tende piedade de nós.\n\nJesus, manso e humilde de Coração, fazei o nosso coração semelhante ao Vosso. Amém.',
  },
  {
    id: 'nossa-senhora',
    title: 'Litania de Nossa Senhora (Litania Lauretana)',
    latin: 'Litaniae Lauretanae',
    category: 'Virgem Maria',
    opening: 'Senhor, tende piedade de nós.\nCristo, tende piedade de nós.\nSenhor, tende piedade de nós.\nCristo, ouvi-nos.\nCristo, atendei-nos.',
    invocations: [
      { call: 'Santa Maria', response: 'rogai por nós.' },
      { call: 'Santa Mãe de Deus', response: 'rogai por nós.' },
      { call: 'Santa Virgem das virgens', response: 'rogai por nós.' },
      { call: 'Mãe de Cristo', response: 'rogai por nós.' },
      { call: 'Mãe da Igreja', response: 'rogai por nós.' },
      { call: 'Mãe da misericórdia', response: 'rogai por nós.' },
      { call: 'Mãe da divina graça', response: 'rogai por nós.' },
      { call: 'Mãe da esperança', response: 'rogai por nós.' },
      { call: 'Mãe puríssima', response: 'rogai por nós.' },
      { call: 'Mãe castíssima', response: 'rogai por nós.' },
      { call: 'Mãe sempre virgem', response: 'rogai por nós.' },
      { call: 'Mãe imaculada', response: 'rogai por nós.' },
      { call: 'Mãe admirável', response: 'rogai por nós.' },
      { call: 'Mãe do bom conselho', response: 'rogai por nós.' },
      { call: 'Mãe do Criador', response: 'rogai por nós.' },
      { call: 'Mãe do Salvador', response: 'rogai por nós.' },
      { call: 'Virgem prudentíssima', response: 'rogai por nós.' },
      { call: 'Virgem venerável', response: 'rogai por nós.' },
      { call: 'Virgem louvável', response: 'rogai por nós.' },
      { call: 'Virgem poderosa', response: 'rogai por nós.' },
      { call: 'Virgem clemente', response: 'rogai por nós.' },
      { call: 'Virgem fiel', response: 'rogai por nós.' },
      { call: 'Espelho de justiça', response: 'rogai por nós.' },
      { call: 'Sede da sabedoria', response: 'rogai por nós.' },
      { call: 'Causa da nossa alegria', response: 'rogai por nós.' },
      { call: 'Vaso espiritual', response: 'rogai por nós.' },
      { call: 'Vaso honorável', response: 'rogai por nós.' },
      { call: 'Vaso insigne de devoção', response: 'rogai por nós.' },
      { call: 'Rosa mística', response: 'rogai por nós.' },
      { call: 'Torre de David', response: 'rogai por nós.' },
      { call: 'Torre de marfim', response: 'rogai por nós.' },
      { call: 'Casa de ouro', response: 'rogai por nós.' },
      { call: 'Arca da aliança', response: 'rogai por nós.' },
      { call: 'Porta do céu', response: 'rogai por nós.' },
      { call: 'Estrela da manhã', response: 'rogai por nós.' },
      { call: 'Saúde dos enfermos', response: 'rogai por nós.' },
      { call: 'Refúgio dos pecadores', response: 'rogai por nós.' },
      { call: 'Consoladora dos aflitos', response: 'rogai por nós.' },
      { call: 'Auxílio dos cristãos', response: 'rogai por nós.' },
      { call: 'Rainha dos Anjos', response: 'rogai por nós.' },
      { call: 'Rainha dos Patriarcas', response: 'rogai por nós.' },
      { call: 'Rainha dos Profetas', response: 'rogai por nós.' },
      { call: 'Rainha dos Apóstolos', response: 'rogai por nós.' },
      { call: 'Rainha dos Mártires', response: 'rogai por nós.' },
      { call: 'Rainha dos Confessores', response: 'rogai por nós.' },
      { call: 'Rainha das Virgens', response: 'rogai por nós.' },
      { call: 'Rainha de todos os Santos', response: 'rogai por nós.' },
      { call: 'Rainha concebida sem pecado original', response: 'rogai por nós.' },
      { call: 'Rainha assunta ao Céu', response: 'rogai por nós.' },
      { call: 'Rainha do Santíssimo Rosário', response: 'rogai por nós.' },
      { call: 'Rainha da família', response: 'rogai por nós.' },
      { call: 'Rainha da paz', response: 'rogai por nós.' },
    ],
    closing: 'Cordeiro de Deus, que tirais os pecados do mundo, perdoai-nos, Senhor.\nCordeiro de Deus, que tirais os pecados do mundo, ouvi-nos, Senhor.\nCordeiro de Deus, que tirais os pecados do mundo, tende piedade de nós.\n\nRogai por nós, Santa Mãe de Deus, para que sejamos dignos das promessas de Cristo. Amém.',
  },
  {
    id: 'todos-santos',
    title: 'Litania de Todos os Santos',
    latin: 'Litaniae Sanctorum',
    category: 'Santos',
    opening: 'Senhor, tende piedade de nós.\nCristo, tende piedade de nós.\nSenhor, tende piedade de nós.',
    invocations: [
      { call: 'Santa Maria, Mãe de Deus', response: 'rogai por nós.' },
      { call: 'São Miguel', response: 'rogai por nós.' },
      { call: 'São Gabriel', response: 'rogai por nós.' },
      { call: 'São Rafael', response: 'rogai por nós.' },
      { call: 'Santos Anjos de Deus', response: 'rogai por nós.' },
      { call: 'São João Batista', response: 'rogai por nós.' },
      { call: 'São José', response: 'rogai por nós.' },
      { call: 'São Pedro e São Paulo', response: 'rogai por nós.' },
      { call: 'Santo André', response: 'rogai por nós.' },
      { call: 'São João', response: 'rogai por nós.' },
      { call: 'São Tiago', response: 'rogai por nós.' },
      { call: 'São Tomé', response: 'rogai por nós.' },
      { call: 'São Filipe', response: 'rogai por nós.' },
      { call: 'São Bartolomeu', response: 'rogai por nós.' },
      { call: 'São Mateus', response: 'rogai por nós.' },
      { call: 'São Simão e São Judas', response: 'rogai por nós.' },
      { call: 'São Matias', response: 'rogai por nós.' },
      { call: 'São Barnabé', response: 'rogai por nós.' },
      { call: 'São Lucas', response: 'rogai por nós.' },
      { call: 'São Marcos', response: 'rogai por nós.' },
      { call: 'Santa Maria Madalena', response: 'rogai por nós.' },
      { call: 'Santo Estêvão', response: 'rogai por nós.' },
      { call: 'Santo Inácio de Antioquia', response: 'rogai por nós.' },
      { call: 'São Policarpo', response: 'rogai por nós.' },
      { call: 'São Lourenço', response: 'rogai por nós.' },
      { call: 'Santos Inocentes', response: 'rogai por nós.' },
      { call: 'Santo Agostinho', response: 'rogai por nós.' },
      { call: 'São Tomás de Aquino', response: 'rogai por nós.' },
      { call: 'São Francisco de Assis', response: 'rogai por nós.' },
      { call: 'São Domingos', response: 'rogai por nós.' },
      { call: 'Santa Teresa de Jesus', response: 'rogai por nós.' },
      { call: 'São João da Cruz', response: 'rogai por nós.' },
      { call: 'Santa Teresa do Menino Jesus', response: 'rogai por nós.' },
      { call: 'Santos e Santas de Deus', response: 'rogai por nós.' },
    ],
    closing: 'Cordeiro de Deus, que tirais os pecados do mundo, perdoai-nos, Senhor.\nCordeiro de Deus, que tirais os pecados do mundo, ouvi-nos, Senhor.\nCordeiro de Deus, que tirais os pecados do mundo, tende piedade de nós. Amém.',
  },
  {
    id: 'sao-jose',
    title: 'Litania de São José',
    latin: 'Litaniae Sancti Ioseph',
    category: 'Santos',
    opening: 'Senhor, tende piedade de nós.\nCristo, tende piedade de nós.\nSenhor, tende piedade de nós.\nCristo, ouvi-nos.\nCristo, atendei-nos.',
    invocations: [
      { call: 'São José', response: 'rogai por nós.' },
      { call: 'Ilustre descendente de David', response: 'rogai por nós.' },
      { call: 'Luz dos Patriarcas', response: 'rogai por nós.' },
      { call: 'Esposo da Mãe de Deus', response: 'rogai por nós.' },
      { call: 'Guardião do Redentor', response: 'rogai por nós.' },
      { call: 'Casto guardião da Virgem', response: 'rogai por nós.' },
      { call: 'Sustentáculo da Sagrada Família', response: 'rogai por nós.' },
      { call: 'São José justíssimo', response: 'rogai por nós.' },
      { call: 'São José castíssimo', response: 'rogai por nós.' },
      { call: 'São José prudentíssimo', response: 'rogai por nós.' },
      { call: 'São José fortíssimo', response: 'rogai por nós.' },
      { call: 'São José obedientíssimo', response: 'rogai por nós.' },
      { call: 'São José fidelíssimo', response: 'rogai por nós.' },
      { call: 'Espelho de paciência', response: 'rogai por nós.' },
      { call: 'Amante da pobreza', response: 'rogai por nós.' },
      { call: 'Modelo dos operários', response: 'rogai por nós.' },
      { call: 'Glória da vida doméstica', response: 'rogai por nós.' },
      { call: 'Protetor das virgens', response: 'rogai por nós.' },
      { call: 'Amparo das famílias', response: 'rogai por nós.' },
      { call: 'Consolação dos aflitos', response: 'rogai por nós.' },
      { call: 'Esperança dos enfermos', response: 'rogai por nós.' },
      { call: 'Padroeiro dos moribundos', response: 'rogai por nós.' },
      { call: 'Terror dos demônios', response: 'rogai por nós.' },
      { call: 'Protetor da Santa Igreja', response: 'rogai por nós.' },
    ],
    closing: 'Cordeiro de Deus, que tirais os pecados do mundo, perdoai-nos, Senhor.\nCordeiro de Deus, que tirais os pecados do mundo, ouvi-nos, Senhor.\nCordeiro de Deus, que tirais os pecados do mundo, tende piedade de nós.\n\nEle o constituiu senhor de sua casa. E príncipe de todos os seus bens. Amém.',
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Jesus Cristo': 'bg-rose-50 text-rose-700 border-rose-100',
  'Virgem Maria': 'bg-sky-50 text-sky-700 border-sky-100',
  'Santos': 'bg-amber-50 text-amber-700 border-secondary',
};

const LitaniesPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { setIndex, setFavorite } = useDevotionalReader();
  const openingRef = useRef<HTMLDivElement | null>(null);
  const invocationsRef = useRef<HTMLDivElement | null>(null);
  const closingRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    if (!searchQuery) return LITANIES;
    const q = searchQuery.toLowerCase();
    return LITANIES.filter(l => l.title.toLowerCase().includes(q) || l.category.toLowerCase().includes(q));
  }, [searchQuery]);

  const litany = LITANIES.find(l => l.id === selectedId);

  // Publica o índice de seções e o alvo favoritável enquanto uma ladainha está aberta.
  useEffect(() => {
    if (!litany) {
      setIndex('Índice', []);
      setFavorite(null);
      return;
    }
    const scrollTo = (el: HTMLElement | null) =>
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const items = [
      ...(litany.opening
        ? [{ id: 'opening', label: 'Abertura', hint: 'Kyrie', onSelect: () => scrollTo(openingRef.current) }]
        : []),
      {
        id: 'invocations',
        label: 'Invocações',
        hint: `${litany.invocations.length} súplicas`,
        onSelect: () => scrollTo(invocationsRef.current),
      },
      ...(litany.closing
        ? [{ id: 'closing', label: 'Encerramento', hint: 'Agnus Dei', onSelect: () => scrollTo(closingRef.current) }]
        : []),
    ];
    setIndex(litany.title, items);
    setFavorite({
      contentType: 'litany',
      contentId: litany.id,
      title: litany.title,
      content: litany.latin ?? null,
      url: '/litanies',
      metadata: { category: litany.category },
    });
    return () => {
      setIndex('Índice', []);
      setFavorite(null);
    };
  }, [litany, setIndex, setFavorite]);


  if (litany) {
    return (
      <div className="w-full space-y-spacing-xl pb-spacing-2xl animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center gap-spacing-lg">
          <Button onClick={() => setSelectedId(null)} className="p-spacing-sm rounded-premium-full bg-card border border-border hover:bg-primary/5 transition-all active:scale-95 shadow-premium-md self-start md:self-center">
            <Icons.ArrowLeft className="w-spacing-lg h-spacing-lg text-foreground" />
          </Button>
          <div className="space-y-spacing-2xs">
            <span className={`inline-flex px-spacing-sm py-spacing-2xs rounded-premium-full text-premium-xs font-black uppercase tracking-widest border ${CATEGORY_COLORS[litany.category] || 'bg-muted text-muted-foreground border-border'}`}>
              {litany.category}
            </span>
            <h1 className="text-premium-3xl md:text-premium-4xl font-serif font-bold text-foreground leading-tight">{litany.title}</h1>
            {litany.latin && <p className="text-premium-base font-serif italic text-muted-foreground opacity-70">{litany.latin}</p>}
          </div>
        </div>

        <div className="premium-card p-spacing-xl md:p-spacing-3xl space-y-spacing-xl">
          {/* Opening */}
          {litany.opening && (
            <div ref={openingRef} id="litany-opening" className="text-center pb-spacing-xl border-b border-border/50 scroll-mt-24">
              <p className="font-serif text-premium-lg text-foreground/80 leading-relaxed whitespace-pre-line italic">{litany.opening}</p>
            </div>
          )}

          {/* Invocations */}
          <div ref={invocationsRef} id="litany-invocations" className="space-y-spacing-2xs w-full scroll-mt-24">
            {litany.invocations.map((inv, i) => (
              <div key={i} className="flex flex-col md:flex-row md:items-baseline gap-spacing-2xs md:gap-spacing-md py-spacing-sm border-b border-border/30 last:border-0 group">
                <p className="flex-1 font-serif text-premium-lg text-foreground/90 group-hover:text-primary transition-colors">{inv.call},</p>
                <p className="font-serif italic text-primary font-bold text-premium-base shrink-0 opacity-80">{inv.response}</p>
              </div>
            ))}
          </div>

          {/* Closing */}
          {litany.closing && (
            <div ref={closingRef} id="litany-closing" className="text-center pt-spacing-xl border-t border-border/50 scroll-mt-24">
              <p className="font-serif text-premium-lg text-foreground/80 leading-relaxed whitespace-pre-line italic">{litany.closing}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-spacing-2xl pb-spacing-2xl">
      <div className="text-center space-y-spacing-md pt-spacing-md">
        <div className="inline-flex items-center gap-spacing-xs px-spacing-md py-spacing-2xs bg-primary/5 border border-primary/10 rounded-premium">
          <Icons.Heart className="w-spacing-md h-spacing-md text-primary" />
          <span className="text-premium-xs font-black uppercase tracking-[0.2em] text-primary">Litaniae</span>
        </div>
        <h1 className="text-premium-4xl md:text-premium-6xl font-serif font-bold text-foreground tracking-tight">Litanias</h1>
        <p className="text-premium-lg text-muted-foreground font-serif italic">
          Orações de invocação e súplica consagradas pela tradição secular da Igreja.
        </p>
      </div>

      <div className="w-full relative group">
        <Icons.Search className="absolute left-spacing-md top-spacing-2xs/2 -translate-y-1/2 w-spacing-md h-spacing-md text-muted-foreground transition-colors group-focus-within:text-primary" />
        <input 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)} 
          placeholder="Buscar por título ou categoria..."
          className="w-full pl-spacing-2xl pr-spacing-md py-spacing-md rounded-premium-full border border-border bg-card text-foreground text-premium-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-premium-md" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-lg">
        {filtered.map(l => (
          <Button key={l.id} onClick={() => setSelectedId(l.id)}
            className="text-left p-spacing-xl rounded-premium-full bg-card border border-border hover:border-primary/40 hover:shadow-premium-hover hover:-translate-y-1 transition-all group relative overflow-hidden">
            <div className="absolute top-spacing-0 right-0 p-spacing-xl opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
              <Icons.BookOpen className="w-spacing-4xl h-spacing-4xl -mr-spacing-xl -mt-spacing-xl rotate-12" />
            </div>
            <div className="relative z-10 space-y-spacing-md">
              <span className={`inline-block font-serif px-spacing-sm py-spacing-2xs rounded-premium-full text-premium-xs font-black uppercase tracking-widest border ${CATEGORY_COLORS[l.category] || 'bg-muted text-muted-foreground border-border'}`}>
                {l.category}
              </span>
              <div className="space-y-spacing-2xs">
                <h2 className="text-premium-2xl font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-tight">{l.title}</h2>
                {l.latin && <p className="text-premium-xs font-serif italic text-muted-foreground opacity-60">{l.latin}</p>}
              </div>
              <div className="flex items-center gap-spacing-xs text-premium-xs font-black uppercase tracking-widest text-primary pt-spacing-xs">
                Começar Oração <Icons.ChevronRight className="w-spacing-sm h-spacing-sm transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default LitaniesPage;