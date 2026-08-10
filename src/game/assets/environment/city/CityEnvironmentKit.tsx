import { Sparkles } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  BackSide,
  BoxGeometry,
  BufferGeometry,
  CapsuleGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Fog,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Path,
  Shape,
  SphereGeometry,
  StaticDrawUsage,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  CITY_BUILDING_SITES,
  CITY_DEBRIS_POSITIONS,
  CITY_LANDMARK_ANCHORS,
  CITY_MARKET_CITIZEN_POSITIONS,
  CITY_MARKET_STALL_POSITIONS,
  CITY_PLANTER_POSITIONS,
  CITY_QUALITY_COUNTS,
  CITY_ROAD_WEAR_POSITIONS,
  CITY_SIGN_POSITIONS,
  CITY_STREET_LAMP_POSITIONS,
  CITY_STREET_STONES,
  citySiteClearsTarget,
  type CityBuildingSite,
  type CityQualityPreset,
  type CityPoint2,
} from "./composition";

type LocalTransform = {
  local: [x: number, y: number, z: number];
  scale: [x: number, y: number, z: number];
  rotation?: number;
};

const CITY_STYLE_COLORS = {
  plaster: {
    facade: "#ad7177",
    roof: "#5b4759",
    beam: "#c9946a",
    window: "#2c3440",
  },
  brick: {
    facade: "#b56558",
    roof: "#624752",
    beam: "#d29264",
    window: "#29303a",
  },
  ochre: {
    facade: "#c4935e",
    roof: "#604c57",
    beam: "#d7aa70",
    window: "#30323b",
  },
  slate: {
    facade: "#7b929c",
    roof: "#4b5a68",
    beam: "#bc9674",
    window: "#293846",
  },
} as const;

const CITY_FACADE_MATERIAL = new MeshStandardMaterial({
  color: "#ffffff",
  roughness: 0.88,
  emissive: "#2a1d28",
  emissiveIntensity: 0.2,
  vertexColors: true,
});
const CITY_ROOF_MATERIAL = new MeshStandardMaterial({
  color: "#ffffff",
  roughness: 0.94,
  emissive: "#241d2a",
  emissiveIntensity: 0.14,
  vertexColors: true,
});
const CITY_BEAM_MATERIAL = new MeshStandardMaterial({
  color: "#ffffff",
  roughness: 0.84,
  emissive: "#2d1c1b",
  emissiveIntensity: 0.2,
  vertexColors: true,
});
const CITY_WINDOW_MATERIAL = new MeshStandardMaterial({
  color: "#ffffff",
  roughness: 0.58,
  metalness: 0.05,
  emissive: "#c16b3d",
  emissiveIntensity: 0.82,
  vertexColors: true,
});
const CITY_TRIM_MATERIAL = new MeshStandardMaterial({
  color: "#b98463",
  roughness: 0.82,
  vertexColors: true,
});
const CITY_AWNING_MATERIAL = new MeshStandardMaterial({
  color: "#8d4e4c",
  roughness: 0.9,
  vertexColors: true,
});
const CITY_DOOR_FRAME_MATERIAL = new MeshStandardMaterial({
  color: "#8d6248",
  roughness: 0.88,
  vertexColors: true,
});
const CITY_DOOR_MATERIAL = new MeshStandardMaterial({
  color: "#46302d",
  roughness: 0.92,
});
const CITY_CHIMNEY_MATERIAL = new MeshStandardMaterial({
  color: "#4f4042",
  roughness: 1,
});
const CITY_STONE_MATERIAL = new MeshStandardMaterial({
  color: "#5b5860",
  roughness: 0.97,
});
const CITY_STONE_LIGHT_MATERIAL = new MeshStandardMaterial({
  color: "#756b69",
  roughness: 0.93,
});
const CITY_WOOD_MATERIAL = new MeshStandardMaterial({
  color: "#50352d",
  roughness: 0.94,
});
const CITY_COBBLE_MATERIAL = new MeshStandardMaterial({
  color: "#5b555d",
  roughness: 1,
});
const CITY_FACADE_WEAR_MATERIAL = new MeshStandardMaterial({
  color: "#ffffff",
  roughness: 1,
  vertexColors: true,
});
const CITY_ROAD_WEAR_MATERIAL = new MeshStandardMaterial({
  color: "#58444a",
  roughness: 1,
  vertexColors: true,
});
const CITY_PLANTER_MATERIAL = new MeshStandardMaterial({
  color: "#9b5c43",
  roughness: 0.94,
});
const CITY_FOLIAGE_MATERIAL = new MeshStandardMaterial({
  color: "#6d8b54",
  roughness: 0.98,
});
const CITY_BANNER_MATERIAL = new MeshStandardMaterial({
  color: "#c77755",
  roughness: 0.92,
  side: 2,
});
const CITY_BANNER_DARK_MATERIAL = new MeshStandardMaterial({
  color: "#5b3d4b",
  roughness: 0.94,
  side: 2,
});
const CITY_CREST_MATERIAL = new MeshStandardMaterial({
  color: "#d2a45f",
  emissive: "#7f482c",
  emissiveIntensity: 0.55,
  roughness: 0.56,
  metalness: 0.24,
});
const CITY_SKYLINE_BODY_MATERIAL = new MeshStandardMaterial({
  color: "#ffffff",
  emissive: "#9a5065",
  emissiveIntensity: 0.48,
  roughness: 0.96,
  vertexColors: true,
});
const CITY_SKYLINE_ROOF_MATERIAL = new MeshStandardMaterial({
  color: "#ffffff",
  emissive: "#b96375",
  emissiveIntensity: 0.58,
  roughness: 1,
  vertexColors: true,
});
const CITY_HORIZON_MATERIAL = new MeshBasicMaterial({
  color: "#ffffff",
  side: BackSide,
  vertexColors: true,
  toneMapped: false,
});
const CITY_SKY_MATERIAL = new MeshStandardMaterial({
  color: "#ffffff",
  emissive: "#171522",
  emissiveIntensity: 0.24,
  roughness: 1,
  side: BackSide,
  vertexColors: true,
  depthWrite: false,
});

/**
 * Adds a restrained authored value breakup to the low-poly kits. The
 * instanced style color still carries the palette; this attribute only keeps
 * broad faces from reading as one flat, unlit color while costing no draws.
 */
function addMaterialBreakup(geometry: ExtrudeGeometry, strength: number) {
  const position = geometry.getAttribute("position");
  const colors = new Float32Array(position.count * 3);
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const variation =
      Math.sin(x * 4.7 + y * 2.3 + z * 1.9) * 0.55 +
      Math.sin(x * 9.1 - y * 3.4) * 0.25;
    const shade = 1 + variation * strength;
    colors[index * 3] = shade;
    colors[index * 3 + 1] = shade * 0.96;
    colors[index * 3 + 2] = shade * 0.94;
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
}

function variedStyleColor(value: string, index: number) {
  const color = new Color(value);
  color.offsetHSL(0, index % 2 === 0 ? 0.008 : -0.006, [-0.035, 0.018, 0.042][index % 3]);
  return `#${color.getHexString()}`;
}

