import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../constants';
import StaggeredList from './StaggeredList';
import SacredImage from './SacredImage';

interface SaintWork { title: string; url?: string; }

interface Saint {
  id: string;
  name: string;
  title: string;
  feastDay: string;
  feastMonth: number;
  feastDayNum: number;
  born: string;
  died: string;
  patronOf: string[];
  bio: string;
  works: SaintWork[];
  quotes: string[];
  category: 'apostle' | 'martyr' | 'doctor' | 'virgin' | 'confessor' | 'pope' | 'founder' | 'mystic';
  image?: string;
  prayer?: string;
  virtues?: string[];
}

const SAINTS_DATA: Saint[] = [
  {
    id: 'thomas-aquinas', name: 'São Tomás de Aquino', title: 'Doctor Angelicus',
    feastDay: '28 de Janeiro', feastMonth: 1, feastDayNum: 28,
    born: '1225, Roccasecca', died: '1274, Fossanova',
    patronOf: ['Estudantes', 'Universidades', 'Filósofos'],
    bio: 'Frade dominicano, teólogo e filósofo italiano. Considerado o maior teólogo da Igreja Católica, autor da Suma Teológica, obra monumental que sintetiza a filosofia aristotélica com a teologia cristã.',
    works: [{ title: 'Suma Teológica', url: 'https://sumateologica.files.wordpress.com/2017/04/suma-teolc3b3gica.pdf' }],
    quotes: ['"O temor é o princípio da sabedoria."', '"A graça não destrói a natureza, mas a aperfeiçoa."'],
    category: 'doctor', image: 'https://images.unsplash.com/photo-1548610762-656391d1ad4d',
    virtues: ['Sabedoria', 'Humildade', 'Pureza'],
    prayer: 'Concedei-me, Senhor, uma vontade que vos queira, uma mente que vos conheça, e um coração que vos ame.'
  },
  {
    id: 'agostinho', name: 'Santo Agostinho de Hipona', title: 'Doctor Gratiae',
    feastDay: '28 de Agosto', feastMonth: 8, feastDayNum: 28,
    born: '354, Tagaste', died: '430, Hipona',
    patronOf: ['Teólogos', 'Cervejeiros', 'Impressores'],
    bio: 'Bispo de Hipona e um dos mais importantes Padres da Igreja. Sua conversão é um dos relatos mais célebres da literatura cristã.',
    works: [{ title: 'Confissões', url: 'https://www.augustinus.it/portoghese/confessioni/index.htm' }],
    quotes: ['"Fizeste-nos para Ti, Senhor, e o nosso coração está inquieto enquanto não descansar em Ti."'],
    category: 'doctor', image: 'https://images.unsplash.com/photo-1510627255389-9e8a718b53e7',
    virtues: ['Contrição', 'Busca pela Verdade'],
    prayer: 'Tarde te amei, ó Beleza tão antiga e tão nova!'
  },
  {
    id: 'francisco-assis', name: 'São Francisco de Assis', title: 'Il Poverello',
    feastDay: '4 de Outubro', feastMonth: 10, feastDayNum: 4,
    born: '1181, Assis', died: '1226, Porciúncula',
    patronOf: ['Animais', 'Ecologia'],
    bio: 'Fundador da Ordem dos Frades Menores. Renunciou à riqueza para viver em pobreza radical.',
    works: [{ title: 'Cântico das Criaturas', url: 'https://www.franciscanos.org.br/?p=cantico-das-criaturas' }],
    quotes: ['"Senhor, fazei-me instrumento da vossa paz."'],
    category: 'founder', image: 'https://images.unsplash.com/photo-1543333309-8cdcd4fef673',
    virtues: ['Pobreza', 'Fraternidade'],
    prayer: 'Senhor, fazei-me instrumento de vossa paz.'
  },
  {
    id: 'judas-tadeu', name: 'São Judas Tadeu', title: 'Padroeiro das Causas Impossíveis',
    feastDay: '28 de Outubro', feastMonth: 10, feastDayNum: 28,
    born: 'Galileia', died: 'Pérsia',
    patronOf: ['Causas impossíveis', 'Negócios difíceis'],
    bio: 'Um dos doze apóstolos, irmão de São Tiago Menor. Pregou o Evangelho na Mesopotâmia e Pérsia onde foi martirizado.',
    works: [{ title: 'Epístola de São Judas' }],
    quotes: ['"Mantenham-se no amor de Deus."'],
    category: 'apostle', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    virtues: ['Esperança', 'Perseverança'],
    prayer: 'São Judas Tadeu, apóstolo glorioso, intercedei por mim nas minhas necessidades.'
  },
  {
    id: 'charbel', name: 'São Charbel Makhlouf', title: 'O Eremita de Annaya',
    feastDay: '24 de Julho', feastMonth: 7, feastDayNum: 24,
    born: '1828, Líbano', died: '1898, Líbano',
    patronOf: ['Pessoas doentes', 'Paz'],
    bio: 'Monge maronita libanês, viveu como eremita por 23 anos. Famoso por inúmeros milagres.',
    works: [],
    quotes: ['"O silêncio fala a Deus."'],
    category: 'mystic', image: 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde',
    virtues: ['Silêncio', 'Oração', 'Penitência'],
    prayer: 'Senhor, pela intercessão de São Charbel, dai-me a cura da alma e do corpo.'
  }
];

