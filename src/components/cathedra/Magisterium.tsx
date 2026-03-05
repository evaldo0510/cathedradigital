import React, { useState, useMemo } from 'react';
import { Icons } from '../../constants';

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
}

const DOCUMENTS: MagisteriumDoc[] = [
  // Councils
  { id: 'trent', title: 'Concílio de Trento', author: 'Concílio Ecumênico', year: 1563, category: 'council', summary: 'Reforma da Igreja e resposta à Reforma Protestante. Definiu a doutrina sobre os sacramentos, a justificação e o cânon bíblico.', topics: ['Sacramentos', 'Justificação', 'Cânon Bíblico'] },
  { id: 'vat1', title: 'Concílio Vaticano I', author: 'Concílio Ecumênico', year: 1870, category: 'council', summary: 'Definiu o dogma da infalibilidade papal e a constituição dogmática Dei Filius sobre a fé católica.', topics: ['Infalibilidade', 'Fé e Razão'] },
  { id: 'vat2-lg', title: 'Lumen Gentium', latinTitle: 'Lumen Gentium', author: 'Concílio Vaticano II', year: 1964, category: 'constitution', summary: 'Constituição dogmática sobre a Igreja. Define a natureza e missão universal da Igreja como sacramento de salvação.', topics: ['Eclesiologia', 'Povo de Deus', 'Colegialidade'] },
  { id: 'vat2-dv', title: 'Dei Verbum', latinTitle: 'Dei Verbum', author: 'Concílio Vaticano II', year: 1965, category: 'constitution', summary: 'Constituição dogmática sobre a Revelação Divina. Trata das Escrituras, Tradição e Magistério.', topics: ['Revelação', 'Escritura', 'Tradição'] },
  { id: 'vat2-sc', title: 'Sacrosanctum Concilium', latinTitle: 'Sacrosanctum Concilium', author: 'Concílio Vaticano II', year: 1963, category: 'constitution', summary: 'Constituição sobre a Sagrada Liturgia. Promoveu a reforma litúrgica e a participação ativa dos fiéis.', topics: ['Liturgia', 'Sacramentos', 'Reforma'] },
  { id: 'vat2-gs', title: 'Gaudium et Spes', latinTitle: 'Gaudium et Spes', author: 'Concílio Vaticano II', year: 1965, category: 'constitution', summary: 'Constituição pastoral sobre a Igreja no mundo atual. Aborda temas como dignidade humana, cultura e vida social.', topics: ['Doutrina Social', 'Dignidade', 'Cultura'] },
  { id: 'vat2-na', title: 'Nostra Aetate', latinTitle: 'Nostra Aetate', author: 'Concílio Vaticano II', year: 1965, category: 'council', summary: 'Declaração sobre as relações da Igreja com as religiões não cristãs.', topics: ['Diálogo Inter-religioso', 'Judaísmo'] },
  // Encyclicals
  { id: 'rn', title: 'Rerum Novarum', latinTitle: 'Rerum Novarum', author: 'Leão XIII', year: 1891, category: 'encyclical', summary: 'Sobre a condição dos operários. Marco fundador da Doutrina Social da Igreja, defende os direitos dos trabalhadores.', topics: ['Doutrina Social', 'Trabalho', 'Propriedade'] },
  { id: 'qa', title: 'Quadragesimo Anno', latinTitle: 'Quadragesimo Anno', author: 'Pio XI', year: 1931, category: 'encyclical', summary: 'Sobre a restauração da ordem social. Desenvolve o princípio da subsidiariedade.', topics: ['Doutrina Social', 'Subsidiariedade'] },
  { id: 'mbs', title: 'Mit brennender Sorge', author: 'Pio XI', year: 1937, category: 'encyclical', summary: 'Condenação do nazismo e do racismo. Escrita em alemão, foi lida em todas as igrejas da Alemanha.', topics: ['Nazismo', 'Direitos Humanos'] },
  { id: 'mc', title: 'Mystici Corporis Christi', latinTitle: 'Mystici Corporis Christi', author: 'Pio XII', year: 1943, category: 'encyclical', summary: 'Sobre o Corpo Místico de Cristo. Define a Igreja como corpo vivo de Cristo.', topics: ['Eclesiologia', 'Corpo Místico'] },
  { id: 'hv', title: 'Humanae Vitae', latinTitle: 'Humanae Vitae', author: 'Paulo VI', year: 1968, category: 'encyclical', summary: 'Sobre a regulação da natalidade. Reafirma a doutrina da Igreja sobre contracepção e abertura à vida.', topics: ['Moral', 'Família', 'Bioética'] },
  { id: 'rh', title: 'Redemptor Hominis', latinTitle: 'Redemptor Hominis', author: 'João Paulo II', year: 1979, category: 'encyclical', summary: 'Primeira encíclica de João Paulo II. Cristo como redentor do homem e centro do cosmos.', topics: ['Cristologia', 'Antropologia'] },
  { id: 'fr', title: 'Fides et Ratio', latinTitle: 'Fides et Ratio', author: 'João Paulo II', year: 1998, category: 'encyclical', summary: 'Sobre as relações entre fé e razão. Defende a harmonia entre filosofia e teologia.', topics: ['Fé e Razão', 'Filosofia', 'Teologia'] },
  { id: 'dce', title: 'Deus Caritas Est', latinTitle: 'Deus Caritas Est', author: 'Bento XVI', year: 2005, category: 'encyclical', summary: 'Sobre o amor cristão. Primeira encíclica de Bento XVI sobre a caridade como essência do cristianismo.', topics: ['Caridade', 'Amor', 'Eros e Ágape'] },
  { id: 'ls', title: 'Laudato Si\'', latinTitle: 'Laudato Si\'', author: 'Francisco', year: 2015, category: 'encyclical', summary: 'Sobre o cuidado da casa comum. Aborda ecologia integral, mudanças climáticas e justiça social.', topics: ['Ecologia', 'Criação', 'Justiça Social'] },
  { id: 'ft', title: 'Fratelli Tutti', latinTitle: 'Fratelli Tutti', author: 'Francisco', year: 2020, category: 'encyclical', summary: 'Sobre a fraternidade e a amizade social. Promoção do diálogo e da solidariedade universal.', topics: ['Fraternidade', 'Diálogo', 'Paz'] },
  { id: 'dn', title: 'Dilexit Nos', latinTitle: 'Dilexit Nos', author: 'Francisco', year: 2024, category: 'encyclical', summary: 'Sobre o amor humano e divino do Coração de Jesus Cristo. Reflete sobre a devoção ao Sagrado Coração.', topics: ['Sagrado Coração', 'Amor Divino'] },
  // Exhortations
  { id: 'eg', title: 'Evangelii Gaudium', latinTitle: 'Evangelii Gaudium', author: 'Francisco', year: 2013, category: 'exhortation', summary: 'Sobre o anúncio do Evangelho no mundo atual. Programa pastoral do pontificado de Francisco.', topics: ['Evangelização', 'Pastoral', 'Missão'] },
  { id: 'al', title: 'Amoris Laetitia', latinTitle: 'Amoris Laetitia', author: 'Francisco', year: 2016, category: 'exhortation', summary: 'Sobre o amor na família. Reflexão sobre o matrimônio, a família e os desafios contemporâneos.', topics: ['Família', 'Matrimônio', 'Pastoral'] },
  { id: 'cv', title: 'Christus Vivit', latinTitle: 'Christus Vivit', author: 'Francisco', year: 2019, category: 'exhortation', summary: 'Aos jovens e a todo o Povo de Deus. Sobre a vocação e missão dos jovens na Igreja.', topics: ['Juventude', 'Vocação', 'Discernimento'] },
  { id: 'vs', title: 'Veritatis Splendor', latinTitle: 'Veritatis Splendor', author: 'João Paulo II', year: 1993, category: 'encyclical', summary: 'Sobre questões fundamentais do ensinamento moral da Igreja. Defende a existência de normas morais absolutas.', topics: ['Moral', 'Verdade', 'Liberdade'] },
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

const Magisterium: React.FC = () => {
  const [category, setCategory] = useState<DocCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<MagisteriumDoc | null>(null);

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

  if (selectedDoc) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedDoc(null)} className="p-2 rounded-xl bg-card border border-border hover:bg-primary/10 transition-all">
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
          <div className="border-t border-border pt-6">
            <p className="text-muted-foreground italic text-center text-sm">
              O texto completo será disponibilizado em breve com integração ao repositório da Santa Sé.
            </p>
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
        <p className="text-muted-foreground font-serif italic">Encíclicas, Concílios e Documentos da Santa Sé.</p>
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
      </div>

      {/* Documents grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map(doc => (
          <button key={doc.id} onClick={() => setSelectedDoc(doc)}
            className="text-left p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-2 ${CATEGORY_COLORS[doc.category] || 'bg-muted text-muted-foreground'}`}>
                  {CATEGORY_LABELS[doc.category]}
                </span>
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
