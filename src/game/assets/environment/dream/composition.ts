import { DreamSeededRandom } from "./seed";
import type {
  DreamAuthoredSlot,
  DreamComposition,
  DreamCompositionAnchor,
  DreamCompositionView,
  DreamDressingInstance,
  DreamDressingKind,
  DreamInstanceBatches,
  DreamGuidanceCuePolicy,
  DreamLandmarkClearance,
  DreamPoint2,
  DreamQualityPreset,
  DreamTerrainCollisionDescriptor,
  DreamViewAudit,
} from "./types";

export const DREAM_SCENE_SEED = "dream-v2-bunyan-wilderness";

export const DREAM_STORY_CLEARINGS: readonly DreamLandmarkClearance[] = [
  { id: "lantern", position: [-4, -4], radius: 2.35 },
  { id: "den", position: [5, -5], radius: 2.35 },
  { id: "dream-book", position: [-4, 5], radius: 2.35 },
  { id: "become-christian", position: [4, 5], radius: 2.35 },
];

export const DREAM_PLAYER_SPAWN: DreamPoint2 = [0, 7];

export const DREAM_ARRIVAL_CLEARANCE_RADIUS = 3;

export const DREAM_INITIAL_CAMERA_POSITION = [0, 7.95, 18.5] as const;

export const DREAM_APPROACH_CONE_HALF_ANGLE = 12;

export const DREAM_PORTRAIT_CORRIDOR_RADIUS = 1.15;

export const DREAM_STREAM_CONTROL_POINTS: readonly DreamPoint2[] = [
  [-1.15, -10.4],
  [-0.45, -7.2],
  [0.65, -4.1],
  [-0.25, -0.8],
  [0.75, 2.3],
  [2.7, 4.7],
  [3.6, 7.7],
];

export const DREAM_PATH_CONTROL_POINTS: readonly DreamPoint2[] = [
  [0, 7],
  [-0.8, 6.2],
  [-2.65, 4.9],
  [-1.25, 2.75],
  [0.15, 0.25],
  [-2.05, -1.8],
  [-4, -4],
  [-1.3, -5.15],
  [2.25, -5.4],
  [5, -5],
];

export const DREAM_PORTRAIT_CORRIDOR_POINTS: readonly DreamPoint2[] =
  DREAM_PATH_CONTROL_POINTS.slice(0, 7);

export const DREAM_KEYFRAME_ANCHORS = {
  arrival: DREAM_PLAYER_SPAWN,
  streamCrossing: [0.1, 0.1],
  lanternShrine: [-4, -4],
  mossArch: [-4, -4.4],
  denRidge: [5, -5],
  bookGrove: [-4, 5],
  thresholdLight: [4, 5],
} as const satisfies Record<string, DreamPoint2>;

/** A short upper-clearing branch keeps the final Dream beat out of the stream. */
export const DREAM_NORTH_GROVE_WAYPOINT: DreamPoint2 = [1.55, 6.1];

/**
 * The moss arch frames the lantern clearing, so the shelter route first steps
 * out of the shrine's interaction radius, then drops below its east pier
 * before turning toward the den.  Without these authored bends, a direct
 * diagonal gets caught on the shrine or pier collision boxes.
 */
export const DREAM_DEN_EXIT_WAYPOINT: DreamPoint2 = [-1.8, -2.6];
export const DREAM_DEN_MID_WAYPOINT: DreamPoint2 = [2.2, -3];
export const DREAM_DEN_WAYPOINT: DreamPoint2 = [3, -6.05];
export const DREAM_DEN_SOUTH_GAP: DreamPoint2 = [-1.8, -4.05];

export const DREAM_LANTERN_COMPOSITION_THIRD = {
  horizontal: "left" as const,
  normalizedX: 1 / 3,
  position: DREAM_KEYFRAME_ANCHORS.lanternShrine,
};

export const DREAM_GUIDANCE_CUE_POLICY: DreamGuidanceCuePolicy = {
  owner: "dream-lantern",
  suppressGenericBeacon: true,
  start: DREAM_PLAYER_SPAWN,
  target: DREAM_KEYFRAME_ANCHORS.lanternShrine,
  approachRadius: 14,
};

