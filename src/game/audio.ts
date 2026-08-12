const sceneGainDb: Record<string, number> = {
  dream: 13.5,
  city: 23.4,
  field: 13,
  slough: 7.6,
  worldly: -0.5,
  gate: 15.5,
  interpreter: 19.8,
  cross: 3.3,
  sleepers: 7.4,
  wall: 9.7,
  hill: 5.5,
  arbor: 38.4,
  lions: 13.4,
  palace: 18.8,
  humiliation: -8,
  shadow: -5.2,
  faithful: 11.8,
  talkative: 6.5,
  warning: 6,
  vanity: -2.7,
  hopeful: 7.3,
  byends: -0.6,
  demas: 3.5,
  bypath: 21.1,
  doubting: 11,
  delectable: 7.8,
  enchanted: -2.4,
  beulah: 13.6,
  river: 5.1,
  celestial: 16.2,
};

const sfxGainDb: Record<string, number> = {
  interact: -0.1,
  dialogue: 10.9,
  chapter: 1.8,
  error: 23.2,
  focus: 7.1,
  "step-earth": -4,
  "step-mud": -6.7,
  success: 5.8,
};

// The finale reuses the measured, mastered beds from nearby chapters until
// dedicated Beulah and City recordings are authored. Keeping this alias map
// local preserves the no-external-audio contract and avoids a silent 404 while
// the finale remains fully playable.
const ambienceSource: Record<string, string> = {
  delectable: "hill",
  enchanted: "shadow",
  beulah: "hopeful",
  river: "cross",
  celestial: "palace",
};

export const ambienceUrl = (sceneId: string) =>
  `/audio/ambience/${ambienceSource[sceneId] ?? sceneId}.mp3`;
export const sfxUrl = (name: string) => `/audio/sfx/${name}.mp3`;
export const dbToGain = (decibels: number) => 10 ** (decibels / 20);
export const audioSceneIds = Object.keys(sceneGainDb);
export const audioMix = {
  // The generated MP3s are intentionally compact and arrive at very
  // different loudnesses (the quietest bed is roughly -70 dBFS RMS).  Keep
  // the target in the musical background range, then calibrate each decoded
  // buffer against its actual RMS/peak before it reaches the shared limiter.
  measuredAmbienceRmsDb: -22,
  ambienceNormalizationLiftDb: 0,
  ambiencePeakCeiling: 1.2,
  sfxTargetRmsDb: -18,
  sfxPeakCeiling: 1.2,
  ambienceBusGain: 0.6,
  sfxBusGain: 0.45,
  masterGain: 0.8,
  // Native fallback is used only when Web Audio cannot create/decode a source.
  // Keep it below full scale because HTMLAudioElement has no shared limiter.
  nativeAmbienceVolume: 0.24,
  nativeSfxVolume: 0.18,
  // Source calibration values are intentionally bounded before they reach
  // the shared limiter. A few legacy scenes were calibrated with very large
  // positive offsets; those can become speaker spikes when voices overlap.
  minSourceGainDb: -48,
  maxAmbienceSourceGainDb: 48,
  maxSfxSourceGainDb: 36,
  maxConcurrentSfx: 4,
} as const;

export const clampSourceGainDb = (
  decibels: number,
  maximum: number,
) => {
  const finite = Number.isFinite(decibels)
    ? decibels
    : audioMix.minSourceGainDb;
  return Math.min(
    maximum,
    Math.max(audioMix.minSourceGainDb, finite),
  );
};

/**
 * Return a bounded gain that brings a decoded asset toward a target RMS
 * without allowing its peak to grow past the soft ceiling. The final graph
 * still has a compressor/limiter, but keeping this calibration conservative
 * prevents the old “silent bed / sudden speaker spike” pairing.
 */
export const calibratedSourceGainDb = ({
  rms,
  peak,
  targetRmsDb,
  peakCeiling,
  maximum,
}: {
  rms: number;
  peak: number;
  targetRmsDb: number;
  peakCeiling: number;
  maximum: number;
}) => {
  if (!(rms > 0) || !(peak > 0)) return audioMix.minSourceGainDb;
  const desired = targetRmsDb - 20 * Math.log10(rms);
  const peakLimit = 20 * Math.log10(peakCeiling / peak);
  return clampSourceGainDb(Math.min(desired, peakLimit), maximum);
};

