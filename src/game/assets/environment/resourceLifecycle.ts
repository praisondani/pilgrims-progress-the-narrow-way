import type { BufferGeometry, Material, Object3D } from "three";

export type OwnedResource = BufferGeometry | Material;
type DisposalToken = { cancelled: boolean };
const disposedResources = new WeakSet<OwnedResource>();
const pendingDisposals = new WeakMap<OwnedResource, DisposalToken>();

function uniqueResources(
  resources: Iterable<OwnedResource | undefined | null>,
) {
  const owned = new Set<OwnedResource>();
  for (const resource of resources) {
    if (resource) owned.add(resource);
  }
  return owned;
}

/**
 * Collect the geometry/material resources owned by an environment subtree.
 * Scene kits intentionally opt out of renderer auto-disposal and hand this
 * deduplicated list to the retain/defer lifecycle below. Shared resources are
 * returned once even when several meshes reference the same identity.
 */
export function collectOwnedResources(
  root: Object3D,
  excluded: Iterable<OwnedResource> = [],
): OwnedResource[] {
  const excludedResources = new Set(excluded);
  const resources: OwnedResource[] = [];
  root.traverse((object) => {
    const candidate = object as Object3D & {
      geometry?: BufferGeometry;
      material?: Material | Material[];
    };
    if (candidate.geometry) resources.push(candidate.geometry);
    if (!candidate.material) return;
    if (Array.isArray(candidate.material)) resources.push(...candidate.material);
    else resources.push(candidate.material);
  });
  return [...uniqueResources(resources)].filter(
    (resource) => !excludedResources.has(resource),
  );
}

/**
 * Cancel a disposal queued by a previous effect cleanup. React StrictMode
 * remounts effects synchronously; retaining before the microtask runs keeps
 * memoized geometry alive for that second mount.
 */
export function retainOwnedResources(
  resources: Iterable<OwnedResource | undefined | null>,
) {
  uniqueResources(resources).forEach((resource) => {
    const token = pendingDisposals.get(resource);
    if (!token) return;
    token.cancelled = true;
    pendingDisposals.delete(resource);
  });
}

/**
 * Defer owned geometry disposal by one microtask. A real unmount has no
 * subsequent retain call and therefore still disposes promptly; a StrictMode
 * cleanup/remount pair cancels the pending token before it can fire.
 */
export function deferOwnedResourcesDisposal(
  resources: Iterable<OwnedResource | undefined | null>,
) {
  uniqueResources(resources).forEach((resource) => {
    const token: DisposalToken = { cancelled: false };
    pendingDisposals.set(resource, token);
    queueMicrotask(() => {
      if (token.cancelled || pendingDisposals.get(resource) !== token) return;
      pendingDisposals.delete(resource);
      disposeOwnedResources([resource]);
    });
  });
}

/** Dispose resources owned by one environment mount, once per identity. */
export function disposeOwnedResources(
  resources: Iterable<OwnedResource | undefined | null>,
) {
  const owned = uniqueResources(resources);
  owned.forEach((resource) => {
    const token = pendingDisposals.get(resource);
    if (token) {
      token.cancelled = true;
      pendingDisposals.delete(resource);
    }
    if (disposedResources.has(resource)) return;
    disposedResources.add(resource);
    resource.dispose();
  });
}

/** Geometry-only aliases keep the environment kits' ownership contracts clear. */
export function retainOwnedGeometries(
  geometries: Iterable<BufferGeometry | undefined | null>,
) {
  retainOwnedResources(geometries);
}

export function deferOwnedGeometriesDisposal(
  geometries: Iterable<BufferGeometry | undefined | null>,
) {
  deferOwnedResourcesDisposal(geometries);
}

export function disposeOwnedGeometries(
  geometries: Iterable<BufferGeometry | undefined | null>,
) {
  disposeOwnedResources(geometries);
}
