import type {
  DeepPartial,
  HeroAnatomySpec,
  HeroSculptSpec,
} from "./types";

const defaultHeroSpec: HeroSculptSpec = {
  id: "christian-procedural-v1",
  version: 1,
  referenceId: "christian-turnaround-v1",
  seed: "christian-canonical-01",
  anatomy: {
    totalHeight: 1.985,
    headHeight: 0.31,
    headWidth: 0.245,
    headDepth: 0.26,
    shoulderWidth: 0.62,
    hipWidth: 0.38,
    torsoLength: 0.56,
    neckLength: 0.085,
    upperArmLength: 0.335,
    forearmLength: 0.295,
    handLength: 0.19,
    thighLength: 0.46,
    shinLength: 0.43,
    ankleHeight: 0.14,
    footLength: 0.34,
    footWidth: 0.15,
  },
  face: {
    eyeLine: 0.49,
    eyeSpacing: 0.28,
    noseBase: 0.66,
    mouthLine: 0.78,
    earTop: 0.43,
    earBottom: 0.68,
    hairline: 0.11,
    browTilt: 0.12,
    beardLength: 0.105,
  },
  outfit: {
    tunicHemHeight: 0.75,
    tunicThickness: 0.018,
    beltHeight: 0.97,
    burdenWidth: 0.8,
    burdenHeight: 1.02,
    burdenDepth: 0.44,
    burdenSocketOffset: [0, 0.13, -0.18],
  },
  lod: {
    highDistance: 0,
    mediumDistance: 8,
    lowDistance: 18,
  },
  collision: {
    // Exact visual-local equivalent of Player.tsx's existing CapsuleCollider.
    controllerCenter: [0, 0.58, 0],
    controllerHalfHeight: 0.42,
    controllerRadius: 0.38,
    interactionCenter: [0, 0.97, 0],
    interactionHalfHeight: 0.66,
    interactionRadius: 0.34,
  },
  palette: {
    skin: "#b77b5d",
    skinShadow: "#8b5542",
    hair: "#2d211c",
    eyeWhite: "#d8cdbd",
    iris: "#40332b",
    pupil: "#171511",
    linen: "#d2c1a2",
    linenShadow: "#a99478",
    tunic: "#874031",
    tunicShadow: "#5f2b25",
    trousers: "#252731",
    legWrap: "#9b8568",
    leather: "#513629",
    leatherDark: "#2e211b",
    brass: "#a87c37",
    steel: "#788087",
    burden: "#342b25",
    burdenShadow: "#211c18",
    rope: "#756049",
    parchment: "#d7c290",
    seal: "#86362e",
  },
};

export const DEFAULT_HERO_SPEC: Readonly<HeroSculptSpec> =
  Object.freeze(defaultHeroSpec);

function mergeObject<T extends object>(base: T, patch?: DeepPartial<T>): T {
  if (!patch) return { ...base };
  const result: Record<string, unknown> = {
    ...(base as Record<string, unknown>),
  };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    const current = result[key];
    result[key] =
      value &&
      current &&
      typeof value === "object" &&
      typeof current === "object" &&
      !Array.isArray(value) &&
      !Array.isArray(current)
        ? mergeObject(
            current as Record<string, unknown>,
            value as DeepPartial<Record<string, unknown>>,
          )
        : value;
  }
  return result as T;
}

function assertFinitePositive(
  anatomy: HeroAnatomySpec,
  key: keyof HeroAnatomySpec,
) {
  const value = anatomy[key];
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`Hero spec anatomy.${key} must be a finite positive number`);
}

export function validateHeroSpec(spec: HeroSculptSpec): HeroSculptSpec {
  for (const key of Object.keys(spec.anatomy) as (keyof HeroAnatomySpec)[])
    assertFinitePositive(spec.anatomy, key);

  if (
    !(
      spec.lod.highDistance >= 0 &&
      spec.lod.mediumDistance > spec.lod.highDistance &&
      spec.lod.lowDistance > spec.lod.mediumDistance
    )
  )
    throw new Error(
      "Hero spec LOD distances must be ascending: high < medium < low",
    );

  const calculatedHeight =
    spec.anatomy.ankleHeight +
    spec.anatomy.shinLength +
    spec.anatomy.thighLength +
    spec.anatomy.torsoLength +
    spec.anatomy.neckLength +
    spec.anatomy.headHeight;
  if (Math.abs(calculatedHeight - spec.anatomy.totalHeight) > 0.08)
    throw new Error(
      "Hero spec totalHeight must match the articulated anatomy within 0.08 world units",
    );

  if (spec.anatomy.shoulderWidth <= spec.anatomy.hipWidth)
    throw new Error("Hero spec shoulderWidth must exceed hipWidth");

  for (const [key, value] of Object.entries(spec.face)) {
    if (!Number.isFinite(value) || value < 0 || value > 1)
      throw new Error(`Hero spec face.${key} must be normalized to 0..1`);
  }

  if (
    spec.collision.controllerHalfHeight <= 0 ||
    spec.collision.controllerRadius <= 0
  )
    throw new Error("Hero spec controller collider dimensions must be positive");

  return spec;
}

export function resolveHeroSpec(
  patch?: DeepPartial<HeroSculptSpec>,
  seed?: string | number,
): HeroSculptSpec {
  const merged = mergeObject<HeroSculptSpec>(
    DEFAULT_HERO_SPEC as HeroSculptSpec,
    patch,
  );
  if (seed !== undefined) merged.seed = String(seed);
  return validateHeroSpec(merged);
}
