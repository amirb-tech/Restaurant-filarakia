export type Vec3 = [number, number, number];

export interface CameraKeyframe {
  position: Vec3;
  lookAt: Vec3;
  fov: number;
}

export interface MoodKeyframe {
  fog: string;
  key: string;
  keyIntensity: number;
  warm: string;
  warmIntensity: number;
  fogDensity: number;
}

export interface ContentCard {
  eyebrow: string;
  title: string;
  body: string;
}

export interface JourneyBeat {
  id: string;
  index: number;
  label: string;
  start: number;
  end: number;
  kicker: string;
  title: string;
  body?: string;
  card?: ContentCard;
  finale?: boolean;
}

/**
 * 13 keyframes, sampled with getPointAt() for constant travel speed
 * along the spine of the building. Order defines the spline.
 */
export const cameraKeyframes: CameraKeyframe[] = [
  { position: [0, 1.6, 16], lookAt: [0, 1.8, 0], fov: 38 },
  { position: [0, 1.7, 7], lookAt: [0, 1.8, -4], fov: 36 },
  { position: [0, 2.2, -2], lookAt: [0, 2.5, -14], fov: 40 },
  { position: [0, 2.4, -10], lookAt: [0, 2.6, -22], fov: 38 },
  { position: [2.4, 4.2, -22], lookAt: [0, 6.4, -30], fov: 42 },
  { position: [0, 3.0, -36], lookAt: [0, 2.6, -48], fov: 42 },
  { position: [-2, 2.2, -50], lookAt: [2, 1.8, -60], fov: 38 },
  { position: [2, 2.4, -62], lookAt: [-1, 2.2, -72], fov: 38 },
  { position: [0, 1.4, -76], lookAt: [0, 1.0, -92], fov: 44 },
  { position: [0, 2.0, -94], lookAt: [0, 2.0, -104], fov: 36 },
  { position: [0, 2.2, -108], lookAt: [0, 2.4, -122], fov: 40 },
  { position: [0, 5.2, -126], lookAt: [0, 6.2, -140], fov: 42 },
  { position: [0, 27, -152], lookAt: [0, 10, -172], fov: 50 },
];

export const moodKeyframes: MoodKeyframe[] = [
  { fog: "#05070c", key: "#7fa8ff", keyIntensity: 0.55, warm: "#3a4a7a", warmIntensity: 0.0, fogDensity: 0.046 },
  { fog: "#090c14", key: "#8fb4ff", keyIntensity: 0.4, warm: "#ffb066", warmIntensity: 0.35, fogDensity: 0.042 },
  { fog: "#1b140a", key: "#ffd8a8", keyIntensity: 0.3, warm: "#ffb066", warmIntensity: 1.5, fogDensity: 0.03 },
  { fog: "#1f160b", key: "#ffd8a8", keyIntensity: 0.3, warm: "#ffb066", warmIntensity: 1.7, fogDensity: 0.028 },
  { fog: "#17130c", key: "#ffe3bd", keyIntensity: 0.3, warm: "#ff9d5c", warmIntensity: 1.3, fogDensity: 0.026 },
  { fog: "#21150a", key: "#ffdcae", keyIntensity: 0.25, warm: "#ffa15c", warmIntensity: 1.5, fogDensity: 0.03 },
  { fog: "#0d1a1c", key: "#bfe9e6", keyIntensity: 0.5, warm: "#8fd8d0", warmIntensity: 1.0, fogDensity: 0.05 },
  { fog: "#10141a", key: "#e8f0ff", keyIntensity: 0.6, warm: "#dfe9ff", warmIntensity: 1.0, fogDensity: 0.022 },
  { fog: "#0c1c22", key: "#8fe3d8", keyIntensity: 0.5, warm: "#a8ecdf", warmIntensity: 1.1, fogDensity: 0.024 },
  { fog: "#1a1006", key: "#ffb877", keyIntensity: 0.3, warm: "#ff9d52", warmIntensity: 1.3, fogDensity: 0.032 },
  { fog: "#351f14", key: "#ff9d5c", keyIntensity: 0.4, warm: "#ffa561", warmIntensity: 1.1, fogDensity: 0.018 },
  { fog: "#40230f", key: "#ffb15c", keyIntensity: 0.4, warm: "#ffc27a", warmIntensity: 1.0, fogDensity: 0.011 },
  { fog: "#ffb066", key: "#fff2d8", keyIntensity: 0.7, warm: "#ffcf94", warmIntensity: 0.7, fogDensity: 0.004 },
];

