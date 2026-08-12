import { Vector2 } from "three";
import { distanceToPathCoordinates } from "./PathMaskGenerator";
import { SeededRandom } from "./SeededRandom";
import { terrainHeight, terrainSlope } from "./TerrainGenerator";
import type { ProceduralSceneDefinition, ScatterPoint, ScatterRule } from "./types";

function clearsLandmarks(
  x: number,
  z: number,
  definition: ProceduralSceneDefinition,
  kind: "vegetation" | "rocks",
) {
  return definition.landmarks.every((landmark) => {
    const excluded = kind === "vegetation" ? landmark.excludeVegetation : landmark.excludeRocks;
    return (
      !excluded ||
      Math.hypot(
        x - landmark.position[0],
        z - landmark.position[1],
      ) > landmark.radius
    );
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
    const offsetX = Math.sin(angle) * radius;
    const offsetZ = Math.cos(angle) * radius;
    const pointX = clustered ? cluster.x + offsetX : offsetX;
    const pointZ = clustered ? cluster.y + offsetZ : offsetZ;
    if (Math.hypot(pointX, pointZ) > definition.radius - 0.28) continue;
    if (
      distanceToPathCoordinates(pointX, pointZ, definition.path) <
      rule.pathClearance
    )
      continue;
    if (!clearsLandmarks(pointX, pointZ, definition, kind)) continue;
    if (terrainSlope(definition, pointX, pointZ) > rule.maxSlope) continue;
    if (
      points.some(
        (other) => Math.hypot(pointX - other.x, pointZ - other.z) < rule.minSpacing,
      )
    )
      continue;
    points.push({
      x: pointX,
      z: pointZ,
      y: terrainHeight(definition, pointX, pointZ),
      scale: random.range(rule.minScale, rule.maxScale),
      rotation: random.range(0, Math.PI * 2),
      variant: random.integer(0, 3),
    });
  }
  return points;
}