function setGeometryColor(geometry: BufferGeometry, value: string) {
  const position = geometry.getAttribute("position");
  const color = new Color(value);
  const colors = new Float32Array(position.count * 3);
  for (let index = 0; index < position.count; index += 1) {
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
}

function shiftedCityColor(value: string, lightness: number, saturation = 0) {
  const color = new Color(value);
  color.offsetHSL(0, saturation, lightness);
  return `#${color.getHexString()}`;
}

function setGeometryVerticalRamp(
  geometry: BufferGeometry,
  bottomValue: string,
  topValue: string,
) {
  const position = geometry.getAttribute("position");
  const bottom = new Color(bottomValue);
  const top = new Color(topValue);
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (let index = 0; index < position.count; index += 1) {
    const y = position.getY(index);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const height = Math.max(0.001, maxY - minY);
  const colors = new Float32Array(position.count * 3);
  const color = new Color();
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const t = Math.max(0, Math.min(1, (y - minY) / height));
    color.lerpColors(bottom, top, t);
    // A restrained side-to-side drift keeps repeated silhouettes from reading
    // as a single flat swatch without introducing another material or draw.
    const drift = 1 + Math.sin(x * 0.19 + z * 0.13) * 0.035;
    colors[index * 3] = color.r * drift;
    colors[index * 3 + 1] = color.g * drift;
    colors[index * 3 + 2] = color.b * drift;
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
}

function setGeometryDepthHaze(
  geometry: BufferGeometry,
  hazeValue: string,
  startRadius: number,
  endRadius: number,
  strength: number,
) {
  const position = geometry.getAttribute("position");
  const colorAttribute = geometry.getAttribute("color");
  if (!colorAttribute) return;
  const haze = new Color(hazeValue);
  const color = new Color();
  const radiusSpan = Math.max(0.001, endRadius - startRadius);
  for (let index = 0; index < position.count; index += 1) {
    const radius = Math.hypot(position.getX(index), position.getZ(index));
    const depth = Math.max(0, Math.min(1, (radius - startRadius) / radiusSpan));
    if (depth === 0) continue;
    color.fromBufferAttribute(colorAttribute, index);
    color.lerp(haze, depth * strength);
    colorAttribute.setXYZ(index, color.r, color.g, color.b);
  }
  colorAttribute.needsUpdate = true;
}

/**
 * One low-poly, grounded city edge closes the view in every orbit. A low
 * continuous plinth keeps the horizon grounded while narrower upper blocks
 * step in and out around the ring, giving the rear view a connected skyline
 * instead of one featureless perimeter wall. Twelve segments are used on
 * mobile (288 triangles); fourteen elsewhere (336).
 */
function makeGroundedCityHorizonGeometry(segmentCount: number) {
  const radius = 22;
  const depth = 1.35;
  const arc = (Math.PI * 2 * radius) / segmentCount;
  const segmentWidth = arc * 1.06;
  const baseHeights = [0.24, 0.32, 0.2, 0.38, 0.28, 0.34, 0.22, 0.32, 0.26, 0.36, 0.18, 0.3, 0.24, 0.34];
  const skylineHeights = [2.56, 3.26, 2.34, 3.68, 2.82, 3.42, 2.48, 3.52, 2.7, 3.18, 2.3, 3.34, 2.76, 3.58];
  const palette = [
    ["#4d3c49", "#5b4655"],
    ["#58424d", "#664e5b"],
    ["#493946", "#564353"],
    ["#604853", "#705565"],
    ["#51404c", "#5f4a59"],
    ["#5d4651", "#684f5e"],
    ["#463746", "#544251"],
  ] as const;
  const parts: BufferGeometry[] = [];

  for (let index = 0; index < segmentCount; index += 1) {
    const angle = (index / segmentCount) * Math.PI * 2;
    const baseHeight = baseHeights[index % baseHeights.length];
    const skylineHeight = skylineHeights[index % skylineHeights.length];
    const upperHeight = skylineHeight - baseHeight;
    const rotation = Math.PI / 2 - angle;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const [bodyColor, upperColor] = palette[index % palette.length];

    const body = new BoxGeometry(segmentWidth, baseHeight, depth);
    body.translate(0, baseHeight * 0.5, 0);
    body.rotateY(rotation);
    body.translate(x, 0, z);
    setGeometryVerticalRamp(
      body,
      shiftedCityColor(bodyColor, -0.025, 0.008),
      shiftedCityColor(bodyColor, 0.11, -0.004),
    );
    parts.push(body);

    const upper = new BoxGeometry(segmentWidth * 0.46, upperHeight, depth * 0.9);
    upper.translate(0, baseHeight + upperHeight * 0.5, 0);
    upper.rotateY(rotation);
    upper.translate(
      Math.cos(angle) * (radius - 0.28),
      0,
      Math.sin(angle) * (radius - 0.28),
    );
    setGeometryVerticalRamp(
      upper,
      shiftedCityColor(upperColor, -0.035, 0.006),
      shiftedCityColor(upperColor, 0.12, -0.006),
    );
    parts.push(upper);
  }

  // A sparse middle course bridges the playable island to the outer skyline.
  // Deep footprints overlap the tower skirts, while the gaps keep the ring
  // from becoming another continuous wall.
  const midgroundPalette = [
    ["#5a414d", "#825767"],
    ["#664753", "#916170"],
    ["#543e4b", "#795366"],
    ["#6b4a55", "#966575"],
  ] as const;
  const midgroundBlueprints = [
    { angle: 30, radius: 17.4, height: 1.15, width: 2.0, depth: 3.8, roofX: 1.2, roofZ: 1.65, cluster: true },
    { angle: 90, radius: 18.7, height: 1.62, width: 2.6, depth: 3.0, roofX: 1.55, roofZ: 1.4, cluster: false },
    { angle: 150, radius: 19.2, height: 1.32, width: 2.3, depth: 3.6, roofX: 1.4, roofZ: 1.9, cluster: true },
    { angle: 210, radius: 17.8, height: 1.86, width: 2.8, depth: 3.1, roofX: 1.7, roofZ: 1.5, cluster: false },
    { angle: 270, radius: 19.4, height: 1.28, width: 2.2, depth: 4.0, roofX: 1.25, roofZ: 1.8, cluster: true },
    { angle: 330, radius: 18.1, height: 1.58, width: 2.5, depth: 3.2, roofX: 1.55, roofZ: 1.55, cluster: false },
    { angle: 0, radius: 17.6, height: 1.42, width: 2.1, depth: 3.7, roofX: 1.3, roofZ: 1.8, cluster: true },
    { angle: 180, radius: 19.0, height: 1.75, width: 2.7, depth: 3.2, roofX: 1.65, roofZ: 1.45, cluster: false },
  ] as const;
  const midgroundCount = segmentCount === 12 ? 6 : midgroundBlueprints.length;
  for (let index = 0; index < midgroundCount; index += 1) {
    const blueprint = midgroundBlueprints[index];
    const angle = (blueprint.angle * Math.PI) / 180;
    const height = blueprint.height;
    const rotation = Math.PI / 2 - angle;
    const x = Math.cos(angle) * blueprint.radius;
    const z = Math.sin(angle) * blueprint.radius;
    const [bodyColor, roofColor] = midgroundPalette[index % midgroundPalette.length];

    const block = new BoxGeometry(blueprint.width, height, blueprint.depth);
    block.translate(0, height * 0.5, 0);
    block.rotateY(rotation);
    block.translate(x, 0, z);
    setGeometryVerticalRamp(
      block,
      shiftedCityColor(bodyColor, -0.035, 0.008),
      shiftedCityColor(bodyColor, 0.12, -0.006),
    );
    parts.push(block);

    const roof = new ConeGeometry(1, 0.44, 4, 1, true);
    roof.scale(blueprint.roofX, 1, blueprint.roofZ);
    roof.rotateY(rotation + Math.PI / 4);
    roof.translate(x, height + 0.22, z);
    setGeometryVerticalRamp(
      roof,
      shiftedCityColor(roofColor, -0.03, 0.006),
      shiftedCityColor(roofColor, 0.14, -0.008),
    );
    parts.push(roof);

    if (blueprint.cluster) {
      const annexHeight = height * 0.52;
      const annex = new BoxGeometry(blueprint.width * 0.42, annexHeight, blueprint.depth * 0.46);
      annex.translate(blueprint.width * 0.42, annexHeight * 0.5, -blueprint.depth * 0.12);
      annex.rotateY(rotation);
      annex.translate(x, 0, z);
      setGeometryVerticalRamp(
        annex,
        shiftedCityColor(bodyColor, 0.005, -0.008),
        shiftedCityColor(bodyColor, 0.14, -0.01),
      );
      parts.push(annex);

      const annexRoof = new ConeGeometry(1, 0.3, 4, 1, true);
      annexRoof.scale(blueprint.roofX * 0.62, 1, blueprint.roofZ * 0.58);
      annexRoof.rotateY(rotation + Math.PI / 4);
      const annexRadialOffset = -blueprint.depth * 0.12;
      annexRoof.translate(
        x +
          Math.cos(rotation) * blueprint.width * 0.42 +
          Math.cos(angle) * annexRadialOffset,
        height + annexHeight + 0.15,
        z -
          Math.sin(rotation) * blueprint.width * 0.42 +
          Math.sin(angle) * annexRadialOffset,
      );
      setGeometryVerticalRamp(
        annexRoof,
        shiftedCityColor(roofColor, 0.005, -0.008),
        shiftedCityColor(roofColor, 0.16, -0.012),
      );
      parts.push(annexRoof);
    }
  }

  // Sparse outer silhouettes keep the dusk field from ending at the island's
  // edge. They are deliberately grounded, low, and discontinuous so the
  // horizon reads as distant terrain rather than another enclosing wall.
  const outerPalette = [
    ["#343444", "#4b465c"],
    ["#3c394b", "#57516a"],
    ["#303143", "#46435a"],
    ["#443c4d", "#5f5269"],
  ] as const;
  const outerBlueprints = [
    { angle: 0, radius: 25.6, height: 0.8, width: 4.6, depth: 2.5, roofX: 1.6, roofZ: 1.25 },
    { angle: 60, radius: 26.8, height: 1.2, width: 5.4, depth: 2.8, roofX: 1.9, roofZ: 1.4 },
    { angle: 120, radius: 25.2, height: 0.95, width: 3.8, depth: 2.2, roofX: 1.35, roofZ: 1.1 },
    { angle: 180, radius: 26.5, height: 1.45, width: 5.8, depth: 2.7, roofX: 2.0, roofZ: 1.35 },
    { angle: 240, radius: 25.8, height: 0.72, width: 4.4, depth: 2.4, roofX: 1.5, roofZ: 1.2 },
    { angle: 300, radius: 27.1, height: 1.1, width: 5.1, depth: 3.0, roofX: 1.8, roofZ: 1.5 },
    { angle: 30, radius: 26.2, height: 1.05, width: 3.9, depth: 2.4, roofX: 1.45, roofZ: 1.2 },
    { angle: 210, radius: 26.1, height: 1.25, width: 4.8, depth: 2.6, roofX: 1.7, roofZ: 1.3 },
  ] as const;
  const outerCount = segmentCount === 12 ? 6 : outerBlueprints.length;
  for (let index = 0; index < outerCount; index += 1) {
    const blueprint = outerBlueprints[index];
    const angle = (blueprint.angle * Math.PI) / 180;
    const rotation = Math.PI / 2 - angle;
    const x = Math.cos(angle) * blueprint.radius;
    const z = Math.sin(angle) * blueprint.radius;
    const [bodyColor, roofColor] = outerPalette[index % outerPalette.length];

    const mass = new BoxGeometry(blueprint.width, blueprint.height, blueprint.depth);
    mass.translate(0, blueprint.height * 0.5, 0);
    mass.rotateY(rotation);
    mass.translate(x, 0, z);
    setGeometryVerticalRamp(mass, bodyColor, shiftedCityColor(bodyColor, 0.12, -0.01));
    parts.push(mass);

    const roof = new ConeGeometry(1, 0.36, 4, 1, true);
    roof.scale(blueprint.roofX, 1, blueprint.roofZ);
    roof.rotateY(rotation + Math.PI / 4);
    roof.translate(x, blueprint.height + 0.18, z);
    setGeometryVerticalRamp(roof, roofColor, shiftedCityColor(roofColor, 0.14, -0.012));
    parts.push(roof);
  }

  // Low, broken berms extend the island's ground language to the outer
  // silhouettes. Each footprint reaches back toward the skyline plinth, but
  // the generous angular gaps keep this from becoming a second annulus.
  const bermPalette = [
    ["#493b4b", "#665466"],
    ["#523f4e", "#705a6b"],
    ["#443849", "#5d4d61"],
    ["#59434f", "#755d6b"],
  ] as const;
  const bermBlueprints = [
    { angle: 0, radius: 25.45, height: 0.58, width: 7.1, depth: 5.25 },
    { angle: 60, radius: 26.5, height: 0.76, width: 7.6, depth: 5.35 },
    { angle: 120, radius: 25.2, height: 0.48, width: 6.2, depth: 5.05 },
    { angle: 180, radius: 26.35, height: 0.9, width: 7.9, depth: 5.55 },
    { angle: 240, radius: 25.65, height: 0.46, width: 6.6, depth: 5.1 },
    { angle: 300, radius: 26.85, height: 0.72, width: 7.2, depth: 5.35 },
    { angle: 30, radius: 25.95, height: 0.63, width: 5.9, depth: 4.9 },
    { angle: 210, radius: 25.9, height: 0.8, width: 6.7, depth: 5.2 },
  ] as const;
  const bermCount = segmentCount === 12 ? 6 : bermBlueprints.length;
  for (let index = 0; index < bermCount; index += 1) {
    const blueprint = bermBlueprints[index];
    const angle = (blueprint.angle * Math.PI) / 180;
    const rotation = Math.PI / 2 - angle;
    const x = Math.cos(angle) * blueprint.radius;
    const z = Math.sin(angle) * blueprint.radius;
    const [baseColor, topColor] = bermPalette[index % bermPalette.length];

    const berm = new CylinderGeometry(0.72, 1.04, blueprint.height, 6, 1, true);
    berm.scale(blueprint.width * 0.5, 1, blueprint.depth * 0.5);
    berm.translate(0, blueprint.height * 0.5, 0);
    berm.rotateY(rotation);
    berm.translate(x, 0, z);
    setGeometryVerticalRamp(
      berm,
      shiftedCityColor(baseColor, -0.025, 0.006),
      shiftedCityColor(topColor, 0.045, -0.006),
    );
    parts.push(berm);

    // A short inset step breaks the berm's profile and gives the distant
    // bodies a believable shelf to grow from without adding another draw.
    const terraceHeight = Math.min(0.24, blueprint.height * 0.42);
    const terrace = new CylinderGeometry(0.48, 0.74, terraceHeight, 6, 1, true);
    terrace.scale(blueprint.width * 0.34, 1, blueprint.depth * 0.3);
    terrace.translate(0, blueprint.height + terraceHeight * 0.5 - 0.02, blueprint.depth * 0.08);
    terrace.rotateY(rotation);
    terrace.translate(x, 0, z);
    setGeometryVerticalRamp(
      terrace,
      shiftedCityColor(baseColor, 0.025, 0.004),
      shiftedCityColor(topColor, 0.09, -0.01),
    );
    parts.push(terrace);

    // Cylinder caps are intentionally open for the inward-facing horizon
    // material. A flipped, six-sided top patch supplies a readable terrace
    // plane without introducing a double-sided terrain material or draw.
    const terraceTop = new CircleGeometry(1, 6);
    terraceTop.scale(blueprint.width * 0.34, blueprint.depth * 0.3, 1);
    terraceTop.rotateX(Math.PI / 2);
    terraceTop.rotateY(rotation);
    terraceTop.translate(
      x + Math.cos(angle) * blueprint.depth * 0.08,
      blueprint.height + terraceHeight - 0.015,
      z + Math.sin(angle) * blueprint.depth * 0.08,
    );
    setGeometryColor(terraceTop, shiftedCityColor(topColor, 0.08, -0.01));
    parts.push(terraceTop);
  }

  // Blend only the farthest radial vertices toward the dusk horizon. This
  // softens toy-like contrast while preserving the saturated front path and
  // the authored color ramps on the playable island.
  parts.forEach((part) =>
    setGeometryDepthHaze(part, "#705260", 22, 29, 0.22),
  );

  const compatible = parts.map((part) => {
    const geometry = part.toNonIndexed();
    part.dispose();
    geometry.deleteAttribute("uv");
    geometry.deleteAttribute("tangent");
    return geometry;
  });
  const geometry = mergeGeometries(compatible, false);
  compatible.forEach((part) => part.dispose());
  if (!geometry) throw new Error("City horizon geometry merge failed");
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function makeCityDuskDomeGeometry(quality: CityQualityPreset) {
  const geometry = new SphereGeometry(
    29,
    quality === "low" ? 12 : 16,
    quality === "low" ? 6 : 8,
  );
  const position = geometry.getAttribute("position");
  const horizon = new Color("#705260");
  const zenith = new Color("#171a29");
  const haze = new Color("#86616b");
  const colors = new Float32Array(position.count * 3);
  for (let index = 0; index < position.count; index += 1) {
    const elevation = Math.max(
      0,
      Math.min(1, (position.getY(index) + 18) / 38),
    );
    const color = horizon.clone().lerp(zenith, elevation);
    // A narrow warm band at the lower dome gives the distant berms a shared
    // atmospheric value. The azimuth drift is intentionally tiny so the
    // backdrop never reads as a painted radial gradient or a new shell.
    const hazeBand = (1 - elevation) * 0.1;
    color.lerp(haze, hazeBand);
    const azimuth = Math.atan2(position.getZ(index), position.getX(index));
    const valueDrift = Math.sin(azimuth * 2.2 + elevation * 3.7) * 0.012 * hazeBand;
    color.offsetHSL(0, 0, valueDrift);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  return geometry;
}

function makeSkylineTowerBodyGeometry() {
  const skirt = new BoxGeometry(1.24, 0.24, 1.1);
  skirt.translate(0, 0.12, 0);
  const upper = new BoxGeometry(1, 0.76, 0.85);
  upper.translate(0, 0.62, 0);
  const parts = [skirt, upper].map((part) => {
    const geometry = part.toNonIndexed();
    part.dispose();
    geometry.deleteAttribute("uv");
    geometry.deleteAttribute("tangent");
    return geometry;
  });
  const geometry = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  if (!geometry) throw new Error("City tower body geometry merge failed");
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  setGeometryVerticalRamp(geometry, "#d9b7bf", "#fff0d2");
  return geometry;
}

type CityBuildingProfile = "steep" | "broad";

function makeFacadeGeometry(profileKind: CityBuildingProfile) {
  const steep = profileKind === "steep";
  const facadeProfile = new Shape();
  facadeProfile.moveTo(-1, 0);
  facadeProfile.lineTo(-0.96, steep ? 1.42 : 1.26);
  facadeProfile.lineTo(-0.54, steep ? 1.72 : 1.48);
  facadeProfile.lineTo(-0.12, steep ? 1.57 : 1.38);
  facadeProfile.lineTo(0.34, steep ? 1.84 : 1.57);
  facadeProfile.lineTo(0.88, steep ? 1.54 : 1.42);
  facadeProfile.lineTo(1, steep ? 1.36 : 1.24);
  facadeProfile.lineTo(1, 0);
  facadeProfile.closePath();
  const geometry = new ExtrudeGeometry(facadeProfile, {
    depth: 1.62,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.045,
    bevelThickness: 0.045,
    curveSegments: 2,
  });
  geometry.translate(0, 0, -0.81);
  geometry.computeVertexNormals();
  return geometry;
}

function makeRoofGeometry(profile: CityBuildingProfile) {
  const steep = profile === "steep";
  const roofProfile = new Shape();
  roofProfile.moveTo(-1.2, 0);
  roofProfile.lineTo(-0.94, steep ? 0.38 : 0.26);
  roofProfile.lineTo(-0.42, steep ? 1.02 : 0.72);
  roofProfile.lineTo(0, steep ? 1.24 : 0.9);
  roofProfile.lineTo(0.48, steep ? 1.0 : 0.7);
  roofProfile.lineTo(0.96, steep ? 0.36 : 0.25);
  roofProfile.lineTo(1.2, 0);
  roofProfile.closePath();
  const geometry = new ExtrudeGeometry(roofProfile, {
    depth: 1.86,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.035,
    bevelThickness: 0.04,
    curveSegments: 2,
  });
  geometry.translate(0, 1.45, -0.93);
  geometry.computeVertexNormals();
  return geometry;
}

function makeThresholdGeometry() {
  const outer = new Shape();
  outer.moveTo(-1.84, 0);
  outer.lineTo(1.84, 0);
  outer.lineTo(1.84, 2.68);
  outer.quadraticCurveTo(1.75, 3.5, 0, 3.68);
  outer.quadraticCurveTo(-1.75, 3.5, -1.84, 2.68);
  outer.closePath();

  const opening = new Path();
  opening.moveTo(-1.02, 0);
  opening.lineTo(1.02, 0);
  opening.lineTo(1.02, 2.4);
  opening.quadraticCurveTo(0.95, 2.78, 0, 2.88);
  opening.quadraticCurveTo(-0.95, 2.78, -1.02, 2.4);
  opening.closePath();
  outer.holes.push(opening);

  const geometry = new ExtrudeGeometry(outer, {
    depth: 0.76,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.05,
    bevelThickness: 0.06,
    curveSegments: 3,
  });
  geometry.translate(0, 0, -0.38);
  geometry.computeVertexNormals();
  return geometry;
}

function placeLocal(
  dummy: Object3D,
  site: CityBuildingSite,
  transform: LocalTransform,
) {
  const [localX, localY, localZ] = transform.local;
  const cos = Math.cos(site.rotation);
  const sin = Math.sin(site.rotation);
  dummy.position.set(
    site.position[0] + localX * cos - localZ * sin,
    localY,
    site.position[1] + localX * sin + localZ * cos,
  );
  dummy.rotation.set(0, site.rotation + (transform.rotation ?? 0), 0);
  dummy.scale.set(
    site.scale * transform.scale[0],
    site.scale * transform.scale[1],
    site.scale * transform.scale[2],
  );
  dummy.updateMatrix();
}

function CityBuildingBatches({
  sites,
  mobile,
}: {
  sites: readonly CityBuildingSite[];
  mobile: boolean;
}) {
  const facade = useRef<InstancedMesh>(null);
  const facadeAlt = useRef<InstancedMesh>(null);
  const roof = useRef<InstancedMesh>(null);
  const roofAlt = useRef<InstancedMesh>(null);
  const beams = useRef<InstancedMesh>(null);
  const windows = useRef<InstancedMesh>(null);
  const windowTrim = useRef<InstancedMesh>(null);
  const awnings = useRef<InstancedMesh>(null);
  const facadeWear = useRef<InstancedMesh>(null);
  const doors = useRef<InstancedMesh>(null);
  const doorFrames = useRef<InstancedMesh>(null);
  const chimneys = useRef<InstancedMesh>(null);

  const geometries = useMemo(
    () => {
      const facade = makeFacadeGeometry("steep");
      const facadeAlt = makeFacadeGeometry("broad");
      const roof = makeRoofGeometry("steep");
      const roofAlt = makeRoofGeometry("broad");
      addMaterialBreakup(facade, 0.075);
      addMaterialBreakup(facadeAlt, 0.075);
      addMaterialBreakup(roof, 0.045);
      addMaterialBreakup(roofAlt, 0.045);
      return {
        facade,
        facadeAlt,
        roof,
        roofAlt,
        beam: new BoxGeometry(1, 1, 1),
        window: new BoxGeometry(1, 1, 1),
        windowTrim: new BoxGeometry(1, 1, 1),
        awning: new BoxGeometry(1, 1, 1),
        wear: new BoxGeometry(1, 1, 1),
        door: new BoxGeometry(1, 1, 1),
        doorFrame: new BoxGeometry(1, 1, 1),
        chimney: new BoxGeometry(1, 1, 1),
      };
    },
    [],
  );

  const detailTransforms = useMemo(() => {
    const beamTransforms: LocalTransform[] = [];
    const windowTransforms: LocalTransform[] = [];
    const windowTrimTransforms: LocalTransform[] = [];
    const awningTransforms: LocalTransform[] = [];
    const wearTransforms: LocalTransform[] = [];
    const doorTransforms: LocalTransform[] = [];
    const doorFrameTransforms: LocalTransform[] = [];
    const chimneyTransforms: LocalTransform[] = [];
    sites.forEach((site) => {
      const style = CITY_STYLE_COLORS[site.style];
      beamTransforms.push(
        { local: [-0.68, 0.74, 0.84], scale: [0.1, 1.28, 0.1], rotation: -0.12 },
        { local: [0.67, 0.74, 0.84], scale: [0.1, 1.28, 0.1], rotation: 0.12 },
        { local: [0, 0.46, 0.84], scale: [1.62, 0.1, 0.1] },
        { local: [0, 1.35, 0.84], scale: [1.55, 0.09, 0.1] },
        { local: [0, 1.84, 0], scale: [0.1, 0.72, 0.1], rotation: 0.18 },
      );
      windowTransforms.push(
        { local: [-0.48, 0.86, 0.88], scale: [0.33, 0.42, 0.055] },
        { local: [0.48, 0.86, 0.88], scale: [0.33, 0.42, 0.055] },
      );
      windowTrimTransforms.push(
        { local: [-0.48, 0.86, 0.84], scale: [0.43, 0.52, 0.035] },
        { local: [0.48, 0.86, 0.84], scale: [0.43, 0.52, 0.035] },
      );
      awningTransforms.push(
        { local: [-0.48, 1.13, 0.9], scale: [0.52, 0.07, 0.16], rotation: -0.08 },
        { local: [0.48, 1.13, 0.9], scale: [0.52, 0.07, 0.16], rotation: 0.08 },
      );
      wearTransforms.push(
        { local: [-0.72, 0.57, 0.9], scale: [0.32, 0.11, 0.03], rotation: -0.12 },
        { local: [0.7, 1.46, 0.9], scale: [0.18, 0.28, 0.026], rotation: 0.08 },
      );

      doorTransforms.push({ local: [0, 0.37, 0.88], scale: [0.42, 0.72, 0.08] });
      doorFrameTransforms.push({ local: [0, 0.38, 0.84], scale: [0.56, 0.86, 0.05] });
      chimneyTransforms.push({ local: [0.54, 2.1, -0.24], scale: [0.25, 0.62, 0.25] });
    });
    return {
      beamTransforms,
      windowTransforms,
      windowTrimTransforms,
      awningTransforms,
      wearTransforms,
      doorTransforms,
      doorFrameTransforms,
      chimneyTransforms,
    };
  }, [sites]);

  useLayoutEffect(() => {
    if (sites.length === 0) return;
    const dummy = new Object3D();
    const setBatch = (
      mesh: InstancedMesh | null,
      transforms: readonly LocalTransform[],
      colorFor: (index: number, site: CityBuildingSite) => string,
    ) => {
      if (!mesh) return;
      mesh.instanceMatrix.setUsage(StaticDrawUsage);
      transforms.forEach((transform, index) => {
        const site = sites[Math.floor(index / (transforms.length / sites.length))];
        if (!site) return;
        placeLocal(dummy, site, transform);
        mesh.setMatrixAt(index, dummy.matrix);
        mesh.setColorAt(index, new Color(colorFor(index, site)));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();
    };

    const setBuildingBatch = (
      mesh: InstancedMesh | null,
      profile: CityBuildingProfile,
      localY: number,
      colorFor: (index: number, site: CityBuildingSite) => string,
    ) => {
      if (!mesh) return;
      mesh.instanceMatrix.setUsage(StaticDrawUsage);
      sites.forEach((site, index) => {
        placeLocal(dummy, site, { local: [0, localY, 0], scale: [1, 1, 1] });
        const siteProfile =
          site.style === "plaster" || site.style === "ochre" ? "steep" : "broad";
        if (siteProfile !== profile) dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
        mesh.setColorAt(index, new Color(colorFor(index, site)));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    };

    setBuildingBatch(facade.current, "steep", 0.08, (index, site) => variedStyleColor(CITY_STYLE_COLORS[site.style].facade, index));
    setBuildingBatch(facadeAlt.current, "broad", 0.08, (index, site) => variedStyleColor(CITY_STYLE_COLORS[site.style].facade, index));
    setBuildingBatch(roof.current, "steep", 0, (index, site) => variedStyleColor(CITY_STYLE_COLORS[site.style].roof, index));
    setBuildingBatch(roofAlt.current, "broad", 0, (index, site) => variedStyleColor(CITY_STYLE_COLORS[site.style].roof, index));
    setBatch(beams.current, detailTransforms.beamTransforms, (_, site) => CITY_STYLE_COLORS[site.style].beam);
    setBatch(windowTrim.current, detailTransforms.windowTrimTransforms, (_, site) => CITY_STYLE_COLORS[site.style].beam);
    setBatch(awnings.current, detailTransforms.awningTransforms, (index) => index % 2 ? "#a45e55" : "#845053");
    setBatch(facadeWear.current, detailTransforms.wearTransforms, (index, site) => {
      if (site.style === "slate") return index % 2 ? "#b1bcb6" : "#596974";
      return index % 2 ? "#e0b789" : "#67434b";
    });
    setBatch(windows.current, detailTransforms.windowTransforms, (index, site) => {
      const siteIndex = Math.floor(index / 2);
      return siteIndex === 2 || siteIndex === 4 ? "#d98a4d" : CITY_STYLE_COLORS[site.style].window;
    });
    setBatch(doorFrames.current, detailTransforms.doorFrameTransforms, (_, site) => CITY_STYLE_COLORS[site.style].beam);
    setBatch(doors.current, detailTransforms.doorTransforms, () => "#46302d");
    setBatch(chimneys.current, detailTransforms.chimneyTransforms, () => "#4f4042");
  }, [detailTransforms, sites]);

  if (sites.length === 0) return null;
  return (
    <group name="city-authored-buildings">
      <instancedMesh
        ref={facade}
        args={[geometries.facade, CITY_FACADE_MATERIAL, sites.length]}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={facadeAlt}
        args={[geometries.facadeAlt, CITY_FACADE_MATERIAL, sites.length]}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={roof}
        args={[geometries.roof, CITY_ROOF_MATERIAL, sites.length]}
        castShadow
      />
      <instancedMesh
        ref={roofAlt}
        args={[geometries.roofAlt, CITY_ROOF_MATERIAL, sites.length]}
        castShadow
      />
      <instancedMesh
        ref={beams}
        args={[geometries.beam, CITY_BEAM_MATERIAL, detailTransforms.beamTransforms.length]}
        castShadow
      />
      <instancedMesh
        ref={windows}
        args={[geometries.window, CITY_WINDOW_MATERIAL, detailTransforms.windowTransforms.length]}
      />
      <instancedMesh
        ref={windowTrim}
        args={[geometries.windowTrim, CITY_TRIM_MATERIAL, detailTransforms.windowTrimTransforms.length]}
      />
      <instancedMesh
        ref={awnings}
        args={[geometries.awning, CITY_AWNING_MATERIAL, detailTransforms.awningTransforms.length]}
        castShadow
      />
      <instancedMesh
        ref={facadeWear}
        args={[geometries.wear, CITY_FACADE_WEAR_MATERIAL, detailTransforms.wearTransforms.length]}
        visible={!mobile}
      />
      <instancedMesh
        ref={doors}
        args={[geometries.door, CITY_DOOR_MATERIAL, detailTransforms.doorTransforms.length]}
      />
      <instancedMesh
        ref={doorFrames}
        args={[geometries.doorFrame, CITY_DOOR_FRAME_MATERIAL, detailTransforms.doorFrameTransforms.length]}
      />
      <instancedMesh
        ref={chimneys}
        args={[geometries.chimney, CITY_CHIMNEY_MATERIAL, detailTransforms.chimneyTransforms.length]}
        castShadow
      />
    </group>
  );
}

function CityLightRig({ mobile }: { mobile: boolean }) {
  return (
    <>
      <hemisphereLight
        color="#ffd9b4"
        groundColor="#443646"
        intensity={mobile ? 0.46 : 0.62}
      />
      <directionalLight
        position={[-6, 9, 8]}
        color="#ffdbb5"
        intensity={mobile ? 0.72 : 1.08}
      />
      <directionalLight
        position={[6, 7, 5]}
        color="#e8b3a2"
        intensity={mobile ? 0.38 : 0.66}
      />
      <pointLight
        position={[0, 5.5, 1.5]}
        color="#f2a06a"
        intensity={mobile ? 1.7 : 2.6}
        distance={18}
      />
    </>
  );
}

function CitySceneFog({ mobile }: { mobile: boolean }) {
  const { scene } = useThree();
  useEffect(() => {
    const previousFog = scene.fog;
    const cityFog = new Fog(
      "#4d3440",
      mobile ? 17.5 : 19,
      mobile ? 35 : 37,
    );
    scene.fog = cityFog;
    return () => {
      if (scene.fog === cityFog) scene.fog = previousFog;
    };
  }, [mobile, scene]);
  return null;
}

function CityStreet({ quality }: { quality: CityQualityPreset }) {
  const count = CITY_QUALITY_COUNTS[quality].streetStones;
  const stones = useMemo(() => CITY_STREET_STONES.slice(0, count), [count]);
  const stoneMesh = useRef<InstancedMesh>(null);
  const stoneGeometry = useMemo(() => new CylinderGeometry(0.2, 0.27, 0.08, 6), []);
  const roadWear = useMemo(
    () => CITY_ROAD_WEAR_POSITIONS.slice(0, quality === "low" ? 0 : 4),
    [quality],
  );
  const roadWearMesh = useRef<InstancedMesh>(null);
  const roadWearGeometry = useMemo(() => new BoxGeometry(1, 1, 1), []);
  useLayoutEffect(() => {
    if (!stoneMesh.current) return;
    const dummy = new Object3D();
    stoneMesh.current.instanceMatrix.setUsage(StaticDrawUsage);
    stones.forEach(([x, z], index) => {
      dummy.position.set(x, 0.1, z);
      dummy.rotation.set(0, index * 0.7, 0);
      dummy.scale.set(1.15 + (index % 3) * 0.18, 1, 0.82 + (index % 2) * 0.16);
      dummy.updateMatrix();
      stoneMesh.current?.setMatrixAt(index, dummy.matrix);
      stoneMesh.current?.setColorAt(index, new Color(index % 3 ? "#655e64" : "#83746e"));
    });
    stoneMesh.current.instanceMatrix.needsUpdate = true;
    if (stoneMesh.current.instanceColor) stoneMesh.current.instanceColor.needsUpdate = true;
  }, [stones]);
  useLayoutEffect(() => {
    if (!roadWearMesh.current) return;
    const dummy = new Object3D();
    roadWearMesh.current.instanceMatrix.setUsage(StaticDrawUsage);
    roadWear.forEach(([x, z], index) => {
      dummy.position.set(x, 0.073, z);
      dummy.rotation.set(0, index * 0.65, 0);
      dummy.scale.set(0.38 + (index % 2) * 0.16, 0.018, 0.14 + (index % 3) * 0.05);
      dummy.updateMatrix();
      roadWearMesh.current?.setMatrixAt(index, dummy.matrix);
      roadWearMesh.current?.setColorAt(index, new Color(index % 2 ? "#6c4a4a" : "#3f3942"));
    });
    roadWearMesh.current.instanceMatrix.needsUpdate = true;
    if (roadWearMesh.current.instanceColor) roadWearMesh.current.instanceColor.needsUpdate = true;
  }, [roadWear]);
  return (
    <group name="city-street-and-cobble">
      <mesh position={[0, 0.025, 0]} receiveShadow>
        <boxGeometry args={[2.45, 0.055, 15.7]} />
        <meshStandardMaterial color="#4e4b54" roughness={1} />
      </mesh>
      <mesh position={[0, 0.028, 0]} receiveShadow>
        <boxGeometry args={[13.8, 0.06, 1.5]} />
        <meshStandardMaterial color="#514c54" roughness={1} />
      </mesh>
      <mesh position={[-1.22, 0.064, 0]}>
        <boxGeometry args={[0.07, 0.018, 15.2]} />
        <meshStandardMaterial color="#8c7b6e" roughness={1} />
      </mesh>
      <mesh position={[1.22, 0.064, 0]}>
        <boxGeometry args={[0.07, 0.018, 15.2]} />
        <meshStandardMaterial color="#8c7b6e" roughness={1} />
      </mesh>
      {stones.length > 0 && (
        <instancedMesh
          ref={stoneMesh}
          args={[stoneGeometry, CITY_COBBLE_MATERIAL, stones.length]}
          castShadow
        />
      )}
      {roadWear.length > 0 && (
        <instancedMesh
          ref={roadWearMesh}
          args={[roadWearGeometry, CITY_ROAD_WEAR_MATERIAL, roadWear.length]}
        />
      )}
    </group>
  );
}

function CitySign({ position, index }: { position: CityPoint2; index: number }) {
  const faceColor = index % 2 ? "#d39a5d" : "#c4744f";
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, index % 2 ? -0.18 : 0.16, 0]}>
      <mesh position={[0, 0.62, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.07, 1.25, 6]} />
        <meshStandardMaterial color="#604238" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.18, 0]} castShadow>
        <boxGeometry args={[0.86, 0.52, 0.09]} />
        <meshStandardMaterial color={faceColor} roughness={0.84} />
      </mesh>
      <mesh position={[0, 1.49, 0]} rotation={[0, 0, index % 2 ? -0.08 : 0.08]}>
        <boxGeometry args={[1.02, 0.07, 0.13]} />
        <meshStandardMaterial color="#664236" roughness={0.9} />
      </mesh>
      {[-0.24, -0.06, 0.14, 0.3].map((x, glyphIndex) => (
        <mesh key={x} position={[x, 1.18 + (glyphIndex % 2) * 0.03, 0.054]}>
          <boxGeometry args={[0.07, glyphIndex % 2 ? 0.22 : 0.28, 0.012]} />
          <meshStandardMaterial color="#5c3340" roughness={0.76} />
        </mesh>
      ))}
    </group>
  );
}

function CityStreetLamp({
  position,
  lit,
}: {
  position: CityPoint2;
  lit: boolean;
}) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 0.92, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.09, 1.84, 7]} />
        <meshStandardMaterial color="#40343a" roughness={0.82} metalness={0.28} />
      </mesh>
      <mesh position={[0.15, 1.78, 0]} rotation={[0, 0, -0.55]}>
        <cylinderGeometry args={[0.045, 0.055, 0.42, 7]} />
        <meshStandardMaterial color="#4e3b3b" roughness={0.8} metalness={0.22} />
      </mesh>
      <mesh position={[0.29, 1.96, 0]}>
        <boxGeometry args={[0.2, 0.24, 0.2]} />
        <meshStandardMaterial
          color="#f1b26d"
          emissive="#be642f"
          emissiveIntensity={lit ? 1.4 : 0.75}
          roughness={0.4}
        />
      </mesh>
      {lit && <pointLight position={[0.29, 1.94, 0]} color="#ffab60" intensity={2.2} distance={5.6} />}
    </group>
  );
}