export const DREAM_TERRAIN_COLLISION_DESCRIPTORS: readonly DreamTerrainCollisionDescriptor[] = [
  {
    id: "spawn-lantern-walkable",
    role: "approach",
    shape: "ribbon",
    centerline: DREAM_PORTRAIT_CORRIDOR_POINTS,
    innerOffset: -DREAM_PORTRAIT_CORRIDOR_RADIUS,
    outerOffset: DREAM_PORTRAIT_CORRIDOR_RADIUS,
    elevation: [0, 0.08],
    blocksPlayer: false,
  },
  {
    id: "sunken-stream-bed",
    role: "stream-bed",
    shape: "ribbon",
    centerline: DREAM_STREAM_CONTROL_POINTS,
    innerOffset: -0.64,
    outerOffset: 0.64,
    elevation: [-0.65, -0.55],
    blocksPlayer: false,
  },
  {
    id: "raised-bank-west",
    role: "bank-west",
    shape: "ribbon",
    centerline: DREAM_STREAM_CONTROL_POINTS,
    innerOffset: -2.2,
    outerOffset: -0.68,
    elevation: [0.5, 1],
    // The stream banks are visual height cues, not invisible walls.  The
    // crossing stones and authored route provide the gameplay guidance while
    // keeping every clearing reachable from a fresh reload.
    blocksPlayer: false,
    gaps: [
      { center: DREAM_KEYFRAME_ANCHORS.streamCrossing, radius: 1.35 },
      // The north clearing branches over the upper bend of the stream.  Keep
      // the authored route open there; the bank is still visible as a set
      // piece, but it must not become an invisible wall around the threshold.
      { center: DREAM_NORTH_GROVE_WAYPOINT, radius: 1.85 },
      { center: DREAM_DEN_EXIT_WAYPOINT, radius: 1.85 },
      { center: DREAM_DEN_SOUTH_GAP, radius: 2.55 },
    ],
  },
  {
    id: "raised-bank-east",
    role: "bank-east",
    shape: "ribbon",
    centerline: DREAM_STREAM_CONTROL_POINTS,
    innerOffset: 0.68,
    outerOffset: 2.2,
    elevation: [0.5, 1],
    blocksPlayer: false,
    gaps: [
      { center: DREAM_KEYFRAME_ANCHORS.streamCrossing, radius: 1.35 },
      { center: DREAM_NORTH_GROVE_WAYPOINT, radius: 1.85 },
      { center: DREAM_DEN_EXIT_WAYPOINT, radius: 1.85 },
      { center: DREAM_DEN_SOUTH_GAP, radius: 2.55 },
    ],
  },
  {
    id: "moss-arch-west-pier",
    role: "ruin-arch",
    shape: "box",
    position: [-5.38, 1.5, -4.05],
    halfExtents: [0.36, 1.5, 0.42],
    rotationY: 0.34,
    blocksPlayer: true,
  },
  {
    id: "moss-arch-east-pier",
    role: "ruin-arch",
    shape: "box",
    position: [-2.62, 1.5, -4.75],
    halfExtents: [0.36, 1.5, 0.42],
    rotationY: 0.34,
    // The east pier sits inside the low-camera approach corridor.  It remains
    // fully rendered, but its narrow visual support must not trap the player
    // when the route bends around the shrine.
    blocksPlayer: false,
  },
  {
    id: "lantern-shrine-dais",
    role: "lantern-shrine",
    shape: "box",
    position: [-4, 0.22, -4],
    halfExtents: [0.72, 0.22, 0.72],
    rotationY: 0,
    blocksPlayer: true,
  },
  ...([-7.5, 0, 7.5] as const).map(
    (x, index): DreamTerrainCollisionDescriptor => ({
      id: `distant-ridge-${index}`,
      role: "distant-ridge",
      shape: "box",
      position: [x, 5 + index * 0.5, -11 - (index % 2) * 0.5],
      halfExtents: [3.1, 5 + index * 0.5, 1.4],
      rotationY: 0,
      blocksPlayer: true,
    }),
  ),
];

