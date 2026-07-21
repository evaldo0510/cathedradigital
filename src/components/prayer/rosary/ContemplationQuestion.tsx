/**
 * ContemplationQuestion — pergunta espiritual ao final da dezena.
 * Sem resposta obrigatória — apenas convite silencioso.
 */
import React from 'react';
import { HelpCircle } from 'lucide-react';
import type { DBMystery } from '@/prayer-engine/loadPrayerHierarchy';
import { readMysteryMeta } from './mysteryMeta';

const ContemplationQuestion: React.FC<{ mystery: DBMystery }> = ({ mystery }) => {
  const meta = readMysteryMeta(mystery);
  if (!meta.contemplation_question) return null;
  return (
    <aside
      aria-label="Pergunta para contemplação"
      className="my-8 rounded-2xl border border-stitch-outline-variant/40 bg-stitch-surface-container-lowest/30 p-6 text-center"
    >
      <HelpCircle aria-hidden className="mx-auto h-4 w-4 text-stitch-secondary" />
      <p className="mt-3 font-stitch-body text-[10px] font-bold uppercase tracking-[0.28em] text-stitch-secondary">
        Para contemplar
      </p>
      <p className="mt-3 font-stitch-serif text-lg italic leading-relaxed text-stitch-on-surface md:text-xl">
        {meta.contemplation_question}
      </p>
    </aside>
  );
};

export default ContemplationQuestion;
