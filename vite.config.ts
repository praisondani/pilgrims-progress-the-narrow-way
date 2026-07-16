import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
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