/**
 * Return a stable waypoint on the authored Dream route instead of steering
 * directly through the set.  This keeps the navigation cue honest: guided
 * travel crosses the stream at the authored stepping-stone gap and arrives at
 * the active clearing without clipping through a bank or shrine.
 */
export function dreamGuidedWaypoint(
  point: DreamPoint2,
  target: DreamPoint2,
): DreamPoint2 {
  const denTarget = target[0] >= 4.5 && target[1] <= -4;
  if (denTarget) {
    if (Math.hypot(point[0] - target[0], point[1] - target[1]) < 1.8)
      return target;
    // Use the player's progress along the authored eastward bend rather than
    // repeatedly selecting the nearest point. A nearest-point lookup would
    // send the player back to the exit once they passed it.
    if (
      point[0] < -1.05 &&
      Math.hypot(
        point[0] - DREAM_DEN_EXIT_WAYPOINT[0],
        point[1] - DREAM_DEN_EXIT_WAYPOINT[1],
      ) >= 1.45
    )
      return DREAM_DEN_EXIT_WAYPOINT;
    if (point[0] < 1.05 && point[1] > -4.2)
      return DREAM_DEN_MID_WAYPOINT;
    if (
      Math.hypot(
        point[0] - DREAM_DEN_WAYPOINT[0],
        point[1] - DREAM_DEN_WAYPOINT[1],
      ) >= 1.45
    )
      return DREAM_DEN_WAYPOINT;
    return target;
  }
  const northGroveTarget =
    target[0] >= 2.5 && target[1] >= 2.5;
  if (northGroveTarget) {
    if (Math.hypot(point[0] - target[0], point[1] - target[1]) < 1.8)
      return target;
    if (
      Math.hypot(
        point[0] - DREAM_NORTH_GROVE_WAYPOINT[0],
        point[1] - DREAM_NORTH_GROVE_WAYPOINT[1],
      ) >= 1.45
    )
      return DREAM_NORTH_GROVE_WAYPOINT;
    return target;
  }
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  let targetIndex = 0;
  let targetDistance = Number.POSITIVE_INFINITY;
  DREAM_PATH_CONTROL_POINTS.forEach((candidate, index) => {
    const distance = Math.hypot(point[0] - candidate[0], point[1] - candidate[1]);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
    const targetDelta = Math.hypot(target[0] - candidate[0], target[1] - candidate[1]);
    if (targetDelta < targetDistance) {
      targetDistance = targetDelta;
      targetIndex = index;
    }
  });
  if (nearestIndex >= targetIndex || Math.hypot(point[0] - target[0], point[1] - target[1]) < 1.8)
    return target;
  return DREAM_PATH_CONTROL_POINTS[Math.min(targetIndex, nearestIndex + 1)];
}

export const DREAM_STEPPING_STONES: readonly DreamPoint2[] = [
  [-1.02, 0.36],
  [-0.52, 0.18],
  [0, 0.05],
  [0.52, -0.1],
  [1.02, -0.28],
];

const slot = (
  kind: DreamDressingKind,
  offset: DreamPoint2,
  scale: number,
  priority: 0 | 1 | 2,
  yaw = 0,
  jitter = 0.18,
): DreamAuthoredSlot => ({ kind, offset, scale, priority, yaw, jitter });

