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
  measuredAmbienceRmsDb: -32,
  ambienceNormalizationLiftDb: 10,
  ambienceBusGain: 0.6,
  sfxBusGain: 0.45,
  masterGain: 0.8,
} as const;
export const normalizedAmbienceOutputDb = () =>
  audioMix.measuredAmbienceRmsDb +
  audioMix.ambienceNormalizationLiftDb +
  20 * Math.log10(audioMix.ambienceBusGain) +
  20 * Math.log10(audioMix.masterGain);

type PlayingAmbience = {
  source: AudioBufferSourceNode;
  gain: GainNode;
};

export type AudioPlaybackState =
  | "muted"
  | "loading"
  | "blocked"
  | "playing"
  | "error";

class GameAudio {
  private ctx?: AudioContext;
  private master?: GainNode;
  private ambienceBus?: GainNode;
  private sfxBus?: GainNode;
  private buffers = new Map<string, AudioBuffer>();
  private loading = new Map<string, Promise<AudioBuffer | undefined>>();
  private current?: PlayingAmbience;
  private pendingScene = "dream";
  private sceneRequest = 0;
  private lastStep = 0;
  private lastFocus = 0;
  private enabled = false;
  private playbackState: AudioPlaybackState = "muted";
  private listeners = new Set<() => void>();

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
    if (typeof document === "undefined") return;
    document.documentElement.dataset.audioState = state;
    document.documentElement.dataset.audioContext = this.ctx?.state ?? "none";
    if (scene) document.documentElement.dataset.audioScene = scene;
    this.listeners.forEach((listener) => listener());
  }

  start() {
    if (!this.ctx) this.buildGraph();
    void this.resumeAndPlay();
  }

  private async resumeAndPlay() {
    if (!this.ctx) this.buildGraph();
    if (!this.ctx || !this.enabled) return false;
    try {
      await Promise.race([
        this.ctx.resume(),
        new Promise<void>((resolve) => window.setTimeout(resolve, 180)),
      ]);
    } catch {
      // Browsers reject resume outside a trusted user gesture.
    }
    if (this.ctx.state !== "running") {
      this.markState("blocked", this.pendingScene);
      return false;
    }
    this.markState("loading", this.pendingScene);
    await this.playScene(this.pendingScene);
    return true;
  }

  setEnabled(value: boolean) {
    this.enabled = value;
    this.markState(value ? "loading" : "muted", this.pendingScene);
    if (!this.ctx || !this.master) {
      if (value) this.start();
      return;
    }
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(value ? audioMix.masterGain : 0, now, 0.08);
    if (value) this.start();
  }

  private buildGraph() {
    this.ctx = new AudioContext();
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
    window.addEventListener("pointerdown", unlock, { capture: true });
    window.addEventListener("keydown", unlock, { capture: true });
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
    if (this.ctx && this.enabled) void this.resumeAndPlay();
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
    if (!buffer || request !== this.sceneRequest || id !== this.pendingScene) {
      if (!buffer && request === this.sceneRequest) this.markState("error", id);
      return;
    }

    const now = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(
      dbToGain(
        (sceneGainDb[id] ?? 0) + audioMix.ambienceNormalizationLiftDb,
      ),
      now + 1.4,
    );
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
    if (!(await this.resumeAndPlay())) return;
    if (!this.ctx || !this.sfxBus) return;
    const buffer = await this.load(sfxUrl(name));
    if (!buffer || !this.enabled) return;
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = dbToGain(sfxGainDb[name] ?? 0);
    source.connect(gain).connect(this.sfxBus);
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
    if (!moving || !this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    if (now - this.lastStep < (mud ? 0.48 : 0.34)) return;
    this.lastStep = now;
    void this.playSfx(mud ? "step-mud" : "step-earth");
  }
}

export const gameAudio = new GameAudio();
