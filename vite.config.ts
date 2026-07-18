import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

export default defineConfig({
  plugins: [react()],
  preview: {
    headers: { "Content-Security-Policy": contentSecurityPolicy },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("three.webgpu") ||
            id.includes("/three/src/renderers/common/") ||
            id.includes("/three/src/renderers/webgpu/") ||
            id.includes("/three/src/nodes/")
          )
            return "three-webgpu-prototype";
          if (id.includes("three-stdlib")) return "three-runtime";
          if (id.includes("@react-three/rapier") || id.includes("@dimforge"))
            return "physics";
          if (id.includes("@react-three") || id.includes("three/"))
            return "three-runtime";
          if (id.includes("react-dom") || id.includes("/react/"))
            return "react-runtime";
          if (id.includes("zustand")) return "state-runtime";
        },
      },
    },
  },
});
