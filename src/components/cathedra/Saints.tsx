import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../../constants';
import StaggeredList from './StaggeredList';
import SacredImage from './SacredImage';
import SaintDetail, { CATEGORY_LABELS } from './SaintDetail';
import { SAINTS_DATA, type Saint } from '@/data/saints';

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as Saint['category'][];

const Saints: React.FC = () => {
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const saintOfTheDay = useMemo(() => {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    return SAINTS_DATA.find(s => s.feastMonth === month && s.feastDayNum === day) || SAINTS_DATA[0];
  }, []);

  const filteredSaints = useMemo(() => {
    if (!activeCategory) return SAINTS_DATA;
    return SAINTS_DATA.filter(s => s.category === activeCategory);
  }, [activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    SAINTS_DATA.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });
    return counts;
  }, []);

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

      {/* Saints Grid */}
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

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedSaint && <SaintDetail saint={selectedSaint} onClose={() => setSelectedSaint(null)} />}
      </AnimatePresence>
    </motion.div>
  );
};

export default Saints;