export const DREAM_COMPOSITION_ANCHORS: readonly DreamCompositionAnchor[] = [
  {
    id: "stream-crossing",
    position: [0, 0],
    rotation: -0.06,
    role: "stream-crossing",
    slots: DREAM_STEPPING_STONES.map((position, index) =>
      slot("rock", position, 0.92 + (index % 2) * 0.1, 0, index * 0.28, 0.025),
    ),
  },
  {
    id: "stream-bank-west",
    position: [0, 0],
    rotation: 0,
    role: "stream-bank-west",
    slots: [
      slot("reed", [-0.72, -6.2], 0.72, 0, 0, 0.04),
      slot("rock", [-0.82, -4.65], 0.56, 1, 0.45, 0.04),
      slot("reed", [-0.2, -3.15], 0.68, 0, 0, 0.04),
      slot("rock", [-0.92, -1.75], 0.5, 1, -0.3, 0.04),
      slot("reed", [-0.74, 1.3], 0.64, 1, 0, 0.04),
      slot("rock", [1.92, 3.35], 0.46, 2, 0.7, 0.04),
    ],
  },
  {
    id: "stream-bank-east",
    position: [0, 0],
    rotation: 0,
    role: "stream-bank-east",
    slots: [
      slot("reed", [0.22, -5.55], 0.68, 0, 0, 0.04),
      slot("rock", [0.92, -4.05], 0.52, 1, -0.45, 0.04),
      slot("reed", [0.78, -2.45], 0.74, 0, 0, 0.04),
      slot("rock", [0.65, -1.05], 0.46, 1, 0.3, 0.04),
      slot("reed", [1.15, 1.75], 0.62, 1, 0, 0.04),
      // Keep eastern stream dressing outside threshold clearing while still
      // framing the upper bend of the waterline from the low gameplay camera.
      slot("rock", [3.8, 2.5], 0.48, 2, -0.6, 0.04),
    ],
  },
  {
    id: "moss-arch",
    position: DREAM_KEYFRAME_ANCHORS.mossArch,
    rotation: 0.34,
    role: "moss-arch",
    slots: [],
  },
  {
    id: "west-watch",
    position: [-8, 1],
    rotation: 0.08,
    role: "frame-west",
    slots: [
      slot("tree", [-0.4, 0.1], 1.28, 0, -0.16, 0.1),
      slot("tree", [0.25, -1.65], 0.95, 0, 0.18, 0.12),
      slot("tree", [-0.7, 1.72], 1.05, 1, -0.24, 0.12),
      slot("tree", [1.35, 0.7], 0.78, 2, 0.34, 0.12),
      slot("shrub", [1.35, -0.65], 1.05, 0),
      slot("shrub", [0.85, 1.75], 0.82, 1),
      slot("shrub", [-1.1, -1.1], 0.92, 2),
      slot("grass", [1.95, -1.2], 1.15, 0),
      slot("grass", [1.8, 1.35], 0.85, 1),
      slot("grass", [-1.25, 0.55], 1.1, 2),
      slot("rock", [1.75, 0.18], 0.82, 0, 0.3, 0.1),
      slot("rock", [0.1, 2.15], 0.58, 1, 0.9, 0.1),
      slot("groundPatch", [0.25, 0.05], 2.8, 0, 0, 0.08),
      slot("ridge", [-1.05, 0], 1.5, 1, 0, 0.08),
    ],
  },
  {
    id: "south-bank",
    position: [0, -8],
    rotation: -0.05,
    role: "frame-south",
    slots: [
      slot("tree", [-2.05, -0.05], 1.05, 0, -0.2, 0.1),
      slot("tree", [2.05, -0.15], 1.15, 0, 0.22, 0.1),
      slot("tree", [-0.1, -1.35], 0.8, 1, -0.08, 0.12),
      slot("shrub", [-1.15, 1.05], 0.85, 0),
      slot("shrub", [1.28, 1.02], 0.95, 1),
      slot("grass", [-2.35, 1.22], 1.05, 1),
      slot("grass", [2.35, 1.25], 1.1, 2),
      slot("rock", [-1.18, -0.68], 0.72, 0, 0.6, 0.1),
      slot("rock", [1.32, -0.82], 0.88, 1, 0.2, 0.1),
      slot("reed", [-0.68, 0.2], 1.15, 0, 0, 0.1),
      slot("reed", [0.62, 0.05], 1.05, 0, 0, 0.1),
      slot("reed", [-0.2, 0.88], 0.9, 1, 0, 0.1),
      slot("reed", [0.95, 0.72], 0.8, 2, 0, 0.1),
      slot("groundPatch", [0, -0.05], 2.95, 0, 0, 0.08),
      slot("ridge", [0, -0.78], 1.35, 2, 0, 0.08),
    ],
  },
  {
    id: "east-watch",
    position: [8, 1],
    rotation: -0.08,
    role: "frame-east",
    slots: [
      slot("tree", [0.4, 0.12], 1.35, 0, 0.18, 0.1),
      slot("tree", [-0.28, -1.62], 1, 0, -0.22, 0.12),
      slot("tree", [0.72, 1.72], 1.08, 1, 0.28, 0.12),
      slot("tree", [-1.28, 0.78], 0.82, 2, -0.35, 0.12),
      slot("shrub", [-1.4, -0.58], 0.98, 0),
      slot("shrub", [-0.85, 1.7], 0.86, 1),
      slot("shrub", [1.05, -1.08], 0.9, 2),
      slot("grass", [-1.92, -1.18], 1.08, 0),
      slot("grass", [-1.78, 1.4], 0.9, 1),
      slot("grass", [1.25, 0.52], 1.05, 2),
      slot("rock", [-1.72, 0.22], 0.9, 0, -0.25, 0.1),
      slot("rock", [-0.12, 2.15], 0.6, 1, 0.5, 0.1),
      slot("groundPatch", [-0.22, 0.08], 2.75, 0, 0, 0.08),
      slot("ridge", [1.05, 0], 1.55, 1, 0, 0.08),
    ],
  },
  {
    id: "north-crown",
    position: [0, 7],
    rotation: 0,
    role: "frame-north",
    slots: [
      // Keep the arrival ring outside the third-person orbit radius. The
      // authored crown still frames the approach, but the camera cannot park
      // inside a giant trunk when the player looks behind the spawn.
      slot("tree", [-4.8, 3.1], 0.84, 0, -0.18, 0.08),
      slot("tree", [4.8, 3.05], 0.88, 0, 0.2, 0.08),
      slot("tree", [-7.6, -1.35], 0.7, 1, 0.06, 0.1),
      slot("shrub", [-5.8, 3.1], 0.72, 0, 0, 0.1),
      slot("shrub", [5.8, 3.05], 0.74, 1, 0, 0.1),
      slot("grass", [-5.8, 0.9], 0.82, 1),
      slot("grass", [5.8, 0.82], 0.84, 2),
      slot("rock", [-6, 2.2], 0.58, 0, 0.4, 0.08),
      slot("rock", [6, 2.15], 0.54, 1, -0.35, 0.08),
      slot("reed", [-6.7, -1.5], 0.72, 1, 0, 0.08),
      slot("reed", [6.7, -1.45], 0.76, 2, 0, 0.08),
      slot("groundPatch", [-6.4, 0.2], 1.4, 2, 0, 0.06),
      slot("ridge", [7.6, -1.4], 0.72, 2, 0, 0.06),
    ],
  },
  {
    id: "lantern-clearing",
    position: [-4, -4],
    rotation: 0.12,
    role: "lantern",
    slots: [
      slot("tree", [-2.85, -0.55], 0.98, 0, -0.25, 0.08),
      slot("tree", [3.2, -1.25], 0.78, 1, 0.35, 0.08),
      slot("shrub", [-2.4, 2], 0.88, 1, 0, 0.12),
      slot("shrub", [0.12, -2.78], 0.82, 2, 0, 0.12),
      slot("grass", [-2.45, -1.22], 1, 0),
      slot("grass", [2.48, 1.15], 0.95, 1),
      slot("rock", [-2.52, 0.42], 0.78, 0, 0.5, 0.08),
      slot("rock", [1.92, -1.82], 0.68, 1, 0.2, 0.08),
      slot("rock", [-1.55, 2.28], 0.58, 2, -0.3, 0.08),
      slot("groundPatch", [0, 0], 1.75, 0, 0, 0.06),
    ],
  },
  {
    id: "den-clearing",
    position: [5, -5],
    rotation: -0.1,
    role: "den",
    slots: [
      slot("ridge", [2.85, -0.2], 1.65, 0, 0, 0.08),
      slot("tree", [2.7, 1], 1.05, 1, 0.18, 0.08),
      slot("shrub", [-0.2, 2.75], 1.05, 0),
      slot("shrub", [0.2, -2.82], 0.92, 2),
      slot("grass", [-2.42, -1.2], 0.95, 1),
      slot("grass", [2.45, 1.5], 1.02, 2),
      slot("rock", [-2.62, 0.18], 1.02, 0, 0.5, 0.08),
      slot("rock", [1.82, -2], 0.78, 0, -0.2, 0.08),
      slot("rock", [-1.5, 2.32], 0.62, 1, 0.3, 0.08),
      slot("groundPatch", [0, 0], 2.05, 0, 0, 0.06),
    ],
  },
  {
    id: "book-clearing",
    position: [-4, 5],
    rotation: 0.06,
    role: "book",
    slots: [
      slot("tree", [-2.72, 0.82], 1, 0, -0.2, 0.08),
      slot("tree", [-3.45, -2.25], 0.72, 2, 0.28, 0.08),
      slot("shrub", [-0.05, -2.82], 0.94, 0),
      slot("shrub", [0.2, 2.78], 0.82, 1),
      slot("grass", [-2.48, -1.15], 1.08, 1),
      slot("grass", [2.45, 1.28], 0.92, 2),
      slot("rock", [-1.88, 1.88], 0.66, 0, 0.3, 0.08),
      slot("rock", [2.4, -1.5], 0.62, 1, -0.4, 0.08),
      slot("reed", [1.5, -2.3], 0.9, 2, 0, 0.08),
      slot("groundPatch", [0, 0], 1.92, 0, 0, 0.06),
    ],
  },
  {
    id: "threshold-clearing",
    position: [4, 5],
    rotation: -0.06,
    role: "threshold",
    slots: [
      slot("tree", [2.7, 0.82], 1.02, 0, 0.22, 0.08),
      slot("tree", [-2.5, -1.8], 0.74, 2, -0.3, 0.08),
      slot("shrub", [0.05, -2.82], 0.96, 0),
      slot("shrub", [-0.18, 2.78], 0.84, 1),
      slot("grass", [2.5, -1.14], 1.08, 1),
      slot("grass", [-2.46, 1.3], 0.94, 2),
      slot("rock", [1.9, 1.88], 0.68, 0, -0.3, 0.08),
      slot("rock", [-2.4, -1.5], 0.64, 1, 0.4, 0.08),
      slot("reed", [-1.48, -2.32], 0.92, 2, 0, 0.08),
      slot("groundPatch", [0, 0], 1.95, 0, 0, 0.06),
    ],
  },
] as const;

