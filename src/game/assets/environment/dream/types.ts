import type { ColorRepresentation } from "three";

export type DreamQualityPreset = "low" | "medium" | "high";

export type DreamWaterStyle = "dry" | "ink" | "moonlit";

export type DreamLodLevel = "near" | "far";

export type DreamAtmosphereMode =
  | "none"
  | "fog"
  | "fog-and-lights";

export type DreamDressingKind =
  | "tree"
  | "shrub"
  | "grass"
  | "rock"
  | "reed"
  | "groundPatch"
  | "ridge";

export type DreamPoint2 = readonly [x: number, z: number];

export type DreamPoint3 = readonly [x: number, y: number, z: number];

export interface DreamEnvironmentPalette {
  background: ColorRepresentation;
  fog: ColorRepresentation;
  fogNear: number;
  fogFar: number;
  hemisphereSky: ColorRepresentation;
  hemisphereGround: ColorRepresentation;
  hemisphereIntensity: number;
  keyLight: ColorRepresentation;
  keyLightIntensity: number;
  groundDark: ColorRepresentation;
  groundMid: ColorRepresentation;
  path: ColorRepresentation;
  moss: ColorRepresentation;
  silhouette: ColorRepresentation;
  silhouetteLift: ColorRepresentation;
  stone: ColorRepresentation;
  stoneLift: ColorRepresentation;
  reed: ColorRepresentation;
  lanternMetal: ColorRepresentation;
  lanternGlass: ColorRepresentation;
  lanternFlame: ColorRepresentation;
  streamInk: ColorRepresentation;
  streamMoonlight: ColorRepresentation;
  mote: ColorRepresentation;
}

export interface DreamLandmarkClearance {
  id: "lantern" | "den" | "dream-book" | "become-christian";
  position: DreamPoint2;
  radius: number;
}

export interface DreamAuthoredSlot {
  kind: DreamDressingKind;
  offset: DreamPoint2;
  scale: number;
  priority: 0 | 1 | 2;
  yaw?: number;
  jitter?: number;
}

export interface DreamCompositionAnchor {
  id: string;
  position: DreamPoint2;
  rotation: number;
  role:
    | "frame-west"
    | "frame-south"
    | "frame-east"
    | "frame-north"
    | "stream-crossing"
    | "stream-bank-west"
    | "stream-bank-east"
    | "moss-arch"
    | "lantern"
    | "den"
    | "book"
    | "threshold";
  slots: readonly DreamAuthoredSlot[];
}

export interface DreamDressingInstance {
  id: string;
  anchorId: string;
  kind: DreamDressingKind;
  position: DreamPoint3;
  rotation: number;
  scale: number;
  variant: 0 | 1 | 2 | 3;
  priority: 0 | 1 | 2;
}

export type DreamInstanceBatches = Record<
  DreamDressingKind,
  readonly DreamDressingInstance[]
>;

export interface DreamComposition {
  seed: string;
  quality: DreamQualityPreset;
  instances: readonly DreamDressingInstance[];
  batches: DreamInstanceBatches;
}

export interface DreamCompositionView {
  id:
    | "arrival-profile"
    | "lantern-approach"
    | "den-approach"
    | "book-crossing"
    | "threshold-crossing";
  camera: DreamPoint3;
  targetAnchorId: string;
  leftFrameAnchorId: string;
  rightFrameAnchorId: string;
}

export interface DreamViewAudit {
  id: DreamCompositionView["id"];
  targetCentered: boolean;
  framesStraddleTarget: boolean;
  framesInFront: boolean;
  passed: boolean;
}

export type DreamTerrainRole =
  | "approach"
  | "stream-bed"
  | "bank-west"
  | "bank-east"
  | "foreground-trunk"
  | "ruin-arch"
  | "lantern-shrine"
  | "distant-ridge";

export interface DreamTerrainRibbonDescriptor {
  id: string;
  role: "approach" | "stream-bed" | "bank-west" | "bank-east";
  shape: "ribbon";
  centerline: readonly DreamPoint2[];
  innerOffset: number;
  outerOffset: number;
  elevation: readonly [min: number, max: number];
  blocksPlayer: boolean;
  gaps?: readonly {
    center: DreamPoint2;
    radius: number;
  }[];
}

export interface DreamTerrainPrimitiveDescriptor {
  id: string;
  role:
    | "foreground-trunk"
    | "ruin-arch"
    | "lantern-shrine"
    | "distant-ridge";
  shape: "capsule" | "box";
  position: DreamPoint3;
  halfExtents: DreamPoint3;
  rotationY: number;
  blocksPlayer: boolean;
}

export type DreamTerrainCollisionDescriptor =
  | DreamTerrainRibbonDescriptor
  | DreamTerrainPrimitiveDescriptor;

export interface DreamGuidanceCuePolicy {
  owner: "dream-lantern";
  suppressGenericBeacon: true;
  start: DreamPoint2;
  target: DreamPoint2;
  approachRadius: number;
}

export interface DreamPerformanceEstimate {
  quality: DreamQualityPreset;
  lod: DreamLodLevel;
  instanceCount: number;
  visibleDrawCalls: number;
  triangles: number;
  pointLights: number;
  textures: number;
}

export interface DreamPerformanceLimit {
  maxInstances: number;
  maxVisibleDrawCalls: number;
  maxTriangles: number;
  maxPointLights: number;
  maxTextures: number;
}

export interface DreamEnvironmentKitProps {
  seed?: string;
  quality?: DreamQualityPreset;
  water?: DreamWaterStyle;
  palette?: Partial<DreamEnvironmentPalette>;
  atmosphere?: DreamAtmosphereMode;
  includeBackground?: boolean;
  lanternLit?: boolean;
  reducedMotion?: boolean;
  visible?: boolean;
}
