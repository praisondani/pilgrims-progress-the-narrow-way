import type { BufferGeometry } from "three";

const disposedGeometries = new WeakSet<BufferGeometry>();

/** Dispose only geometry owned by one environment mount, once per identity. */
export function disposeOwnedGeometries(
  geometries: Iterable<BufferGeometry | undefined | null>,
) {
  const owned = new Set<BufferGeometry>();
  for (const geometry of geometries) {
    if (geometry) owned.add(geometry);
  }
  owned.forEach((geometry) => {
    if (disposedGeometries.has(geometry)) return;
    disposedGeometries.add(geometry);
    geometry.dispose();
  });
}