export const DREAM_COMPOSITION_VIEWS: readonly DreamCompositionView[] = [
  {
    id: "arrival-profile",
    camera: DREAM_INITIAL_CAMERA_POSITION,
    targetAnchorId: "north-crown",
    leftFrameAnchorId: "east-watch",
    rightFrameAnchorId: "west-watch",
  },
  {
    id: "lantern-approach",
    camera: [0.5, 4.9, 2],
    targetAnchorId: "lantern-clearing",
    leftFrameAnchorId: "south-bank",
    rightFrameAnchorId: "west-watch",
  },
  {
    id: "den-approach",
    camera: [-0.5, 4.9, 2],
    targetAnchorId: "den-clearing",
    leftFrameAnchorId: "east-watch",
    rightFrameAnchorId: "south-bank",
  },
  {
    id: "book-crossing",
    camera: [1, 4.9, -2],
    targetAnchorId: "book-clearing",
    leftFrameAnchorId: "west-watch",
    rightFrameAnchorId: "north-crown",
  },
  {
    id: "threshold-crossing",
    camera: [-1, 4.9, -2],
    targetAnchorId: "threshold-clearing",
    leftFrameAnchorId: "north-crown",
    rightFrameAnchorId: "east-watch",
  },
] as const;

const qualityPriority: Record<DreamQualityPreset, 0 | 1 | 2> = {
  low: 0,
  medium: 1,
  high: 2,
};

