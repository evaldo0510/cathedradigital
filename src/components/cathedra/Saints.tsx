import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../constants';
import StaggeredList from './StaggeredList';
import SacredImage from './SacredImage';
import SaintDetail, { CATEGORY_LABELS } from './SaintDetail';
import { SAINTS_DATA, type Saint } from '@/data/saints';
import { Search, X } from 'lucide-react';

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as Saint['category'][];

/** Extract a numeric birth year from the "born" string, e.g. "1225, …" → 1225 */
function parseBirthYear(born: string): number | null {
  const m = born.match(/(\d{3,4})/);
  return m ? parseInt(m[1], 10) : null;
}

const Saints: React.FC = () => {
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  const saintOfTheDay = useMemo(() => {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    return SAINTS_DATA.find(s => s.feastMonth === month && s.feastDayNum === day) || SAINTS_DATA[0];
  }, []);

  const filteredSaints = useMemo(() => {
    let list = SAINTS_DATA;
    if (activeCategory) list = list.filter(s => s.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.patronOf.some(p => p.toLowerCase().includes(q))
      );
    }
    return list;
  }, [activeCategory, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    SAINTS_DATA.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });
    return counts;
  }, []);

  /** Saints sorted by birth year for timeline */
  const timelineSaints = useMemo(() => {
    return [...filteredSaints]
      .map(s => ({ ...s, birthYear: parseBirthYear(s.born) }))
      .filter(s => s.birthYear !== null)
      .sort((a, b) => a.birthYear! - b.birthYear!);
  }, [filteredSaints]);

  return (
    <motion.div
      className="space-y-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Sanctorum</p>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground">Vidas dos Santos</h1>
        <p className="text-muted-foreground font-serif italic max-w-xl mx-auto">
          Heróis da fé que iluminam o caminho da santidade através dos séculos.
        </p>
      </motion.div>

      {/* Saint of the Day */}
      {saintOfTheDay && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/5 border border-primary/20 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm backdrop-blur-sm"
        >
          <div className="w-40 h-40 rounded-3xl overflow-hidden flex-shrink-0 border-4 border-card shadow-xl rotate-3 hover:rotate-0 transition-transform duration-500">
            <SacredImage src={saintOfTheDay.image} className="w-full h-full object-cover" alt={saintOfTheDay.name} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <Icons.Star className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-primary font-black uppercase tracking-widest text-[10px]">Santo do Dia — {saintOfTheDay.feastDay}</span>
            </div>
            <h2 className="text-4xl font-serif font-bold text-foreground mb-2">{saintOfTheDay.name}</h2>
            <p className="text-primary font-serif italic text-lg mb-4">{saintOfTheDay.title}</p>
            <p className="text-muted-foreground italic font-serif leading-relaxed line-clamp-2">{saintOfTheDay.quotes[0]}</p>
            <button
              onClick={() => setSelectedSaint(saintOfTheDay)}
              className="mt-6 px-6 py-2.5 bg-foreground text-background rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform"
            >
              Conhecer sua vida
            </button>
          </div>
        </motion.section>
      )}

      {/* Search + View Toggle */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar santo por nome, título ou padroado…"
            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex bg-secondary rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              viewMode === 'grid' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Grade
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              viewMode === 'timeline' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Cronologia
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            !activeCategory ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary'
          }`}
        >
          Todos ({SAINTS_DATA.length})
        </button>
        {ALL_CATEGORIES.filter(c => categoryCounts[c]).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              activeCategory === cat ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary'
            }`}
          >
            {CATEGORY_LABELS[cat]} ({categoryCounts[cat]})
          </button>
        ))}
      </div>

      {/* Results count */}
      {(search || activeCategory) && (
        <p className="text-center text-sm text-muted-foreground">
          {filteredSaints.length} santo{filteredSaints.length !== 1 ? 's' : ''} encontrado{filteredSaints.length !== 1 ? 's' : ''}
        </p>
      )}

      {viewMode === 'grid' ? (
        /* Saints Grid */
        <StaggeredList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSaints.map(saint => (
            <button
              key={saint.id}
              onClick={() => setSelectedSaint(saint)}
              className="group p-8 bg-card border border-border rounded-3xl hover:border-primary/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 text-left flex flex-col h-full"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">{saint.feastDay}</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded font-bold">{CATEGORY_LABELS[saint.category]}</span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-foreground group-hover:text-primary transition-colors mb-2">{saint.name}</h3>
                <p className="text-sm text-muted-foreground font-serif italic mb-4">{saint.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-4">{saint.bio}</p>
                {saint.works.length > 0 && (
                  <p className="text-[10px] font-bold text-primary">
                    {saint.works.length} obra{saint.works.length > 1 ? 's' : ''} disponíve{saint.works.length > 1 ? 'is' : 'l'}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {saint.virtues?.slice(0, 3).map(v => (
                  <span key={v} className="px-2 py-1 bg-secondary text-[9px] font-black uppercase tracking-widest text-muted-foreground rounded-lg">{v}</span>
                ))}
              </div>
            </button>
          ))}
        </StaggeredList>
      ) : (
        /* Timeline View */
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-px" />

          <div className="space-y-8">
            {timelineSaints.map((saint, i) => {
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={saint.id}
                  initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className={`relative flex items-start gap-4 md:gap-8 ${
                    isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                  } flex-row`}
                >
                  {/* Content card */}
                  <div className={`flex-1 ml-14 md:ml-0 ${isLeft ? 'md:text-right' : 'md:text-left'}`}>
                    <button
                      onClick={() => setSelectedSaint(saint)}
                      className="group w-full p-5 bg-card border border-border rounded-2xl hover:border-primary/50 hover:shadow-xl transition-all duration-300 text-left"
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">{saint.feastDay}</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded font-bold">{CATEGORY_LABELS[saint.category]}</span>
                      </div>
                      <h3 className="text-xl font-serif font-bold text-foreground group-hover:text-primary transition-colors">{saint.name}</h3>
                      <p className="text-xs text-muted-foreground font-serif italic">{saint.title}</p>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{saint.bio}</p>
                    </button>
                  </div>

                  {/* Timeline node */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                      <span className="text-[9px] font-black text-primary">{saint.birthYear}</span>
                    </div>
                  </div>

                  {/* Spacer for the other side (desktop) */}
                  <div className="hidden md:block flex-1" />
                </motion.div>
              );
            })}
          </div>

          {timelineSaints.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhum santo encontrado.</p>
          )}
        </div>
      )}

      {filteredSaints.length === 0 && viewMode === 'grid' && (
        <p className="text-center text-sm text-muted-foreground py-8">Nenhum santo encontrado.</p>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedSaint && <SaintDetail saint={selectedSaint} onClose={() => setSelectedSaint(null)} />}
      </AnimatePresence>
    </motion.div>
  );
};

export default Saints;