export const ambienceSourceGainDb = (sceneId: string) =>
  clampSourceGainDb(
    (sceneGainDb[sceneId] ?? 0) + audioMix.ambienceNormalizationLiftDb,
    Math.min(4, audioMix.maxAmbienceSourceGainDb),
  );

export const sfxSourceGainDb = (name: string) =>
  clampSourceGainDb(
    sfxGainDb[name] ?? audioMix.minSourceGainDb,
    Math.min(4, audioMix.maxSfxSourceGainDb),
  );

export const ambienceSourceGain = (sceneId: string) =>
  dbToGain(ambienceSourceGainDb(sceneId));

export const sfxSourceGain = (name: string) =>
  dbToGain(sfxSourceGainDb(name));

export const normalizedAmbienceOutputDb = () =>
  audioMix.measuredAmbienceRmsDb +
  audioMix.ambienceNormalizationLiftDb +
  20 * Math.log10(audioMix.ambienceBusGain) +
  20 * Math.log10(audioMix.masterGain);

type PlayingAmbience = {
  source: AudioBufferSourceNode;
  gain: GainNode;
};

type PlayingNativeAmbience = {
  element: HTMLAudioElement;
  scene: string;
};

type AudioBufferStats = { rms: number; peak: number };

function measureBuffer(buffer: AudioBuffer): AudioBufferStats {
  let sum = 0;
  let peak = 0;
  let sampleCount = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    sampleCount += data.length;
    for (const sample of data) {
      const absolute = Math.abs(sample);
      sum += sample * sample;
      peak = Math.max(peak, absolute);
    }
  }
  return {
    rms: sampleCount > 0 ? Math.sqrt(sum / sampleCount) : 0,
    peak,
  };
}

export type AudioPlaybackState =
  | "muted"
  | "loading"
  | "blocked"
  | "playing"
  | "error";

export class GameAudio {
  private ctx?: AudioContext;
  private master?: GainNode;
  private ambienceBus?: GainNode;
  private sfxBus?: GainNode;
  private buffers = new Map<string, AudioBuffer>();
  private loading = new Map<string, Promise<AudioBuffer | undefined>>();
  private current?: PlayingAmbience;
  private pendingScene = "dream";
  private sceneRequest = 0;
  // Allow the first movement cue immediately, including on native fallback
  // paths where performance.now() can still be below the cadence threshold.
  private lastStep = Number.NEGATIVE_INFINITY;
  private lastFocus = Number.NEGATIVE_INFINITY;
  private enabled = false;
  private playbackState: AudioPlaybackState = "muted";
  private listeners = new Set<() => void>();
  private resumeRequest?: Promise<boolean>;
  private activeSfx: AudioBufferSourceNode[] = [];
  private nativeAmbience?: PlayingNativeAmbience;
  private nativeSfx = new Set<HTMLAudioElement>();
  private calibratedGains = new Map<string, number>();

  getSnapshot = () => this.playbackState;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private markState(
    state: AudioPlaybackState,
    scene?: string,
  ) {
    this.playbackState = state;
    if (typeof document !== "undefined") {
      document.documentElement.dataset.audioState = state;
      document.documentElement.dataset.audioContext =
        this.ctx?.state ?? (this.nativeAmbience ? "native" : "none");
      if (scene) document.documentElement.dataset.audioScene = scene;
    }
    this.listeners.forEach((listener) => listener());
  }

  start() {
    if (!this.enabled) {
      this.markState("muted", this.pendingScene);
      return;
    }
    if (!this.ctx) this.buildGraph();
    if (!this.ctx) {
      void this.playNativeAmbience(this.pendingScene, this.sceneRequest);
      return;
    }
    void this.resumeAndPlay();
  }

