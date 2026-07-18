import { describe, expect, it } from "vitest";
import { Vector2 } from "three";
import { countrysideBiome } from "./BiomeSystem";
import { scatterPoints } from "./ScatterSystem";
import { SeededRandom } from "./SeededRandom";
import type { ProceduralSceneDefinition } from "./types";

const definition: ProceduralSceneDefinition = {
  id: "test",
  seed: "bunyan-1678",
  radius: 10,
  path: [new Vector2(0, 8), new Vector2(0, -8)],
  landmarks: [
    {
      id: "gate",
      position: [4, 2],
      radius: 1.5,
      flattenStrength: 1,
      excludeVegetation: true,
      excludeRocks: true,
    },
  ],
  biome: countrysideBiome,
};

describe("procedural generation", () => {
  it("repeats the same random sequence for the same seed", () => {
    const first = new SeededRandom("narrow-way");
    const second = new SeededRandom("narrow-way");
    expect(Array.from({ length: 10 }, () => first.next())).toEqual(
      Array.from({ length: 10 }, () => second.next()),
    );
  });

  it("creates deterministic scatter clear of path and landmarks", () => {
    const rule = { ...countrysideBiome.vegetationRules.trees, count: 12 };
    const first = scatterPoints(definition, rule, "trees");
    const second = scatterPoints(definition, rule, "trees");
    expect(first).toEqual(second);
    expect(first).toHaveLength(12);
    expect(first.every((point) => Math.abs(point.x) >= rule.pathClearance)).toBe(true);
    expect(first.every((point) => Math.hypot(point.x - 4, point.z - 2) > 1.5)).toBe(true);
  });
});
