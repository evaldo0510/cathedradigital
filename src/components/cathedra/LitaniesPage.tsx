import React, { useState, useMemo } from 'react';
import { Icons } from '../../constants';

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
  'Jesus Cristo': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  'Virgem Maria': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  'Santos': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

const LitaniesPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    if (!searchQuery) return LITANIES;
    const q = searchQuery.toLowerCase();
    return LITANIES.filter(l => l.title.toLowerCase().includes(q) || l.category.toLowerCase().includes(q));
  }, [searchQuery]);

  const litany = LITANIES.find(l => l.id === selectedId);

  if (litany) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedId(null)} className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all">
            <Icons.ArrowDown className="w-5 h-5 rotate-90 text-foreground" />
          </button>
          <div>
            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-1 ${CATEGORY_COLORS[litany.category] || 'bg-muted text-muted-foreground'}`}>
              {litany.category}
            </span>
            <h1 className="text-xl font-serif font-bold text-foreground">{litany.title}</h1>
            {litany.latin && <p className="text-xs font-serif italic text-muted-foreground">{litany.latin}</p>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl p-8 md:p-12 space-y-6">
          {/* Opening */}
          {litany.opening && (
            <div className="text-center pb-6 border-b border-border">
              <p className="font-serif text-foreground/90 leading-relaxed whitespace-pre-line">{litany.opening}</p>
            </div>
          )}

          {/* Invocations */}
          <div className="space-y-2">
            {litany.invocations.map((inv, i) => (
              <div key={i} className="flex items-baseline gap-2 py-1">
                <p className="flex-1 font-serif text-foreground/90">{inv.call},</p>
                <p className="font-serif italic text-primary text-sm shrink-0">{inv.response}</p>
              </div>
            ))}
          </div>

          {/* Closing */}
          {litany.closing && (
            <div className="text-center pt-6 border-t border-border">
              <p className="font-serif text-foreground/90 leading-relaxed whitespace-pre-line">{litany.closing}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Icons.Heart className="w-4 h-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Litaniae</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Litanias</h1>
        <p className="text-muted-foreground font-serif italic max-w-lg mx-auto">
          Orações de invocação e súplica consagradas pela tradição da Igreja.
        </p>
      </div>

      <div className="max-w-md mx-auto relative">
        <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar litania..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(l => (
          <button key={l.id} onClick={() => setSelectedId(l.id)}
            className="text-left p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group space-y-3">
            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${CATEGORY_COLORS[l.category] || 'bg-muted text-muted-foreground'}`}>
              {l.category}
            </span>
            <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{l.title}</h3>
            {l.latin && <p className="text-xs font-serif italic text-muted-foreground">{l.latin}</p>}
            <p className="text-sm text-muted-foreground">{l.invocations.length} invocações</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LitaniesPage;