  private async resumeAndPlay() {
    if (!this.ctx) this.buildGraph();
    if (!this.enabled) return false;
    if (!this.ctx)
      return this.playNativeAmbience(this.pendingScene, this.sceneRequest);
    const context = this.ctx;
    if (context.state !== "running") {
      if (!this.resumeRequest) {
        this.resumeRequest = (async () => {
          try {
            // Safari can take a few hundred milliseconds to settle a trusted
            // gesture. The old 180ms race reported a false "blocked" state
            // while the context was already on its way to running. Keep a
            // bounded wait, then let the next pointer/keyboard gesture retry.
            await Promise.race([
              context.resume(),
              new Promise<void>((resolve) => setTimeout(resolve, 1_200)),
            ]);
          } catch {
            // Autoplay policy rejects resume until a trusted user gesture.
          }
          const running = context.state === "running";
          if (!running && this.enabled) {
            this.markState("blocked", this.pendingScene);
          }
          return running;
        })().finally(() => {
          this.resumeRequest = undefined;
        });
      }
      if (!(await this.resumeRequest))
        return this.playNativeAmbience(this.pendingScene, this.sceneRequest);
    }
    if (!this.enabled) {
      this.markState("muted", this.pendingScene);
      return false;
    }
    if (context.state !== "running") {
      this.markState("blocked", this.pendingScene);
      return this.playNativeAmbience(this.pendingScene, this.sceneRequest);
    }
    this.markState("loading", this.pendingScene);
    await this.playScene(this.pendingScene);
    return true;
  }

  setEnabled(value: boolean) {
    this.enabled = value;
    if (!value) {
      // Invalidate a pending decode so it cannot start an ambience source
      // after the user has muted audio while it was loading.
      this.sceneRequest += 1;
      // Muting must stop the sources, not only turn the master gain down. A
      // hidden Web Audio source can otherwise keep looping behind the mute,
      // and a later unmute can resurrect several stale SFX voices at once.
      this.stopWebAudioPlayback();
      this.stopNativePlayback();
      this.markState("muted", this.pendingScene);
    } else {
      this.markState("loading", this.pendingScene);
    }
    if (!this.ctx || !this.master) {
      if (value) this.start();
      return;
    }
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(value ? audioMix.masterGain : 0, now, 0.08);
    if (value) this.start();
  }

  private stopWebAudioPlayback() {
    const current = this.current;
    this.current = undefined;
    if (current) {
      try {
        current.source.stop();
      } catch {
        // An already-ended AudioBufferSourceNode throws when stopped twice.
      }
    }

    const activeSfx = this.activeSfx;
    this.activeSfx = [];
    for (const source of activeSfx) {
      try {
        source.stop();
      } catch {
        // SFX may have ended between the snapshot and the mute action.
      }
    }
  }

  private stopNativeAmbience() {
    const ambience = this.nativeAmbience;
    this.nativeAmbience = undefined;
    if (!ambience) return;
    ambience.element.pause();
    ambience.element.removeAttribute("src");
    ambience.element.load();
    ambience.element.remove();
  }

  private stopNativePlayback() {
    this.stopNativeAmbience();
    for (const element of this.nativeSfx) {
      element.pause();
      element.remove();
    }
    this.nativeSfx.clear();
  }

  private buildGraph() {
    if (typeof window === "undefined") return;
    const AudioContextConstructor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextConstructor) {
      this.markState("error", this.pendingScene);
      return;
    }
    try {
      this.ctx = new AudioContextConstructor();
    } catch {
      this.markState("error", this.pendingScene);
      return;
    }
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 9_000;
    lowpass.Q.value = 0.4;

    const limiter = this.ctx.createDynamicsCompressor();
    limiter.threshold.value = -18;
    limiter.knee.value = 24;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.006;
    limiter.release.value = 0.28;

    this.master = this.ctx.createGain();
    this.master.gain.value = this.enabled ? audioMix.masterGain : 0;
    this.ambienceBus = this.ctx.createGain();
    this.ambienceBus.gain.value = audioMix.ambienceBusGain;
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = audioMix.sfxBusGain;

    this.ambienceBus.connect(lowpass);
    this.sfxBus.connect(lowpass);
    lowpass.connect(limiter).connect(this.master).connect(this.ctx.destination);

