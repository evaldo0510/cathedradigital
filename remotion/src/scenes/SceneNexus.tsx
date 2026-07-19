import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { InkBackground } from "../components/Backgrounds";
import { CandleParticles } from "../components/CandleParticles";
import { cormorant, karla } from "../fonts";
import { COLORS } from "../theme";

// Animated web of theological cross-references (Nexus).
export const SceneNexus: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const nodes = [
    { x: 960, y: 540, label: "Jo 6,54", big: true },
    { x: 500, y: 300, label: "§1324" },
    { x: 1420, y: 300, label: "§1391" },
    { x: 380, y: 720, label: "S. Tomás" },
    { x: 1540, y: 720, label: "Trento" },
    { x: 960, y: 200, label: "Ex 12" },
    { x: 960, y: 880, label: "1Cor 11" },
  ];

  const centerP = spring({ frame: frame - 10, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill>
      <InkBackground />
      <CandleParticles count={12} />

      <svg
        width={1920}
        height={1080}
        style={{ position: "absolute", inset: 0 }}
      >
        {nodes.slice(1).map((n, i) => {
          const delay = 25 + i * 8;
          const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
          const dash = interpolate(p, [0, 1], [800, 0]);
          return (
            <line
              key={i}
              x1={960}
              y1={540}
              x2={n.x}
              y2={n.y}
              stroke={COLORS.gold}
              strokeWidth={1.2}
              strokeDasharray={800}
              strokeDashoffset={dash}
              opacity={0.6}
            />
          );
        })}
      </svg>

      {nodes.map((n, i) => {
        const delay = i === 0 ? 5 : 30 + i * 8;
        const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
        const scale = interpolate(p, [0, 1], [0.5, 1]);
        return (
          <div
            key={n.label}
            style={{
              position: "absolute",
              left: n.x,
              top: n.y,
              transform: `translate(-50%,-50%) scale(${scale})`,
              opacity: p,
              fontFamily: cormorant,
              fontStyle: "italic",
              fontSize: n.big ? 72 : 36,
              color: n.big ? COLORS.gold : COLORS.parchment,
              padding: n.big ? "16px 28px" : "8px 18px",
              border: `1px solid ${COLORS.gold}${n.big ? "" : "88"}`,
              borderRadius: 4,
              background: "rgba(11,31,58,0.6)",
              backdropFilter: "none",
              letterSpacing: 1,
            }}
          >
            {n.label}
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          top: 90,
          left: 140,
          fontFamily: karla,
          textTransform: "uppercase",
          letterSpacing: 10,
          fontSize: 20,
          color: COLORS.gold,
          opacity: centerP,
        }}
      >
        Nexus Theologicus
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 90,
          left: 140,
          right: 140,
          fontFamily: cormorant,
          fontStyle: "italic",
          fontSize: 44,
          color: COLORS.parchment,
          opacity: spring({ frame: frame - 90, fps, config: { damping: 200 } }),
          textAlign: "center",
        }}
      >
        Cada versículo abre um mundo. Cada palavra chama outra.
      </div>
    </AbsoluteFill>
  );
};
