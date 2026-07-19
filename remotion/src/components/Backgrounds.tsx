import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS } from "./theme";

// Parchment texture built with layered radial gradients + subtle drift.
export const ParchmentBackground: React.FC<{ intensity?: number }> = ({
  intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 90) * 20;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 30% 20%, ${COLORS.parchment} 0%, ${COLORS.parchmentDeep} 55%, #d8caab 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${50 + drift}% 40%, rgba(200,169,106,${0.18 * intensity}) 0%, transparent 55%)`,
          mixBlendMode: "multiply",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "repeating-linear-gradient(45deg, rgba(11,31,58,0.02) 0 2px, transparent 2px 6px)",
          opacity: 0.4,
        }}
      />
      {/* vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(11,31,58,0.35) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

export const InkBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 120) * 30;
  return (
    <AbsoluteFill style={{ background: COLORS.shadow }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${50 + drift}% 45%, ${COLORS.ink} 0%, ${COLORS.shadow} 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 70% 30%, rgba(200,169,106,0.18) 0%, transparent 45%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
