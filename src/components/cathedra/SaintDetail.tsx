import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../../constants';
import SacredImage from './SacredImage';
import ShareButton from './ShareButton';
import { type Saint } from '@/data/saints';

const CATEGORY_LABELS: Record<string, string> = {
  apostle: 'Apóstolo',
  martyr: 'Mártir',
  doctor: 'Doutor(a) da Igreja',
  virgin: 'Virgem',
  confessor: 'Confessor',
  pope: 'Papa',
  founder: 'Fundador(a)',
  mystic: 'Místico(a)',
};

const SaintDetail: React.FC<{ saint: Saint; onClose: () => void }> = ({ saint, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-background/95 z-[70] flex items-center justify-center p-4 md:p-8 backdrop-blur-md"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
      className="bg-card rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-border flex flex-col md:flex-row"
      onClick={e => e.stopPropagation()}
    >
      {/* Image */}
      <div className="w-full md:w-2/5 h-64 md:h-auto relative overflow-hidden flex-shrink-0">
        <SacredImage src={saint.image} className="w-full h-full object-cover" alt={saint.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <button onClick={onClose} className="absolute top-6 left-6 p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-md text-white transition-colors">
          <Icons.ArrowDown className="w-5 h-5 rotate-90" />
        </button>
        <div className="absolute bottom-6 left-6 right-6 md:hidden">
          <h2 className="text-2xl font-serif font-bold text-white">{saint.name}</h2>
          <p className="text-primary font-serif italic">{saint.title}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto space-y-6">
        <div className="hidden md:block">
          <h2 className="text-3xl font-serif font-bold text-foreground">{saint.name}</h2>
          <p className="text-lg text-primary font-serif italic">{saint.title}</p>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full font-bold">{saint.feastDay}</span>
          <span className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full font-bold">{CATEGORY_LABELS[saint.category] || saint.category}</span>
          <ShareButton
            title={saint.name}
            text={`${saint.name} — ${saint.title}. ${saint.quotes[0] || ''}`}
            variant="button"
            className="!px-3 !py-1.5 !text-xs !rounded-full"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-secondary/50 rounded-xl">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Nascimento</span>
            <span className="text-foreground font-serif">{saint.born}</span>
          </div>
          <div className="p-3 bg-secondary/50 rounded-xl">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Falecimento</span>
            <span className="text-foreground font-serif">{saint.died}</span>
          </div>
        </div>

        {/* Patronage */}
        {saint.patronOf.length > 0 && (
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Padroeiro(a) de</span>
            <div className="flex flex-wrap gap-1.5">
              {saint.patronOf.map(p => (
                <span key={p} className="px-2 py-1 bg-secondary text-secondary-foreground text-[10px] font-bold rounded-lg">{p}</span>
              ))}
            </div>
          </div>
        )}

        {/* Biography */}
        <section>
          <span className="text-[9px] font-black uppercase tracking-widest text-primary block mb-3">Biografia</span>
          <div className="text-foreground/90 font-serif leading-relaxed text-[15px] space-y-4">
            {(saint.fullBio || saint.bio).split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {/* Works */}
        {saint.works.length > 0 && (
          <section>
            <span className="text-[9px] font-black uppercase tracking-widest text-primary block mb-3">
              Obras {saint.works.length > 0 && `(${saint.works.length})`}
            </span>
            <div className="space-y-2">
              {saint.works.map((w, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl group hover:bg-primary/5 transition-colors">
                  <Icons.Book className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {w.url ? (
                      <a href={w.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-foreground hover:text-primary transition-colors underline-offset-2 hover:underline">{w.title}</a>
                    ) : (
                      <span className="text-sm font-bold text-foreground">{w.title}</span>
                    )}
                    {w.year && <span className="text-[10px] text-muted-foreground ml-2">({w.year})</span>}
                  </div>
                  {w.url && (
                    <a href={w.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-primary hover:underline flex-shrink-0 flex items-center gap-1">
                      Ler <Icons.ArrowDown className="w-3 h-3 -rotate-90" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quotes */}
        {saint.quotes.length > 0 && (
          <section>
            <span className="text-[9px] font-black uppercase tracking-widest text-primary block mb-3">Citações</span>
            <div className="space-y-3">
              {saint.quotes.map((q, i) => (
                <blockquote key={i} className="border-l-2 border-primary/30 pl-4 py-1">
                  <p className="text-foreground/80 font-serif italic text-sm leading-relaxed">{q}</p>
                </blockquote>
              ))}
            </div>
          </section>
        )}

        {/* Virtues */}
        {saint.virtues && saint.virtues.length > 0 && (
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Virtudes</span>
            <div className="flex flex-wrap gap-1.5">
              {saint.virtues.map(v => (
                <span key={v} className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg">{v}</span>
              ))}
            </div>
          </div>
        )}

        {/* Prayer */}
        {saint.prayer && (
          <section className="bg-foreground text-background p-6 rounded-2xl">
            <span className="text-[9px] font-black uppercase tracking-widest text-background/60 block mb-3">Oração</span>
            <p className="font-serif italic text-lg leading-relaxed">"{saint.prayer}"</p>
          </section>
        )}
      </div>
    </motion.div>
  </motion.div>
);

export default SaintDetail;
export { CATEGORY_LABELS };
