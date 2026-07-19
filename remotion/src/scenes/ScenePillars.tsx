import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ParchmentBackground } from "../components/Backgrounds";
import { cormorant, karla } from "../fonts";
import { COLORS } from "../theme";

type Pillar = {
  kicker: string;
  title: string;
  body: string;
};

const PILLARS: Pillar[] = [
  {
    kicker: "I · Sagrada Escritura",
    title: "Bíblia viva",
    body:
      "Leitura contínua com marcadores, referências cruzadas e comentário patrístico ao alcance de um toque.",
  },
  {
    kicker: "II · Catecismo",
    title: "Doutrina ao alcance",
    body:
      "2865 parágrafos costurados por temas, tags e o Nexus Theologicus — sem perder o fio da meditação.",
  },
  {
    kicker: "III · Devoção",
    title: "Rosário, Missal, Via Sacra",
    body:
      "Ofícios e devoções em modos guiado, contemplativo e automático. Retomar exatamente de onde parou.",
  },
];

export const ScenePillars: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <ParchmentBackground intensity={0.7} />
      <AbsoluteFill
        style={{
          padding: "120px 140px",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontFamily: karla,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: COLORS.gold,
            fontSize: 20,
            opacity: spring({ frame: frame - 5, fps, config: { damping: 200 } }),
          }}
        >
          Três pilares
        </div>
        <div
          style={{
            fontFamily: cormorant,
            fontSize: 96,
            color: COLORS.ink,
            marginTop: 12,
            marginBottom: 60,
            fontWeight: 500,
            opacity: spring({ frame: frame - 12, fps, config: { damping: 200 } }),
            transform: `translateY(${interpolate(
              spring({ frame: frame - 12, fps, config: { damping: 200 } }),
              [0, 1],
              [30, 0]
            )}px)`,
          }}
        >
          A arquitetura da <span style={{ fontStyle: "italic", color: COLORS.gold }}>vida interior</span>.
        </div>

        <div style={{ display: "flex", gap: 60, flex: 1 }}>
          {PILLARS.map((p, i) => {
            const delay = 30 + i * 22;
            const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
            const y = interpolate(s, [0, 1], [40, 0]);
            const ruleW = interpolate(frame - delay - 10, [0, 30], [0, 60], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={p.title}
                style={{
                  flex: 1,
                  opacity: s,
                  transform: `translateY(${y}px)`,
                  borderTop: `1px solid ${COLORS.ink}22`,
                  paddingTop: 28,
                }}
              >
                <div
                  style={{
                    fontFamily: karla,
                    letterSpacing: 4,
                    fontSize: 15,
                    color: COLORS.gold,
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  {p.kicker}
                </div>
                <div
                  style={{
                    fontFamily: cormorant,
                    fontSize: 56,
                    color: COLORS.ink,
                    lineHeight: 1.05,
                    marginBottom: 20,
                    fontWeight: 500,
                  }}
                >
                  {p.title}
                </div>
                <div
                  style={{
                    width: ruleW,
                    height: 1,
                    background: COLORS.gold,
                    marginBottom: 20,
                  }}
                />
                <div
                  style={{
                    fontFamily: karla,
                    fontSize: 22,
                    lineHeight: 1.55,
                    color: `${COLORS.ink}dd`,
                    maxWidth: 380,
                  }}
                >
                  {p.body}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
