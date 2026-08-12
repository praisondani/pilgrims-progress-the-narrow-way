import { describe, expect, it } from "vitest";
import { BoxGeometry, MeshStandardMaterial } from "three";
import {
  deferOwnedGeometriesDisposal,
  deferOwnedResourcesDisposal,
  disposeOwnedGeometries,
  disposeOwnedResources,
  retainOwnedGeometries,
  retainOwnedResources,
} from "./resourceLifecycle";

describe("environment resource lifecycle", () => {
  it("disposes each owned geometry once even when references repeat", () => {
    const first = new BoxGeometry(1, 1, 1);
    const second = new BoxGeometry(1, 1, 1);
    const disposed = new Map([
      [first.uuid, 0],
      [second.uuid, 0],
    ]);
    first.addEventListener("dispose", () =>
      disposed.set(first.uuid, (disposed.get(first.uuid) ?? 0) + 1),
    );
    second.addEventListener("dispose", () =>
      disposed.set(second.uuid, (disposed.get(second.uuid) ?? 0) + 1),
    );

    disposeOwnedGeometries([first, first, undefined, second, null]);

    expect([...disposed.values()]).toEqual([1, 1]);
    disposeOwnedGeometries([first, second]);
    expect([...disposed.values()]).toEqual([1, 1]);
  });

  it("cancels a deferred cleanup when StrictMode remounts the geometry", async () => {
    const geometry = new BoxGeometry(1, 1, 1);
    let disposeCount = 0;
    geometry.addEventListener("dispose", () => {
      disposeCount += 1;
    });

    deferOwnedGeometriesDisposal([geometry]);
    retainOwnedGeometries([geometry]);
    await Promise.resolve();
    expect(disposeCount).toBe(0);

    deferOwnedGeometriesDisposal([geometry]);
    await Promise.resolve();
    expect(disposeCount).toBe(1);
  });

  it("applies the same deferred ownership contract to materials", async () => {
    const material = new MeshStandardMaterial();
    let disposeCount = 0;
    material.addEventListener("dispose", () => {
      disposeCount += 1;
    });

    deferOwnedResourcesDisposal([material]);
    retainOwnedResources([material]);
    await Promise.resolve();
    expect(disposeCount).toBe(0);

    deferOwnedResourcesDisposal([material]);
    await Promise.resolve();
    expect(disposeCount).toBe(1);

    disposeOwnedResources([material]);
    expect(disposeCount).toBe(1);
  });
});
