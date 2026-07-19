import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ParchmentBackground } from "../components/Backgrounds";
import { CandleParticles } from "../components/CandleParticles";
import { Monogram } from "../components/Monogram";
import { cormorant, karla } from "../fonts";
import { COLORS } from "../theme";

export const SceneClose: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mg = spring({ frame: frame - 5, fps, config: { damping: 200 } });
  const t1 = spring({ frame: frame - 25, fps, config: { damping: 200 } });
  const t2 = spring({ frame: frame - 55, fps, config: { damping: 200 } });
  const url = spring({ frame: frame - 90, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill>
      <ParchmentBackground />
      <CandleParticles count={16} />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 28,
          textAlign: "center",
        }}
      >
        <div style={{ opacity: mg }}>
          <Monogram size={150} delay={0} />
        </div>
        <div
          style={{
            fontFamily: cormorant,
            fontSize: 130,
            color: COLORS.ink,
            fontWeight: 500,
            opacity: t1,
            transform: `translateY(${interpolate(t1, [0, 1], [30, 0])}px)`,
            lineHeight: 1,
          }}
        >
          Cathedra
        </div>
        <div
          style={{
            fontFamily: cormorant,
            fontStyle: "italic",
            fontSize: 48,
            color: COLORS.ink,
            opacity: t2,
            transform: `translateY(${interpolate(t2, [0, 1], [20, 0])}px)`,
            maxWidth: 1200,
          }}
        >
          Entre. Sente-se. Respire. A cátedra o espera.
        </div>
        <div
          style={{
            marginTop: 30,
            fontFamily: karla,
            letterSpacing: 8,
            fontSize: 22,
            color: COLORS.gold,
            textTransform: "uppercase",
            opacity: url,
          }}
        >
          cathedradigital.com.br
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
