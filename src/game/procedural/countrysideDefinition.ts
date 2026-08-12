import { Vector2 } from "three";
import { storyScenes } from "../story";
import { countrysideBiome } from "./BiomeSystem";
import type { ProceduralSceneDefinition } from "./types";

export const COUNTRYSIDE_DEFAULT_SEED = "field-v1-1678";

export const COUNTRYSIDE_PATH = [
  new Vector2(0, 7.4),
  new Vector2(-0.5, 4.5),
  new Vector2(0.65, 1.5),
  new Vector2(-0.5, -1.8),
  new Vector2(0, -5.8),
];

/** Build the Chapter II world contract from the authored story beats. */
export function createCountrysideDefinition(
  seed = COUNTRYSIDE_DEFAULT_SEED,
): ProceduralSceneDefinition {
  const scene = storyScenes.find((candidate) => candidate.id === "field");
  if (!scene) throw new Error("Chapter II countryside scene is missing");
  return {
    id: "field-countryside",
    seed,
    radius: 10.65,
    path: COUNTRYSIDE_PATH.map((point) => point.clone()),
    biome: countrysideBiome,
    landmarks: scene.steps.map((step) => ({
      id: step.id,
      position: [...step.position] as [number, number],
      radius: step.id === "marsh-edge" ? 2.15 : 1.75,
      flattenStrength: 1,
      excludeVegetation: true,
      excludeRocks: true,
    })),
  };
}
