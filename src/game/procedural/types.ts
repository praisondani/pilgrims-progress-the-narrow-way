import type { Vector2 } from "three";

export interface StoryLandmark {
  id: string;
  position: [number, number];
  radius: number;
  flattenStrength: number;
  excludeVegetation: boolean;
  excludeRocks: boolean;
}

export interface ScatterRule {
  count: number;
  minScale: number;
  maxScale: number;
  minSpacing: number;
  pathClearance: number;
  maxSlope: number;
  cluster: number;
}

export interface BiomeDefinition {
  id: string;
  terrainMaterial: string;
  vegetationRules: Record<string, ScatterRule>;
  rockRules: ScatterRule[];
  weatherProfile: string;
  lightingProfile: string;
  ambientAudio: string[];
  fogProfile: string;
}

export interface ProceduralSceneDefinition {
  id: string;
  seed: string;
  radius: number;
  path: Vector2[];
  landmarks: StoryLandmark[];
  biome: BiomeDefinition;
}

export interface ScatterPoint {
  x: number;
  z: number;
  y: number;
  scale: number;
  rotation: number;
  variant: number;
}
