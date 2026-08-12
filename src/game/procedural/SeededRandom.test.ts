import { describe, expect, it } from "vitest";
import { Vector2 } from "three";
import { countrysideBiome } from "./BiomeSystem";
import { createCountrysideDefinition } from "./countrysideDefinition";
import { scatterPoints } from "./ScatterSystem";
import { SeededRandom } from "./SeededRandom";
import { terrainSlope } from "./TerrainGenerator";
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
  it("derives Chapter II landmarks from every authored story beat", () => {
    const first = createCountrysideDefinition("field-contract");
    const second = createCountrysideDefinition("field-contract");

    expect(first).toEqual(second);
    expect(first.landmarks.map((landmark) => landmark.id)).toEqual([
      "evangelist",
      "obstinate",
      "pliable",
      "fragment-one",
      "fragment-two",
      "marsh-edge",
    ]);
    expect(first.path.map((point) => [point.x, point.y])).toEqual([
      [0, 7.4],
      [-0.5, 4.5],
      [0.65, 1.5],
      [-0.5, -1.8],
      [0, -5.8],
    ]);
    expect(first.landmarks.at(-1)).toMatchObject({
      id: "marsh-edge",
      radius: 2.15,
      excludeVegetation: true,
      excludeRocks: true,
    });
  });

  it("keeps the seed as the only procedural input that varies", () => {
    const canonical = createCountrysideDefinition("field-contract");
    const alternate = createCountrysideDefinition("field-alt");
    expect(alternate.seed).toBe("field-alt");
    expect(alternate.id).toBe(canonical.id);
    expect(alternate.radius).toBe(canonical.radius);
    expect(alternate.path).toEqual(canonical.path);
    expect(alternate.landmarks).toEqual(canonical.landmarks);
    expect(alternate.biome).toBe(canonical.biome);
  });

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
    expect(
      first.every((point) => terrainSlope(definition, point.x, point.z) <= rule.maxSlope),
    ).toBe(true);
  });
});
