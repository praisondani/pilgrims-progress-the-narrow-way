import { describe, expect, it } from "vitest";
import { Vector2 } from "three";
import { countrysideBiome } from "./BiomeSystem";
import { generateTerrain, terrainHeight, terrainSlope } from "./TerrainGenerator";
import type { ProceduralSceneDefinition } from "./types";

const definition: ProceduralSceneDefinition = {
  id: "terrain-test",
  seed: "bunyan-terrain-1678",
  radius: 10,
  path: [new Vector2(0, 8), new Vector2(-0.4, 0), new Vector2(0, -8)],
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

describe("procedural terrain", () => {
  it("generates deterministic finite topology for a collider", () => {
    const first = generateTerrain(definition, 6, 18);
    const second = generateTerrain(definition, 6, 18);

    expect(Array.from(first.vertices)).toEqual(Array.from(second.vertices));
    expect(Array.from(first.indices)).toEqual(Array.from(second.indices));
    expect(first.vertices.length / 3).toBe(1 + 6 * 18);
    expect(first.indices.length).toBe(18 * 3 + 5 * 18 * 6);
    expect(Array.from(first.vertices).every(Number.isFinite)).toBe(true);
    expect(first.geometry.getAttribute("position").count).toBe(1 + 6 * 18);
    expect(first.geometry.index?.count).toBe(18 * 3 + 5 * 18 * 6);
    expect(first.geometry.boundingSphere?.radius).toBeGreaterThan(9);

    first.geometry.dispose();
    second.geometry.dispose();
  });

  it("flattens the playable path and authored landmark pads", () => {
    expect(Math.abs(terrainHeight(definition, 0, 8))).toBeLessThan(0.1);
    expect(Math.abs(terrainHeight(definition, 0, 0))).toBeLessThan(0.1);
    expect(Math.abs(terrainHeight(definition, 4, 2))).toBeLessThan(0.1);
    expect(terrainSlope(definition, 0, 0)).toBeGreaterThanOrEqual(0);
    expect(terrainSlope(definition, 0, 0)).toBeLessThan(2);
  });
});
