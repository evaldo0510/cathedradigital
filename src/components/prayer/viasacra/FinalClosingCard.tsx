/**
 * FinalClosingCard — encerramento editorial da Via Sacra completa (14ª estação).
 *
 * Momento de recolhimento após percorrer todo o caminho da Cruz. Inclui
 * versículo pascal, oração final e CTAs (recomeçar / voltar às Orações).
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Cross, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ShareButton from '@/components/cathedra/ShareButton';

interface Props {
  onRestart: () => void;
  onExit: () => void;
}

const FinalClosingCard: React.FC<Props> = ({ onRestart, onExit }) => {
  return (
    <motion.section
      aria-labelledby="via-sacra-final"
      data-testid="via-sacra-final-closing"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mt-spacing-2xl mx-auto max-w-2xl rounded-[2.5rem] border border-primary/20 bg-card/60 p-spacing-xl md:p-spacing-2xl text-center space-y-spacing-lg"
    >
      <div className="inline-flex items-center gap-spacing-xs px-spacing-md py-spacing-2xs bg-primary/5 border border-primary/10 rounded-premium">
        <Cross className="w-spacing-md h-spacing-md text-primary" />
        <span className="font-serif text-premium-xs font-black uppercase tracking-[0.32em] text-primary">
          Via Sacra concluída
        </span>
      </div>

      <h2
        id="via-sacra-final"
        className="font-serif text-premium-3xl md:text-premium-4xl font-bold text-foreground tracking-tight"
      >
        Do sepulcro ao Ressuscitado
      </h2>

      <p className="font-serif italic text-premium-lg leading-relaxed text-foreground/85 max-w-[54ch] mx-auto">
        "Se, pois, morremos com Cristo, cremos que também com Ele viveremos, sabendo que Cristo, ressuscitado dos mortos, já não morre." <span className="not-italic text-premium-xs uppercase tracking-widest text-muted-foreground">— Rm 6,8-9</span>
      </p>

      <div className="mx-auto max-w-[54ch] rounded-2xl border border-primary/10 bg-primary/[0.04] px-spacing-lg py-spacing-md space-y-spacing-xs">
        <p className="font-serif text-premium-xs font-black uppercase tracking-[0.28em] text-primary">
          Oração final
        </p>
        <p className="font-serif text-premium-base leading-relaxed text-foreground/90">
          Senhor Jesus Cristo, pela Vossa dolorosa Paixão, pela Vossa morte e sepultura,
          concedei-me caminhar hoje como discípulo da Cruz — sepultando em mim o que morre
          e deixando florescer o que já ressuscita em Vós. Amém.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-spacing-sm pt-spacing-xs">
        <Button
          onClick={onRestart}
          variant="outline"
          size="lg"
          className="rounded-premium-full gap-spacing-xs"
          data-testid="via-sacra-restart"
        >
          <RefreshCcw className="w-spacing-md h-spacing-md" />
          Recomeçar do início
        </Button>
        <Button
          onClick={onExit}
          size="lg"
          className="rounded-premium-full gap-spacing-xs bg-primary text-primary-foreground"
          data-testid="via-sacra-exit"
        >
          <Home className="w-spacing-md h-spacing-md" />
          Voltar às Orações
        </Button>
        <ShareButton
          title="Via Sacra"
          text="Percorri hoje a Via Sacra no Cathedra. Um caminho de silêncio e conversão."
          variant="ghost"
          size="lg"
        />
      </div>
    </motion.section>
  );
};

export default FinalClosingCard;
