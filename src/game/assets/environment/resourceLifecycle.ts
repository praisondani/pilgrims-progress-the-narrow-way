import type { BufferGeometry } from "three";

/** Dispose only geometry owned by one environment mount, once per identity. */
export function disposeOwnedGeometries(
  geometries: Iterable<BufferGeometry | undefined | null>,
) {
  const owned = new Set<BufferGeometry>();
  for (const geometry of geometries) {
    if (geometry) owned.add(geometry);
  }
  owned.forEach((geometry) => geometry.dispose());
}