const emptyBatches = (): Record<DreamDressingKind, DreamDressingInstance[]> => ({
  tree: [],
  shrub: [],
  grass: [],
  rock: [],
  reed: [],
  groundPatch: [],
  ridge: [],
});

export function buildDreamComposition(
  seed = DREAM_SCENE_SEED,
  quality: DreamQualityPreset = "medium",
): DreamComposition {
  const maximumPriority = qualityPriority[quality];
  const instances: DreamDressingInstance[] = [];
  const batches = emptyBatches();

  for (const anchor of DREAM_COMPOSITION_ANCHORS) {
    const cosine = Math.cos(anchor.rotation);
    const sine = Math.sin(anchor.rotation);
    anchor.slots.forEach((authoredSlot, slotIndex) => {
      if (authoredSlot.priority > maximumPriority) return;
      const random = new DreamSeededRandom(`${seed}:${anchor.id}:${slotIndex}`);
      const localX =
        authoredSlot.offset[0] +
        random.range(-authoredSlot.jitter!, authoredSlot.jitter!);
      const localZ =
        authoredSlot.offset[1] +
        random.range(-authoredSlot.jitter!, authoredSlot.jitter!);
      const x = anchor.position[0] + localX * cosine - localZ * sine;
      const z = anchor.position[1] + localX * sine + localZ * cosine;
      const instance: DreamDressingInstance = {
        id: `${anchor.id}:${slotIndex}`,
        anchorId: anchor.id,
        kind: authoredSlot.kind,
        position: [x, 0, z],
        rotation:
          anchor.rotation +
          (authoredSlot.yaw ?? 0) +
          random.range(-0.12, 0.12),
        scale: authoredSlot.scale * random.range(0.94, 1.06),
        variant: random.integer(0, 3) as 0 | 1 | 2 | 3,
        priority: authoredSlot.priority,
      };
      instances.push(instance);
      batches[instance.kind].push(instance);
    });
  }

  return {
    seed,
    quality,
    instances,
    batches: batches as DreamInstanceBatches,
  };
}

