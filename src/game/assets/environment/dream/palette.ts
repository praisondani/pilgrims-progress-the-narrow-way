import type {
  DreamEnvironmentPalette,
  DreamQualityPreset,
} from "./types";

export const DREAM_DEFAULT_PALETTE: Readonly<DreamEnvironmentPalette> = {
  background: "#101421",
  fog: "#171c29",
  fogNear: 13,
  fogFar: 39,
  hemisphereSky: "#9fb5d5",
  hemisphereGround: "#252b34",
  hemisphereIntensity: 1.3,
  keyLight: "#9fb5d5",
  keyLightIntensity: 2.1,
  groundDark: "#26372f",
  groundMid: "#536b59",
  path: "#83745b",
  moss: "#31483b",
  silhouette: "#2e493d",
  silhouetteLift: "#46604c",
  stone: "#66706d",
  stoneLift: "#7a8178",
  reed: "#405b49",
  lanternMetal: "#4a3a2c",
  lanternGlass: "#f1b868",
  lanternFlame: "#ffd58a",
  streamInk: "#0b202b",
  streamMoonlight: "#164152",
  mote: "#d8c390",
};

export const DREAM_ATMOSPHERE_PRESET = {
  mode: "fog" as const,
  includeBackground: true,
  palette: {
    background: "#0d1a2a",
    fog: "#2c4050",
    fogNear: 11,
    fogFar: 35,
  },
} as const;

export const DREAM_PBR_FAMILIES = {
  earth: {
    color: DREAM_DEFAULT_PALETTE.path,
    roughness: 0.96,
    metalness: 0,
  },
  wetStone: {
    color: DREAM_DEFAULT_PALETTE.stone,
    roughness: 0.72,
    metalness: 0.02,
    clearcoat: 0.24,
    clearcoatRoughness: 0.58,
  },
  barkMoss: {
    color: DREAM_DEFAULT_PALETTE.silhouette,
    roughness: 0.9,
    metalness: 0,
    clearcoat: 0.04,
    clearcoatRoughness: 0.78,
  },
} as const;

export function resolveDreamPalette(
  overrides: Partial<DreamEnvironmentPalette> = {},
): DreamEnvironmentPalette {
  return { ...DREAM_DEFAULT_PALETTE, ...overrides };
}

export function dreamFogRange(
  palette: DreamEnvironmentPalette,
  quality: DreamQualityPreset,
) {
  const qualityScale = quality === "low" ? 0.86 : quality === "medium" ? 0.94 : 1;
  return {
    near: palette.fogNear * qualityScale,
    far: palette.fogFar * qualityScale,
  };
}