function CityDebris({ position, index }: { position: CityPoint2; index: number }) {
  const barrel = index % 2 === 0;
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, index * 0.7, 0]}>
      {barrel ? (
        <>
          <mesh position={[0, 0.34, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.34, 0.68, 8]} />
            <meshStandardMaterial color="#76503b" roughness={0.94} />
          </mesh>
          {[-0.2, 0.2].map((y) => (
            <mesh key={y} position={[0, 0.34 + y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.29, 0.025, 5, 12]} />
              <meshStandardMaterial color="#bb8756" roughness={0.82} metalness={0.18} />
            </mesh>
          ))}
        </>
      ) : (
        <>
          <mesh position={[0, 0.27, 0]} castShadow>
            <boxGeometry args={[0.58, 0.54, 0.58]} />
            <meshStandardMaterial color="#9a6846" roughness={0.94} />
          </mesh>
          <mesh position={[0, 0.27, 0.3]}>
            <boxGeometry args={[0.08, 0.62, 0.025]} />
            <meshStandardMaterial color="#5f4134" roughness={0.9} />
          </mesh>
          <mesh position={[0.3, 0.27, 0]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[0.08, 0.62, 0.025]} />
            <meshStandardMaterial color="#5f4134" roughness={0.9} />
          </mesh>
        </>
      )}
    </group>
  );
}