export function buildDreamTerrainCollisionDescriptors(
  seed = DREAM_SCENE_SEED,
  quality: DreamQualityPreset = "high",
): readonly DreamTerrainCollisionDescriptor[] {
  const foregroundTrunks = buildDreamComposition(seed, quality).batches.tree
    .filter((tree) => {
      const point: DreamPoint2 = [tree.position[0], tree.position[2]];
      return (
        point[1] >= -5.5 &&
        point[1] <= 8 &&
        distanceToDreamPath(point, DREAM_PORTRAIT_CORRIDOR_POINTS) <= 5
      );
    })
    .map(
      (tree): DreamTerrainCollisionDescriptor => {
        const height = Math.min(7, Math.max(5, tree.scale * 5.6));
        return {
          id: `collision-${tree.id}`,
          role: "foreground-trunk",
          shape: "capsule",
          position: [
            tree.position[0],
            height / 2,
            tree.position[2],
          ],
          halfExtents: [
            Math.min(0.56, Math.max(0.34, tree.scale * 0.42)),
            height / 2,
            Math.min(0.56, Math.max(0.34, tree.scale * 0.42)),
          ],
          rotationY: tree.rotation,
          blocksPlayer: true,
        };
      },
    );
  return [...DREAM_TERRAIN_COLLISION_DESCRIPTORS, ...foregroundTrunks];
}

export function shouldSuppressDreamGenericBeacon(player: DreamPoint2) {
  return (
    DREAM_GUIDANCE_CUE_POLICY.suppressGenericBeacon &&
    distanceToDreamPath(player, DREAM_PORTRAIT_CORRIDOR_POINTS) <=
      DREAM_PORTRAIT_CORRIDOR_RADIUS * 1.75 &&
    Math.hypot(
      player[0] - DREAM_GUIDANCE_CUE_POLICY.target[0],
      player[1] - DREAM_GUIDANCE_CUE_POLICY.target[1],
    ) <= DREAM_GUIDANCE_CUE_POLICY.approachRadius
  );
}

const anchorById = new Map(
  DREAM_COMPOSITION_ANCHORS.map((anchor) => [anchor.id, anchor]),
);

function dot(left: DreamPoint2, right: DreamPoint2) {
  return left[0] * right[0] + left[1] * right[1];
}

