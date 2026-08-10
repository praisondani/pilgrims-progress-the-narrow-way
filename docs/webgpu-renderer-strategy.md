# WebGPU Renderer Strategy

## Decision

Keep `WebGLRenderer` as default. Offer `WebGPURenderer` only through `?webgpu=1` until visual, physics, accessibility, browser, memory, and performance parity pass. Failure immediately returns to the verified WebGL 2 constructor.

Three.js documents `WebGPURenderer` as experimental and notes that unsupported browsers can use its WebGL 2 backend. R3F v9 supports an async `gl` factory. References: [Three.js WebGPU manual](https://threejs.org/manual/en/webgpurenderer), [R3F v9 migration guide](https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide).

## Central capability service

`src/game/rendering/capabilities.ts` owns browser/device checks and publishes:

```ts
interface RenderingCapabilities {
  webgpu: boolean;
  compute: boolean;
  webgl2: boolean;
  highPerformanceGPU: boolean;
  maxTextureSize: number;
  recommendedPreset: "low" | "medium" | "high";
}
```

No scene component should directly check `navigator.gpu`.

## Feature flags

| Flag | Query | Default | Current meaning |
| --- | --- | --- | --- |
| `webgpuRenderer` | `?webgpu=1` | off | Lazy-load and initialize `WebGPURenderer`. |
| `gpuComputeParticles` | `?compute-particles=1` | off | Reserved until measurable compute prototype exists. |
| `gpuVegetation` | `?gpu-vegetation=1` | on | Instanced vegetation path; not falsely labeled compute. |
| `gpuWeather` | `?gpu-weather=1` | off | Reserved for weather compute after fallback exists. |
| `advancedTerrain` | `?advanced-terrain=0` disables | on | Deterministic Chapter II terrain prototype. |

`document.documentElement.dataset` exposes requested backend, detected capability, chosen backend, and recommended quality for tests/dev HUD.

## Verification gate

Before enabling WebGPU by default:

1. Compare all 30 scene screenshots with WebGL.
2. Complete full 223-beat journey on both backends.
3. Validate shadows, transparent water, particles, OrbitControls, Rapier, audio unlock, screenshots, reduced motion, and high contrast.
4. Measure startup, shader compilation, frame time, draw calls, GPU time, and memory on real hardware.
5. Force initialization failure and prove WebGL 2 recovery.
6. Safari, Chrome, Edge, Firefox matrix must match documented support.

No compute feature may become essential to navigation or story progression.