function CityStreetLife({ quality, mobile }: { quality: CityQualityPreset; mobile: boolean }) {
  const signs = CITY_SIGN_POSITIONS.slice(0, quality === "low" ? 1 : quality === "medium" ? 2 : 3);
  const lamps = CITY_STREET_LAMP_POSITIONS.slice(0, quality === "low" ? 1 : 2);
  const debris = CITY_DEBRIS_POSITIONS.slice(0, quality === "low" ? 1 : quality === "medium" ? 3 : 4);
  return (
    <group name="city-street-life">
      {signs.map((position, index) => <CitySign key={`sign-${index}`} position={position} index={index} />)}
      {lamps.map((position, index) => <CityStreetLamp key={`lamp-${index}`} position={position} lit={!mobile || index === 0} />)}
      {debris.map((position, index) => <CityDebris key={`debris-${index}`} position={position} index={index} />)}
    </group>
  );
}

const CITY_CITIZEN_BODY_MATERIAL = new MeshStandardMaterial({
  color: "#6d7961",
  roughness: 0.9,
});
const CITY_CITIZEN_HEAD_MATERIAL = new MeshStandardMaterial({
  color: "#b8785d",
  roughness: 0.82,
});
const CITY_CITIZEN_HAT_MATERIAL = new MeshStandardMaterial({
  color: "#c18c5f",
  roughness: 0.86,
});