export const journeyBeats: JourneyBeat[] = [
  {
    id: "arrival",
    index: 1,
    label: "Arrival",
    start: 0.0,
    end: 0.08,
    kicker: "The Seven Star Residence",
    title: "Beyond Five Stars",
    body: "An arrival unlike any other begins.",
  },
  {
    id: "threshold",
    index: 2,
    label: "The Threshold",
    start: 0.08,
    end: 0.15,
    kicker: "Arrival",
    title: "Every Door Opens Into Wonder",
  },
  {
    id: "lobby",
    index: 3,
    label: "The Lobby",
    start: 0.15,
    end: 0.24,
    kicker: "Ground Floor",
    title: "Where Light Meets Luxury",
    card: {
      eyebrow: "Lobby",
      title: "A Room That Breathes Light",
      body: "Hand-cut marble, living flame, and a concierge who remembers your name.",
    },
  },
  {
    id: "staircase",
    index: 4,
    label: "Grand Staircase",
    start: 0.24,
    end: 0.32,
    kicker: "Rising",
    title: "Architecture Designed for Serenity",
  },
  {
    id: "dining",
    index: 5,
    label: "Fine Dining",
    start: 0.32,
    end: 0.41,
    kicker: "Culinary",
    title: "A Table Set for the Senses",
    card: {
      eyebrow: "Restaurant",
      title: "Cuisine Without Compromise",
      body: "Three kitchens. One philosophy — ingredients as art.",
    },
  },
  {
    id: "spa",
    index: 6,
    label: "The Spa",
    start: 0.41,
    end: 0.5,
    kicker: "Wellness",
    title: "Silence, Water, Stone",
    card: {
      eyebrow: "Spa",
      title: "Stillness by Design",
      body: "Warm basalt, slow water, and air that feels like silk.",
    },
  },
  {
    id: "gym",
    index: 7,
    label: "The Studio",
    start: 0.5,
    end: 0.58,
    kicker: "Vitality",
    title: "Strength in Quiet Light",
    card: {
      eyebrow: "Gym",
      title: "Private Training Suites",
      body: "Glass, steel, and a skyline for motivation.",
    },
  },
  {
    id: "pool",
    index: 8,
    label: "Infinity Pool",
    start: 0.58,
    end: 0.68,
    kicker: "Horizon",
    title: "Where the Horizon Dissolves",
    card: {
      eyebrow: "Pool",
      title: "An Edge Without End",
      body: "Water that meets the sky without a seam.",
    },
  },
  {
    id: "suite",
    index: 9,
    label: "Private Suites",
    start: 0.68,
    end: 0.77,
    kicker: "Residence",
    title: "Every Stay Becomes a Memory",
    card: {
      eyebrow: "Suite",
      title: "A Home Above the World",
      body: "Curated stillness, tailored to your rhythm.",
    },
  },
  {
    id: "balcony",
    index: 10,
    label: "The Balcony",
    start: 0.77,
    end: 0.85,
    kicker: "Open Air",
    title: "Step Into the Sky",
    card: {
      eyebrow: "Balcony",
      title: "Your Private Horizon",
      body: "Every suite opens onto the bay.",
    },
  },
  {
    id: "skylounge",
    index: 11,
    label: "Sky Lounge",
    start: 0.85,
    end: 0.93,
    kicker: "Elevation",
    title: "An Evening Above the Clouds",
    card: {
      eyebrow: "Sky Lounge",
      title: "Cocktails at Altitude",
      body: "The city becomes a constellation below you.",
    },
  },
  {
    id: "finale",
    index: 12,
    label: "Reserve",
    start: 0.93,
    end: 1.0,
    kicker: "The Residence",
    title: "Experience Timeless Luxury",
    body: "Reserve Your Experience",
    finale: true,
  },
];

/** Splits [0,1] progress across an evenly-spaced keyframe array. */
export function sampleIndex(progress: number, length: number) {
  const n = length - 1;
  const f = Math.min(Math.max(progress, 0), 1) * n;
  const i = Math.min(Math.floor(f), n - 1 < 0 ? 0 : n - 1);
  const t = f - i;
  return { i, t };
}

export function getActiveBeat(progress: number): JourneyBeat {
  return (
    journeyBeats.find((b) => progress >= b.start && progress < b.end) ??
    journeyBeats[journeyBeats.length - 1]
  );
}
