export type CityQualityPreset = "low" | "medium" | "high";

export type CityBuildingStyle = "plaster" | "brick" | "ochre" | "slate";

export type CityPoint2 = readonly [x: number, z: number];

export interface CityBuildingSite {
  id: string;
  position: CityPoint2;
  rotation: number;
  scale: number;
  style: CityBuildingStyle;
}

/** Stable authored sites preserve the six-house framing from the original city. */
export const CITY_BUILDING_SITES: readonly CityBuildingSite[] = [
  {
    id: "west-south",
    position: [-5.7, -5],
    rotation: 0.18,
    scale: 1.03,
    style: "plaster",
  },
  {
    id: "west-market",
    position: [-5.8, -1],
    rotation: -0.08,
    scale: 0.92,
    style: "brick",
  },
  {
    id: "west-north",
    position: [-5.5, 4],
    rotation: 0.15,
    scale: 1.08,
    style: "ochre",
  },
  {
    id: "east-south",
    position: [5.7, -4],
    rotation: -0.16,
    scale: 0.96,
    style: "slate",
  },
  {
    id: "east-market",
    position: [5.8, 1],
    rotation: 0.1,
    scale: 1.08,
    style: "plaster",
  },
  {
    id: "east-north",
    position: [5.4, 5],
    rotation: -0.13,
    scale: 0.98,
    style: "brick",
  },
] as const;

export const CITY_STORY_TARGETS: readonly CityPoint2[] = [
  [-5, -5],
  [5, -5],
  [-5, 4],
  [4, 5],
  [-4, 0],
  [5, 0],
  [0, -7],
] as const;

export const CITY_PLAYER_SPAWN: CityPoint2 = [0, 7];

export const CITY_LANDMARK_ANCHORS = {
  marketCrossing: [0, 0] as CityPoint2,
  threshold: [0, -7] as CityPoint2,
  marketWell: [2.65, -1.55] as CityPoint2,
  bellTower: [0, -9.85] as CityPoint2,
} as const;

export const CITY_MARKET_STALL_POSITIONS: readonly CityPoint2[] = [
  [2.75, -1.95],
  [-2.55, 2.25],
  [2.9, 1.95],
] as const;

export const CITY_SIGN_POSITIONS: readonly CityPoint2[] = [
  [-2.55, -3.5],
  [2.45, 3.15],
  [-3, 2.5],
] as const;

export const CITY_STREET_LAMP_POSITIONS: readonly CityPoint2[] = [
  [-2.45, -2.1],
  [2.35, 2.15],
] as const;

export const CITY_DEBRIS_POSITIONS: readonly CityPoint2[] = [
  [-2.5, -2.4],
  [2.7, -3.1],
  [-2.55, 3.2],
  [2.4, 3.2],
] as const;

export const CITY_ROAD_WEAR_POSITIONS: readonly CityPoint2[] = [
  [-0.68, 2.8],
  [0.72, 1.8],
  [-0.66, -2.35],
  [0.58, -3.35],
] as const;

export const CITY_PLANTER_POSITIONS: readonly CityPoint2[] = [
  [-3.05, -2.8],
  [2.82, 2.55],
  [-2.58, 3.4],
] as const;

export const CITY_MARKET_CITIZEN_POSITIONS: readonly CityPoint2[] = [
  [1.95, 2.4],
  [-2.5, 3.65],
  [2.78, -3.2],
] as const;

/** Low-profile street stones avoid blocking any interaction target. */
export const CITY_STREET_STONES: readonly CityPoint2[] = [
  [-0.68, 6.1],
  [0.42, 5.35],
  [-0.34, 4.45],
  [0.63, 3.55],
  [-0.52, 2.6],
  [0.44, 1.7],
  [-0.62, 0.86],
  [0.46, -0.1],
  [-0.45, -1.08],
  [0.52, -2.1],
  [-0.32, -3.08],
  [0.55, -4.12],
  [-0.4, -5.15],
  [0.35, -6.1],
] as const;

export const CITY_QUALITY_COUNTS: Record<CityQualityPreset, {
  streetStones: number;
  marketProps: number;
  skylineTowers: number;
}> = {
  low: { streetStones: 7, marketProps: 2, skylineTowers: 3 },
  medium: { streetStones: 14, marketProps: 4, skylineTowers: 5 },
  high: { streetStones: 14, marketProps: 6, skylineTowers: 7 },
};

export function cityDistanceToTarget(
  point: CityPoint2,
  target: CityPoint2,
): number {
  return Math.hypot(point[0] - target[0], point[1] - target[1]);
}

export function citySiteClearsTarget(
  site: CityBuildingSite,
  target: CityPoint2,
  radius = 2.35,
): boolean {
  return cityDistanceToTarget(site.position, target) > radius;
}
