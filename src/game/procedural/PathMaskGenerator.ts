import { Vector2 } from "three";

/**
 * Measure the shortest distance from a scalar x/z position to the authored
 * path without allocating projection vectors. Terrain generation and scatter
 * placement call this thousands of times during a scene build, so keeping
 * the calculation scalar avoids a burst of short-lived Three.js objects on
 * low-end devices while retaining the same geometric result.
 */
export function distanceToPathCoordinates(
  x: number,
  z: number,
  path: readonly Vector2[],
) {
  let nearest = Number.POSITIVE_INFINITY;
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
    const segmentX = end.x - start.x;
    const segmentZ = end.y - start.y;
    const lengthSquared = segmentX * segmentX + segmentZ * segmentZ;
    const amount = lengthSquared
      ? Math.max(
          0,
          Math.min(
            1,
            ((x - start.x) * segmentX + (z - start.y) * segmentZ) /
              lengthSquared,
          ),
        )
      : 0;
    const projectionX = start.x + segmentX * amount;
    const projectionZ = start.y + segmentZ * amount;
    nearest = Math.min(nearest, Math.hypot(x - projectionX, z - projectionZ));
  }
  return nearest;
}

export function distanceToPath(point: Vector2, path: readonly Vector2[]) {
  return distanceToPathCoordinates(point.x, point.y, path);
}