function CityPlanters({ quality }: { quality: CityQualityPreset }) {
  const count = quality === "low" ? 1 : quality === "medium" ? 2 : 3;
  const positions = CITY_PLANTER_POSITIONS.slice(0, count);
  const pot = useRef<InstancedMesh>(null);
  const soil = useRef<InstancedMesh>(null);
  const foliage = useRef<InstancedMesh>(null);
  const geometries = useMemo(
    () => ({
      pot: new CylinderGeometry(0.28, 0.34, 0.5, 8),
      soil: new CylinderGeometry(0.22, 0.22, 0.045, 10),
      foliage: new DodecahedronGeometry(0.29, 0),
    }),
    [],
  );
  useLayoutEffect(() => {
    const dummy = new Object3D();
    [pot.current, soil.current, foliage.current].forEach((mesh) =>
      mesh?.instanceMatrix.setUsage(StaticDrawUsage),
    );
    positions.forEach(([x, z], index) => {
      dummy.position.set(x, 0.27, z);
      dummy.rotation.set(0, index * 0.7, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      pot.current?.setMatrixAt(index, dummy.matrix);
      dummy.position.y = 0.54;
      dummy.updateMatrix();
      soil.current?.setMatrixAt(index, dummy.matrix);
      dummy.position.y = 0.82;
      dummy.scale.set(1.15 + (index % 2) * 0.14, 1.2, 1.08);
      dummy.updateMatrix();
      foliage.current?.setMatrixAt(index, dummy.matrix);
    });
    [pot.current, soil.current, foliage.current].forEach((mesh) => {
      if (mesh) mesh.instanceMatrix.needsUpdate = true;
    });
  }, [positions]);
  return (
    <group name="city-authored-planters">
      <instancedMesh ref={pot} args={[geometries.pot, CITY_PLANTER_MATERIAL, positions.length]} castShadow />
      <instancedMesh
        ref={soil}
        args={[geometries.soil, CITY_PLANTER_MATERIAL, positions.length]}
      />
      <instancedMesh
        ref={foliage}
        args={[geometries.foliage, CITY_FOLIAGE_MATERIAL, positions.length]}
        castShadow
      />
    </group>
  );
}

function CityMarketCitizens({
  quality,
  reducedMotion,
}: {
  quality: CityQualityPreset;
  reducedMotion: boolean;
}) {
  const count = quality === "low" ? 1 : quality === "medium" ? 2 : 3;
  const positions = CITY_MARKET_CITIZEN_POSITIONS.slice(0, count);
  const root = useRef<Group>(null);
  const body = useRef<InstancedMesh>(null);
  const head = useRef<InstancedMesh>(null);
  const hat = useRef<InstancedMesh>(null);
  const arm = useRef<InstancedMesh>(null);
  const geometries = useMemo(
    () => ({
      body: new CapsuleGeometry(0.22, 0.38, 6, 10),
      head: new DodecahedronGeometry(0.19, 1),
      hat: new ConeGeometry(0.26, 0.2, 6),
      arm: new CapsuleGeometry(0.06, 0.28, 5, 7),
    }),
    [],
  );
  useFrame(({ clock }) => {
    if (!root.current || reducedMotion) return;
    root.current.position.y = Math.sin(clock.elapsedTime * 1.4) * 0.018;
    root.current.rotation.y = Math.sin(clock.elapsedTime * 0.45) * 0.035;
  });
  useLayoutEffect(() => {
    const dummy = new Object3D();
    [body.current, head.current, hat.current, arm.current].forEach((mesh) =>
      mesh?.instanceMatrix.setUsage(StaticDrawUsage),
    );
    positions.forEach(([x, z], index) => {
      const scale = 0.72 + (index % 2) * 0.05;
      const yaw = index % 2 ? -0.35 : 0.35;
      const cloth = new Color(index % 2 ? "#5d6e62" : "#8a4f4e");
      const accent = new Color(index % 2 ? "#c5a06a" : "#d19a62");
      dummy.position.set(x, 0.84, z);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      body.current?.setMatrixAt(index, dummy.matrix);
      body.current?.setColorAt(index, cloth);
      dummy.position.y = 1.3;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      head.current?.setMatrixAt(index, dummy.matrix);
      dummy.position.y = 1.48;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      hat.current?.setMatrixAt(index, dummy.matrix);
      hat.current?.setColorAt(index, accent);
      for (const side of [-1, 1]) {
        const armIndex = index * 2 + (side === 1 ? 1 : 0);
        dummy.position.set(x + side * 0.31 * scale, 0.78, z);
        dummy.rotation.set(0, yaw, side * -0.28);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        arm.current?.setMatrixAt(armIndex, dummy.matrix);
        arm.current?.setColorAt(armIndex, cloth);
      }
    });
    [body.current, head.current, hat.current, arm.current].forEach((mesh) => {
      if (mesh) {
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
    });
  }, [positions]);
  return (
    <group ref={root} name="city-market-citizens">
      <instancedMesh ref={body} args={[geometries.body, CITY_CITIZEN_BODY_MATERIAL, positions.length]} castShadow />
      <instancedMesh ref={head} args={[geometries.head, CITY_CITIZEN_HEAD_MATERIAL, positions.length]} castShadow />
      <instancedMesh ref={hat} args={[geometries.hat, CITY_CITIZEN_HAT_MATERIAL, positions.length]} castShadow />
      <instancedMesh ref={arm} args={[geometries.arm, CITY_CITIZEN_BODY_MATERIAL, positions.length * 2]} castShadow />
    </group>
  );
}

function MarketStall({ position, rotation = 0 }: { position: CityPoint2; rotation?: number }) {
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
      <mesh position={[-0.68, 0.72, 0]} castShadow>
        <boxGeometry args={[0.1, 1.4, 0.1]} />
        <primitive object={CITY_WOOD_MATERIAL} attach="material" />
      </mesh>
      <mesh position={[0.68, 0.72, 0]} castShadow>
        <boxGeometry args={[0.1, 1.4, 0.1]} />
        <primitive object={CITY_WOOD_MATERIAL} attach="material" />
      </mesh>
      <mesh position={[0, 1.32, 0]} castShadow>
        <boxGeometry args={[1.55, 0.12, 1.05]} />
        <meshStandardMaterial color="#a45843" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.38, 0.04]} receiveShadow>
        <boxGeometry args={[1.55, 0.12, 0.72]} />
        <meshStandardMaterial color="#6b4a3d" roughness={1} />
      </mesh>
    </group>
  );
}

