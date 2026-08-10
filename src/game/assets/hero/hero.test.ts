import { describe, expect, it, vi } from "vitest";
import { Group, Mesh, SkinnedMesh, Vector3 } from "three";
import { createPilgrimHero } from "./createHero";
import { createDeferredHeroDisposer } from "./lifecycle";
import { createHeroRandom } from "./procedural";
import { resolveHeroSpec } from "./spec";

function authoredSurface(seed: string) {
  const runtime = createPilgrimHero({ seed });
  const body = runtime.root.getObjectByName(
    "hero.mesh.authored-body",
  ) as SkinnedMesh;
  const transforms = Array.from(
    body.geometry.attributes.position.array.slice(0, 120),
  );
  runtime.dispose();
  return transforms;
}

describe("authored Christian hero", () => {
  it("builds an adult reference-shaped, action-ready hierarchy", () => {
    const runtime = createPilgrimHero({ burden: 1 });
    const metadata = runtime.root.userData.sculptRuntime;
    const budget = runtime.root.userData.heroBudget;
    const renderMeshes: Mesh[] = [];
    const uniqueMaterials = new Set();
    runtime.root.traverse((object) => {
      if (!(object as Mesh).isMesh) return;
      const mesh = object as Mesh;
      renderMeshes.push(mesh);
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      materials.forEach((material) => uniqueMaterials.add(material));
    });

    const headUnits =
      runtime.spec.anatomy.totalHeight / runtime.spec.anatomy.headHeight;
    expect(headUnits).toBeGreaterThan(6.2);
    expect(headUnits).toBeLessThan(6.8);
    expect(runtime.pivots.leftElbow.parent).toBe(runtime.pivots.leftShoulder);
    expect(runtime.pivots.leftWrist.parent).toBe(runtime.pivots.leftElbow);
    expect(runtime.sockets.backBurden.parent).toBe(runtime.pivots.chest);
    expect(runtime.root.getObjectByName("hero.attachment.burden")?.visible)
      .toBe(true);
    const burden = runtime.root.getObjectByName(
      "hero.attachment.burden",
    ) as Group;
    expect(burden.position.y).toBeCloseTo(-0.08);
    expect(burden.position.z).toBeCloseTo(-0.04);
    expect(
      runtime.root.getObjectByName("hero.mesh.authored-burden"),
    ).toBeTruthy();
    expect(runtime.lods.size).toBe(2);
    expect(renderMeshes).toHaveLength(6);
    expect(uniqueMaterials.size).toBe(4);
    expect(budget).toMatchObject({
      drawCalls: 4,
      materials: 4,
      renderMeshes: 4,
      topology: "single-gameplay-topology",
    });
    const body = runtime.root.getObjectByName(
      "hero.mesh.authored-body",
    ) as SkinnedMesh;
    expect(body.isSkinnedMesh).toBe(true);
    expect(
      runtime.root.getObjectByName("hero.lod.authored-body")?.children,
    ).toHaveLength(2);
    expect(
      runtime.root.getObjectByName("hero.lod.authored-burden")?.children,
    ).toHaveLength(2);
    expect(body.geometry.attributes.skinIndex).toBeTruthy();
    expect(body.geometry.morphAttributes.position).toHaveLength(4);
    expect(metadata.coordinateSystem).toEqual({
      up: "+Y",
      forward: "+Z",
      origin: "foot-ground-center",
    });
    expect(() => JSON.stringify(metadata)).not.toThrow();
    runtime.dispose();
  });

  it("mirrors the current Player collider and exposes action sockets", () => {
    const runtime = createPilgrimHero();
    const controller = runtime.colliders.find(
      (collider) => collider.id === "controller",
    );

    expect(controller).toMatchObject({
      shape: "capsule",
      center: [0, 0.58, 0],
      halfHeight: 0.42,
      radius: 0.38,
      trigger: false,
    });
    expect(runtime.getSocket("rightHandAction").name).toBe(
      "hero.socket.rightHandAction",
    );
    const world = runtime.getSocketWorldPosition(
      "backBurden",
      new Vector3(),
    );
    expect(Number.isFinite(world.y)).toBe(true);
    runtime.dispose();
  });

  it("keeps the authored topology deterministic", () => {
    expect(authoredSurface("stable-seed")).toEqual(
      authoredSurface("stable-seed"),
    );

    const first = createHeroRandom("repeatable");
    const second = createHeroRandom("repeatable");
    expect([first(), first(), first()]).toEqual([
      second(),
      second(),
      second(),
    ]);
  });

  it("animates joint pivots and accessory state without touching root yaw", () => {
    const runtime = createPilgrimHero();
    runtime.root.rotation.y = 1.25;
    runtime.update(0.08, {
      walking: true,
      burden: 1,
      hasRoll: true,
      equipped: true,
    });

    expect(runtime.pivots.leftHip.rotation.x).not.toBe(0);
    expect(runtime.pivots.leftShoulder.rotation.x).not.toBe(0);
    expect(runtime.motionRoot.rotation.x).toBeGreaterThan(0);
    expect(runtime.pivots.pelvis.rotation.x).not.toBe(0);
    expect(runtime.pivots.spine.rotation.x).toBeGreaterThan(0);
    expect(runtime.pivots.leftKnee.rotation.x).toBeGreaterThan(0);
    expect(runtime.root.rotation.y).toBe(1.25);
    expect(runtime.root.getObjectByName("hero.attachment.sealed-roll")?.visible)
      .toBe(true);
    expect(runtime.root.getObjectByName("hero.equipment.authored")?.visible)
      .toBe(true);
    runtime.dispose();
  });

  it("lets loaded cloth settle a beat behind the walking stride", () => {
    const runtime = createPilgrimHero({ burden: 1 });
    const burden = runtime.root.getObjectByName(
      "hero.attachment.burden",
    ) as Group;
    const initialScale = burden.scale.clone();
    for (let index = 0; index < 18; index += 1)
      runtime.update(0.05, { burden: 1, walking: true });

    expect(burden.scale.x).not.toBeCloseTo(initialScale.x, 4);
    expect(burden.position.y).toBeGreaterThanOrEqual(-0.1);
    expect(burden.rotation.x).toBeLessThan(-0.08);
    runtime.dispose();
  });

  it("keeps v38 burden depth compressed and cinched behind the scapulae", () => {
    const runtime = createPilgrimHero({ burden: 1 });
    const burden = runtime.root.getObjectByName(
      "hero.mesh.authored-burden",
    ) as Mesh;
    burden.geometry.computeBoundingBox();
    const bounds = burden.geometry.boundingBox;
    expect(bounds).toBeTruthy();
    const size = bounds!.getSize(new Vector3());

    // Profile depth is intentionally smaller than the shoulder-spanning X
    // width. The top tie extends beyond the loft crown and proves the load is
    // gathered cloth, not a smooth capsule.
    // V38 preserves the stuffed cloth silhouette while keeping profile depth
    // materially smaller than its shoulder-spanning width.
    expect(size.z).toBeLessThan(0.43);
    expect(size.x).toBeGreaterThan(size.z * 1.45);
    expect(bounds!.max.y).toBeGreaterThan(0.47);
    runtime.dispose();
  });

  it("splits a planted loaded posture across root, pelvis, and spine", () => {
    const runtime = createPilgrimHero({ burden: 1 });
    for (let index = 0; index < 30; index += 1)
      runtime.update(0.05, { burden: 1, walking: false });

    const loadedLean =
      runtime.motionRoot.rotation.x +
      runtime.pivots.pelvis.rotation.x +
      runtime.pivots.spine.rotation.x;
    expect(loadedLean).toBeGreaterThan(0.15);
    expect(loadedLean).toBeLessThan(0.18);
    expect(runtime.pivots.leftKnee.rotation.x).toBeGreaterThan(0.095);
    expect(runtime.pivots.leftAnkle.rotation.x).toBeLessThan(-0.05);
    runtime.dispose();
  });

  it("drives facial controls through presets", () => {
    const runtime = createPilgrimHero({ expression: "concerned" });
    const body = runtime.root.getObjectByName(
      "hero.mesh.authored-body",
    ) as SkinnedMesh;
    const before = body.morphTargetInfluences?.[0] ?? 0;
    runtime.setExpression("hopeful");
    runtime.expressions.update(1);

    expect(runtime.expressions.values.smile).toBeGreaterThan(0.45);
    expect(body.morphTargetInfluences?.[0]).toBeGreaterThan(before);
    runtime.dispose();
  });

  it("disposes owned GPU resources once and detaches the root", () => {
    const runtime = createPilgrimHero();
    const parent = new Group();
    parent.add(runtime.root);
    const firstMesh = runtime.root.getObjectByProperty(
      "type",
      "Mesh",
    ) as Mesh;
    const geometryDisposed = vi.fn();
    const materialDisposed = vi.fn();
    firstMesh.geometry.addEventListener("dispose", geometryDisposed);
    const firstMaterial = Array.isArray(firstMesh.material)
      ? firstMesh.material[0]
      : firstMesh.material;
    firstMaterial.addEventListener("dispose", materialDisposed);

    runtime.dispose();
    runtime.dispose();

    expect(runtime.disposed).toBe(true);
    expect(runtime.root.parent).toBeNull();
    expect(runtime.root.children).toHaveLength(0);
    expect(geometryDisposed).toHaveBeenCalledTimes(1);
    expect(materialDisposed).toHaveBeenCalledTimes(1);
  });
});

