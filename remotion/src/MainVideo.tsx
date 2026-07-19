import React from "react";
import { AbsoluteFill } from "remotion";
import {
  TransitionSeries,
  linearTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { SceneOpen } from "./scenes/SceneOpen";
import { SceneManifesto } from "./scenes/SceneManifesto";
import { ScenePillars } from "./scenes/ScenePillars";
import { SceneNexus } from "./scenes/SceneNexus";
import { SceneClose } from "./scenes/SceneClose";

const D = {
  open: 160,
  manifesto: 180,
  pillars: 210,
  nexus: 190,
  close: 180,
};
const T = 24;

// total = sum(scenes) - transitions * (n-1)
export const TOTAL_FRAMES =
  D.open + D.manifesto + D.pillars + D.nexus + D.close - T * 4;

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#050F1E" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={D.open}>
          <SceneOpen />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={D.manifesto}>
          <SceneManifesto />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={D.pillars}>
          <ScenePillars />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={D.nexus}>
          <SceneNexus />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={D.close}>
          <SceneClose />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