const Saints: React.FC = () => {
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null);
  const saintOfTheDay = useMemo(() => {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    return SAINTS_DATA.find(s => s.feastMonth === month && s.feastDayNum === day) || SAINTS_DATA[0];
  }, []);

  return (
    <div className="space-y-12 page-enter">
      <div className="text-center space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4af37]">Sanctorum</p>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-100">Vidas dos Santos</h1>
        <p className="text-stone-500 font-serif italic max-w-xl mx-auto">Heróis da fé que iluminam o caminho da santidade através dos séculos.</p>
      </div>

      {saintOfTheDay && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50/50 dark:bg-stone-900/50 border border-amber-200/50 dark:border-stone-800 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm backdrop-blur-sm"
        >
          <div className="w-40 h-40 rounded-3xl overflow-hidden flex-shrink-0 border-4 border-white dark:border-stone-800 shadow-xl rotate-3 hover:rotate-0 transition-transform duration-500">
             <SacredImage src={saintOfTheDay.image} className="w-full h-full object-cover" alt="Saint" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <Icons.Star className="w-4 h-4 text-[#d4af37] animate-pulse" />
              <span className="text-[#d4af37] font-black uppercase tracking-widest text-[10px]">Santo do Dia — {saintOfTheDay.feastDay}</span>
            </div>
            <h2 className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-2">{saintOfTheDay.name}</h2>
            <p className="text-amber-800 dark:text-[#d4af37] font-serif italic text-lg mb-4">{saintOfTheDay.title}</p>
            <p className="text-stone-600 dark:text-stone-400 italic font-serif leading-relaxed line-clamp-2">"{saintOfTheDay.quotes[0]}"</p>
            <button onClick={() => setSelectedSaint(saintOfTheDay)} className="mt-6 px-6 py-2.5 bg-stone-900 dark:bg-[#d4af37] text-white dark:text-stone-900 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform">
              Conhecer sua vida
            </button>
          </div>
        </motion.section>
      )}

      <StaggeredList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SAINTS_DATA.map(saint => (
          <button 
            key={saint.id} onClick={() => setSelectedSaint(saint)} 
            className="group p-8 bg-white dark:bg-stone-900/40 border border-stone-100 dark:border-stone-800 rounded-3xl hover:border-[#d4af37]/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 text-left flex flex-col h-full"
          >
            <div className="flex-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#d4af37] mb-2 block">{saint.feastDay}</span>
              <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#d4af37] transition-colors mb-2">{saint.name}</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 font-serif italic mb-4">{saint.title}</p>
              <p className="text-sm text-stone-600 dark:text-stone-500 line-clamp-3 leading-relaxed mb-6">{saint.bio}</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-auto">
              {saint.virtues?.map(v => <span key={v} className="px-2 py-1 bg-stone-50 dark:bg-stone-800 text-[9px] font-black uppercase tracking-widest text-stone-400 rounded-lg">{v}</span>)}
            </div>
          </button>
        ))}
      </StaggeredList>

      <AnimatePresence>
        {selectedSaint && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-stone-900/95 z-[70] flex items-center justify-center p-4 md:p-8 backdrop-blur-md" onClick={() => setSelectedSaint(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white dark:bg-stone-900 rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
              <div className="w-full md:w-2/5 h-64 md:h-auto relative overflow-hidden">
                <SacredImage src={selectedSaint.image} className="w-full h-full object-cover" alt={selectedSaint.name} />
                <button onClick={() => setSelectedSaint(null)} className="absolute top-6 left-6 p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-md text-white transition-colors"><Icons.ArrowDown className="w-5 h-5 rotate-90" /></button>
              </div>
              <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                <h2 className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-2">{selectedSaint.name}</h2>
                <p className="text-xl text-[#d4af37] font-serif italic mb-8">{selectedSaint.title}</p>
                <div className="space-y-8">
                  <section><p className="text-stone-700 dark:text-stone-300 font-serif leading-relaxed text-lg">{selectedSaint.bio}</p></section>
                  {selectedSaint.prayer && (
                    <section className="bg-stone-900 text-white p-8 rounded-[2rem]"><p className="font-serif italic text-xl leading-relaxed">"{selectedSaint.prayer}"</p></section>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Saints;
