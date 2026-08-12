import { describe, expect, it } from "vitest";
import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
} from "three";
import {
  collectOwnedResources,
  deferOwnedGeometriesDisposal,
  deferOwnedResourcesDisposal,
  disposeOwnedGeometries,
  disposeOwnedResources,
  retainOwnedGeometries,
  retainOwnedResources,
} from "./resourceLifecycle";

describe("environment resource lifecycle", () => {
  it("collects each geometry and material once from a mounted scene graph", () => {
    const group = new Group();
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshStandardMaterial();
    const alternate = new MeshStandardMaterial();
    group.add(new Mesh(geometry, material));
    group.add(new Mesh(geometry, [material, alternate]));

    expect(collectOwnedResources(group)).toEqual([
      geometry,
      material,
      alternate,
    ]);
  });

  it("disposes repeated procedural region graphs after each final release", async () => {
    for (let transition = 0; transition < 12; transition += 1) {
      const group = new Group();
      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshStandardMaterial();
      group.add(new Mesh(geometry, material));
      const owned = collectOwnedResources(group);
      const disposed = new Map(owned.map((resource) => [resource.uuid, 0]));
      owned.forEach((resource) =>
        resource.addEventListener("dispose", () => {
          disposed.set(resource.uuid, (disposed.get(resource.uuid) ?? 0) + 1);
        }),
      );

      retainOwnedResources(owned);
      deferOwnedResourcesDisposal(owned);
      retainOwnedResources(owned);
      await Promise.resolve();
      expect([...disposed.values()].every((count) => count === 0)).toBe(true);

      deferOwnedResourcesDisposal(owned);
      await Promise.resolve();
      expect([...disposed.values()].every((count) => count === 1)).toBe(true);
    }
  });

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
