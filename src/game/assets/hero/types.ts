import type {
  Group,
  LOD,
  Material,
  Object3D,
  Vector3,
} from "three";

export type HeroVec3 = [number, number, number];

export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export type HeroPivotId =
  | "motion"
  | "pelvis"
  | "spine"
  | "chest"
  | "neck"
  | "head"
  | "jaw"
  | "leftShoulder"
  | "leftElbow"
  | "leftWrist"
  | "rightShoulder"
  | "rightElbow"
  | "rightWrist"
  | "leftHip"
  | "leftKnee"
  | "leftAnkle"
  | "rightHip"
  | "rightKnee"
  | "rightAnkle";

export type HeroSocketId =
  | "backBurden"
  | "chestAction"
  | "headAction"
  | "leftHandGrip"
  | "rightHandGrip"
  | "leftHandAction"
  | "rightHandAction"
  | "beltRoll"
  | "beltEquipment"
  | "leftFootGround"
  | "rightFootGround";

export type HeroMaterialId =
  | "skin"
  | "skinShadow"
  | "hair"
  | "eyeWhite"
  | "iris"
  | "pupil"
  | "catchlight"
  | "mouth"
  | "linen"
  | "linenShadow"
  | "tunic"
  | "tunicShadow"
  | "trousers"
  | "legWrap"
  | "leather"
  | "leatherDark"
  | "brass"
  | "steel"
  | "burden"
  | "burdenShadow"
  | "rope"
  | "parchment"
  | "seal";

export type HeroExpressionChannel =
  | "smile"
  | "concern"
  | "effort"
  | "blink"
  | "squint";

export type HeroExpressionPreset =
  | "neutral"
  | "hopeful"
  | "concerned"
  | "determined"
  | "weary";

export interface HeroPalette {
  skin: string;
  skinShadow: string;
  hair: string;
  eyeWhite: string;
  iris: string;
  pupil: string;
  linen: string;
  linenShadow: string;
  tunic: string;
  tunicShadow: string;
  trousers: string;
  legWrap: string;
  leather: string;
  leatherDark: string;
  brass: string;
  steel: string;
  burden: string;
  burdenShadow: string;
  rope: string;
  parchment: string;
  seal: string;
}

export interface HeroAnatomySpec {
  totalHeight: number;
  headHeight: number;
  headWidth: number;
  headDepth: number;
  shoulderWidth: number;
  hipWidth: number;
  torsoLength: number;
  neckLength: number;
  upperArmLength: number;
  forearmLength: number;
  handLength: number;
  thighLength: number;
  shinLength: number;
  ankleHeight: number;
  footLength: number;
  footWidth: number;
}

export interface HeroFaceSpec {
  eyeLine: number;
  eyeSpacing: number;
  noseBase: number;
  mouthLine: number;
  earTop: number;
  earBottom: number;
  hairline: number;
  browTilt: number;
  beardLength: number;
}

export interface HeroOutfitSpec {
  tunicHemHeight: number;
  tunicThickness: number;
  beltHeight: number;
  burdenWidth: number;
  burdenHeight: number;
  burdenDepth: number;
  burdenSocketOffset: HeroVec3;
}

export interface HeroLodSpec {
  highDistance: number;
  mediumDistance: number;
  lowDistance: number;
}

export interface HeroCollisionSpec {
  controllerCenter: HeroVec3;
  controllerHalfHeight: number;
  controllerRadius: number;
  interactionCenter: HeroVec3;
  interactionHalfHeight: number;
  interactionRadius: number;
}

export interface HeroSculptSpec {
  id: string;
  version: number;
  referenceId: string;
  seed: string;
  anatomy: HeroAnatomySpec;
  face: HeroFaceSpec;
  outfit: HeroOutfitSpec;
  lod: HeroLodSpec;
  collision: HeroCollisionSpec;
  palette: HeroPalette;
}

export type HeroCollider =
  | {
      id: string;
      parent: HeroPivotId | "root";
      shape: "capsule";
      center: HeroVec3;
      rotation: HeroVec3;
      radius: number;
      halfHeight: number;
      trigger: boolean;
      activeWhen?: "always" | "burden";
    }
  | {
      id: string;
      parent: HeroPivotId | HeroSocketId | "root";
      shape: "sphere";
      center: HeroVec3;
      rotation: HeroVec3;
      radius: number;
      trigger: boolean;
      activeWhen?: "always" | "burden";
    }
  | {
      id: string;
      parent: HeroPivotId | HeroSocketId | "root";
      shape: "box";
      center: HeroVec3;
      rotation: HeroVec3;
      halfExtents: HeroVec3;
      trigger: boolean;
      activeWhen?: "always" | "burden";
    };

export type HeroContactType =
  | "embedded"
  | "socket"
  | "overlap"
  | "hinge"
  | "surface-contact";

export interface HeroAttachment {
  id: string;
  parent: HeroPivotId | HeroSocketId | "root";
  parentSocket: HeroPivotId | HeroSocketId;
  localStart: HeroVec3;
  localEnd: HeroVec3;
  baseRadius: number;
  endRadius: number;
  embedDepth: number;
  contactType: HeroContactType;
  gapTolerance: number;
  evidenceRef: string;
}

export interface HeroExpressionController {
  readonly values: Readonly<Record<HeroExpressionChannel, number>>;
  readonly target: Readonly<Record<HeroExpressionChannel, number>>;
  setPreset(preset: HeroExpressionPreset, intensity?: number): void;
  setWeights(weights: Partial<Record<HeroExpressionChannel, number>>): void;
  update(delta: number, dynamicEffort?: number, automaticBlink?: number): void;
  reset(): void;
}

export interface HeroUpdateInput {
  walking?: boolean;
  burden?: number;
  hasRoll?: boolean;
  equipped?: boolean;
  reducedMotion?: boolean;
  locomotionSpeed?: number;
}

export interface HeroFactoryOptions {
  spec?: DeepPartial<HeroSculptSpec>;
  seed?: string | number;
  burden?: number;
  hasRoll?: boolean;
  equipped?: boolean;
  expression?: HeroExpressionPreset;
}

export interface HeroSculptRuntimeMetadata {
  kind: "pilgrims-progress-procedural-hero";
  version: number;
  specId: string;
  referenceId: string;
  seed: string;
  coordinateSystem: {
    up: "+Y";
    forward: "+Z";
    origin: "foot-ground-center";
  };
  pivotUuids: Record<HeroPivotId, string>;
  socketUuids: Record<HeroSocketId, string>;
  lodNames: string[];
  colliderIds: string[];
  expressionChannels: HeroExpressionChannel[];
}

export interface HeroRuntime {
  readonly root: Group;
  readonly motionRoot: Group;
  readonly spec: HeroSculptSpec;
  readonly pivots: Readonly<Record<HeroPivotId, Object3D>>;
  readonly sockets: Readonly<Record<HeroSocketId, Object3D>>;
  readonly lods: ReadonlyMap<string, LOD>;
  readonly materials: Readonly<Record<HeroMaterialId, Material>>;
  readonly colliders: readonly HeroCollider[];
  readonly attachments: readonly HeroAttachment[];
  readonly expressions: HeroExpressionController;
  readonly state: Readonly<Required<HeroUpdateInput>>;
  readonly disposed: boolean;
  update(delta: number, input?: HeroUpdateInput): void;
  setExpression(preset: HeroExpressionPreset, intensity?: number): void;
  getSocket(id: HeroSocketId): Object3D;
  getSocketWorldPosition(id: HeroSocketId, target?: Vector3): Vector3;
  dispose(): void;
}
