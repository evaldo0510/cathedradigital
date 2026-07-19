/**
 * CAT-12.3 — Indicador visual do progresso do Rosário.
 *
 * Renderiza os 5 mistérios como clusters de 10 contas (Ave-Marias),
 * separados pelo Pai-Nosso. Preenche à medida que o usuário avança.
 *
 * Padrão Logos 2030: sem ruído, dourado discreto, foco visível para
 * navegação por teclado quando `onSeek` é fornecido.
 */

import React from "react";
import { cn } from "@/lib/utils";

interface Props {
  /** 0..4 — dezena atual. */
  mysteryIndex: number;
  /** 0..10 — Ave-Marias já rezadas na dezena atual. */
  beadIndex: number;
  /** Marcar mistérios já concluídos. */
  completed: boolean[];
  className?: string;
}

export const RosaryProgress: React.FC<Props> = ({
  mysteryIndex,
  beadIndex,
  completed,
  className,
}) => {
  return (
    <div
      className={cn("flex items-center justify-center gap-spacing-md", className)}
      role="group"
      aria-label={`Progresso do Rosário: mistério ${mysteryIndex + 1} de 5, ${beadIndex} de 10 Ave-Marias`}
    >
      {[0, 1, 2, 3, 4].map((mi) => {
        const isCurrent = mi === mysteryIndex;
        const isDone = completed[mi];
        return (
          <React.Fragment key={mi}>
            {mi > 0 && (
              <span
                aria-hidden
                className={cn(
                  "block w-2.5 h-2.5 rounded-full border transition-colors",
                  isDone || mi <= mysteryIndex
                    ? "bg-secondary border-secondary"
                    : "bg-transparent border-secondary/25",
                )}
              />
            )}
            <div
              className={cn(
                "flex items-center gap-1 rounded-premium-full px-1.5 py-1 transition-colors",
                isCurrent && "bg-secondary/10",
              )}
            >
              {Array.from({ length: 10 }).map((_, bi) => {
                const filled = isDone || (isCurrent && bi < beadIndex) || mi < mysteryIndex;
                return (
                  <span
                    key={bi}
                    aria-hidden
                    className={cn(
                      "block w-1.5 h-1.5 rounded-full transition-all duration-300",
                      filled
                        ? "bg-secondary shadow-[0_0_6px_rgba(200,169,106,0.55)]"
                        : "bg-secondary/25",
                      isCurrent && bi === beadIndex && "scale-150",
                    )}
                  />
                );
              })}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default RosaryProgress;
