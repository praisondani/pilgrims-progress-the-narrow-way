export type GateStepId =
  | "approach"
  | "second-cover"
  | "inscription"
  | "knock-one"
  | "knock-two"
  | "goodwill";

export type GateTarget = [number, number];

export const WICKET_GATE_ROOT: [number, number, number] = [0, 0, -8.15];

/** Shared world-space anchors for story guidance and authored Gate composition. */
export const GATE_ANCHORS: Record<GateStepId, GateTarget> = {
  approach: [-1.7, 3.35],
  "second-cover": [1.65, -0.45],
  inscription: [0, -5.55],
  "knock-one": [-0.55, -5.72],
  "knock-two": [0.55, -5.72],
  goodwill: [0, -9.18],
};

export const GATE_COVER_CENTERS: readonly GateTarget[] = [
  [-2.25, 3.35],
  [2.2, -0.45],
];

export const GATE_ARROW_LANES = [3.55, 1.35, -0.75, -2.85, -5.05] as const;
export const GATE_SALVO = {
  cycleSeconds: 5.4,
  telegraphSeconds: 0.95,
  flightSeconds: 1.55,
  startX: -9.4,
  endX: 9.4,
} as const;

const SALVO_PATTERNS: readonly (readonly number[])[] = [
  [0, 2, 4],
  [1, 3],
];

export type GateSalvoPhase = "telegraph" | "flight" | "safe";

export type GateArrowFrame = {
  cycle: number;
  phase: GateSalvoPhase;
  targeted: boolean;
  visible: boolean;
  x: number;
};

export function gateArrowFrame(
  elapsedSeconds: number,
  laneIndex: number,
): GateArrowFrame {
  const cycle = Math.max(0, Math.floor(elapsedSeconds / GATE_SALVO.cycleSeconds));
  const cycleTime =
    ((elapsedSeconds % GATE_SALVO.cycleSeconds) + GATE_SALVO.cycleSeconds) %
    GATE_SALVO.cycleSeconds;
  const targeted = SALVO_PATTERNS[cycle % SALVO_PATTERNS.length].includes(
    laneIndex,
  );
  const phase: GateSalvoPhase =
    cycleTime < GATE_SALVO.telegraphSeconds
      ? "telegraph"
      : cycleTime < GATE_SALVO.telegraphSeconds + GATE_SALVO.flightSeconds
        ? "flight"
        : "safe";
  const progress = Math.max(
    0,
    Math.min(
      1,
      (cycleTime - GATE_SALVO.telegraphSeconds) / GATE_SALVO.flightSeconds,
    ),
  );
  return {
    cycle,
    phase,
    targeted,
    visible: targeted && phase === "flight",
    x:
      GATE_SALVO.startX +
      (GATE_SALVO.endX - GATE_SALVO.startX) * progress,
  };
}

export function segmentCircleContact(
  start: GateTarget,
  end: GateTarget,
  center: GateTarget,
  radius: number,
) {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const lengthSquared = dx * dx + dz * dz;
  const projection =
    lengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((center[0] - start[0]) * dx + (center[1] - start[1]) * dz) /
              lengthSquared,
          ),
        );
  const nearestX = start[0] + dx * projection;
  const nearestZ = start[1] + dz * projection;
  return Math.hypot(center[0] - nearestX, center[1] - nearestZ) <= radius;
}

function pointSegmentDistanceSquared(
  point: GateTarget,
  start: GateTarget,
  end: GateTarget,
) {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const lengthSquared = dx * dx + dz * dz;
  const projection =
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
  const nearestX = start[0] + dx * projection;
  const nearestZ = start[1] + dz * projection;
  return (point[0] - nearestX) ** 2 + (point[1] - nearestZ) ** 2;
}

function orientation(a: GateTarget, b: GateTarget, c: GateTarget) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function segmentsIntersect(
  startA: GateTarget,
  endA: GateTarget,
  startB: GateTarget,
  endB: GateTarget,
) {
  const epsilon = 1e-8;
  const a = orientation(startA, endA, startB);
  const b = orientation(startA, endA, endB);
  const c = orientation(startB, endB, startA);
  const d = orientation(startB, endB, endA);
  if ((a > epsilon && b < -epsilon || a < -epsilon && b > epsilon) &&
      (c > epsilon && d < -epsilon || c < -epsilon && d > epsilon))
    return true;
  return (
    Math.abs(a) <= epsilon &&
      pointSegmentDistanceSquared(startB, startA, endA) <= epsilon * epsilon ||
    Math.abs(b) <= epsilon &&
      pointSegmentDistanceSquared(endB, startA, endA) <= epsilon * epsilon ||
    Math.abs(c) <= epsilon &&
      pointSegmentDistanceSquared(startA, startB, endB) <= epsilon * epsilon ||
    Math.abs(d) <= epsilon &&
      pointSegmentDistanceSquared(endA, startB, endB) <= epsilon * epsilon
  );
}

/** Swept contact for an arrow segment and a fast-moving player segment. */
export function segmentSegmentContact(
  startA: GateTarget,
  endA: GateTarget,
  startB: GateTarget,
  endB: GateTarget,
  radius: number,
) {
  if (segmentsIntersect(startA, endA, startB, endB)) return true;
  const radiusSquared = radius * radius;
  return Math.min(
    pointSegmentDistanceSquared(startA, startB, endB),
    pointSegmentDistanceSquared(endA, startB, endB),
    pointSegmentDistanceSquared(startB, startA, endA),
    pointSegmentDistanceSquared(endB, startA, endA),
  ) <= radiusSquared;
}

export function isInsideGateCover(position: GateTarget) {
  return GATE_COVER_CENTERS.some(
    (cover) => Math.hypot(position[0] - cover[0], position[1] - cover[1]) < 1.05,
  );
}

export type GateControllerInput = {
  stepId: string;
  dialogueActive: boolean;
  dialogueIndex: number;
  sceneComplete: boolean;
  reducedMotion: boolean;
};

export type GateController = {
  stepId: GateStepId;
  target: GateTarget;
  knockSide: -1 | 0 | 1;
  boltsReleased: boolean;
  doorOpen: boolean;
  doorwayOpen: boolean;
  goodwillVisible: boolean;
  pulling: boolean;
  reducedMotion: boolean;
};

export function deriveGateController(input: GateControllerInput): GateController {
  const stepId = (input.stepId in GATE_ANCHORS
    ? input.stepId
    : "approach") as GateStepId;
  const atGoodwill = stepId === "goodwill" || input.sceneComplete;
  const secondKnockTurnsBolts =
    stepId === "knock-two" && input.dialogueActive && input.dialogueIndex >= 1;
  return {
    stepId,
    target: GATE_ANCHORS[stepId],
    knockSide:
      input.dialogueActive && stepId === "knock-one"
        ? -1
        : input.dialogueActive && stepId === "knock-two"
          ? 1
          : 0,
    boltsReleased: atGoodwill || secondKnockTurnsBolts,
    doorOpen: atGoodwill,
    doorwayOpen: atGoodwill,
    goodwillVisible: atGoodwill || secondKnockTurnsBolts,
    pulling: stepId === "goodwill" && input.dialogueActive,
    reducedMotion: input.reducedMotion,
  };
}

export function gatePlayerBounds(controller: GateController) {
  return {
    minimumX: -7.2,
    maximumX: 7.2,
    minimumZ: controller.doorwayOpen ? -10.25 : -7.2,
    maximumZ: 7.2,
  };
}
