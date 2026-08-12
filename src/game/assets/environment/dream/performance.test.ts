import { describe, expect, it } from "vitest";
import { MeshPhysicalMaterial } from "three";
import { buildDreamComposition } from "./composition";
import { resolveDreamPalette } from "./palette";
import {
  dreamPerformanceViolations,
  estimateDreamPerformance,
  selectDreamLod,
  DREAM_PERFORMANCE_BUDGET,
} from "./performance";
import { createDreamEnvironmentResources } from "./resources";
import type { DreamQualityPreset } from "./types";

describe("Dream environment performance contract", () => {
  it.each([
    ["low", "far"],
    ["medium", "near"],
    ["high", "near"],
  ] as const)("%s stays inside its explicit contribution budget", (quality, lod) => {
    const composition = buildDreamComposition(undefined, quality);
    const resources = createDreamEnvironmentResources(
      resolveDreamPalette(),
      quality,
      "ink",
    );
    const estimate = estimateDreamPerformance(
      composition,
      resources,
      lod,
      true,
    );
    expect(dreamPerformanceViolations(estimate)).toEqual([]);
    expect(estimate.visibleDrawCalls).toBeLessThanOrEqual(
      DREAM_PERFORMANCE_BUDGET[quality].maxVisibleDrawCalls,
    );
    expect(estimate.textures).toBe(0);
    resources.dispose();
  });

  it("uses hysteresis and pins low quality to far LOD", () => {
    expect(selectDreamLod(2, "low", "near")).toBe("far");
    expect(selectDreamLod(12, "medium", "far")).toBe("near");
    expect(selectDreamLod(14.5, "medium", "near")).toBe("near");
    expect(selectDreamLod(16, "medium", "near")).toBe("far");
    expect(selectDreamLod(18, "high", "near")).toBe("near");
    expect(selectDreamLod(20, "high", "near")).toBe("far");
  });

  it("offers dry, ink, and moonlit stream materials without textures", () => {
    const palette = resolveDreamPalette();
    const resources = (
      ["low", "medium", "high"] as DreamQualityPreset[]
    ).map((quality, index) =>
      createDreamEnvironmentResources(
        palette,
        quality,
        index === 0 ? "dry" : index === 1 ? "ink" : "moonlit",
      ),
    );
    expect(resources[0].materials.stream).toBeNull();
    expect(resources[1].materials.stream).not.toBeNull();
    expect(resources[2].materials.stream).not.toBeNull();
    expect(
      (resources[2].materials.stream as MeshPhysicalMaterial).clearcoat,
    ).toBeGreaterThan(0.65);
    resources[2].geometries.treeFar.computeBoundingBox();
    const farTreeBounds = resources[2].geometries.treeFar.boundingBox!;
    expect(farTreeBounds.max.z - farTreeBounds.min.z).toBeGreaterThan(0.5);
    expect(
      resources[2].geometries.treeFar.getAttribute("position").count / 3,
    ).toBeGreaterThan(20);
    resources[2].geometries.depthMasses.computeBoundingBox();
    expect(
      resources[2].geometries.depthMasses.boundingBox!.max.y,
    ).toBeGreaterThan(8);
    expect(
      resources[2].geometries.depthMasses.boundingBox!.min.y,
    ).toBeLessThanOrEqual(-0.5);
    resources[2].geometries.treeNear.computeBoundingBox();
    const foregroundTreeHeight =
      resources[2].geometries.treeNear.boundingBox!.max.y -
      resources[2].geometries.treeNear.boundingBox!.min.y;
    expect(foregroundTreeHeight).toBeGreaterThanOrEqual(5);
    expect(foregroundTreeHeight).toBeLessThanOrEqual(7);
    resources[2].geometries.stream.computeBoundingBox();
    resources[2].geometries.streamBed.computeBoundingBox();
    const waterWidth =
      resources[2].geometries.stream.boundingBox!.max.x -
      resources[2].geometries.stream.boundingBox!.min.x;
    const bedWidth =
      resources[2].geometries.streamBed.boundingBox!.max.x -
      resources[2].geometries.streamBed.boundingBox!.min.x;
    expect(bedWidth).toBeGreaterThan(waterWidth);
    resources[2].geometries.path.computeBoundingBox();
    expect(resources[2].geometries.streamBed.boundingBox!.min.y).toBeCloseTo(
      0.025,
    );
    expect(resources[2].geometries.stream.boundingBox!.min.y).toBeCloseTo(
      0.075,
    );
    expect(resources[2].geometries.path.boundingBox!.min.y).toBeCloseTo(
      0.11,
    );
    expect(
      resources[2].geometries.path.boundingBox!.max.x -
        resources[2].geometries.path.boundingBox!.min.x,
    ).toBeGreaterThan(5);
    expect(resources[2].materials.treeNear).toBeInstanceOf(
      MeshPhysicalMaterial,
    );
    expect(resources[2].materials.rock).toBeInstanceOf(MeshPhysicalMaterial);
    expect(resources[2].materials.path).toBeInstanceOf(MeshPhysicalMaterial);
    expect(resources[1].geometries.stream.index?.count).toBeLessThan(
      resources[2].geometries.stream.index?.count ?? 0,
    );
    resources.forEach((resource) => resource.dispose());
  });

  it("keeps the lantern warm pool as a bounded disposable shader resource", () => {
    const resources = createDreamEnvironmentResources(
      resolveDreamPalette(),
      "medium",
      "moonlit",
    );
    const pool = resources.materials.lanternPool;
    expect(pool.transparent).toBe(true);
    expect(pool.depthWrite).toBe(false);
    expect(pool.uniforms.poolStrength.value).toBeCloseTo(0.035);
    resources.geometries.lanternPool.computeBoundingSphere();
    expect(resources.geometries.lanternPool.boundingSphere?.radius).toBeCloseTo(
      1,
      1,
    );
    resources.dispose();
    expect(resources.disposed).toBe(true);
  });

  it("disposes owned geometries and materials once after final release", async () => {
    const resources = createDreamEnvironmentResources(
      resolveDreamPalette(),
      "medium",
      "moonlit",
    );
    const owned = [
      ...Object.values(resources.geometries),
      ...Object.values(resources.materials).filter(
        (material): material is NonNullable<typeof material> =>
          material !== null,
      ),
    ];
    const disposed = new Map(owned.map((resource) => [resource.uuid, 0]));
    owned.forEach((resource) =>
      resource.addEventListener("dispose", () => {
        disposed.set(resource.uuid, (disposed.get(resource.uuid) ?? 0) + 1);
      }),
    );

    resources.retain();
    resources.release();
    resources.retain();
    await Promise.resolve();
    expect(resources.disposed).toBe(false);

    resources.release();
    await Promise.resolve();
    expect(resources.disposed).toBe(true);
    expect([...disposed.values()].every((count) => count === 1)).toBe(true);

    resources.dispose();
    expect([...disposed.values()].every((count) => count === 1)).toBe(true);
  });

  it("disposes every remounted resource set after repeated scene transitions", async () => {
    for (let transition = 0; transition < 12; transition += 1) {
      const resources = createDreamEnvironmentResources(
        resolveDreamPalette(),
        "low",
        "ink",
      );
      const owned = [
        ...Object.values(resources.geometries),
        ...Object.values(resources.materials).filter(
          (material): material is NonNullable<typeof material> =>
            material !== null,
        ),
      ];
      const disposed = new Map(owned.map((resource) => [resource.uuid, 0]));
      owned.forEach((resource) =>
        resource.addEventListener("dispose", () => {
          disposed.set(resource.uuid, (disposed.get(resource.uuid) ?? 0) + 1);
        }),
      );

      resources.retain();
      resources.release();
      resources.retain();
      resources.release();
      await Promise.resolve();

      expect(resources.disposed).toBe(true);
      expect([...disposed.values()].every((count) => count === 1)).toBe(true);
    }
  });
});
