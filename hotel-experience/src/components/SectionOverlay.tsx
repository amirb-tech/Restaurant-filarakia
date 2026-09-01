"use client";

import { JourneyBeat } from "@/data/journey";
import { envelope, localProgress } from "@/lib/motion";
import { SplitReveal } from "./SplitReveal";
import { ContentCard } from "./ContentCard";

interface Props {
  progress: number;
  beat: JourneyBeat;
}

export function SectionOverlay({ progress, beat }: Props) {
  const t = localProgress(progress, beat);
  const visibility = envelope(t, beat.finale ? 0.35 : 0.3);
  const textT = Math.min(t / 0.5, 1);

  if (beat.finale) {
    return (
      <div className="beat beat--finale" style={{ opacity: visibility }}>
        <div className="beat__copy">
          <span className="beat__kicker">{beat.kicker}</span>
          <SplitReveal
            as="h1"
            text={beat.title}
            progress={textT}
            className="beat__title beat__title--finale"
          />
          <p className="beat__lede">{beat.body}</p>
        </div>
        <button className="cta" type="button">
          Reserve Your Experience
        </button>
      </div>
    );
  }

  return (
    <div className="beat" style={{ opacity: visibility }}>
      <div className="beat__copy">
        <span className="beat__kicker">{beat.kicker}</span>
        <SplitReveal
          as="h2"
          text={beat.title}
          progress={textT}
          className="beat__title"
        />
        {beat.body && <p className="beat__lede">{beat.body}</p>}
      </div>
      {beat.card && (
        <ContentCard
          card={beat.card}
          visibility={visibility}
          side={beat.index % 2 === 0 ? "right" : "left"}
        />
      )}
    </div>
  );
}