function CityMarket({ quality }: { quality: CityQualityPreset }) {
  const count = CITY_QUALITY_COUNTS[quality].marketProps;
  return (
    <group name="city-market-dressing">
      {count >= 2 && <MarketStall position={CITY_MARKET_STALL_POSITIONS[0]} rotation={-0.18} />}
      {count >= 4 && <MarketStall position={CITY_MARKET_STALL_POSITIONS[1]} rotation={0.2} />}
      {count >= 6 && <MarketStall position={CITY_MARKET_STALL_POSITIONS[2]} rotation={Math.PI - 0.2} />}
      <group position={[CITY_LANDMARK_ANCHORS.marketWell[0], 0, CITY_LANDMARK_ANCHORS.marketWell[1]]}>
        <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.62, 0.7, 0.58, 10]} />
          <primitive object={CITY_STONE_MATERIAL} attach="material" />
        </mesh>
        <mesh position={[0, 0.68, 0]}>
          <torusGeometry args={[0.53, 0.08, 7, 14]} />
          <primitive object={CITY_STONE_LIGHT_MATERIAL} attach="material" />
        </mesh>
        <mesh position={[0, 0.78, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.4, 16]} />
          <meshStandardMaterial color="#242d39" roughness={0.62} metalness={0.12} />
        </mesh>
      </group>
    </group>
  );
}

