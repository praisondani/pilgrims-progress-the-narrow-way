import { describe, expect, it, vi } from "vitest";
import {
  auditDreamCompositionViews,
  buildDreamComposition,
  buildDreamTerrainCollisionDescriptors,
  distanceToDreamClearing,
  distanceToDreamPath,
  isInsideDreamApproachCone,
  shouldSuppressDreamGenericBeacon,
  DREAM_APPROACH_CONE_HALF_ANGLE,
  DREAM_ARRIVAL_CLEARANCE_RADIUS,
  DREAM_COMPOSITION_ANCHORS,
  DREAM_INITIAL_CAMERA_POSITION,
  DREAM_KEYFRAME_ANCHORS,
  DREAM_GUIDANCE_CUE_POLICY,
  DREAM_DEN_EXIT_WAYPOINT,
  DREAM_LANTERN_COMPOSITION_THIRD,
  DREAM_NORTH_GROVE_WAYPOINT,
  DREAM_PATH_CONTROL_POINTS,
  DREAM_PLAYER_SPAWN,
  DREAM_PORTRAIT_CORRIDOR_POINTS,
  DREAM_PORTRAIT_CORRIDOR_RADIUS,
  DREAM_SCENE_SEED,
  DREAM_STEPPING_STONES,
  DREAM_STORY_CLEARINGS,
  DREAM_TERRAIN_COLLISION_DESCRIPTORS,
  dreamGuidedWaypoint,
} from "./composition";

