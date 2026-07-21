/**
 * MissaClosingActionCard — cartão final da celebração:
 * "Ação concreta para viver a liturgia" + oração final breve.
 * As sugestões de continuidade espiritual (LH, Santo, Rosário, Bíblia,
 * Catecismo) ficam no ReaderContinuation logo abaixo.
 */
import React from 'react';
import { Icons } from '@/constants';

interface Props {
  gospelSummary?: string | null;
}

export const MissaClosingActionCard: React.FC<Props> = ({ gospelSummary }) => (
  <section
    aria-label="Levar a liturgia para a vida"
    className="my-spacing-lg rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/[0.06] via-transparent to-secondary/[0.05] p-spacing-lg md:p-spacing-xl"
  >
    <div className="flex items-start gap-spacing-sm">
      <Icons.Flame className="h-6 w-6 text-primary flex-shrink-0 mt-1" aria-hidden />
      <div>
        <p className="font-stitch-body text-[10px] font-black uppercase tracking-[0.3em] text-primary">
          Ite, missa est
        </p>
        <h3 className="mt-spacing-2xs font-stitch-display text-premium-xl md:text-premium-2xl text-foreground">
          Uma ação concreta para hoje
        </h3>
        <p className="mt-spacing-sm font-serif italic leading-relaxed text-muted-foreground">
          {gospelSummary
            ? `A Palavra que ouvimos hoje pede resposta. Escolha um gesto pequeno e verdadeiro para viver o Evangelho antes que este dia termine: um perdão dado, um telefonema adiado, um minuto de silêncio diante do sacrário, uma esmola escondida.`
            : `Escolha um gesto pequeno e verdadeiro para viver a Missa antes que este dia termine: um perdão dado, um telefonema adiado, um minuto de silêncio diante do sacrário, uma esmola escondida.`}
        </p>
        <blockquote className="mt-spacing-md border-l-2 border-primary/40 pl-spacing-sm font-stitch-display text-premium-base italic leading-relaxed text-foreground">
          Senhor Jesus, que na Eucaristia vos entregastes por mim, fazei
          que a graça deste altar se prolongue nas horas do meu dia,
          e que aquilo que celebrei se torne vida em mim. Amém.
        </blockquote>
      </div>
    </div>
  </section>
);

export default MissaClosingActionCard;