function CityLantern({ reducedMotion }: { reducedMotion: boolean }) {
  const flame = useRef<Group>(null);
  const root = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 4.4) * 0.08;
    if (flame.current) flame.current.scale.set(pulse, 1.08 - pulse * 0.04, pulse);
    if (root.current) root.current.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.018;
  });
  return (
    <group ref={root} position={[0, 3.22, 0.44]} name="city-threshold-lantern">
      <mesh castShadow>
        <cylinderGeometry args={[0.11, 0.15, 0.62, 8]} />
        <meshStandardMaterial color="#40323a" roughness={0.78} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.42, 0.08, 0.42]} />
        <meshStandardMaterial color="#5a4140" roughness={0.7} metalness={0.28} />
      </mesh>
      <group ref={flame} position={[0, 0.57, 0]}>
        <mesh>
          <sphereGeometry args={[0.16, 12, 8]} />
          <meshStandardMaterial
            color="#ffd58a"
            emissive="#d9792f"
            emissiveIntensity={1.8}
            roughness={0.35}
          />
        </mesh>
      </group>
      <pointLight position={[0, 0.52, 0]} color="#f6a25a" intensity={3.3} distance={7} />
    </group>
  );
}

function CityThresholdLandmark({
  reducedMotion,
  mobile,
}: {
  reducedMotion: boolean;
  mobile: boolean;
}) {
  const thresholdGeometry = useMemo(() => makeThresholdGeometry(), []);
  return (
    <group
      position={[CITY_LANDMARK_ANCHORS.threshold[0], 0, CITY_LANDMARK_ANCHORS.threshold[1]]}
      name="city-threshold-landmark"
    >
      <mesh geometry={thresholdGeometry} castShadow receiveShadow>
        <primitive object={CITY_STONE_MATERIAL} attach="material" />
      </mesh>
      <mesh position={[0, 1.22, 0.42]} castShadow>
        <boxGeometry args={[1.85, 2.5, 0.1]} />
        <primitive object={CITY_DOOR_MATERIAL} attach="material" />
      </mesh>
      {[-0.58, 0, 0.58].map((x, index) => (
        <mesh key={x} position={[x, 1.24, 0.5]}>
          <boxGeometry args={[0.06, 2.25, 0.03]} />
          <meshStandardMaterial color={index === 1 ? "#795033" : "#3c2b2d"} roughness={0.84} />
        </mesh>
      ))}
      <mesh position={[0, 1.58, 0.56]} rotation={[0, 0, -0.18]}>
        <boxGeometry args={[2.08, 0.08, 0.04]} />
        <meshStandardMaterial color="#9c7047" roughness={0.74} metalness={0.16} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 1.42, 2.06, 0.41]} rotation={[0, 0, side * 0.08]}>
          <boxGeometry args={[0.34, 0.18, 0.84]} />
          <meshStandardMaterial color={side < 0 ? "#4d5b4c" : "#59664f"} roughness={1} />
        </mesh>
      ))}
      {!mobile && (
        <>
          {[-1, 1].map((side, index) => (
            <group key={`threshold-banner-${side}`} position={[side * 1.34, 2.1, 0.48]} rotation={[0, 0, side * 0.06]}>
              <mesh position={[0, 0.02, 0]}>
                <cylinderGeometry args={[0.025, 0.03, 1.28, 6]} />
                <meshStandardMaterial color="#5b4036" roughness={0.9} />
              </mesh>
              <mesh position={[0, -0.18, 0.025]}>
                <planeGeometry args={[0.54, 0.82]} />
                <primitive object={index === 0 ? CITY_BANNER_MATERIAL : CITY_BANNER_DARK_MATERIAL} attach="material" />
              </mesh>
              <mesh position={[0, 0.05, 0.055]}>
                <boxGeometry args={[0.12, 0.22, 0.018]} />
                <primitive object={CITY_CREST_MATERIAL} attach="material" />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 2.96, 0.48]} castShadow>
            <dodecahedronGeometry args={[0.3, 0]} />
            <primitive object={CITY_CREST_MATERIAL} attach="material" />
          </mesh>
        </>
      )}
      <CityLantern reducedMotion={reducedMotion} />
    </group>
  );
}

