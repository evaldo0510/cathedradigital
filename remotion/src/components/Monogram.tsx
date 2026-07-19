import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

// Cross-shaped monogram that draws itself with a stroke reveal.
export const Monogram: React.FC<{ size?: number; delay?: number }> = ({
  size = 220,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const draw = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, stiffness: 40 },
  });
  const dash = interpolate(draw, [0, 1], [1200, 0]);
  const glow = interpolate(draw, [0.6, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <radialGradient id="mg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={COLORS.gold} stopOpacity={0.35 * glow} />
          <stop offset="100%" stopColor={COLORS.gold} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="url(#mg)" />
      <circle
        cx="100"
        cy="100"
        r="80"
        fill="none"
        stroke={COLORS.gold}
        strokeWidth="1.2"
        strokeDasharray="1200"
        strokeDashoffset={dash}
        opacity={0.9}
      />
      {/* Cross */}
      <path
        d="M100 40 L100 160 M60 100 L140 100"
        stroke={COLORS.gold}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1200"
        strokeDashoffset={dash}
      />
      {/* Serifs */}
      <path
        d="M92 40 L108 40 M92 160 L108 160 M60 92 L60 108 M140 92 L140 108"
        stroke={COLORS.gold}
        strokeWidth="2"
        strokeLinecap="round"
        opacity={glow}
      />
    </svg>
  );
};
