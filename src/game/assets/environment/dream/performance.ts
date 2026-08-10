import type { DreamEnvironmentResources } from "./resources";
import { geometryTriangleCount } from "./resources";
import type {
  DreamComposition,
  DreamLodLevel,
  DreamPerformanceEstimate,
  DreamPerformanceLimit,
  DreamQualityPreset,
} from "./types";

export const DREAM_PERFORMANCE_BUDGET: Readonly<
  Record<DreamQualityPreset, DreamPerformanceLimit>
> = {
  low: {
    maxInstances: 54,
    maxVisibleDrawCalls: 13,
    maxTriangles: 2_600,
    maxPointLights: 1,
    maxTextures: 0,
  },
  medium: {
    maxInstances: 96,
    maxVisibleDrawCalls: 15,
    // The grounded reverse-orbit mound pass adds a small authored silhouette
    // cost while remaining well below the runtime mobile benchmark.
    maxTriangles: 6_500,
    maxPointLights: 1,
    maxTextures: 0,
  },
  high: {
    maxInstances: 120,
    maxVisibleDrawCalls: 15,
    maxTriangles: 8_000,
    maxPointLights: 1,
    maxTextures: 0,
  },
} as const;

export const DREAM_LOD_THRESHOLDS: Readonly<
  Record<
    DreamQualityPreset,
    { enterNear: number; exitNear: number }
  >
> = {
  low: { enterNear: 0, exitNear: 0 },
  medium: { enterNear: 13.5, exitNear: 15.5 },
  high: { enterNear: 17, exitNear: 19 },
};

export function selectDreamLod(
  distanceToSceneCenter: number,
  quality: DreamQualityPreset,
  previous: DreamLodLevel = "far",
): DreamLodLevel {
  if (quality === "low") return "far";
  const threshold = DREAM_LOD_THRESHOLDS[quality];
  if (previous === "near")
    return distanceToSceneCenter > threshold.exitNear ? "far" : "near";
  return distanceToSceneCenter < threshold.enterNear ? "near" : "far";
}

const visibleKinds: Record<
  DreamLodLevel,
  readonly (keyof DreamComposition["batches"])[]
> = {
  near: [
    "tree",
    "shrub",
    "grass",
    "rock",
    "reed",
  ],
  far: ["tree", "shrub", "rock"],
};

export function estimateDreamPerformance(
  composition: DreamComposition,
  resources: DreamEnvironmentResources,
  lod: DreamLodLevel,
  lanternLit = true,
): DreamPerformanceEstimate {
  const treeGeometry =
    lod === "near"
      ? resources.geometries.treeNear
      : resources.geometries.treeFar;
  const geometryByKind = {
    tree: treeGeometry,
    shrub:
      lod === "near"
        ? resources.geometries.shrub
        : resources.geometries.shrubFar,
    grass: resources.geometries.grass,
    rock: resources.geometries.rock,
    reed: resources.geometries.reed,
    groundPatch: resources.geometries.groundPatch,
    ridge: resources.geometries.ridge,
  };
  let visibleDrawCalls = 0;
  let triangles = 0;
  let instanceCount = 5;
  for (const kind of visibleKinds[lod]) {
    const count = composition.batches[kind].length;
    if (count === 0) continue;
    visibleDrawCalls += 1;
    instanceCount += count;
    triangles += count * geometryTriangleCount(geometryByKind[kind]);
  }

  if (resources.materials.stream) {
    visibleDrawCalls += 1;
    triangles += geometryTriangleCount(resources.geometries.stream);
  }

  visibleDrawCalls += 4;
  triangles +=
    geometryTriangleCount(resources.geometries.path) +
    geometryTriangleCount(resources.geometries.streamBed) +
    geometryTriangleCount(resources.geometries.depthMasses) +
    geometryTriangleCount(resources.geometries.moon);

  visibleDrawCalls += 4;
  triangles +=
    5 * geometryTriangleCount(resources.geometries.lanternBaseRock) +
    geometryTriangleCount(resources.geometries.lanternFrame) +
    geometryTriangleCount(resources.geometries.lanternGlass) +
    geometryTriangleCount(resources.geometries.lanternFlame);

  return {
    quality: composition.quality,
    lod,
    instanceCount,
    visibleDrawCalls,
    triangles: Math.ceil(triangles),
    // The unlit lantern keeps a small warm guide light so the first objective
    // remains legible from every orbit; the same single light is reused when
    // the flame is kindled.
    pointLights: 1,
    textures: 0,
  };
}

export function dreamPerformanceViolations(
  estimate: DreamPerformanceEstimate,
  limit = DREAM_PERFORMANCE_BUDGET[estimate.quality],
) {
  const violations: string[] = [];
  if (estimate.instanceCount > limit.maxInstances)
    violations.push(
      `instances ${estimate.instanceCount} > ${limit.maxInstances}`,
    );
  if (estimate.visibleDrawCalls > limit.maxVisibleDrawCalls)
    violations.push(
      `draw calls ${estimate.visibleDrawCalls} > ${limit.maxVisibleDrawCalls}`,
    );
  if (estimate.triangles > limit.maxTriangles)
    violations.push(`triangles ${estimate.triangles} > ${limit.maxTriangles}`);
  if (estimate.pointLights > limit.maxPointLights)
    violations.push(
      `point lights ${estimate.pointLights} > ${limit.maxPointLights}`,
    );
  if (estimate.textures > limit.maxTextures)
    violations.push(`textures ${estimate.textures} > ${limit.maxTextures}`);
  return violations;
}
