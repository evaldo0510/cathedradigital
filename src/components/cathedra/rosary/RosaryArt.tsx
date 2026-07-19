/**
 * CAT-12.3 — Arte SVG dos mistérios do Rosário.
 *
 * SVG inline (sem dependência externa, sem imagem hospedada) com paleta
 * derivada dos tokens semânticos (currentColor). Cada conjunto tem um
 * emblema principal + textura discreta de contas. Estilo editorial,
 * gravura sacra: linhas finas, simetria, ouro sobre azul profundo.
 */

import React from "react";
import type { MysterySet } from "./mysteries";

interface Props {
  set: MysterySet;
  className?: string;
  /** Modo "arte grande" (para hero da preparação) vs. thumbnail (grid). */
  variant?: "thumbnail" | "hero";
}

/** Guirlanda comum a todos os conjuntos (contas + crucifixo estilizado). */
const RosaryGarland: React.FC<{ className?: string }> = ({ className }) => (
  <g className={className} aria-hidden="true">
    {Array.from({ length: 20 }).map((_, i) => {
      const angle = (i / 20) * Math.PI * 2 - Math.PI / 2;
      const r = 44;
      const cx = 50 + Math.cos(angle) * r;
      const cy = 50 + Math.sin(angle) * r;
      return (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={i % 10 === 0 ? 1.6 : 0.9}
          fill="currentColor"
          opacity={i % 10 === 0 ? 0.65 : 0.32}
        />
      );
    })}
  </g>
);

const EMBLEM: Record<MysterySet, React.ReactNode> = {
  joyful: (
    <g>
      {/* Lírio (símbolo da Anunciação) */}
      <path
        d="M50 22 C 44 34, 44 44, 50 52 C 56 44, 56 34, 50 22 Z"
        fill="currentColor"
        opacity="0.16"
      />
      <path
        d="M50 22 C 44 34, 44 44, 50 52 C 56 44, 56 34, 50 22 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
        opacity="0.85"
      />
      <path d="M50 52 L50 78" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
      <path
        d="M38 64 C 44 60, 50 60, 50 66 C 50 60, 56 60, 62 64"
        stroke="currentColor"
        strokeWidth="0.7"
        fill="none"
        opacity="0.55"
      />
      <circle cx="50" cy="48" r="1.4" fill="currentColor" opacity="0.9" />
    </g>
  ),
  luminous: (
    <g>
      {/* Sol nascente + água (Batismo / Transfiguração) */}
      <circle cx="50" cy="48" r="12" fill="currentColor" opacity="0.14" />
      <circle cx="50" cy="48" r="6" fill="currentColor" opacity="0.35" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const x1 = 50 + Math.cos(a) * 14;
        const y1 = 48 + Math.sin(a) * 14;
        const x2 = 50 + Math.cos(a) * 22;
        const y2 = 48 + Math.sin(a) * 22;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth="0.8"
            opacity="0.55"
          />
        );
      })}
      <path
        d="M28 72 Q 40 68, 50 72 T 72 72"
        stroke="currentColor"
        strokeWidth="0.9"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M28 76 Q 40 72, 50 76 T 72 76"
        stroke="currentColor"
        strokeWidth="0.7"
        fill="none"
        opacity="0.35"
      />
    </g>
  ),
  sorrowful: (
    <g>
      {/* Cruz coroada de espinhos */}
      <path d="M50 22 L50 74" stroke="currentColor" strokeWidth="1.6" opacity="0.85" />
      <path d="M34 40 L66 40" stroke="currentColor" strokeWidth="1.6" opacity="0.85" />
      <circle
        cx="50"
        cy="40"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity="0.6"
        strokeDasharray="1.4 1.6"
      />
      {/* Gota */}
      <path
        d="M50 78 C 47 74, 47 71, 50 68 C 53 71, 53 74, 50 78 Z"
        fill="currentColor"
        opacity="0.7"
      />
    </g>
  ),
  glorious: (
    <g>
      {/* Coroa + estrelas (Ressurreição / Coroação de Maria) */}
      <path
        d="M32 58 L38 40 L44 54 L50 34 L56 54 L62 40 L68 58 Z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M32 58 L38 40 L44 54 L50 34 L56 54 L62 40 L68 58 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
        opacity="0.85"
      />
      <path d="M30 62 L70 62" stroke="currentColor" strokeWidth="0.9" opacity="0.7" />
      {/* Estrelas */}
      {[
        [26, 30],
        [74, 32],
        [50, 22],
      ].map(([x, y], i) => (
        <path
          key={i}
          d={`M${x} ${y - 3} L${x + 1} ${y - 1} L${x + 3} ${y} L${x + 1} ${y + 1} L${x} ${y + 3} L${x - 1} ${y + 1} L${x - 3} ${y} L${x - 1} ${y - 1} Z`}
          fill="currentColor"
          opacity="0.75"
        />
      ))}
    </g>
  ),
};

export const RosaryArt: React.FC<Props> = ({ set, className, variant = "thumbnail" }) => {
  const size = variant === "hero" ? 220 : 96;
  return (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
    >
      <RosaryGarland />
      {EMBLEM[set]}
    </svg>
  );
};

export default RosaryArt;
