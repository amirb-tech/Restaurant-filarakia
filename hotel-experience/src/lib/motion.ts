import { JourneyBeat } from "@/data/journey";

/** Maps global scroll progress to a 0..1 position local to a beat's own range. */
export function localProgress(progress: number, beat: JourneyBeat) {
  const span = beat.end - beat.start;
  if (span <= 0) return 0;
  return Math.min(Math.max((progress - beat.start) / span, 0), 1);
}

/** Fades content in for the first quarter of a beat and out for the last quarter. */
export function envelope(t: number, fade = 0.28) {
  const fadeIn = Math.min(t / fade, 1);
  const fadeOut = Math.min((1 - t) / fade, 1);
  return Math.max(Math.min(fadeIn, fadeOut), 0);
}

export function clamp01(n: number) {
  return Math.min(Math.max(n, 0), 1);
}
