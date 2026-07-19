import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { InkBackground } from "../components/Backgrounds";
import { CandleParticles } from "../components/CandleParticles";
import { cormorant, karla } from "../fonts";
import { COLORS } from "../theme";

export const SceneManifesto: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lines = [
    "Bíblia.",
    "Catecismo.",
    "Liturgia.",
    "Santos.",
    "Oração.",
  ];

  return (
    <AbsoluteFill>
      <InkBackground />
      <CandleParticles count={10} />
      <AbsoluteFill
        style={{
          padding: "0 180px",
          flexDirection: "column",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: karla,
            letterSpacing: 10,
            color: COLORS.gold,
            textTransform: "uppercase",
            fontSize: 20,
            opacity: spring({ frame: frame - 5, fps, config: { damping: 200 } }),
            marginBottom: 30,
          }}
        >
          Uma catedral digital
        </div>
        {lines.map((word, i) => {
          const delay = 15 + i * 12;
          const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
          const x = interpolate(p, [0, 1], [-60, 0]);
          return (
            <div
              key={word}
              style={{
                fontFamily: cormorant,
                fontWeight: 500,
                fontSize: 140,
                lineHeight: 1.05,
                color: i === 4 ? COLORS.gold : COLORS.parchment,
                opacity: p,
                transform: `translateX(${x}px)`,
                fontStyle: i === 4 ? "italic" : "normal",
              }}
            >
              {word}
            </div>
          );
        })}
        <div
          style={{
            marginTop: 40,
            width: 120,
            height: 1,
            background: COLORS.gold,
            opacity: spring({ frame: frame - 100, fps, config: { damping: 200 } }),
          }}
        />
        <div
          style={{
            fontFamily: cormorant,
            fontStyle: "italic",
            fontSize: 34,
            color: COLORS.parchment,
            marginTop: 24,
            opacity: spring({ frame: frame - 110, fps, config: { damping: 200 } }),
            maxWidth: 900,
          }}
        >
          Tudo interligado. Tudo ao alcance. Tudo contemplativo.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