function CityBackdrop({ quality }: { quality: CityQualityPreset }) {
  const count = CITY_QUALITY_COUNTS[quality].skylineTowers;
  const horizonSegments = quality === "low" ? 12 : 14;
  const duskDomeGeometry = useMemo(
    () => makeCityDuskDomeGeometry(quality),
    [quality],
  );
  const horizonGeometry = useMemo(
    () => makeGroundedCityHorizonGeometry(horizonSegments),
    [horizonSegments],
  );
  const towers = [
    // Twelve authored placements keep a readable skyline in every heading;
    // the mobile slice takes the first eight while desktop adds the rest.
    [0, -20.2, 4.8, 2.2, "#684652", "#805865"],
    [14.3, -14.3, 5.4, 2.0, "#704b54", "#8c6069"],
    [20.6, 0, 4.4, 2.6, "#5f4351", "#795465"],
    [14.8, 14.8, 5.7, 2.3, "#754e57", "#93636c"],
    [0, 20.8, 4.8, 2.7, "#684658", "#805b6a"],
    [-14.8, 14.8, 5.3, 2.1, "#79525e", "#966772"],
    [-20.6, 0, 4.3, 2.4, "#624451", "#7d5863"],
    [-14.3, -14.3, 5.6, 2.2, "#714b5b", "#8b606f"],
    [7.4, -19.1, 4.6, 2.5, "#634351", "#7c5663"],
    [19.1, 7.4, 5.2, 2.15, "#754d57", "#93626b"],
    [-7.4, 19.1, 4.2, 2.55, "#664452", "#815968"],
    [-19.1, -7.4, 5.8, 2.35, "#79505a", "#966570"],
  ] as const;
  const visibleTowers = useMemo(() => towers.slice(0, count), [count]);
  const towerBodies = useRef<InstancedMesh>(null);
  const towerRoofs = useRef<InstancedMesh>(null);
  const towerWindows = useRef<InstancedMesh>(null);
  const towerBodyGeometry = useMemo(() => makeSkylineTowerBodyGeometry(), []);
  const towerRoofGeometry = useMemo(() => {
    const geometry = new ConeGeometry(1, 0.52, 4);
    setGeometryVerticalRamp(geometry, "#c59ba8", "#ffe0c5");
    return geometry;
  }, []);
  const towerWindowGeometry = useMemo(() => new BoxGeometry(1, 1, 1), []);

  useEffect(
    () => () => {
      duskDomeGeometry.dispose();
      horizonGeometry.dispose();
      towerBodyGeometry.dispose();
      towerRoofGeometry.dispose();
      towerWindowGeometry.dispose();
    },
    [
      duskDomeGeometry,
      horizonGeometry,
      towerBodyGeometry,
      towerRoofGeometry,
      towerWindowGeometry,
    ],
  );

  useLayoutEffect(() => {
    const dummy = new Object3D();
    const body = towerBodies.current;
    const roof = towerRoofs.current;
    const window = towerWindows.current;
    if (!body || !roof || !window) return;
    body.instanceMatrix.setUsage(StaticDrawUsage);
    roof.instanceMatrix.setUsage(StaticDrawUsage);
    window.instanceMatrix.setUsage(StaticDrawUsage);
    visibleTowers.forEach(([x, z, height, width, bodyColor, roofColor], index) => {
      const towerRotation = Math.atan2(x, z);
      dummy.position.set(x, 0, z);
      dummy.rotation.set(0, towerRotation, 0);
      dummy.scale.set(width, height, 1.5);
      dummy.updateMatrix();
      body.setMatrixAt(index, dummy.matrix);
      body.setColorAt(index, new Color(bodyColor));

      dummy.position.set(x, height + 0.26, z);
      dummy.rotation.set(0, towerRotation + Math.PI / 4, 0);
      dummy.scale.set(width * 0.78, 1, width * 0.78);
      dummy.updateMatrix();
      roof.setMatrixAt(index, dummy.matrix);
      roof.setColorAt(index, new Color(roofColor));

      const facing = Math.atan2(-x, -z);
      const inwardX = Math.sin(facing);
      const inwardZ = Math.cos(facing);
      const tangentX = Math.cos(facing);
      const tangentZ = -Math.sin(facing);
      for (let slot = 0; slot < 3; slot += 1) {
        const lateral = (slot - 1) * width * 0.28;
        const windowIndex = index * 3 + slot;
        dummy.position.set(
          x + inwardX * 0.68 + tangentX * lateral,
          height * (0.42 + (slot % 2) * 0.16),
          z + inwardZ * 0.68 + tangentZ * lateral,
        );
        dummy.rotation.set(0, facing, 0);
        dummy.scale.set(width * 0.14, height * 0.085, 0.04);
        dummy.updateMatrix();
        window.setMatrixAt(windowIndex, dummy.matrix);
        window.setColorAt(windowIndex, new Color(slot === 1 ? "#f4b56c" : "#dd8a55"));
      }
    });
    [body, roof, window].forEach((mesh) => {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
  }, [visibleTowers]);

  return (
    <group name="city-depth-backdrop">
      <mesh
        name="city-dusk-dome"
        geometry={duskDomeGeometry}
        material={CITY_SKY_MATERIAL}
        position={[0, 3, 0]}
        renderOrder={-10}
        frustumCulled={false}
      />
      <mesh
        name="city-grounded-horizon"
        geometry={horizonGeometry}
        material={CITY_HORIZON_MATERIAL}
      />
      <mesh position={[0, 1.08, -10.35]} receiveShadow>
        <boxGeometry args={[17.8, 2.16, 0.7]} />
        <meshStandardMaterial
          color="#4b3e4b"
          emissive="#292531"
          emissiveIntensity={0.12}
          roughness={1}
        />
      </mesh>
      <mesh position={[-20.35, 2.47, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[9.85, 0.28, 1.24]} />
        <meshStandardMaterial color="#a87363" emissive="#523c44" emissiveIntensity={0.08} roughness={0.9} />
      </mesh>
      {[-4.35, 4.35].map((x) => (
        <mesh key={x} position={[x, 1.35, -9.35]} castShadow>
          <boxGeometry args={[0.48, 2.72, 1.16]} />
          <meshStandardMaterial color={x < 0 ? "#594452" : "#5d594c"} roughness={0.98} />
        </mesh>
      ))}
      {visibleTowers.length > 0 && (
        <>
          <instancedMesh
            ref={towerBodies}
            args={[towerBodyGeometry, CITY_SKYLINE_BODY_MATERIAL, visibleTowers.length]}
            castShadow
          />
          <instancedMesh
            ref={towerRoofs}
            args={[towerRoofGeometry, CITY_SKYLINE_ROOF_MATERIAL, visibleTowers.length]}
            castShadow
          />
          <instancedMesh
            ref={towerWindows}
            args={[towerWindowGeometry, CITY_WINDOW_MATERIAL, visibleTowers.length * 3]}
          />
        </>
      )}
      <mesh position={[-20.5, 0.36, 0]} rotation={[0, Math.PI / 2, -0.08]}>
        <boxGeometry args={[3.6, 0.72, 0.46]} />
        <meshStandardMaterial color="#66505a" roughness={1} />
      </mesh>
      <mesh position={[20.5, 0.4, 0]} rotation={[0, Math.PI / 2, 0.08]}>
        <boxGeometry args={[3.5, 0.8, 0.46]} />
        <meshStandardMaterial color="#5c4b57" roughness={1} />
      </mesh>
    </group>
  );
}

export interface CityEnvironmentKitProps {
  target: CityPoint2;
  quality?: CityQualityPreset;
  reducedMotion?: boolean;
}

export function CityEnvironmentKit({
  target,
  quality = "medium",
  reducedMotion = false,
}: CityEnvironmentKitProps) {
  const mobile = typeof window !== "undefined" && window.innerWidth <= 720;
  const effectiveQuality: CityQualityPreset = mobile ? "low" : quality;
  const visibleSites = useMemo(
    () => CITY_BUILDING_SITES.filter((site) => citySiteClearsTarget(site, target)),
    [target],
  );
  return (
    <group name="city-environment-kit" dispose={null}>
      <group name="city-atmosphere" dispose={null}>
        <CitySceneFog mobile={mobile} />
      </group>
      <CityLightRig mobile={mobile} />
      <CityStreet quality={effectiveQuality} />
      <CityBackdrop quality={effectiveQuality} />
      <CityBuildingBatches sites={visibleSites} mobile={mobile} />
      {!mobile && visibleSites.some((site) => site.id === "west-north") && (
        <pointLight
          position={[-5.5, 0.95, 4.85]}
          color="#f1a15a"
          intensity={2.1}
          distance={4.8}
        />
      )}
      <CityMarket quality={effectiveQuality} />
      <CityStreetLife quality={effectiveQuality} mobile={mobile} />
      <CityPlanters quality={effectiveQuality} />
      <CityMarketCitizens quality={effectiveQuality} reducedMotion={reducedMotion} />
      <CityThresholdLandmark reducedMotion={reducedMotion} mobile={mobile} />
      <Sparkles
        count={mobile ? 20 : 42}
        scale={[14, 6.5, 14]}
        position={[0, 2.45, -0.8]}
        color="#efad79"
        size={mobile ? 1.7 : 2.15}
        speed={reducedMotion ? 0 : 0.08}
        opacity={0.28}
      />
    </group>
  );
}
