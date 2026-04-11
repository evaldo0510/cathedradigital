import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SEOHead from '@/components/SEOHead';
import { Icons } from '../../constants';
import StaggeredList from './StaggeredList';
import SacredImage from './SacredImage';
import SaintDetail, { CATEGORY_LABELS } from './SaintDetail';
import { SAINTS_DATA, type Saint } from '@/data/saints';
import { Search, X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles, BookOpen, Quote, Shield } from 'lucide-react';
import { format, addDays, subDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Saints: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null);
  const [autoReflect, setAutoReflect] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'daily' | 'search'>('daily');
  const [officialSaint, setOfficialSaint] = useState<any>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchOfficialSaint = async () => {
      try {
        const response = await supabase.functions.invoke('saint-of-the-day');
        if (response.data && !response.error) {
          setOfficialSaint(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch official saint:', err);
      }
    };
    fetchOfficialSaint();
  }, []);

  const handleOpenSaint = (saint: Saint, shouldReflect: boolean = false) => {
    setAutoReflect(shouldReflect);
    setSelectedSaint(saint);
  };

  const saintsForSelectedDate = useMemo(() => {
    const day = selectedDate.getDate();
    const month = selectedDate.getMonth() + 1;
    const localSaints = SAINTS_DATA.filter(s => s.feastMonth === month && s.feastDayNum === day);
    
    // Merge official saint if it's today
    if (officialSaint && isSameDay(selectedDate, new Date()) && officialSaint.name !== "Menu" && officialSaint.name !== "Santo do Dia") {
      const match = localSaints.find(s => 
        officialSaint.name.toLowerCase().includes(s.name.toLowerCase()) ||
        s.name.toLowerCase().includes(officialSaint.name.toLowerCase())
      );
      
      if (match) {
        return localSaints.map(s => s.id === match.id ? { ...s, ...officialSaint } : s);
      } else {
        return [
          {
            id: 'official-today',
            name: officialSaint.name,
            title: 'Santo do Dia',
            bio: officialSaint.description,
            image: officialSaint.image,
            url: officialSaint.url,
            category: 'confessor' as const,
            works: [],
            quotes: [],
            feastDay: '',
            feastMonth: 0,
            feastDayNum: 0,
            born: '',
            died: '',
            patronOf: []
          },
          ...localSaints
        ];
      }
    }
    
    return localSaints;
  }, [selectedDate, officialSaint]);


  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'reflect' && saintsForSelectedDate.length > 0) {
      handleOpenSaint(saintsForSelectedDate[0], true);
    }
  }, [searchParams, saintsForSelectedDate]);

  const filteredSaints = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase().trim();
    return SAINTS_DATA.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.patronOf.some(p => p.toLowerCase().includes(q))
    );
  }, [search]);

  // Date strip logic
  const dateStrip = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(subDays(selectedDate, 3), i));
  }, [selectedDate]);

  return (
    <>
      <SEOHead 
        title="Santo do Dia - Calendário de Santos" 
        description="Conheça o santo do dia, sua história, virtudes e ensinamentos. Um calendário completo de santidade para cada dia do ano." 
        path="/saints" 
        keywords="santo do dia, calendário litúrgico, vida dos santos, catolicismo, oração dos santos"
        breadcrumbs={[{ name: "Início", path: "/" }, { name: "Santos", path: "/saints" }]} 
      />

      <div className="space-y-10 pb-20">
        {/* Header */}
        <header className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary border border-primary/20"
          >
            <CalendarIcon className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sanctorum Pro</span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground">Santos</h1>
          <p className="text-muted-foreground font-serif italic max-w-xl mx-auto">
            "Sede santos, porque eu, o Senhor vosso Deus, sou santo." — Levítico 19,2
          </p>
        </header>

        {/* View Toggle */}
        <div className="flex justify-center">
          <div className="bg-secondary/50 p-1 rounded-2xl flex gap-1">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                viewMode === 'daily' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Santo do Dia
            </button>
            <button
              onClick={() => setViewMode('search')}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                viewMode === 'search' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Buscar Santo
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'daily' ? (
            <motion.div
              key="daily"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Date Navigator */}
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-4 md:gap-8">
                  <button 
                    onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                    className="p-3 bg-card border border-border rounded-full hover:bg-primary/5 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="text-center min-w-[200px]">
                    <h2 className="text-2xl font-serif font-bold text-foreground">
                      {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">
                      {format(selectedDate, "EEEE", { locale: ptBR })}
                    </p>
                  </div>

                  <button 
                    onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                    className="p-3 bg-card border border-border rounded-full hover:bg-primary/5 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Date Strip */}
                <div className="flex gap-2 overflow-x-auto pb-2 px-4 max-w-full no-scrollbar">
                  {dateStrip.map((date, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={`flex flex-col items-center justify-center min-w-[56px] h-20 rounded-2xl border transition-all ${
                        isSameDay(date, selectedDate)
                          ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110'
                          : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
                      }`}
                    >
                      <span className="text-[9px] font-black uppercase tracking-tighter mb-1">
                        {format(date, "EEE", { locale: ptBR }).replace('.', '')}
                      </span>
                      <span className="text-lg font-serif font-bold">{format(date, "dd")}</span>
                    </button>
                  ))}
                </div>

                {!isSameDay(selectedDate, new Date()) && (
                  <button 
                    onClick={() => setSelectedDate(new Date())}
                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                  >
                    Voltar para Hoje
                  </button>
                )}
              </div>

              {/* Saint Content */}
              <div className="max-w-4xl mx-auto space-y-6">
                {saintsForSelectedDate.length > 0 ? (
                  saintsForSelectedDate.map(saint => (
                    <motion.div
                      key={saint.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative bg-card border border-border rounded-[2.5rem] overflow-hidden hover:border-primary/30 transition-all shadow-xl"
                    >
                      <div className="flex flex-col md:flex-row h-full">
                        {/* Image Section */}
                        <div className="w-full md:w-1/3 h-64 md:h-auto relative">
                          <SacredImage 
                            src={saint.image} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                            alt={saint.name} 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-6 left-6 right-6 text-white">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-primary px-2 py-1 rounded-md mb-2 inline-block">
                              {CATEGORY_LABELS[saint.category] || saint.category}
                            </span>
                            <h3 className="text-2xl font-serif font-bold">{saint.name}</h3>
                          </div>
                        </div>

                        {/* Summary Content */}
                        <div className="flex-1 p-8 space-y-6">
                          <div>
                            <p className="text-lg text-primary font-serif italic mb-4">"{saint.title}"</p>
                            <p className="text-muted-foreground leading-relaxed line-clamp-4 font-serif italic">
                              {saint.bio}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Virtude Principal</span>
                              <div className="flex flex-wrap gap-1">
                                {saint.virtues?.slice(0, 1).map(v => (
                                  <span key={v} className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg">{v}</span>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1 text-right">
                              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Padroeiro(a)</span>
                              <p className="text-xs font-bold text-foreground truncate">{saint.patronOf[0] || '—'}</p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3">
                            <button
                              onClick={() => handleOpenSaint(saint, false)}
                              className="w-full py-4 bg-secondary text-secondary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                              <BookOpen className="w-4 h-4" />
                              Conhecer História
                            </button>

                            <button
                              onClick={() => handleOpenSaint(saint, true)}
                              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 group"
                            >
                              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                              Refletir com Logos
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] border border-dashed border-border space-y-4">
                    <Icons.Star className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                    <div className="space-y-2">
                      <p className="text-lg font-serif italic text-muted-foreground">O céu está repleto de heróis silenciosos.</p>
                      <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto">
                        Embora não tenhamos um santo específico catalogado para hoje em nossa base, milhares de almas celebram na glória de Deus.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar santo por nome, título ou padroado…"
                  className="w-full pl-14 pr-14 py-5 bg-card border border-border rounded-full text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                />
                {search && (
                  <button 
                    onClick={() => setSearch('')} 
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Search Results */}
              <div className="max-w-5xl mx-auto">
                {search.trim() ? (
                  <StaggeredList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSaints.map(saint => (
                      <button
                        key={saint.id}
                        onClick={() => handleOpenSaint(saint, false)}
                        className="group p-8 bg-card border border-border rounded-[2rem] hover:border-primary/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 text-left flex flex-col h-full"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">{saint.feastDay}</span>
                            <span className="text-[9px] px-2 py-0.5 bg-secondary text-secondary-foreground rounded-md font-bold uppercase">{CATEGORY_LABELS[saint.category]}</span>
                          </div>
                          <h3 className="text-2xl font-serif font-bold text-foreground group-hover:text-primary transition-colors mb-2">{saint.name}</h3>
                          <p className="text-sm text-muted-foreground font-serif italic mb-4 line-clamp-1">{saint.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-4">{saint.bio}</p>
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
                  <div className="text-center py-20 text-muted-foreground/60 italic font-serif">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Comece a digitar para encontrar um santo específico...</p>
                  </div>
                )}

                {search.trim() && filteredSaints.length === 0 && (
                  <p className="text-center text-muted-foreground py-20 italic font-serif">Nenhum santo encontrado para sua busca.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedSaint && (
            <SaintDetail 
              saint={selectedSaint} 
              onClose={() => setSelectedSaint(null)} 
              autoReflect={autoReflect}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Saints;