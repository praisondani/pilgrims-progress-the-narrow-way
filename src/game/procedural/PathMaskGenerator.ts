import { Vector2 } from "three";

export function distanceToPath(point: Vector2, path: Vector2[]) {
  let nearest = Number.POSITIVE_INFINITY;
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
    const segment = end.clone().sub(start);
    const lengthSquared = segment.lengthSq();
    const amount = lengthSquared
      ? Math.max(0, Math.min(1, point.clone().sub(start).dot(segment) / lengthSquared))
      : 0;
    const projection = start.clone().add(segment.multiplyScalar(amount));
    nearest = Math.min(nearest, point.distanceTo(projection));
  }
  return nearest;
}
