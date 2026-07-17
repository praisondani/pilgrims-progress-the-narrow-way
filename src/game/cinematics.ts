export type CameraMood = "open" | "intimate" | "ominous" | "monumental";

export type ChapterCameraProfile = {
  mood: CameraMood;
  duration: number;
  startHeight: number;
  startDistance: number;
  playHeight: number;
  playDistance: number;
  fov: number;
};

const INTIMATE = new Set(["gate", "interpreter", "palace", "faithful", "talkative"]);
const OMINOUS = new Set(["dream", "slough", "shadow", "vanity", "bypath", "doubting"]);
const MONUMENTAL = new Set(["cross", "hill", "warning", "lions", "humiliation"]);

export function cameraMoodFor(sceneId: string): CameraMood {
  if (INTIMATE.has(sceneId)) return "intimate";
  if (OMINOUS.has(sceneId)) return "ominous";
  if (MONUMENTAL.has(sceneId)) return "monumental";
  return "open";
}

export function chapterCameraProfile(
  sceneId: string,
  portrait: boolean,
): ChapterCameraProfile {
  const mood = cameraMoodFor(sceneId);
  const moodValues = {
    open: { duration: 1.8, startHeight: 12.4, startDistance: 15.2 },
    intimate: { duration: 1.55, startHeight: 8.4, startDistance: 11.6 },
    ominous: { duration: 2, startHeight: 9.6, startDistance: 14.2 },
    monumental: { duration: 2.1, startHeight: 13.8, startDistance: 16.4 },
  }[mood];

  return {
    mood,
    ...moodValues,
    // Portrait framing is composed independently instead of cropping desktop.
    playHeight: portrait ? 8.3 : 5.8,
    playDistance: portrait ? 13.8 : 11.5,
    fov: portrait ? 53 : 44,
    startHeight: moodValues.startHeight + (portrait ? 1.8 : 0),
    startDistance: moodValues.startDistance - (portrait ? 1.4 : 0),
  };
}

export function cinematicEase(progress: number) {
  const t = Math.max(0, Math.min(1, progress));
  return t * t * (3 - 2 * t);
}