describe("Dream authored composition", () => {
  it("uses fixed slots with deterministic micro-variation", () => {
    const random = vi
      .spyOn(Math, "random")
      .mockImplementation(() => {
        throw new Error("Dream composition must not use Math.random()");
      });
    const first = buildDreamComposition(DREAM_SCENE_SEED, "high");
    const second = buildDreamComposition(DREAM_SCENE_SEED, "high");
    expect(second).toEqual(first);
    expect(() => buildDreamComposition("alternate-review-seed", "high")).not.toThrow();
    expect(random).not.toHaveBeenCalled();
    random.mockRestore();
  });

  it("changes only micro-variation when seed changes", () => {
    const first = buildDreamComposition("dream-seed-a", "high");
    const second = buildDreamComposition("dream-seed-b", "high");
    expect(second.instances.map(({ id, anchorId, kind, priority }) => ({
      id,
      anchorId,
      kind,
      priority,
    }))).toEqual(
      first.instances.map(({ id, anchorId, kind, priority }) => ({
        id,
        anchorId,
        kind,
        priority,
      })),
    );
    expect(second.instances.map((instance) => instance.position)).not.toEqual(
      first.instances.map((instance) => instance.position),
    );
  });

  it("preserves every core slot when quality drops", () => {
    const high = buildDreamComposition(DREAM_SCENE_SEED, "high");
    const medium = buildDreamComposition(DREAM_SCENE_SEED, "medium");
    const low = buildDreamComposition(DREAM_SCENE_SEED, "low");
    const highById = new Map(high.instances.map((instance) => [instance.id, instance]));
    for (const instance of [...medium.instances, ...low.instances])
      expect(instance).toEqual(highById.get(instance.id));
    expect(low.instances.every((instance) => instance.priority === 0)).toBe(true);
    expect(
      medium.instances.every((instance) => instance.priority <= 1),
    ).toBe(true);
    expect(low.instances.length).toBeLessThan(medium.instances.length);
    expect(medium.instances.length).toBeLessThan(high.instances.length);
  });

  it("keeps blocking silhouettes outside all story clearings", () => {
    const blocking = new Set(["tree", "shrub", "rock", "ridge"]);
    for (const seed of [
      DREAM_SCENE_SEED,
      "dream-mobile-review",
      "dream-camera-review",
      "dream-lifecycle-review",
    ]) {
      const composition = buildDreamComposition(seed, "high");
      for (const instance of composition.instances) {
        if (!blocking.has(instance.kind)) continue;
        for (const clearing of DREAM_STORY_CLEARINGS)
          expect(
            distanceToDreamClearing(
              [instance.position[0], instance.position[2]],
              clearing,
            ),
            `${instance.id} entered ${clearing.id}`,
          ).toBeGreaterThan(clearing.radius);
      }
    }
  });

  it("keeps a three-metre arrival bubble clear around Christian", () => {
    const blocking = new Set(["tree", "shrub", "rock", "ridge"]);
    for (const seed of [
      DREAM_SCENE_SEED,
      "dream-mobile-review",
      "dream-camera-review",
      "dream-lifecycle-review",
    ]) {
      const composition = buildDreamComposition(seed, "high");
      for (const instance of composition.instances) {
        if (!blocking.has(instance.kind)) continue;
        expect(
          Math.hypot(
            instance.position[0] - DREAM_PLAYER_SPAWN[0],
            instance.position[2] - DREAM_PLAYER_SPAWN[1],
          ),
          `${instance.id} occluded the arrival`,
        ).toBeGreaterThan(DREAM_ARRIVAL_CLEARANCE_RADIUS);
      }
    }
  });

  it("reserves a 24-degree approach cone and portrait-safe path corridor", () => {
    const composition = buildDreamComposition(DREAM_SCENE_SEED, "high");
    const tall = composition.instances.filter(
      (instance) => instance.kind === "tree" || instance.kind === "shrub",
    );
    expect(DREAM_APPROACH_CONE_HALF_ANGLE * 2).toBe(24);
    for (const instance of tall) {
      const point = [instance.position[0], instance.position[2]] as const;
      expect(
        isInsideDreamApproachCone(point),
        `${instance.id} entered approach cone`,
      ).toBe(false);
      expect(
        distanceToDreamPath(point, DREAM_PORTRAIT_CORRIDOR_POINTS),
        `${instance.id} entered portrait corridor`,
      ).toBeGreaterThan(DREAM_PORTRAIT_CORRIDOR_RADIUS);
    }
    expect(DREAM_PORTRAIT_CORRIDOR_POINTS.at(-1)).toEqual(
      DREAM_KEYFRAME_ANCHORS.lanternShrine,
    );
  });

  it("frames each story focal point from its intended third-person heading", () => {
    const audits = auditDreamCompositionViews();
    expect(audits).toHaveLength(5);
    expect(audits.every((audit) => audit.passed)).toBe(true);
    expect(DREAM_INITIAL_CAMERA_POSITION).toEqual([0, 7.95, 18.5]);
    expect(new Set(DREAM_COMPOSITION_ANCHORS.map((anchor) => anchor.role))).toEqual(
      new Set([
        "frame-west",
        "frame-south",
        "frame-east",
        "frame-north",
        "stream-crossing",
        "stream-bank-west",
        "stream-bank-east",
        "moss-arch",
        "lantern",
        "den",
        "book",
        "threshold",
      ]),
    );
  });

  it("keeps keyframe path, stream crossing, shrine, and arch authored", () => {
    expect(DREAM_PATH_CONTROL_POINTS[0]).toEqual(DREAM_PLAYER_SPAWN);
    expect(DREAM_PATH_CONTROL_POINTS).toContainEqual(
      DREAM_KEYFRAME_ANCHORS.lanternShrine,
    );
    expect(DREAM_PATH_CONTROL_POINTS.at(-1)).toEqual(
      DREAM_KEYFRAME_ANCHORS.denRidge,
    );
    expect(DREAM_STEPPING_STONES).toHaveLength(5);
    expect(
      DREAM_STEPPING_STONES.every(
        (stone, index) =>
          index === 0 ||
          (stone[0] > DREAM_STEPPING_STONES[index - 1][0] &&
            stone[1] < DREAM_STEPPING_STONES[index - 1][1]),
      ),
    ).toBe(true);
    expect(DREAM_KEYFRAME_ANCHORS.mossArch).toEqual([-4, -4.4]);
  });

  it("guides Dream travel through the authored route", () => {
    expect(
      dreamGuidedWaypoint(DREAM_PLAYER_SPAWN, DREAM_KEYFRAME_ANCHORS.lanternShrine),
    ).toEqual(DREAM_PATH_CONTROL_POINTS[1]);
    expect(
      dreamGuidedWaypoint(DREAM_PATH_CONTROL_POINTS[5], DREAM_KEYFRAME_ANCHORS.lanternShrine),
    ).toEqual(DREAM_KEYFRAME_ANCHORS.lanternShrine);
    expect(
      dreamGuidedWaypoint(DREAM_KEYFRAME_ANCHORS.lanternShrine, DREAM_KEYFRAME_ANCHORS.lanternShrine),
    ).toEqual(DREAM_KEYFRAME_ANCHORS.lanternShrine);
    expect(
      dreamGuidedWaypoint(DREAM_PLAYER_SPAWN, DREAM_KEYFRAME_ANCHORS.thresholdLight),
    ).toEqual(DREAM_NORTH_GROVE_WAYPOINT);
    expect(
      dreamGuidedWaypoint(DREAM_NORTH_GROVE_WAYPOINT, DREAM_KEYFRAME_ANCHORS.thresholdLight),
    ).toEqual(DREAM_KEYFRAME_ANCHORS.thresholdLight);
    expect(
      dreamGuidedWaypoint(DREAM_KEYFRAME_ANCHORS.lanternShrine, DREAM_KEYFRAME_ANCHORS.denRidge),
    ).toEqual(DREAM_DEN_EXIT_WAYPOINT);
  });

  it("exports collision-ready vertical terrain for the 12m lantern corridor", () => {
    const descriptors = buildDreamTerrainCollisionDescriptors();
    const ribbons = DREAM_TERRAIN_COLLISION_DESCRIPTORS.filter(
      (descriptor) => descriptor.shape === "ribbon",
    );
    const stream = ribbons.find(
      (descriptor) => descriptor.role === "stream-bed",
    )!;
    const banks = ribbons.filter(
      (descriptor) =>
        descriptor.role === "bank-west" ||
        descriptor.role === "bank-east",
    );
    const trunks = descriptors.filter(
      (descriptor) => descriptor.role === "foreground-trunk",
    );
    const arch = descriptors.filter(
      (descriptor) => descriptor.role === "ruin-arch",
    );
    const ridges = descriptors.filter(
      (descriptor) => descriptor.role === "distant-ridge",
    );
    expect(
      Math.hypot(
        DREAM_PLAYER_SPAWN[0] - DREAM_KEYFRAME_ANCHORS.lanternShrine[0],
        DREAM_PLAYER_SPAWN[1] - DREAM_KEYFRAME_ANCHORS.lanternShrine[1],
      ),
    ).toBeGreaterThanOrEqual(11);
    expect(stream.elevation[0]).toBeLessThanOrEqual(-0.6);
    expect(stream.elevation[1]).toBeGreaterThanOrEqual(-0.6);
    expect(banks).toHaveLength(2);
    expect(
      banks.every(
        (bank) =>
          bank.elevation[0] >= 0.5 &&
          bank.elevation[1] <= 1 &&
          bank.gaps?.some(
            (gap) =>
              gap.center === DREAM_KEYFRAME_ANCHORS.streamCrossing &&
              gap.radius >= DREAM_PORTRAIT_CORRIDOR_RADIUS,
          ) &&
          bank.gaps?.some(
            (gap) =>
              gap.center === DREAM_NORTH_GROVE_WAYPOINT &&
              gap.radius >= 1.8,
          ),
      ),
    ).toBe(true);
    expect(trunks.length).toBeGreaterThanOrEqual(4);
    expect(
      trunks.every(
        (trunk) =>
          trunk.shape === "capsule" &&
          trunk.halfExtents[1] * 2 >= 5 &&
          trunk.halfExtents[1] * 2 <= 7,
      ),
    ).toBe(true);
    expect(
      arch.every(
        (pier) =>
          pier.shape === "box" && pier.halfExtents[1] * 2 === 3,
      ),
    ).toBe(true);
    expect(
      ridges.every(
        (ridge) =>
          ridge.shape === "box" &&
          ridge.halfExtents[1] * 2 >= 8 &&
          ridge.halfExtents[1] * 2 <= 12,
      ),
    ).toBe(true);
  });

  it("places the lantern on the left third and gates the generic beacon", () => {
    expect(DREAM_LANTERN_COMPOSITION_THIRD.horizontal).toBe("left");
    expect(DREAM_LANTERN_COMPOSITION_THIRD.normalizedX).toBeCloseTo(1 / 3);
    expect(DREAM_GUIDANCE_CUE_POLICY.target).toEqual(
      DREAM_KEYFRAME_ANCHORS.lanternShrine,
    );
    expect(shouldSuppressDreamGenericBeacon(DREAM_PLAYER_SPAWN)).toBe(true);
    expect(shouldSuppressDreamGenericBeacon([12, 12])).toBe(false);
  });
});
