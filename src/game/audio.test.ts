import { describe, expect, it } from "vitest";
import { storyScenes } from "./story";
import {
  ambienceUrl,
  ambienceSourceGain,
  ambienceSourceGainDb,
  audioMix,
  audioSceneIds,
  clampSourceGainDb,
  dbToGain,
  normalizedAmbienceOutputDb,
  sfxSourceGain,
  sfxSourceGainDb,
  sfxUrl,
} from "./audio";

describe("safe local audio assets", () => {
  it("covers every playable scene", () => {
    expect(audioSceneIds.sort()).toEqual(storyScenes.map((scene) => scene.id).sort());
  });

  it("never builds external asset URLs", () => {
    expect(ambienceUrl("dream")).toBe("/audio/ambience/dream.mp3");
    expect(sfxUrl("dialogue")).toBe("/audio/sfx/dialogue.mp3");
  });

  it("converts measured normalization levels to linear gain", () => {
    expect(dbToGain(0)).toBe(1);
    expect(dbToGain(-6)).toBeCloseTo(0.501, 3);
  });

  it("keeps continuous ambience audible without approaching full scale", () => {
    expect(normalizedAmbienceOutputDb()).toBeGreaterThanOrEqual(-30);
    expect(normalizedAmbienceOutputDb()).toBeLessThanOrEqual(-26);
    expect(audioMix.masterGain).toBeLessThan(1);
  });

  it("bounds legacy ambience calibration before it reaches the graph", () => {
    expect(ambienceSourceGainDb("arbor")).toBe(
      audioMix.maxAmbienceSourceGainDb,
    );
    expect(ambienceSourceGainDb("dream")).toBe(
      audioMix.maxAmbienceSourceGainDb,
    );
    expect(ambienceSourceGain("arbor")).toBeLessThanOrEqual(
      dbToGain(audioMix.maxAmbienceSourceGainDb),
    );
    expect(ambienceSourceGainDb("unknown-scene")).toBe(
      audioMix.maxAmbienceSourceGainDb,
    );
  });

  it("keeps every transient below a conservative speaker-safe ceiling", () => {
    expect(sfxSourceGainDb("error")).toBe(audioMix.maxSfxSourceGainDb);
    expect(sfxSourceGainDb("dialogue")).toBe(audioMix.maxSfxSourceGainDb);
    expect(sfxSourceGainDb("missing-sfx")).toBe(audioMix.minSourceGainDb);
    expect(sfxSourceGain("error")).toBeLessThanOrEqual(
      dbToGain(audioMix.maxSfxSourceGainDb),
    );
  });

  it("normalizes non-finite source values to the quiet floor", () => {
    expect(clampSourceGainDb(Number.NaN, 0)).toBe(audioMix.minSourceGainDb);
    expect(clampSourceGainDb(Number.POSITIVE_INFINITY, 0)).toBe(
      audioMix.minSourceGainDb,
    );
  });
});
