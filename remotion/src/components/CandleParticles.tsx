import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

// Floating candle-like light particles that drift up slowly.
export const CandleParticles: React.FC<{ count?: number }> = ({ count = 18 }) => {
  const frame = useCurrentFrame();
  const { height, durationInFrames } = useVideoConfig();

  const particles = new Array(count).fill(0).map((_, i) => {
    const seed = i * 137.31;
    const x = (Math.sin(seed) * 0.5 + 0.5) * 100;
    const speed = 0.15 + ((i % 5) * 0.05);
    const offset = (i * 47) % durationInFrames;
    const y =
      height -
      ((frame * speed + offset) % (height + 200)) +
      Math.sin((frame + i * 20) / 30) * 10;
    const size = 3 + (i % 4);
    const opacity = 0.35 + ((i % 3) * 0.15);
    return { x, y, size, opacity, key: i };
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {particles.map((p) => (
        <div
          key={p.key}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: COLORS.candle,
            boxShadow: `0 0 ${p.size * 6}px ${p.size}px rgba(240,201,122,0.55)`,
            opacity: p.opacity,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
