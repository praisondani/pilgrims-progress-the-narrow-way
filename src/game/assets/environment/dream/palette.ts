import type {
  DreamEnvironmentPalette,
  DreamQualityPreset,
} from "./types";

export const DREAM_DEFAULT_PALETTE: Readonly<DreamEnvironmentPalette> = {
  // Deep blue dusk keeps rear silhouettes readable without a black horizon
  // seam. Fog stays close in value so distant meadow blends into sky.
  background: "#1a2d3d",
  fog: "#2b4655",
  fogNear: 13,
  fogFar: 39,
  hemisphereSky: "#b9d4ee",
  hemisphereGround: "#1d3437",
  hemisphereIntensity: 1.45,
  keyLight: "#a8c9e8",
  keyLightIntensity: 2.35,
  groundDark: "#1d3b34",
  groundMid: "#4f725d",
  // A mossed earth trail reads as a grounded route under moonlight; the
  // previous pale clay value became a distracting ribbon in reverse orbit.
  path: "#596653",
  moss: "#2d5545",
  silhouette: "#173b3b",
  silhouetteLift: "#4f7d64",
  stone: "#6e8790",
  stoneLift: "#a0b0aa",
  reed: "#426d55",
  lanternMetal: "#5a4330",
  lanternGlass: "#f3c77f",
  lanternFlame: "#ffe19d",
  streamInk: "#071c2d",
  streamMoonlight: "#27617d",
  mote: "#f2d59a",
};

export const DREAM_ATMOSPHERE_PRESET = {
  mode: "fog" as const,
  includeBackground: true,
  palette: {
    background: "#1a2d3d",
    fog: "#2b4655",
    fogNear: 11,
    fogFar: 36,
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
