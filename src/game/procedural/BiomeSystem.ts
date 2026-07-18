import type { BiomeDefinition } from "./types";

export const countrysideBiome: BiomeDefinition = {
  id: "open-countryside",
  terrainMaterial: "spring-meadow",
  vegetationRules: {
    trees: {
      count: 12,
      minScale: 0.72,
      maxScale: 1.16,
      minSpacing: 1.45,
      pathClearance: 2.35,
      maxSlope: 0.7,
      cluster: 0.42,
    },
    shrubs: {
      count: 28,
      minScale: 0.55,
      maxScale: 1.25,
      minSpacing: 0.58,
      pathClearance: 1.35,
      maxSlope: 0.85,
      cluster: 0.68,
    },
    grass: {
      count: 900,
      minScale: 0.65,
      maxScale: 1.35,
      minSpacing: 0.08,
      pathClearance: 0.58,
      maxSlope: 0.9,
      cluster: 0.72,
    },
    flowers: {
      count: 110,
      minScale: 0.7,
      maxScale: 1.25,
      minSpacing: 0.18,
      pathClearance: 0.38,
      maxSlope: 0.85,
      cluster: 0.82,
    },
  },
  rockRules: [
    {
      count: 22,
      minScale: 0.28,
      maxScale: 0.9,
      minSpacing: 0.45,
      pathClearance: 1.55,
      maxSlope: 0.9,
      cluster: 0.48,
    },
  ],
  weatherProfile: "clearing-morning",
  lightingProfile: "warm-guiding-light",
  ambientAudio: ["field"],
  fogProfile: "long-blue-haze",
};
