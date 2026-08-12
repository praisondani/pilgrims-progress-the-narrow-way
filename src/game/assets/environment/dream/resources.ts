import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Material,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  PointsMaterial,
  SphereGeometry,
  TorusGeometry,
  Uint32BufferAttribute,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  DREAM_KEYFRAME_ANCHORS,
  DREAM_PORTRAIT_CORRIDOR_POINTS,
  DREAM_STREAM_CONTROL_POINTS,
} from "./composition";
import { DreamSeededRandom } from "./seed";
import type {
  DreamEnvironmentPalette,
  DreamQualityPreset,
  DreamWaterStyle,
} from "./types";

export interface DreamEnvironmentGeometries {
  treeNear: BufferGeometry;
  treeFar: BufferGeometry;
  shrub: BufferGeometry;
  shrubFar: BufferGeometry;
  grass: BufferGeometry;
  rock: BufferGeometry;
  reed: BufferGeometry;
  groundPatch: BufferGeometry;
  ridge: BufferGeometry;
  path: BufferGeometry;
  streamBed: BufferGeometry;
  stream: BufferGeometry;
  depthMasses: BufferGeometry;
  moon: BufferGeometry;
  motes: BufferGeometry;
  lanternBaseRock: BufferGeometry;
  lanternFrame: BufferGeometry;
  lanternGlass: BufferGeometry;
  lanternFlame: BufferGeometry;
}

export interface DreamEnvironmentMaterials {
  treeNear: Material;
  treeFar: Material;
  shrub: Material;
  grass: Material;
  rock: Material;
  reed: Material;
  groundPatch: Material;
  ridge: Material;
  path: Material;
  streamBed: Material;
  stream: Material | null;
  depthMasses: Material;
  moon: Material;
  motes: PointsMaterial;
  lanternBaseRock: Material;
  lanternFrame: Material;
  lanternGlass: Material;
  lanternFlame: Material;
}

export interface DreamEnvironmentResources {
  geometries: DreamEnvironmentGeometries;
  materials: DreamEnvironmentMaterials;
  readonly disposed: boolean;
  retain: () => void;
  release: () => void;
  dispose: () => void;
}

