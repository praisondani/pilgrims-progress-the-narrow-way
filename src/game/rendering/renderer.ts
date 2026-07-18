import { WebGLRenderer, type WebGLRendererParameters } from "three";
import {
  detectRenderingCapabilities,
  publishRenderingCapabilities,
  renderingFeatureFlags,
} from "./capabilities";

type RendererInput = WebGLRendererParameters & {
  canvas: HTMLCanvasElement | OffscreenCanvas;
};

export async function createGameRenderer(input: RendererInput) {
  const flags = renderingFeatureFlags();
  const capabilities = detectRenderingCapabilities();
  publishRenderingCapabilities(capabilities, flags);

  if (flags.webgpuRenderer && capabilities.webgpu) {
    try {
      const { WebGPURenderer } = await import("three/webgpu");
      const renderer = new WebGPURenderer({
        antialias: true,
        canvas: input.canvas,
        powerPreference: "high-performance",
      });
      await renderer.init();
      document.documentElement.dataset.rendererBackend = "webgpu";
      return renderer;
    } catch (error) {
      console.warn("WebGPU prototype failed; using verified WebGL 2 renderer.", error);
    }
  }

  const renderer = new WebGLRenderer({
    ...input,
    antialias: true,
    powerPreference: "high-performance",
  });
  document.documentElement.dataset.rendererBackend = "webgl2";
  return renderer;
}
