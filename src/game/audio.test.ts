import { afterEach, describe, expect, it, vi } from "vitest";
import { storyScenes } from "./story";
import {
  ambienceUrl,
  ambienceSourceGain,
  ambienceSourceGainDb,
  audioMix,
  calibratedSourceGainDb,
  audioSceneIds,
  clampSourceGainDb,
  dbToGain,
  GameAudio,
  normalizedAmbienceOutputDb,
  sfxSourceGain,
  sfxSourceGainDb,
  sfxUrl,
} from "./audio";

class FakeAudioElement {
  static instances: FakeAudioElement[] = [];
  readonly src: string;
  loop = false;
  preload = "";
  volume = 1;
  playing = false;
  private listeners = new Map<string, () => void>();

  constructor(src: string) {
    this.src = src;
    FakeAudioElement.instances.push(this);
  }

  setAttribute() {}
  addEventListener(name: string, listener: () => void) {
    this.listeners.set(name, listener);
  }
  removeAttribute() {}
  load() {}
  remove() {}
  pause() {
    this.playing = false;
  }
  async play() {
    this.playing = true;
  }
}

afterEach(() => {
  FakeAudioElement.instances = [];
  vi.unstubAllGlobals();
});

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

  it("keeps native fallback playback bounded below full scale", () => {
    expect(audioMix.nativeAmbienceVolume).toBeGreaterThan(0);
    expect(audioMix.nativeAmbienceVolume).toBeLessThanOrEqual(0.3);
    expect(audioMix.nativeSfxVolume).toBeGreaterThan(0);
    expect(audioMix.nativeSfxVolume).toBeLessThanOrEqual(0.25);
  });

  it("plays ambience through native fallback when AudioContext is unavailable", async () => {
    vi.stubGlobal("Audio", FakeAudioElement);
    const audio = new GameAudio();
    audio.setEnabled(true);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(audio.getSnapshot()).toBe("playing");
    expect(FakeAudioElement.instances).toHaveLength(1);
    expect(FakeAudioElement.instances[0].src).toBe(
      "/audio/ambience/dream.mp3",
    );
    expect(FakeAudioElement.instances[0].playing).toBe(true);
    expect(FakeAudioElement.instances[0].volume).toBe(
      audioMix.nativeAmbienceVolume,
    );
  });

  it("keeps fallback scene trims bounded before they reach the graph", () => {
    expect(ambienceSourceGainDb("arbor")).toBeLessThanOrEqual(
      4,
    );
    expect(ambienceSourceGainDb("dream")).toBeLessThanOrEqual(
      4,
    );
    expect(ambienceSourceGain("arbor")).toBeLessThanOrEqual(
      dbToGain(audioMix.maxAmbienceSourceGainDb),
    );
    expect(ambienceSourceGainDb("unknown-scene")).toBe(0);
  });

  it("keeps every transient below a conservative speaker-safe ceiling", () => {
    expect(sfxSourceGainDb("error")).toBeLessThanOrEqual(
      4,
    );
    expect(sfxSourceGainDb("dialogue")).toBeLessThanOrEqual(
      4,
    );
    expect(sfxSourceGainDb("missing-sfx")).toBe(audioMix.minSourceGainDb);
    expect(sfxSourceGain("error")).toBeLessThanOrEqual(
      dbToGain(4),
    );
  });

  it("normalizes non-finite source values to the quiet floor", () => {
    expect(clampSourceGainDb(Number.NaN, 0)).toBe(audioMix.minSourceGainDb);
    expect(clampSourceGainDb(Number.POSITIVE_INFINITY, 0)).toBe(
      audioMix.minSourceGainDb,
    );
  });

  it("raises quiet beds while honoring the decoded peak ceiling", () => {
    expect(
      calibratedSourceGainDb({
        rms: 0.003,
        peak: 0.02,
        targetRmsDb: -22,
        peakCeiling: 1.2,
        maximum: audioMix.maxAmbienceSourceGainDb,
      }),
    ).toBeGreaterThan(25);
    expect(
      calibratedSourceGainDb({
        rms: 0.5,
        peak: 1,
        targetRmsDb: -18,
        peakCeiling: 1.2,
        maximum: audioMix.maxSfxSourceGainDb,
      }),
    ).toBeCloseTo(-12, 1);
    expect(
      calibratedSourceGainDb({
        rms: 0,
        peak: 0,
        targetRmsDb: -22,
        peakCeiling: 1.2,
        maximum: audioMix.maxAmbienceSourceGainDb,
      }),
    ).toBe(audioMix.minSourceGainDb);
  });
});
