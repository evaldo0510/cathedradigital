import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../constants';
import StaggeredList from './StaggeredList';
import SacredImage from './SacredImage';

const InternalReader: React.FC<{ url: string; title: string; onClose: () => void }> = ({ url, title, onClose }) => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/90 flex flex-col backdrop-blur-sm">
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-stone-900 text-white">
        <div className="flex items-center gap-3">
          <Icons.Book className="w-5 h-5 text-[#d4af37]" />
          <h2 className="font-serif font-bold text-lg truncate max-w-[250px] md:max-w-md">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/10 rounded-full transition-colors"><Icons.ExternalLink className="w-5 h-5" /></a>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Icons.ArrowDown className="w-6 h-6 rotate-180" /></button>
        </div>
      </div>
      <div className="flex-1 relative bg-white">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-50 gap-4">
            <Icons.Cross className="w-12 h-12 text-[#d4af37] animate-pulse" />
            <p className="font-serif italic text-stone-500">Abrindo obra sagrada...</p>
          </div>
        )}
        <iframe src={url} className="w-full h-full border-none" onLoad={() => setLoading(false)} title={title} />
      </div>
    </motion.div>
  );
};

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
    category: 'apostle',
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
    category: 'mystic',
    virtues: ['Silêncio', 'Oração', 'Penitência'],
    prayer: 'Senhor, pela intercessão de São Charbel, dai-me a cura da alma e do corpo.'
  }
];

const CATEGORY_LABELS: Record<string, string> = { apostle: 'Apóstolo', martyr: 'Mártir', doctor: 'Doutor(a)', founder: 'Fundador(a)', mystic: 'Místico(a)' };
const CATEGORY_COLORS: Record<string, string> = { apostle: 'bg-blue-100 text-blue-800', martyr: 'bg-red-100 text-red-800', doctor: 'bg-amber-100 text-amber-800', founder: 'bg-orange-100 text-orange-800', mystic: 'bg-violet-100 text-violet-800' };

const Saints: React.FC = () => {
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null);
  const saintOfTheDay = useMemo(() => {
    const today = new Date();
    return SAINTS_DATA.find(s => s.feastMonth === today.getMonth() + 1 && s.feastDayNum === today.getDate());
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12">
      {saintOfTheDay && (
        <section className="bg-amber-50 dark:bg-stone-900 border border-amber-200 dark:border-stone-800 rounded-3xl p-8 flex items-center gap-8">
          <div className="w-32 h-32 rounded-full overflow-hidden flex-shrink-0 border-4 border-white shadow-lg">
             <img src={saintOfTheDay.image || 'https://images.unsplash.com/photo-1548610762-656391d1ad4d'} className="w-full h-full object-cover" alt="Saint" />
          </div>
          <div>
            <span className="text-amber-700 font-black uppercase tracking-widest text-xs">Santo do Dia</span>
            <h2 className="text-3xl font-serif font-bold text-stone-900">{saintOfTheDay.name}</h2>
            <p className="text-amber-800 font-serif italic mb-4">{saintOfTheDay.title}</p>
            <p className="text-stone-600 italic">"{saintOfTheDay.quotes[0]}"</p>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SAINTS_DATA.map(saint => (
          <button key={saint.id} onClick={() => setSelectedSaint(saint)} className="p-6 bg-white dark:bg-stone-900 border rounded-2xl hover:shadow-lg transition-all text-left">
            <h3 className="font-serif font-bold">{saint.name}</h3>
            <p className="text-sm text-primary mb-2">{saint.title}</p>
            <p className="text-xs text-stone-500 line-clamp-2">{saint.bio}</p>
          </button>
        ))}
      </div>
      
      {selectedSaint && (
        <motion.div initial={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
             <h2 className="text-4xl font-serif font-bold mb-2">{selectedSaint.name}</h2>
             <p className="text-lg italic mb-6">{selectedSaint.title}</p>
             <div className="prose max-w-none">
                <p>{selectedSaint.bio}</p>
                {selectedSaint.prayer && (
                   <div className="bg-stone-100 p-4 rounded-xl mt-6">
                      <p className="font-serif italic text-sm">"{selectedSaint.prayer}"</p>
                   </div>
                )}
             </div>
             <button onClick={() => setSelectedSaint(null)} className="mt-8 bg-stone-900 text-white px-6 py-2 rounded-full">Fechar</button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
export default Saints;