function merged(parts: BufferGeometry[]) {
  const compatible = parts.map((part) => {
    const geometry = part.index ? part.toNonIndexed() : part;
    if (geometry !== part) part.dispose();
    if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
    geometry.deleteAttribute("uv");
    geometry.deleteAttribute("tangent");
    return geometry;
  });
  const geometry = mergeGeometries(compatible, false);
  compatible.forEach((part) => part.dispose());
  if (!geometry) throw new Error("Dream environment geometry merge failed");
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Keep the authored low-poly silhouettes, but give broad faces a restrained
 * value drift so moonlight can describe them instead of flattening each kit
 * into one color. Vertex colors ride the existing instanced draw calls.
 */
function addDreamMaterialBreakup(geometry: BufferGeometry, strength: number) {
  const position = geometry.getAttribute("position");
  const colors = new Float32Array(position.count * 3);
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const variation =
      Math.sin(x * 3.9 + y * 2.1 + z * 1.7) * 0.55 +
      Math.sin(x * 8.3 - z * 4.2) * 0.22;
    const shade = 1 + variation * strength;
    colors[index * 3] = shade;
    colors[index * 3 + 1] = shade * 0.98;
    colors[index * 3 + 2] = shade * 0.94;
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
}

function tintDreamHorizonBands(geometry: BufferGeometry) {
  const position = geometry.getAttribute("position");
  const color = geometry.getAttribute("color");
  if (!color) return;
  for (let index = 0; index < position.count; index += 1) {
    const depth = Math.min(1, Math.max(0, (position.getZ(index) - 10) / 8));
    if (depth <= 0) continue;
    const band =
      position.getY(index) < 1.2
        ? 0.78
        : position.getY(index) < 2.5
          ? 0.88
          : 0.98;
    const haze = depth * 0.28;
    color.setXYZ(
      index,
      color.getX(index) * band * (0.88 - haze * 0.2) + haze * 0.1,
      color.getY(index) * band * (0.96 - haze * 0.14) + haze * 0.2,
      color.getZ(index) * Math.min(1.08, band + 0.16) + haze * 0.26,
    );
  }
  color.needsUpdate = true;
}

function createNearTreeGeometry() {
  const trunk = new CylinderGeometry(0.16, 0.46, 4.75, 6, 1);
  trunk.translate(0, 2.375, 0);
  const leftBranch = new CylinderGeometry(0.08, 0.14, 1.35, 5, 1);
  leftBranch.rotateZ(-0.67);
  leftBranch.translate(-0.45, 4.48, 0);
  const rightBranch = new CylinderGeometry(0.07, 0.13, 1.25, 5, 1);
  rightBranch.rotateZ(0.76);
  rightBranch.rotateY(0.42);
  rightBranch.translate(0.42, 4.2, 0.1);
  const highTwig = new CylinderGeometry(0.05, 0.09, 0.92, 4, 1);
  highTwig.rotateZ(-0.35);
  highTwig.translate(-0.12, 5.15, -0.05);
  const lowerCanopy = new DodecahedronGeometry(0.72, 0);
  lowerCanopy.scale(1.12, 0.66, 0.92);
  lowerCanopy.translate(-0.28, 4.55, 0);
  const upperCanopy = new DodecahedronGeometry(0.58, 0);
  upperCanopy.scale(0.94, 0.74, 0.84);
  upperCanopy.translate(0.3, 5.45, 0.06);
  return merged([
    trunk,
    leftBranch,
    rightBranch,
    highTwig,
    lowerCanopy,
    upperCanopy,
  ]);
}

function createFarTreeGeometry() {
  const trunk = new CylinderGeometry(0.14, 0.4, 4.55, 5, 1);
  trunk.translate(0, 2.275, 0);
  const canopy = new DodecahedronGeometry(0.78, 0);
  canopy.scale(1.04, 0.72, 0.9);
  canopy.translate(-0.18, 4.75, 0);
  return merged([trunk, canopy]);
}

function createGrassGeometry() {
  const blades = [-0.13, 0, 0.13].map((x, index) => {
    const blade = new ConeGeometry(
      0.036,
      0.42 + index * 0.07,
      4,
      1,
    );
    blade.rotateZ((index - 1) * 0.16);
    blade.translate(x, 0.23 + index * 0.035, 0);
    return blade;
  });
  return merged(blades);
}

function createShrubGeometry() {
  const left = new DodecahedronGeometry(0.36, 0);
  left.scale(1.08, 0.66, 0.86);
  left.translate(-0.24, 0.27, 0);
  const center = new DodecahedronGeometry(0.42, 0);
  center.scale(1, 0.78, 0.92);
  center.translate(0.06, 0.34, 0.02);
  const right = new DodecahedronGeometry(0.31, 0);
  right.scale(1.04, 0.68, 0.9);
  right.translate(0.34, 0.24, -0.04);
  return merged([left, center, right]);
}

function createFarShrubGeometry() {
  const shrub = new DodecahedronGeometry(0.48, 0);
  shrub.scale(1.18, 0.58, 0.86);
  shrub.translate(0, 0.28, 0);
  return shrub;
}

function createRidgeGeometry() {
  const left = new DodecahedronGeometry(0.62, 0);
  left.scale(1.35, 0.52, 0.9);
  left.translate(-0.48, 0.28, 0);
  const center = new DodecahedronGeometry(0.72, 0);
  center.scale(1.5, 0.58, 0.96);
  center.translate(0.18, 0.34, -0.04);
  const right = new DodecahedronGeometry(0.5, 0);
  right.scale(1.25, 0.48, 0.85);
  right.translate(0.78, 0.24, 0.05);
  return merged([left, center, right]);
}

function createReedGeometry() {
  const stems = [-0.12, 0.02, 0.14].map((x, index) => {
    const stem = new ConeGeometry(0.035, 0.72 + index * 0.12, 3, 1);
    stem.rotateZ((index - 1) * 0.08);
    stem.translate(x, 0.4 + index * 0.05, 0);
    return stem;
  });
  return merged(stems);
}

function createStreamGeometry(quality: DreamQualityPreset) {
  const segments = quality === "low" ? 16 : quality === "medium" ? 24 : 32;
  const curve = new CatmullRomCurve3(
    DREAM_STREAM_CONTROL_POINTS.map(
      ([x, z]) => new Vector3(x, 0.075, z),
    ),
  );
  const positions: number[] = [];
  const indices: number[] = [];
  const dreamAcross: number[] = [];
  for (let index = 0; index <= segments; index += 1) {
    // Keep the stream inside the authored terrain ring so the reverse orbit
    // cannot expose a hard water-sheet cut at the camera-facing endpoint.
    const progress = 0.08 + (index / segments) * 0.84;
    const point = curve.getPoint(progress);
    const tangent = curve.getTangent(progress);
    const normal = new Vector3(-tangent.z, 0, tangent.x).normalize();
    const endpointTaper =
      0.015 + Math.sin(((progress - 0.08) / 0.84) * Math.PI) * 0.985;
    const width =
      0.44 +
      Math.sin(progress * Math.PI * 3.2) * 0.05 +
      progress * 0.06;
    const taperedWidth = width * endpointTaper;
    const left = point.clone().addScaledVector(normal, taperedWidth);
    const right = point.clone().addScaledVector(normal, -taperedWidth);
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    dreamAcross.push(0, 1);
    // Omit the four terminal quads.  Their near-zero-width triangles can still
    // project as pale shards when the orbit camera looks across the ribbon.
    if (index > 3 && index < segments - 3) {
      const offset = index * 2;
      indices.push(
        offset,
        offset + 1,
        offset + 2,
        offset + 1,
        offset + 3,
        offset + 2,
      );
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(new Uint32BufferAttribute(indices, 1));
  geometry.setAttribute(
    "dreamAcross",
    new Float32BufferAttribute(dreamAcross, 1),
  );
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function createStreamBedGeometry(quality: DreamQualityPreset) {
  const segments = quality === "low" ? 16 : quality === "medium" ? 24 : 32;
  const curve = new CatmullRomCurve3(
    DREAM_STREAM_CONTROL_POINTS.map(
      ([x, z]) => new Vector3(x, 0.025, z),
    ),
  );
  const positions: number[] = [];
  const indices: number[] = [];
  for (let index = 0; index <= segments; index += 1) {
    const progress = 0.08 + (index / segments) * 0.84;
    const point = curve.getPoint(progress);
    const tangent = curve.getTangent(progress);
    const normal = new Vector3(-tangent.z, 0, tangent.x).normalize();
    const endpointTaper =
      0.015 + Math.sin(((progress - 0.08) / 0.84) * Math.PI) * 0.985;
    const width =
      0.68 +
      Math.sin(progress * Math.PI * 3.2) * 0.07 +
      progress * 0.1;
    const taperedWidth = width * endpointTaper;
    const left = point.clone().addScaledVector(normal, taperedWidth);
    const right = point.clone().addScaledVector(normal, -taperedWidth);
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    if (index > 0 && index < segments - 1) {
      const offset = index * 2;
      indices.push(
        offset,
        offset + 1,
        offset + 2,
        offset + 1,
        offset + 3,
        offset + 2,
      );
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(new Uint32BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function createPathGeometry(quality: DreamQualityPreset) {
  const segments = quality === "low" ? 18 : quality === "medium" ? 28 : 36;
  const curve = new CatmullRomCurve3(
    DREAM_PORTRAIT_CORRIDOR_POINTS.map(
      ([x, z]) => new Vector3(x, 0.11, z),
    ),
  );
  const positions: number[] = [];
  const indices: number[] = [];
  for (let index = 0; index <= segments; index += 1) {
    // The portrait route is already framed by ground dressing; keeping the
    // visible ribbon inside its middle bend avoids end-cap projections during
    // a 360-degree orbit while preserving the walkable lantern approach.
    const progress = 0.34 + (index / segments) * 0.56;
    const point = curve.getPoint(progress);
    const tangent = curve.getTangent(progress);
    const normal = new Vector3(-tangent.z, 0, tangent.x).normalize();
    // Preserve the full authored corridor width at the unused end vertices;
    // terminal quads are omitted below, so the orbit never sees end-cap shards.
    const endpointTaper = 1;
    const width =
      1 +
      (1 - progress) * 0.2 +
      Math.sin(progress * Math.PI * 4) * 0.055;
    const taperedWidth = width * endpointTaper;
    const left = point.clone().addScaledVector(normal, taperedWidth);
    const right = point.clone().addScaledVector(normal, -taperedWidth);
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    // Do not render terminal quads: the route stays broad for collision and
    // guidance bounds while its camera-facing end remains visually hidden.
    if (index > 3 && index < segments - 3) {
      const offset = index * 2;
      indices.push(
        offset,
        offset + 1,
        offset + 2,
        offset + 1,
        offset + 3,
        offset + 2,
      );
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(new Uint32BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function createMoteGeometry(quality: DreamQualityPreset) {
  const count = quality === "low" ? 24 : quality === "medium" ? 42 : 64;
  const positions = new Float32Array(count * 3);
  const random = new DreamSeededRandom(`dream-motes:${quality}`);
  for (let index = 0; index < count; index += 1) {
    const angle = index * 2.399963229728653;
    const radius = 1.7 + random.range(0, 8.2);
    positions[index * 3] = Math.sin(angle) * radius;
    positions[index * 3 + 1] = random.range(0.45, 3.8);
    positions[index * 3 + 2] = Math.cos(angle) * radius;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function createLanternFrameGeometry() {
  const post = new CylinderGeometry(0.08, 0.12, 1.62, 6, 1);
  post.translate(0, 0.775, 0);
  const hood = new ConeGeometry(0.42, 0.32, 5, 1);
  hood.translate(0, 1.83, 0);
  const hook = new TorusGeometry(0.34, 0.04, 5, 12, Math.PI * 1.15);
  hook.rotateZ(-0.18);
  hook.translate(0.2, 2.03, 0);
  return merged([post, hood, hook]);
}

function createMossArchGeometry() {
  const leftPier = new BoxGeometry(0.48, 1.85, 0.58);
  leftPier.translate(-1.38, 0.925, 0);
  const rightPier = new BoxGeometry(0.48, 1.85, 0.58);
  rightPier.translate(1.38, 0.925, 0);
  const arch = new TorusGeometry(1.38, 0.27, 3, 12, Math.PI);
  arch.translate(0, 1.82, 0);
  return merged([leftPier, rightPier, arch]);
}

function createBankStripGeometry(
  curve: CatmullRomCurve3,
  side: -1 | 1,
  innerWidth: number,
  outerWidth: number,
  innerHeight: number,
  outerHeight: number,
  segments: number,
) {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let index = 0; index <= segments; index += 1) {
    const progress = 0.08 + (index / segments) * 0.64;
    const point = curve.getPoint(progress);
    const tangent = curve.getTangent(progress);
    const normal = new Vector3(-tangent.z, 0, tangent.x).normalize();
    const variation = Math.sin(progress * Math.PI * 4.2) * 0.07;
    const endpointTaper =
      0.015 + Math.sin((index / segments) * Math.PI) * 0.985;
    const inner = point
      .clone()
      .addScaledVector(
        normal,
        side * (innerWidth + variation) * endpointTaper,
      );
    const outer = point
      .clone()
      .addScaledVector(
        normal,
        side * (outerWidth + variation * 1.35) * endpointTaper,
      );
    inner.y = innerHeight;
    outer.y = outerHeight;
    positions.push(inner.x, inner.y, inner.z, outer.x, outer.y, outer.z);
    if (index < segments) {
      const midpoint = curve.getPoint(
        0.08 + ((index + 0.5) / segments) * 0.64,
      );
      if (
        Math.hypot(
          midpoint.x - DREAM_KEYFRAME_ANCHORS.streamCrossing[0],
          midpoint.z - DREAM_KEYFRAME_ANCHORS.streamCrossing[1],
        ) < 1.35
      )
        continue;
      const offset = index * 2;
      indices.push(
        offset,
        offset + 1,
        offset + 2,
        offset + 1,
        offset + 3,
        offset + 2,
      );
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(new Uint32BufferAttribute(indices, 1));
  return geometry;
}

/**
 * A low, irregular rear ridge keeps the reverse orbit from ending in a single
 * faceted boulder. It is a shallow authored silhouette rather than a wall, so
 * fog can layer it into the moonlit horizon without adding a draw call.
 */
function createHorizonRidgeGeometry() {
  // Rounded, staggered mounds keep the reverse orbit grounded in an authored
  // skyline. A previous ribbon wall read as three hard blue panels from the
  // back; these low-poly forms preserve the same single merged draw group
  // while giving light and fog real volume to work across.
  return merged(
    [
      [-7.6, 0.9, 19.0, 1.45, 1.05, 0.62, -0.12],
      [-1.2, 1.1, 19.6, 1.7, 1.2, 0.72, 0.08],
      [5.6, 1.05, 19.2, 1.55, 1.1, 0.66, -0.1],
      [10.8, 0.8, 19.8, 1.25, 0.95, 0.56, 0.16],
    ].map(([x, y, z, sx, sy, sz, rotation]) => {
      const mound = new DodecahedronGeometry(1, 0);
      mound.scale(sx, sy, sz);
      mound.rotateY(rotation);
      mound.translate(x, y, z);
      return mound;
    }),
  );
}

function createDepthMassesGeometry(quality: DreamQualityPreset) {
  const segments = quality === "low" ? 6 : quality === "medium" ? 7 : 10;
  const curve = new CatmullRomCurve3(
    DREAM_STREAM_CONTROL_POINTS.map(([x, z]) => new Vector3(x, 0, z)),
  );
  const parts: BufferGeometry[] = [];
  const bands = [
    [0.43, 0.9, -0.52, 0.5],
    [0.9, 1.45, 0.5, 0.76],
    [1.45, 2.2, 0.76, 1],
  ] as const;
  for (const side of [-1, 1] as const)
    for (const [inner, outer, innerY, outerY] of bands)
      parts.push(
        createBankStripGeometry(
          curve,
          side,
          inner,
          outer,
          innerY,
          outerY,
          segments,
        ),
      );

  // Five authored horizon masses are deliberately staggered around the
  // rear and side edges. Reusing the existing ridge geometry keeps the
  // medium/low triangle and draw budgets unchanged while avoiding a single
  // flat wall when the camera orbits away from the approach.
  [
    [-8.8, 3.25, -12.6],
    [0, 4.05, -13.2],
    [8.8, 3.45, -12.45],
    [13.4, 3.35, -1.8],
    [0, 3.9, 13.5],
  ].forEach(([x, y, z], index) => {
    if (index === 4) {
      const ridge = createHorizonRidgeGeometry();
      ridge.translate(0, 0, z - 13.5);
      parts.push(ridge);
      return;
    }
    const ridge = new DodecahedronGeometry(1, 0);
    ridge.scale(
      2.25 + (index % 2) * 0.45,
      5.1 + (index % 3) * 0.7,
      1.05 + (index % 2) * 0.18,
    );
    ridge.translate(x, y, z);
    parts.push(ridge);
  });

  const arch = createMossArchGeometry();
  arch.rotateY(0.34);
  arch.translate(
    DREAM_KEYFRAME_ANCHORS.mossArch[0],
    0,
    DREAM_KEYFRAME_ANCHORS.mossArch[1],
  );
  parts.push(arch);
  return merged(parts);
}

export function createDreamEnvironmentResources(
  palette: DreamEnvironmentPalette,
  quality: DreamQualityPreset,
  water: DreamWaterStyle,
): DreamEnvironmentResources {
  const groundPatch = new CircleGeometry(1, 9);
  groundPatch.rotateX(-Math.PI / 2);
  groundPatch.translate(0, 0.008, 0);
  const shrub = createShrubGeometry();
  const rock = new DodecahedronGeometry(0.42, 0);
  rock.scale(1.2, 0.68, 0.9);
  rock.translate(0, 0.26, 0);
  const ridge = createRidgeGeometry();
  const lanternBaseRock = new DodecahedronGeometry(0.28, 0);
  lanternBaseRock.scale(1.4, 0.68, 1.05);
  lanternBaseRock.translate(0, 0.13, 0);
  // A tapered glass chamber catches the point light around its full profile;
  // the old box read as a flat glowing card from side orbit angles.
  const lanternGlass = new CylinderGeometry(0.23, 0.27, 0.52, 10, 1);
  lanternGlass.translate(0, 1.5, 0);
  const lanternFlame = new OctahedronGeometry(0.125, 0);
  lanternFlame.scale(0.72, 1.35, 0.72);
  lanternFlame.translate(0, 1.49, 0);

  const geometries: DreamEnvironmentGeometries = {
    treeNear: createNearTreeGeometry(),
    treeFar: createFarTreeGeometry(),
    shrub,
    shrubFar: createFarShrubGeometry(),
    grass: createGrassGeometry(),
    rock,
    reed: createReedGeometry(),
    groundPatch,
    ridge,
    path: createPathGeometry(quality),
    streamBed: createStreamBedGeometry(quality),
    stream: createStreamGeometry(quality),
    depthMasses: createDepthMassesGeometry(quality),
    moon: new SphereGeometry(0.62, 7, 5),
    motes: createMoteGeometry(quality),
    lanternBaseRock,
    lanternFrame: createLanternFrameGeometry(),
    lanternGlass,
    lanternFlame,
  };

  addDreamMaterialBreakup(geometries.treeNear, 0.075);
  addDreamMaterialBreakup(geometries.treeFar, 0.06);
  addDreamMaterialBreakup(geometries.shrub, 0.07);
  addDreamMaterialBreakup(geometries.shrubFar, 0.06);
  addDreamMaterialBreakup(geometries.grass, 0.05);
  addDreamMaterialBreakup(geometries.rock, 0.08);
  addDreamMaterialBreakup(geometries.reed, 0.05);
  addDreamMaterialBreakup(geometries.ridge, 0.07);
  addDreamMaterialBreakup(geometries.path, 0.045);
  addDreamMaterialBreakup(geometries.streamBed, 0.06);
  addDreamMaterialBreakup(geometries.depthMasses, 0.065);
  tintDreamHorizonBands(geometries.depthMasses);
  addDreamMaterialBreakup(geometries.lanternBaseRock, 0.08);
  addDreamMaterialBreakup(geometries.lanternFrame, 0.06);
  addDreamMaterialBreakup(geometries.lanternGlass, 0.035);

  const streamMaterial =
    water === "dry"
      ? null
      : new MeshPhysicalMaterial({
          color:
            water === "moonlit"
              ? palette.streamMoonlight
              : palette.streamInk,
          emissive:
            water === "moonlit"
              ? new Color(palette.streamMoonlight).multiplyScalar(0.12)
              : new Color(palette.streamInk).multiplyScalar(0.08),
          emissiveIntensity: water === "moonlit" ? 0.28 : 0.28,
          roughness: water === "moonlit" ? 0.2 : 0.62,
          metalness: water === "moonlit" ? 0.04 : 0,
          clearcoat: water === "moonlit" ? 0.72 : 0.28,
          clearcoatRoughness: water === "moonlit" ? 0.12 : 0.5,
          specularIntensity: water === "moonlit" ? 0.78 : 0.5,
          specularColor:
            water === "moonlit" ? palette.keyLight : palette.streamInk,
          transparent: true,
          opacity: water === "moonlit" ? 0.88 : 0.82,
          depthWrite: false,
          side: DoubleSide,
        });

  if (streamMaterial && water === "moonlit") {
    streamMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.dreamEdgeColor = {
        value: new Color(palette.keyLight),
      };
      shader.vertexShader = `
        attribute float dreamAcross;
        varying float vDreamAcross;
        ${shader.vertexShader}
      `.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vDreamAcross = dreamAcross;`,
      );
      shader.fragmentShader = `
        uniform vec3 dreamEdgeColor;
        varying float vDreamAcross;
        ${shader.fragmentShader}
      `.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float dreamEdge = smoothstep(
          0.72,
          0.98,
          abs(vDreamAcross * 2.0 - 1.0)
        );
        diffuseColor.rgb = mix(
          diffuseColor.rgb * 0.72,
          dreamEdgeColor,
          dreamEdge * 0.38
        );`,
      );
    };
    streamMaterial.customProgramCacheKey = () =>
      "dream-moonlit-specular-edge-v1";
  }

  const depthMassesMaterial = new MeshPhysicalMaterial({
    // The arch and layered horizon share one draw call. A restrained vertical
    // value drift gives the stone a painterly light falloff instead of one
    // uniform blue polygon when the camera turns away from the shrine.
    color: palette.stone,
    roughness: 0.72,
    metalness: 0,
    clearcoat: 0.24,
    clearcoatRoughness: 0.52,
    emissive: palette.silhouette,
    emissiveIntensity: 0.12,
    vertexColors: true,
    flatShading: true,
  });
  depthMassesMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.dreamHazeColor = {
      value: new Color(palette.fog),
    };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vDreamDepthPosition;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvDreamDepthPosition = transformed;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform vec3 dreamHazeColor;\nvarying vec3 vDreamDepthPosition;",
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float stoneBand = smoothstep(0.2, 8.2, vDreamDepthPosition.y);
        float rearHaze = smoothstep(8.0, 18.0, vDreamDepthPosition.z);
        diffuseColor.rgb *= mix(0.78, 1.08, stoneBand);
        diffuseColor.rgb = mix(
          diffuseColor.rgb,
          mix(diffuseColor.rgb * 0.76, dreamHazeColor * 0.9, 0.45),
          rearHaze * 0.58
        );`,
      );
  };
  depthMassesMaterial.customProgramCacheKey = () =>
    "dream-depth-atmosphere-v2";
  const materials: DreamEnvironmentMaterials = {
    treeNear: new MeshPhysicalMaterial({
      color: palette.silhouette,
      roughness: 0.86,
      metalness: 0,
      clearcoat: 0.08,
      clearcoatRoughness: 0.7,
      emissive: palette.moss,
      emissiveIntensity: 0.08,
      vertexColors: true,
      flatShading: true,
    }),
    treeFar: new MeshPhysicalMaterial({
      color: palette.silhouette,
      roughness: 0.92,
      metalness: 0,
      clearcoat: 0.02,
      emissive: palette.moss,
      emissiveIntensity: 0.045,
      vertexColors: true,
      flatShading: true,
    }),
    shrub: new MeshStandardMaterial({
      color: palette.silhouetteLift,
      roughness: 0.9,
      emissive: palette.moss,
      emissiveIntensity: 0.06,
      vertexColors: true,
      flatShading: true,
    }),
    grass: new MeshStandardMaterial({
      color: palette.silhouetteLift,
      roughness: 0.94,
      emissive: palette.moss,
      emissiveIntensity: 0.045,
      vertexColors: true,
      flatShading: true,
    }),
    rock: new MeshPhysicalMaterial({
      color: palette.stone,
      roughness: 0.62,
      metalness: 0.02,
      clearcoat: 0.34,
      clearcoatRoughness: 0.48,
      vertexColors: true,
      flatShading: true,
    }),
    reed: new MeshStandardMaterial({
      color: palette.reed,
      roughness: 0.9,
      vertexColors: true,
      flatShading: true,
    }),
    groundPatch: new MeshStandardMaterial({
      color: palette.groundMid,
      roughness: 1,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    }),
    ridge: new MeshStandardMaterial({
      color: palette.groundDark,
      roughness: 0.94,
      vertexColors: true,
      flatShading: true,
    }),
    path: new MeshPhysicalMaterial({
      color: palette.path,
      roughness: 0.84,
      metalness: 0,
      clearcoat: 0.16,
      clearcoatRoughness: 0.72,
      emissive: palette.groundDark,
      emissiveIntensity: 0.045,
      vertexColors: true,
      flatShading: true,
    }),
    streamBed: new MeshPhysicalMaterial({
      color: palette.streamInk,
      roughness: 0.56,
      metalness: 0.02,
      clearcoat: 0.48,
      clearcoatRoughness: 0.38,
      emissive: palette.streamInk,
      emissiveIntensity: 0.12,
      vertexColors: true,
      flatShading: true,
    }),
    stream: streamMaterial,
    depthMasses: depthMassesMaterial,
    moon: new MeshBasicMaterial({
      color: palette.keyLight,
      transparent: true,
      opacity: 0.82,
    }),
    motes: new PointsMaterial({
      color: palette.mote,
      size: quality === "low" ? 0.036 : 0.045,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      sizeAttenuation: true,
    }),
    lanternBaseRock: new MeshStandardMaterial({
      color: palette.stoneLift,
      roughness: 0.78,
      vertexColors: true,
      flatShading: true,
    }),
    lanternFrame: new MeshStandardMaterial({
      color: palette.lanternMetal,
      roughness: 0.68,
      metalness: 0.3,
      vertexColors: true,
      flatShading: true,
    }),
    lanternGlass: new MeshStandardMaterial({
      color: palette.lanternGlass,
      emissive: palette.lanternFlame,
      // The glass carries a low warm source even before interaction so the
      // shrine reads as a destination; the flame still owns the lit-state
      // peak together with its point light.
      emissiveIntensity: 1.18,
      transparent: true,
      opacity: 0.62,
      roughness: 0.34,
      vertexColors: true,
      depthWrite: false,
      toneMapped: false,
    }),
    lanternFlame: new MeshBasicMaterial({
      color: palette.lanternFlame,
      transparent: true,
      opacity: 0.98,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  };

  let disposed = false;
  let leases = 0;
  let lifecycleRevision = 0;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    Object.values(geometries).forEach((geometry) => geometry.dispose());
    Object.values(materials).forEach((material) => material?.dispose());
  };
  return {
    geometries,
    materials,
    get disposed() {
      return disposed;
    },
    retain() {
      if (disposed)
        throw new Error("Cannot retain disposed Dream environment resources");
      leases += 1;
      lifecycleRevision += 1;
    },
    release() {
      leases = Math.max(0, leases - 1);
      const releaseRevision = ++lifecycleRevision;
      queueMicrotask(() => {
        if (leases === 0 && lifecycleRevision === releaseRevision) dispose();
      });
    },
    dispose,
  };
}

export function geometryTriangleCount(geometry: BufferGeometry) {
  if (geometry.index) return geometry.index.count / 3;
  const positions = geometry.getAttribute("position");
  return positions ? positions.count / 3 : 0;
}
