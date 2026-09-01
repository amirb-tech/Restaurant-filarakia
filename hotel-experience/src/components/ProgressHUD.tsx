"use client";

import { JourneyBeat } from "@/data/journey";

interface Props {
  visible: boolean;
  progress: number;
  beat: JourneyBeat;
  total: number;
}

export function ProgressHUD({ visible, progress, beat, total }: Props) {
  const showHint = progress < 0.02;
  return (
    <div className={`hud ${visible ? "" : "hud--hidden"}`}>
      <div className="hud__section">
        <span className="hud__index">{String(beat.index).padStart(2, "0")}</span>
        <span className="hud__divider" />
        <span className="hud__label">{beat.label}</span>
        <span className="hud__total">/ {String(total).padStart(2, "0")}</span>
      </div>
      <div className="hud__bar">
        <div className="hud__bar-fill" style={{ transform: `scaleX(${progress})` }} />
      </div>
      <div className={`hud__hint ${showHint ? "" : "hud__hint--hidden"}`}>
        <span className="hud__hint-mouse" />
        Scroll to Enter
      </div>
    </div>
  );
}
