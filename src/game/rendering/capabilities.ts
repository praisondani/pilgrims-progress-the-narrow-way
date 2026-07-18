export type QualityPreset = "low" | "medium" | "high";

export interface RenderingCapabilities {
  webgpu: boolean;
  compute: boolean;
  webgl2: boolean;
  highPerformanceGPU: boolean;
  maxTextureSize: number;
  recommendedPreset: QualityPreset;
}

export interface RenderingFeatureFlags {
  webgpuRenderer: boolean;
  gpuComputeParticles: boolean;
  gpuVegetation: boolean;
  gpuWeather: boolean;
  advancedTerrain: boolean;
}

const defaults: RenderingFeatureFlags = {
  webgpuRenderer: false,
  gpuComputeParticles: false,
  gpuVegetation: true,
  gpuWeather: false,
  advancedTerrain: true,
};

const queryAliases: Record<keyof RenderingFeatureFlags, string> = {
  webgpuRenderer: "webgpu",
  gpuComputeParticles: "compute-particles",
  gpuVegetation: "gpu-vegetation",
  gpuWeather: "gpu-weather",
  advancedTerrain: "advanced-terrain",
};

export function renderingFeatureFlags(
  search = typeof location === "undefined" ? "" : location.search,
): RenderingFeatureFlags {
  const params = new URLSearchParams(search);
  return Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => {
      const value = params.get(queryAliases[key as keyof RenderingFeatureFlags]);
      return [key, value === null ? fallback : value === "1" || value === "true"];
    }),
  ) as unknown as RenderingFeatureFlags;
}

export function detectRenderingCapabilities(): RenderingCapabilities {
  if (typeof document === "undefined" || typeof navigator === "undefined")
    return {
      webgpu: false,
      compute: false,
      webgl2: false,
      highPerformanceGPU: false,
      maxTextureSize: 0,
      recommendedPreset: "low",
    };

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", { powerPreference: "high-performance" });
  const webgl2 = Boolean(gl);
  const maxTextureSize = gl?.getParameter(gl.MAX_TEXTURE_SIZE) ?? 0;
  const nav = navigator as Navigator & {
    gpu?: unknown;
    deviceMemory?: number;
  };
  const webgpu = Boolean(nav.gpu);
  const cores = navigator.hardwareConcurrency || 2;
  const memory = nav.deviceMemory || 4;
  const highPerformanceGPU =
    webgpu && cores >= 8 && memory >= 8 && maxTextureSize >= 8192;
  const recommendedPreset: QualityPreset = highPerformanceGPU
    ? "high"
    : webgl2 && cores >= 4 && memory >= 4
      ? "medium"
      : "low";
  gl?.getExtension("WEBGL_lose_context")?.loseContext();
  return {
    webgpu,
    compute: webgpu,
    webgl2,
    highPerformanceGPU,
    maxTextureSize,
    recommendedPreset,
  };
}

export function publishRenderingCapabilities(
  capabilities = detectRenderingCapabilities(),
  flags = renderingFeatureFlags(),
) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.rendererCapability = capabilities.webgpu
    ? "webgpu"
    : capabilities.webgl2
      ? "webgl2"
      : "unsupported";
  document.documentElement.dataset.qualityPreset = capabilities.recommendedPreset;
  document.documentElement.dataset.rendererRequested = flags.webgpuRenderer
    ? "webgpu"
    : "webgl";
}