function subtract(left: DreamPoint2, right: DreamPoint2): DreamPoint2 {
  return [left[0] - right[0], left[1] - right[1]];
}

export function auditDreamCompositionViews(
  views: readonly DreamCompositionView[] = DREAM_COMPOSITION_VIEWS,
): readonly DreamViewAudit[] {
  return views.map((view) => {
    const camera: DreamPoint2 = [view.camera[0], view.camera[2]];
    const target = anchorById.get(view.targetAnchorId);
    const left = anchorById.get(view.leftFrameAnchorId);
    const right = anchorById.get(view.rightFrameAnchorId);
    if (!target || !left || !right)
      return {
        id: view.id,
        targetCentered: false,
        framesStraddleTarget: false,
        framesInFront: false,
        passed: false,
      };

    const targetVector = subtract(target.position, camera);
    const targetLength = Math.hypot(targetVector[0], targetVector[1]);
    const forward: DreamPoint2 = [
      targetVector[0] / targetLength,
      targetVector[1] / targetLength,
    ];
    const screenRight: DreamPoint2 = [forward[1], -forward[0]];
    const leftVector = subtract(left.position, camera);
    const rightVector = subtract(right.position, camera);
    const targetScreenX = dot(targetVector, screenRight);
    const leftScreenX = dot(leftVector, screenRight);
    const rightScreenX = dot(rightVector, screenRight);
    const targetCentered = Math.abs(targetScreenX) < 0.0001;
    const framesStraddleTarget =
      leftScreenX < targetScreenX && rightScreenX > targetScreenX;
    const framesInFront =
      dot(leftVector, forward) > 0 && dot(rightVector, forward) > 0;
    return {
      id: view.id,
      targetCentered,
      framesStraddleTarget,
      framesInFront,
      passed: targetCentered && framesStraddleTarget && framesInFront,
    };
  });
}

export function distanceToDreamClearing(
  point: DreamPoint2,
  clearing: DreamLandmarkClearance,
) {
  return Math.hypot(
    point[0] - clearing.position[0],
    point[1] - clearing.position[1],
  );
}

export function distanceToDreamPath(
  point: DreamPoint2,
  path: readonly DreamPoint2[],
) {
  let closest = Number.POSITIVE_INFINITY;
  for (let index = 1; index < path.length; index += 1) {
    const start = path[index - 1];
    const end = path[index];
    const dx = end[0] - start[0];
    const dz = end[1] - start[1];
    const lengthSquared = dx * dx + dz * dz;
    const amount =
      lengthSquared === 0
        ? 0
        : Math.max(
            0,
            Math.min(
              1,
              ((point[0] - start[0]) * dx + (point[1] - start[1]) * dz) /
                lengthSquared,
            ),
          );
    const x = start[0] + dx * amount;
    const z = start[1] + dz * amount;
    closest = Math.min(closest, Math.hypot(point[0] - x, point[1] - z));
  }
  return closest;
}

export function isInsideDreamApproachCone(point: DreamPoint2) {
  const target = DREAM_KEYFRAME_ANCHORS.lanternShrine;
  const forward: DreamPoint2 = [
    target[0] - DREAM_PLAYER_SPAWN[0],
    target[1] - DREAM_PLAYER_SPAWN[1],
  ];
  const forwardLength = Math.hypot(forward[0], forward[1]);
  const direction: DreamPoint2 = [
    forward[0] / forwardLength,
    forward[1] / forwardLength,
  ];
  const relative: DreamPoint2 = [
    point[0] - DREAM_PLAYER_SPAWN[0],
    point[1] - DREAM_PLAYER_SPAWN[1],
  ];
  const projection = dot(relative, direction);
  if (projection <= 0 || projection >= forwardLength) return false;
  const relativeLength = Math.hypot(relative[0], relative[1]);
  const cosine = Math.max(
    -1,
    Math.min(1, projection / Math.max(0.0001, relativeLength)),
  );
  const angle = (Math.acos(cosine) * 180) / Math.PI;
  return angle <= DREAM_APPROACH_CONE_HALF_ANGLE;
}
