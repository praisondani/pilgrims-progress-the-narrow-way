import {
  Color,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Material,
} from "three";
import type {
  HeroMaterialId,
  HeroPalette,
} from "./types";

export type HeroMaterials = Record<HeroMaterialId, Material>;

function standard(
  name: string,
  color: string,
  roughness: number,
  metalness = 0,
) {
  const material = new MeshStandardMaterial({
    color: new Color(color),
    roughness,
    metalness,
  });
  material.name = `hero.material.${name}`;
  material.dithering = true;
  return material;
}

function physical(
  name: string,
  color: string,
  roughness: number,
  options: {
    metalness?: number;
    clearcoat?: number;
    clearcoatRoughness?: number;
    sheen?: number;
    sheenColor?: string;
    sheenRoughness?: number;
  } = {},
) {
  // Keep the hero on one standard PBR shader family. The previous collection
  // of per-material clearcoat and sheen combinations compiled several physical
  // shader variants before the first gameplay frame, yet those micro-highlights
  // were not visible at the third-person camera distance.
  const material = new MeshStandardMaterial({
    color: new Color(color),
    roughness,
    metalness: options.metalness ?? 0,
  });
  material.name = `hero.material.${name}`;
  material.dithering = true;
  return material;
}

export function createHeroMaterials(palette: HeroPalette): HeroMaterials {
  const catchlight = new MeshBasicMaterial({
    color: new Color("#fffdf4"),
    toneMapped: false,
  });
  catchlight.name = "hero.material.catchlight";

  return {
    skin: physical("skin", palette.skin, 0.61, {
      clearcoat: 0.08,
      clearcoatRoughness: 0.78,
      sheen: 0.08,
      sheenColor: "#d9a085",
      sheenRoughness: 0.82,
    }),
    skinShadow: physical("skinShadow", palette.skinShadow, 0.68, {
      sheen: 0.04,
      sheenColor: "#c9856b",
    }),
    hair: physical("hair", palette.hair, 0.86, {
      sheen: 0.3,
      sheenColor: "#5b4030",
      sheenRoughness: 0.62,
    }),
    eyeWhite: physical("eyeWhite", palette.eyeWhite, 0.24, {
      clearcoat: 0.6,
      clearcoatRoughness: 0.18,
    }),
    iris: physical("iris", palette.iris, 0.32, {
      clearcoat: 0.35,
      clearcoatRoughness: 0.2,
    }),
    pupil: standard("pupil", palette.pupil, 0.38),
    catchlight,
    mouth: physical("mouth", "#74483f", 0.52, {
      clearcoat: 0.08,
      clearcoatRoughness: 0.5,
    }),
    linen: physical("linen", palette.linen, 0.96, {
      sheen: 0.16,
      sheenColor: "#eee2c9",
      sheenRoughness: 0.9,
    }),
    linenShadow: physical("linenShadow", palette.linenShadow, 1, {
      sheen: 0.08,
      sheenColor: "#c9b99b",
    }),
    tunic: physical("tunic", palette.tunic, 0.91, {
      sheen: 0.12,
      sheenColor: "#b96851",
      sheenRoughness: 0.88,
    }),
    tunicShadow: physical("tunicShadow", palette.tunicShadow, 0.97, {
      sheen: 0.04,
    }),
    trousers: physical("trousers", palette.trousers, 0.96, {
      sheen: 0.1,
      sheenColor: "#4a4c58",
      sheenRoughness: 0.9,
    }),
    legWrap: physical("legWrap", palette.legWrap, 1, {
      sheen: 0.06,
      sheenColor: "#c4ae8a",
    }),
    leather: physical("leather", palette.leather, 0.73, {
      clearcoat: 0.06,
      clearcoatRoughness: 0.68,
      sheen: 0.12,
      sheenColor: "#7a5037",
    }),
    leatherDark: physical("leatherDark", palette.leatherDark, 0.84, {
      sheen: 0.06,
    }),
    brass: physical("brass", palette.brass, 0.34, {
      metalness: 0.78,
      clearcoat: 0.12,
      clearcoatRoughness: 0.3,
    }),
    steel: physical("steel", palette.steel, 0.28, {
      metalness: 0.88,
      clearcoat: 0.08,
      clearcoatRoughness: 0.22,
    }),
    burden: physical("burden", palette.burden, 0.98, {
      sheen: 0.06,
      sheenColor: "#5f5144",
    }),
    burdenShadow: standard("burdenShadow", palette.burdenShadow, 1),
    rope: physical("rope", palette.rope, 1, {
      sheen: 0.08,
      sheenColor: "#a08662",
    }),
    parchment: physical("parchment", palette.parchment, 0.9, {
      sheen: 0.06,
      sheenColor: "#efe0b5",
    }),
    seal: physical("seal", palette.seal, 0.48, {
      clearcoat: 0.2,
      clearcoatRoughness: 0.36,
    }),
  };
}
