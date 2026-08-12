import type { BufferGeometry } from "three";

const disposedGeometries = new WeakSet<BufferGeometry>();
type DisposalToken = { cancelled: boolean };
const pendingDisposals = new WeakMap<BufferGeometry, DisposalToken>();

function uniqueGeometries(
  geometries: Iterable<BufferGeometry | undefined | null>,
) {
  const owned = new Set<BufferGeometry>();
  for (const geometry of geometries) {
    if (geometry) owned.add(geometry);
  }
  return owned;
}

/**
 * Cancel a disposal queued by a previous effect cleanup. React StrictMode
 * remounts effects synchronously; retaining before the microtask runs keeps
 * memoized geometry alive for that second mount.
 */
export function retainOwnedGeometries(
  geometries: Iterable<BufferGeometry | undefined | null>,
) {
  uniqueGeometries(geometries).forEach((geometry) => {
    const token = pendingDisposals.get(geometry);
    if (!token) return;
    token.cancelled = true;
    pendingDisposals.delete(geometry);
  });
}

/**
 * Defer owned geometry disposal by one microtask. A real unmount has no
 * subsequent retain call and therefore still disposes promptly; a StrictMode
 * cleanup/remount pair cancels the pending token before it can fire.
 */
export function deferOwnedGeometriesDisposal(
  geometries: Iterable<BufferGeometry | undefined | null>,
) {
  uniqueGeometries(geometries).forEach((geometry) => {
    const token: DisposalToken = { cancelled: false };
    pendingDisposals.set(geometry, token);
    queueMicrotask(() => {
      if (token.cancelled || pendingDisposals.get(geometry) !== token) return;
      pendingDisposals.delete(geometry);
      disposeOwnedGeometries([geometry]);
    });
  });
}

/** Dispose only geometry owned by one environment mount, once per identity. */
export function disposeOwnedGeometries(
  geometries: Iterable<BufferGeometry | undefined | null>,
) {
  const owned = uniqueGeometries(geometries);
  owned.forEach((geometry) => {
    const token = pendingDisposals.get(geometry);
    if (token) {
      token.cancelled = true;
      pendingDisposals.delete(geometry);
    }
    if (disposedGeometries.has(geometry)) return;
    disposedGeometries.add(geometry);
    geometry.dispose();
  });
}
