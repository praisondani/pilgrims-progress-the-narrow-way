import { Vector2 } from "three";
import { distanceToPath } from "./PathMaskGenerator";
import { SeededRandom } from "./SeededRandom";
import { terrainHeight } from "./TerrainGenerator";
import type { ProceduralSceneDefinition, ScatterPoint, ScatterRule } from "./types";

function clearsLandmarks(
  point: Vector2,
  definition: ProceduralSceneDefinition,
  kind: "vegetation" | "rocks",
) {
  return definition.landmarks.every((landmark) => {
    const excluded = kind === "vegetation" ? landmark.excludeVegetation : landmark.excludeRocks;
    return !excluded || point.distanceTo(new Vector2(...landmark.position)) > landmark.radius;
  });
}

export function scatterPoints(
  definition: ProceduralSceneDefinition,
  rule: ScatterRule,
  label: string,
  kind: "vegetation" | "rocks" = "vegetation",
) {
  const random = new SeededRandom(`${definition.seed}:${label}`);
  const points: ScatterPoint[] = [];
  const attempts = rule.count * 36;
  const clusters = Array.from({ length: Math.max(2, Math.round(rule.count / 9)) }, () => {
    const angle = random.range(0, Math.PI * 2);
    const radius = Math.sqrt(random.next()) * (definition.radius - 1);
    return new Vector2(Math.sin(angle) * radius, Math.cos(angle) * radius);
  });
  for (let attempt = 0; attempt < attempts && points.length < rule.count; attempt += 1) {
    const cluster = clusters[random.integer(0, clusters.length - 1)];
    const clustered = random.next() < rule.cluster;
    const angle = random.range(0, Math.PI * 2);
    const radius = clustered
      ? Math.sqrt(random.next()) * 2.4
      : Math.sqrt(random.next()) * (definition.radius - 0.35);
    const point = clustered
      ? cluster.clone().add(new Vector2(Math.sin(angle) * radius, Math.cos(angle) * radius))
      : new Vector2(Math.sin(angle) * radius, Math.cos(angle) * radius);
    if (point.length() > definition.radius - 0.28) continue;
    if (distanceToPath(point, definition.path) < rule.pathClearance) continue;
    if (!clearsLandmarks(point, definition, kind)) continue;
    if (points.some((other) => Math.hypot(point.x - other.x, point.y - other.z) < rule.minSpacing))
      continue;
    points.push({
      x: point.x,
      z: point.y,
      y: terrainHeight(definition, point.x, point.y),
      scale: random.range(rule.minScale, rule.maxScale),
      rotation: random.range(0, Math.PI * 2),
      variant: random.integer(0, 3),
    });
  }
  return points;
}
