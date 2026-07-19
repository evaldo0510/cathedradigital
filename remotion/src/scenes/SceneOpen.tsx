import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ParchmentBackground } from "../components/Backgrounds";
import { CandleParticles } from "../components/CandleParticles";
import { Monogram } from "../components/Monogram";
import { cormorant, karla } from "../fonts";
import { COLORS } from "../theme";

export const SceneOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const kicker = spring({ frame: frame - 20, fps, config: { damping: 200 } });
  const title = spring({ frame: frame - 40, fps, config: { damping: 200 } });
  const rule = interpolate(frame, [70, 110], [0, 1], { extrapolateRight: "clamp" });
  const sub = spring({ frame: frame - 90, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill>
      <ParchmentBackground />
      <CandleParticles count={14} />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 24,
          textAlign: "center",
        }}
      >
        <div style={{ opacity: kicker, transform: `translateY(${interpolate(kicker,[0,1],[20,0])}px)` }}>
          <Monogram size={180} delay={0} />
        </div>
        <div
          style={{
            opacity: kicker,
            fontFamily: karla,
            letterSpacing: 12,
            fontSize: 22,
            color: COLORS.gold,
            textTransform: "uppercase",
            fontWeight: 500,
            marginTop: 20,
          }}
        >
          A n n o   D o m i n i   ·   2 0 2 6
        </div>
        <div
          style={{
            opacity: title,
            transform: `translateY(${interpolate(title, [0, 1], [40, 0])}px)`,
            fontFamily: cormorant,
            fontWeight: 500,
            fontSize: 200,
            color: COLORS.ink,
            lineHeight: 1,
            letterSpacing: -2,
          }}
        >
          Cathedra
        </div>
        <div
          style={{
            width: interpolate(rule, [0, 1], [0, 320]),
            height: 1,
            background: COLORS.gold,
            marginTop: 8,
          }}
        />
        <div
          style={{
            opacity: sub,
            fontFamily: cormorant,
            fontStyle: "italic",
            fontSize: 40,
            color: COLORS.ink,
            marginTop: 8,
          }}
        >
          Onde a fé encontra o silêncio.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
