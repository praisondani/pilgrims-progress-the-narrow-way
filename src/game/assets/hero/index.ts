export { PilgrimHero, type PilgrimHeroProps } from "./PilgrimHero";
export { createPilgrimHero } from "./createHero";
export { createDeferredHeroDisposer } from "./lifecycle";
export {
  DEFAULT_HERO_SPEC,
  resolveHeroSpec,
  validateHeroSpec,
} from "./spec";
export {
  createHeroRandom,
  hashHeroSeed,
} from "./procedural";
export type {
  DeepPartial,
  HeroAnatomySpec,
  HeroAttachment,
  HeroCollider,
  HeroCollisionSpec,
  HeroContactType,
  HeroExpressionChannel,
  HeroExpressionController,
  HeroExpressionPreset,
  HeroFactoryOptions,
  HeroLodSpec,
  HeroMaterialId,
  HeroOutfitSpec,
  HeroPalette,
  HeroPivotId,
  HeroRuntime,
  HeroSculptRuntimeMetadata,
  HeroSculptSpec,
  HeroSocketId,
  HeroUpdateInput,
  HeroVec3,
} from "./types";