    const unlock = () => {
      if (this.enabled && this.ctx?.state !== "running") void this.resumeAndPlay();
    };
    // Mobile Safari can suspend or interrupt an AudioContext when the page is
    // backgrounded, the output route changes, or the device locks. Keep the
    // HUD truthful instead of leaving “Sound on” visible over silence.
    this.ctx.addEventListener("statechange", () => {
      const contextState = this.ctx?.state as string | undefined;
      if (!this.enabled) {
        this.markState("muted", this.pendingScene);
      } else if (contextState === "running") {
        this.markState(this.current ? "playing" : "loading", this.pendingScene);
      } else if (contextState === "closed") {
        this.markState("error", this.pendingScene);
      } else {
        this.markState("blocked", this.pendingScene);
      }
    });
    window.addEventListener("pointerdown", unlock, {
      capture: true,
      passive: true,
    });
    window.addEventListener("keydown", unlock, { capture: true });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") unlock();
    });
  }

  private async load(url: string) {
    const cached = this.buffers.get(url);
    if (cached) return cached;
    const existing = this.loading.get(url);
    if (existing) return existing;
    if (!this.ctx) return;
    const request = (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok || !this.ctx) return;
        const buffer = await this.ctx.decodeAudioData(await response.arrayBuffer());
        this.buffers.set(url, buffer);
        return buffer;
      } catch {
        return;
      } finally {
        this.loading.delete(url);
      }
    })();
    this.loading.set(url, request);
    return request;
  }

  scene(id: string) {
    this.pendingScene = id;
    if (this.enabled) void this.resumeAndPlay();
  }

  /**
   * Keep a browser-native playback path for Safari/WebKit builds where an
   * AudioContext exists but MP3 decode is unavailable or interrupted. The
   * fallback still needs the same trusted gesture, but avoids turning a
   * recoverable decode failure into a permanently silent game.
   */
  private async playNativeAmbience(id: string, request: number) {
    if (!this.enabled || id !== this.pendingScene || request !== this.sceneRequest)
      return false;
    if (typeof Audio === "undefined") return false;
    if (this.nativeAmbience?.scene === id) {
      this.markState("playing", id);
      return true;
    }
    this.markState("loading", id);
    this.stopNativeAmbience();
    const element = new Audio(ambienceUrl(id));
    element.loop = true;
    element.preload = "auto";
    element.volume = audioMix.nativeAmbienceVolume;
    element.setAttribute("playsinline", "true");
    this.nativeAmbience = { element, scene: id };
    try {
      await element.play();
    } catch {
      if (this.nativeAmbience?.element === element) this.nativeAmbience = undefined;
      element.remove();
      if (this.enabled && id === this.pendingScene)
        this.markState("blocked", id);
      return false;
    }
    if (
      !this.enabled ||
      id !== this.pendingScene ||
      request !== this.sceneRequest ||
      this.nativeAmbience?.element !== element
    ) {
      element.pause();
      element.remove();
      return false;
    }
    if (typeof document !== "undefined")
      document.documentElement.dataset.audioContext = "native";
    this.markState("playing", id);
    return true;
  }

  private async playNativeSfx(name: string) {
    if (!this.enabled || typeof Audio === "undefined") return false;
    // HTMLAudioElement has no shared compressor or bus. Stop the oldest
    // fallback voice before adding another one so a burst of footsteps,
    // focus ticks, or impact callbacks cannot pile up and spike the speaker.
    while (this.nativeSfx.size >= audioMix.maxConcurrentSfx) {
      const oldest = this.nativeSfx.values().next().value as
        | HTMLAudioElement
        | undefined;
      if (!oldest) break;
      oldest.pause();
      oldest.remove();
      this.nativeSfx.delete(oldest);
    }
    const element = new Audio(sfxUrl(name));
    element.preload = "auto";
    element.volume = audioMix.nativeSfxVolume;
    element.setAttribute("playsinline", "true");
    this.nativeSfx.add(element);
    const cleanup = () => {
      this.nativeSfx.delete(element);
      element.remove();
    };
    element.addEventListener("ended", cleanup, { once: true });
    try {
      await element.play();
      return true;
    } catch {
      cleanup();
      return false;
    }
  }

  private async playScene(id: string) {
    if (
      !this.ctx ||
      !this.ambienceBus ||
      !this.enabled ||
      this.ctx.state !== "running"
    )
      return;
    if (
      this.current &&
      this.current.source.buffer === this.buffers.get(ambienceUrl(id))
    ) {
      this.markState("playing", id);
      return;
    }
    this.markState("loading", id);
    const request = ++this.sceneRequest;
    const buffer = await this.load(ambienceUrl(id));
    if (
      !buffer ||
      !this.enabled ||
      this.ctx.state !== "running" ||
      request !== this.sceneRequest ||
      id !== this.pendingScene
    ) {
      if (!buffer && request === this.sceneRequest) {
        if (await this.playNativeAmbience(id, request)) return;
        this.markState("error", id);
      }
      return;
    }

    const gainKey = `ambience:${id}:${ambienceUrl(id)}`;
    const gainDb = this.calibratedGains.get(gainKey) ?? (() => {
      const stats = measureBuffer(buffer);
      const trim = Math.min(4, Math.max(-4, sceneGainDb[id] ?? 0));
      const calibrated = calibratedSourceGainDb({
        rms: stats.rms,
        peak: stats.peak,
        targetRmsDb: audioMix.measuredAmbienceRmsDb + trim,
        peakCeiling: audioMix.ambiencePeakCeiling,
        maximum: audioMix.maxAmbienceSourceGainDb,
      });
      this.calibratedGains.set(gainKey, calibrated);
      return calibrated;
    })();
    if (typeof document !== "undefined")
      document.documentElement.dataset.audioAmbienceGainDb = gainDb.toFixed(1);
    const now = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(dbToGain(gainDb), now + 1.4);
    source.connect(gain).connect(this.ambienceBus);
    source.start();
    this.markState("playing", id);

    const previous = this.current;
    if (previous) {
      previous.gain.gain.cancelScheduledValues(now);
      previous.gain.gain.setValueAtTime(
        Math.max(0.0001, previous.gain.gain.value),
        now,
      );
      previous.gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
      previous.source.stop(now + 1.5);
    }
    this.current = { source, gain };
  }

  private async playSfx(name: string) {
    if (!this.enabled) return;
    if (!(await this.resumeAndPlay())) {
      await this.playNativeSfx(name);
      return;
    }
    if (!this.ctx || !this.sfxBus) {
      await this.playNativeSfx(name);
      return;
    }
    const buffer = await this.load(sfxUrl(name));
    if (!buffer || !this.enabled) {
      if (!buffer) await this.playNativeSfx(name);
      return;
    }
    const gainKey = `sfx:${name}`;
    const gainDb = this.calibratedGains.get(gainKey) ?? (() => {
      const stats = measureBuffer(buffer);
      const trim = Math.min(4, Math.max(-4, sfxGainDb[name] ?? 0));
      const calibrated = calibratedSourceGainDb({
        rms: stats.rms,
        peak: stats.peak,
        targetRmsDb: audioMix.sfxTargetRmsDb + trim,
        peakCeiling: audioMix.sfxPeakCeiling,
        maximum: audioMix.maxSfxSourceGainDb,
      });
      this.calibratedGains.set(gainKey, calibrated);
      return calibrated;
    })();
    if (typeof document !== "undefined")
      document.documentElement.dataset.audioSfxGainDb = gainDb.toFixed(1);
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = dbToGain(gainDb);
    source.connect(gain).connect(this.sfxBus);

    // Do not let repeated focus/impact callbacks stack indefinitely. Keeping
    // four voices retains tactile feedback while bounding total transient
    // energy before the shared compressor.
    if (this.activeSfx.length >= audioMix.maxConcurrentSfx) {
      this.activeSfx.shift()?.stop();
    }
    this.activeSfx.push(source);
    source.onended = () => {
      this.activeSfx = this.activeSfx.filter((active) => active !== source);
    };
    source.start();
  }

  interact() {
    void this.playSfx("interact");
  }

  dialogue() {
    void this.playSfx("dialogue");
  }

  chapter() {
    void this.playSfx("chapter");
  }

  success() {
    void this.playSfx("success");
  }

  error() {
    void this.playSfx("error");
  }

  impact() {
    void this.playSfx("step-earth");
  }

  focus(_value?: number) {
    const now = performance.now();
    if (now - this.lastFocus < 110) return;
    this.lastFocus = now;
    void this.playSfx("focus");
  }

  walking(moving: boolean, mud = false) {
    if (!moving || !this.enabled) return;
    // Native fallback has no AudioContext clock. Keep footsteps available on
    // WebKit/decode-failure paths by using the same monotonic wall clock.
    const now = this.ctx?.currentTime ?? performance.now() / 1000;
    if (now - this.lastStep < (mud ? 0.48 : 0.34)) return;
    this.lastStep = now;
    void this.playSfx(mud ? "step-mud" : "step-earth");
  }
}

export const gameAudio = new GameAudio();
