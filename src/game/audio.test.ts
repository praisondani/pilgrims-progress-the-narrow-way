/// <reference types="node" />

import { afterEach, describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
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
  removed = false;
  playCalls = 0;
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
  remove() {
    this.removed = true;
  }
  pause() {
    this.playing = false;
  }
  async play() {
    this.playCalls += 1;
    this.playing = true;
  }
}

type Mp3Stats = {
  frames: number;
  durationSeconds: number;
  nonZeroFrameBytes: number;
};

function inspectMp3(bytes: Buffer): Mp3Stats {
  const id3Size =
    ((bytes[6] & 0x7f) << 21) |
    ((bytes[7] & 0x7f) << 14) |
    ((bytes[8] & 0x7f) << 7) |
    (bytes[9] & 0x7f);
  const mpeg1Bitrates = [
    0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0,
  ];
  const mpeg2Bitrates = [
    0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0,
  ];
  const sampleRates = {
    3: [44_100, 48_000, 32_000],
    2: [22_050, 24_000, 16_000],
    0: [11_025, 12_000, 8_000],
  } as const;
  let offset = 10 + id3Size;
  let frames = 0;
  let durationSeconds = 0;
  let nonZeroFrameBytes = 0;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff || (bytes[offset + 1] & 0xe0) !== 0xe0)
      break;
    const version = (bytes[offset + 1] >> 3) & 0x03;
    const layer = (bytes[offset + 1] >> 1) & 0x03;
    const bitrateIndex = (bytes[offset + 2] >> 4) & 0x0f;
    const sampleRateIndex = (bytes[offset + 2] >> 2) & 0x03;
    const padding = (bytes[offset + 2] >> 1) & 0x01;
    if (layer !== 1 || sampleRateIndex === 3) break;
    const bitrate = (version === 3 ? mpeg1Bitrates : mpeg2Bitrates)[bitrateIndex];
    const sampleRate = sampleRates[version as keyof typeof sampleRates]?.[
      sampleRateIndex
    ];
    if (!bitrate || !sampleRate) break;
    const frameLength = Math.floor(
      (version === 3 ? 144 : 72) * (bitrate * 1000) / sampleRate,
    ) + padding;
    if (frameLength < 5 || offset + frameLength > bytes.length) break;
    for (let index = offset + 4; index < offset + frameLength; index += 1)
      if (bytes[index] !== 0) nonZeroFrameBytes += 1;
    frames += 1;
    durationSeconds += (version === 3 ? 1_152 : 576) / sampleRate;
    offset += frameLength;
  }
  return { frames, durationSeconds, nonZeroFrameBytes };
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

  it("ships every resolved scene bed and SFX with an MP3 frame", () => {
    const assetPath = (url: string) =>
      resolve(process.cwd(), "public", url.replace(/^\//, ""));
    const hasMpegFrame = (path: string) => {
      const bytes = readFileSync(path);
      for (let index = 32; index < bytes.length - 1; index += 1) {
        if (bytes[index] === 0xff && (bytes[index + 1] & 0xe0) === 0xe0)
          return true;
      }
      return false;
    };
    for (const sceneId of audioSceneIds) {
      const path = assetPath(ambienceUrl(sceneId));
      expect(existsSync(path), `${sceneId} ambience missing`).toBe(true);
      expect(hasMpegFrame(path), `${sceneId} ambience has no MP3 frame`).toBe(
        true,
      );
    }
    for (const name of [
      "chapter",
      "dialogue",
      "error",
      "focus",
      "interact",
      "step-earth",
      "step-mud",
      "success",
    ]) {
      const path = assetPath(sfxUrl(name));
      expect(existsSync(path), `${name} SFX missing`).toBe(true);
      expect(hasMpegFrame(path), `${name} SFX has no MP3 frame`).toBe(true);
    }
  });

  it("rejects truncated or silent-looking local audio payloads", () => {
    const assetPath = (url: string) =>
      resolve(process.cwd(), "public", url.replace(/^\//, ""));
    const inspect = (url: string) => inspectMp3(readFileSync(assetPath(url)));
    for (const sceneId of audioSceneIds) {
      const stats = inspect(ambienceUrl(sceneId));
      expect(stats.frames, `${sceneId} frame count`).toBeGreaterThanOrEqual(8);
      expect(stats.durationSeconds, `${sceneId} duration`).toBeGreaterThan(2);
      expect(
        stats.nonZeroFrameBytes,
        `${sceneId} encoded payload`,
      ).toBeGreaterThan(stats.frames * 8);
    }
    for (const name of [
      "chapter",
      "dialogue",
      "error",
      "focus",
      "interact",
      "step-earth",
      "step-mud",
      "success",
    ]) {
      const stats = inspect(sfxUrl(name));
      expect(stats.frames, `${name} frame count`).toBeGreaterThanOrEqual(4);
      expect(stats.durationSeconds, `${name} duration`).toBeGreaterThan(0.2);
      expect(
        stats.nonZeroFrameBytes,
        `${name} encoded payload`,
      ).toBeGreaterThan(stats.frames * 8);
    }
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
    expect(audioMix.nativeAmbienceBoostDb).toBeGreaterThan(0);
    expect(audioMix.nativeAmbienceBoostDb).toBeLessThanOrEqual(18);
    expect(audioMix.nativeSfxBoostDb).toBeGreaterThan(0);
    expect(audioMix.nativeSfxBoostDb).toBeLessThanOrEqual(6);
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

  it("restarts an existing native ambience element after a visibility return", async () => {
    const listeners = new Map<string, () => void>();
    const documentStub = {
      visibilityState: "visible",
      documentElement: { dataset: {} as Record<string, string> },
      addEventListener(name: string, listener: () => void) {
        listeners.set(name, listener);
      },
    } as unknown as Document;
    vi.stubGlobal("document", documentStub);
    vi.stubGlobal("Audio", FakeAudioElement);
    const audio = new GameAudio();
    audio.setEnabled(true);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const ambience = FakeAudioElement.instances[0];
    expect(ambience.playCalls).toBe(1);
    ambience.pause();
    (documentStub as unknown as { visibilityState: DocumentVisibilityState }).visibilityState =
      "hidden";
    listeners.get("visibilitychange")?.();
    expect(ambience.playing).toBe(false);

    (documentStub as unknown as { visibilityState: DocumentVisibilityState }).visibilityState =
      "visible";
    listeners.get("visibilitychange")?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(ambience.playing).toBe(true);
    expect(ambience.playCalls).toBe(2);
  });

  it("keeps native fallback footsteps available without an AudioContext", async () => {
    vi.stubGlobal("Audio", FakeAudioElement);
    const audio = new GameAudio();
    audio.setEnabled(true);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const ambienceCount = FakeAudioElement.instances.length;
    audio.walking(true);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(FakeAudioElement.instances).toHaveLength(ambienceCount + 1);
    expect(FakeAudioElement.instances.at(-1)?.src).toBe(
      "/audio/sfx/step-earth.mp3",
    );
    expect(FakeAudioElement.instances.at(-1)?.playing).toBe(true);
  });

  it("plays the first focus cue immediately on native fallback", async () => {
    vi.stubGlobal("Audio", FakeAudioElement);
    const audio = new GameAudio();
    audio.setEnabled(true);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const ambienceCount = FakeAudioElement.instances.length;
    audio.focus();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(FakeAudioElement.instances).toHaveLength(ambienceCount + 1);
    expect(FakeAudioElement.instances.at(-1)?.src).toBe(
      "/audio/sfx/focus.mp3",
    );
    expect(FakeAudioElement.instances.at(-1)?.playing).toBe(true);
  });

  it("caps concurrent native fallback SFX voices", async () => {
    vi.stubGlobal("Audio", FakeAudioElement);
    const audio = new GameAudio();
    audio.setEnabled(true);
    await new Promise((resolve) => setTimeout(resolve, 0));

    for (let index = 0; index < audioMix.maxConcurrentSfx + 3; index += 1)
      audio.interact();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const activeSfx = FakeAudioElement.instances.filter(
      (element) => element.src.includes("/audio/sfx/") && element.playing,
    );
    expect(activeSfx).toHaveLength(audioMix.maxConcurrentSfx);
  });

  it("stops native ambience and SFX when muted", async () => {
    vi.stubGlobal("Audio", FakeAudioElement);
    const audio = new GameAudio();
    audio.setEnabled(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    audio.interact();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const playing = FakeAudioElement.instances.filter(
      (element) => element.playing,
    );
    expect(playing.length).toBeGreaterThanOrEqual(2);

    audio.setEnabled(false);

    expect(audio.getSnapshot()).toBe("muted");
    expect(playing.every((element) => !element.playing)).toBe(true);
    expect(playing.every((element) => element.removed)).toBe(true);
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
