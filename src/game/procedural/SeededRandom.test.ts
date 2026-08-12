import { describe, expect, it } from "vitest";
import { Vector2 } from "three";
import { countrysideBiome } from "./BiomeSystem";
import { createCountrysideDefinition } from "./countrysideDefinition";
import { distanceToPath, distanceToPathCoordinates } from "./PathMaskGenerator";
import { scatterPoints } from "./ScatterSystem";
import { SeededRandom } from "./SeededRandom";
import { terrainHeight, terrainSlope } from "./TerrainGenerator";
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

  it("keeps every authored Chapter II objective on a finite playable pad", () => {
    const field = createCountrysideDefinition("field-contract");

    for (const landmark of field.landmarks) {
      const [x, z] = landmark.position;
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(z)).toBe(true);
      expect(Math.hypot(x, z) + landmark.radius).toBeLessThan(field.radius);
      expect(terrainHeight(field, x, z)).toBeCloseTo(0, 4);
      expect(Number.isFinite(distanceToPathCoordinates(x, z, field.path))).toBe(
        true,
      );
    }
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

  it("keeps every Chapter II scatter rule safe across alternate seeds", () => {
    const rules = [
      ...Object.entries(countrysideBiome.vegetationRules).map(
        ([label, rule]) => ({ label, rule, kind: "vegetation" as const }),
      ),
      ...countrysideBiome.rockRules.map((rule, index) => ({
        label: `rocks-${index}`,
        rule,
        kind: "rocks" as const,
      })),
    ];

    for (const seed of ["field-v1-1678", "field-alt-2001"]) {
      const seededDefinition = createCountrysideDefinition(seed);
      for (const { label, rule, kind } of rules) {
        const boundedRule = { ...rule, count: Math.min(rule.count, 36) };
        const first = scatterPoints(seededDefinition, boundedRule, label, kind);
        const second = scatterPoints(seededDefinition, boundedRule, label, kind);
        expect(first).toEqual(second);
        expect(first.length).toBeGreaterThan(0);
        for (const point of first) {
          expect(Number.isFinite(point.x)).toBe(true);
          expect(Number.isFinite(point.y)).toBe(true);
          expect(Number.isFinite(point.z)).toBe(true);
          expect(distanceToPath(new Vector2(point.x, point.z), seededDefinition.path)).toBeGreaterThanOrEqual(
            boundedRule.pathClearance,
          );
          expect(terrainSlope(seededDefinition, point.x, point.z)).toBeLessThanOrEqual(
            boundedRule.maxSlope + 1e-9,
          );
          for (const landmark of seededDefinition.landmarks) {
            const excluded =
              kind === "vegetation"
                ? landmark.excludeVegetation
                : landmark.excludeRocks;
            if (!excluded) continue;
            expect(
              Math.hypot(
                point.x - landmark.position[0],
                point.z - landmark.position[1],
              ),
            ).toBeGreaterThan(landmark.radius);
          }
        }
      }
    }
  });
});
