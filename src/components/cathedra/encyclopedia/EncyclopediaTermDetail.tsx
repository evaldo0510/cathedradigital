import { Icons } from '@/constants';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FaithTerm } from '../AZFaithPage';
import BibleVersePopover from '../BibleVersePopover';
import CatechismPopover from '../CatechismPopover';
import MagisteriumPopover from '../MagisteriumPopover';
import { parseBibleReferences } from '@/lib/bibleRefParser';
import { buildBibleUrl } from '@/lib/bibleUrl';

interface EncyclopediaTermDetailProps {
  selectedTerm: FaithTerm | null;
  detailRef: React.RefObject<HTMLDivElement>;
  navigate: (path: string) => void;
  onStudyWithLogos: (term: string) => void;
  onLiveThis: (term: FaithTerm) => void;
}

const EncyclopediaTermDetail: React.FC<EncyclopediaTermDetailProps> = ({
  selectedTerm,
  detailRef,
  navigate,
  onStudyWithLogos,
  onLiveThis,
}) => {
  return (
    <div className="md:col-span-8" ref={detailRef}>
      <AnimatePresence mode="wait">
        {!selectedTerm ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col items-center justify-center text-center p-spacing-xl bg-muted/10 rounded-premium-full border border-dashed border-border/40"
          >
            <Icons.Sparkles className="h-spacing-xl w-spacing-xl text-primary/60 mb-spacing-md" />
            <h3 className="text-premium-xl font-bold text-foreground mb-spacing-xs">Selecione um termo</h3>
            <p className="text-muted-foreground text-premium-sm">Escolha um termo da lista para explorar sua profundidade teológica.</p>
          </motion.div>
        ) : (
          <motion.div
            key={selectedTerm.term}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="bg-card border border-border rounded-premium-full p-spacing-lg md:p-spacing-xl space-y-spacing-lg shadow-premium-md"
          >
            {/* Term Header */}
            <div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-premium-xs uppercase tracking-[0.15em] font-black mb-spacing-xs">
                {selectedTerm.category || 'Conceito'}
              </Badge>
              <h2 className="text-premium-3xl md:text-premium-4xl font-black text-foreground tracking-tight">
                🫧 {selectedTerm.term}
              </h2>
            </div>

            {/* Definition */}
            <div className="space-y-spacing-2xs">
              <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">Definição</p>
              <p className="text-foreground/90 leading-relaxed text-premium-base font-medium italic">
                {selectedTerm.definition}
              </p>
            </div>

            {/* Bible */}
            {(selectedTerm.bibleVerses || selectedTerm.reference) && (
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-premium p-spacing-md space-y-spacing-xs">
                <div className="flex items-center gap-spacing-xs">
                  <Icons.Book className="w-spacing-md h-spacing-md text-blue-600" />
                  <p className="text-premium-xs font-black uppercase tracking-widest text-blue-600">📖 Bíblia</p>
                </div>
                <div className="flex flex-wrap gap-spacing-xs">
                  {(selectedTerm.bibleVerses || [selectedTerm.reference!]).flatMap((v, vIdx) => {
                    const segments = parseBibleReferences(v);
                    const bibleRefs = segments.filter(s => s.type === 'bibleRef' && s.abbr);
                    
                    if (bibleRefs.length > 0) {
                      return bibleRefs.map((bibleSeg, bIdx) => (
                        <BibleVersePopover
                          key={`${vIdx}-${bIdx}`}
                          abbr={bibleSeg.abbr!}
                          chapter={bibleSeg.chapter!}
                          verse={bibleSeg.verse}
                          label={bibleSeg.value}
                          onNavigate={(abbr, chapter, verse) => {
                            navigate(buildBibleUrl({ abbr, chapter, verse }));
                          }}
                        />
                      ));
                    }
                    
                    return (
                      <Badge key={vIdx} variant="outline" className="bg-blue-500/5 text-blue-700 dark:text-blue-400 border-blue-500/20 rounded-premium-full text-premium-xs font-semibold">
                        {v}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Catechism */}
            {selectedTerm.catechismReferences && (
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-premium p-spacing-md space-y-spacing-xs">
                <div className="flex items-center gap-spacing-xs">
                  <Icons.Bookmark className="w-spacing-md h-spacing-md text-amber-600" />
                  <p className="text-premium-xs font-black uppercase tracking-widest text-amber-600">📘 Catecismo</p>
                </div>
                <div className="flex flex-wrap gap-spacing-xs">
                  {selectedTerm.catechismReferences.flatMap((r, rIdx) => {
                    const paraMatches = [...r.matchAll(/§(\d+)/g)];
                    
                    if (paraMatches.length > 0) {
                      return paraMatches.map((match, mIdx) => (
                        <CatechismPopover
                          key={`${rIdx}-${mIdx}`}
                          paragraph={parseInt(match[1])}
                          onNavigate={(p) => navigate(`/catecismo?p=${p}`)}
                        />
                      ));
                    }
                    
                    return (
                      <Badge key={rIdx} variant="outline" className="bg-amber-500/5 text-amber-700 dark:text-amber-400 border-amber-500/20 rounded-premium-full text-premium-xs font-semibold">
                        {r}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Magisterium */}
            {selectedTerm.magisteriumReferences && (
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-premium p-spacing-md space-y-spacing-xs">
                <div className="flex items-center gap-spacing-xs">
                  <Icons.Globe className="w-spacing-md h-spacing-md text-emerald-600" />
                  <p className="text-premium-xs font-black uppercase tracking-widest text-emerald-600">📜 Magistério</p>
                </div>
                <div className="flex flex-wrap gap-spacing-xs">
                  {selectedTerm.magisteriumReferences.map((m, idx) => {
                    const docName = m.replace(/\s*\(.*?\)\s*$/, '').replace(/\s*n\.\s*\d.*$/, '').trim();
                    return (
                      <MagisteriumPopover
                        key={`${m}-${idx}`}
                        documentName={docName}
                        label={m}
                        onNavigate={(search) => navigate(`/magisterio?search=${encodeURIComponent(search)}`)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Practical Application */}
            {selectedTerm.practicalApplication && (
              <div className="bg-primary/5 border border-primary/10 rounded-premium p-spacing-md space-y-spacing-xs">
                <div className="flex items-center gap-spacing-xs">
                  <Icons.Target className="w-spacing-md h-spacing-md text-primary" />
                  <p className="text-premium-xs font-black uppercase tracking-widest text-primary">🧠 Aplicação</p>
                </div>
                <p className="text-foreground/80 leading-relaxed text-premium-sm font-medium">
                  {selectedTerm.practicalApplication}
                </p>
              </div>
            )}

            {/* Deep Interpretation */}
            {selectedTerm.deepInterpretation && (
              <div className="bg-muted/30 rounded-premium p-spacing-md space-y-spacing-xs">
                <div className="flex items-center gap-spacing-xs">
                  <Icons.Quote className="w-spacing-md h-spacing-md text-muted-foreground" />
                  <p className="text-premium-xs font-black uppercase tracking-widest text-muted-foreground">Interpretação</p>
                </div>
                <p className="text-foreground/70 leading-relaxed text-premium-sm italic font-serif">
                  {selectedTerm.deepInterpretation}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-spacing-sm pt-spacing-xs">
              <Button
                onClick={() => onStudyWithLogos(selectedTerm.term)}
                variant="outline"
                className="w-full rounded-premium-full h-spacing-2xl gap-spacing-xs font-bold text-premium-xs uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/10"
              >
                <Icons.Brain className="w-spacing-md h-spacing-md" />
                🤖 Refletir com Logos
              </Button>

              <Button
                onClick={() => onLiveThis(selectedTerm)}
                className={`w-full rounded-premium-full h-spacing-2xl gap-spacing-xs font-bold text-premium-xs uppercase tracking-widest ${selectedTerm.journey_id ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border-border text-foreground/70 hover:bg-muted/50'}`}
                variant={selectedTerm.journey_id ? 'default' : 'outline'}
              >
                {selectedTerm.journey_id ? <Icons.Compass className="w-spacing-md h-spacing-md" /> : <Icons.Heart className="w-spacing-md h-spacing-md" />}
                🚀 Viver isso {selectedTerm.journey_id ? '— Jornada Prática' : ''}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EncyclopediaTermDetail;