describe("hero sculpt spec validation", () => {
  it("rejects structurally impossible proportions and invalid LOD order", () => {
    expect(() =>
      resolveHeroSpec({ anatomy: { shoulderWidth: 0.2, hipWidth: 0.4 } }),
    ).toThrow("shoulderWidth must exceed hipWidth");
    expect(() =>
      resolveHeroSpec({
        lod: { highDistance: 0, mediumDistance: 12, lowDistance: 8 },
      }),
    ).toThrow("LOD distances must be ascending");
  });
});

describe("StrictMode-safe hero lifecycle", () => {
  it("cancels replay disposal but releases a true unmount", () => {
    const scheduled: (() => void)[] = [];
    const dispose = vi.fn();
    const resource = {
      disposed: false,
      dispose,
    };
    const lifecycle = createDeferredHeroDisposer((callback) => {
      scheduled.push(callback);
    });

    const firstReplayRelease = lifecycle.retain(resource);
    firstReplayRelease();
    const secondReplayRelease = lifecycle.retain(resource);
    scheduled.splice(0).forEach((callback) => callback());
    expect(dispose).not.toHaveBeenCalled();

    secondReplayRelease();
    scheduled.splice(0).forEach((callback) => callback());
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it("disposes a replaced runtime independently", () => {
    const scheduled: (() => void)[] = [];
    const oldRuntime = { disposed: false, dispose: vi.fn() };
    const newRuntime = { disposed: false, dispose: vi.fn() };
    const lifecycle = createDeferredHeroDisposer((callback) => {
      scheduled.push(callback);
    });

    const releaseOld = lifecycle.retain(oldRuntime);
    lifecycle.retain(newRuntime);
    releaseOld();
    scheduled.splice(0).forEach((callback) => callback());

    expect(oldRuntime.dispose).toHaveBeenCalledTimes(1);
    expect(newRuntime.dispose).not.toHaveBeenCalled();
  });
});
