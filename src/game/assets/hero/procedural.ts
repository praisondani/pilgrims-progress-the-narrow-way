import {
  BoxGeometry,
  CatmullRomCurve3,
  CapsuleGeometry,
  CylinderGeometry,
  Group,
  LOD,
  LatheGeometry,
  Mesh,
  SphereGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
  type Material,
  type Object3D,
} from "three";
import type { HeroLodSpec, HeroVec3 } from "./types";

export type HeroDetailLevel = "high" | "medium" | "low";

export function hashHeroSeed(seed: string | number): number {
  const text = String(seed);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createHeroRandom(seed: string | number): () => number {
  let state = hashHeroSeed(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function createHeroMesh(
  name: string,
  geometry: BufferGeometry,
  material: Material,
  castShadow = true,
): Mesh {
  const mesh = new Mesh(geometry, material);
  mesh.name = name;
  const silhouetteDetail =
    /(face|eye|brow|lid|mouth|nose|cheek|ear|hair-clump|moustache|tunic-(?:fold|tatter)|collar|lace|rope|patch|buckle|catchlight)/;
  mesh.castShadow = castShadow && !silhouetteDetail.test(name);
  mesh.receiveShadow = false;
  return mesh;
}

export function createHeroLod(
  name: string,
  distances: HeroLodSpec,
  factory: (detail: HeroDetailLevel) => Object3D,
): LOD {
  const lod = new LOD();
  lod.name = `hero.lod.${name}`;
  lod.autoUpdate = true;
  // Christian is currently the only hero and remains close to the camera.
  // Constructing three complete procedural copies of every articulated part
  // blocked the Canvas before its first frame. The medium topology preserves
  // the authored silhouette at the normal 6–12m gameplay distance while
  // cutting procedural geometry work sharply. Keep the LOD boundary/metadata
  // stable, but build that gameplay mesh once. A future offline GLB bake can restore
  // genuine distance meshes without putting geometry generation on startup.
  lod.addLevel(factory("medium"), distances.highDistance);
  lod.userData.heroLod = {
    id: name,
    distances: [
      distances.highDistance,
      distances.mediumDistance,
      distances.lowDistance,
    ],
  };
  return lod;
}

const detailSegments: Record<
  HeroDetailLevel,
  { radial: number; cap: number; sphereWidth: number; sphereHeight: number }
> = {
  high: { radial: 18, cap: 8, sphereWidth: 24, sphereHeight: 18 },
  medium: { radial: 12, cap: 6, sphereWidth: 16, sphereHeight: 12 },
  low: { radial: 8, cap: 4, sphereWidth: 10, sphereHeight: 8 },
};

export function createCapsuleLod(
  name: string,
  length: number,
  radius: number,
  material: Material,
  lod: HeroLodSpec,
  options: {
    position?: HeroVec3;
    scale?: HeroVec3;
    rotation?: HeroVec3;
    castShadow?: boolean;
  } = {},
): LOD {
  const result = createHeroLod(name, lod, (detail) => {
    const segments = detailSegments[detail];
    const cylinderLength = Math.max(0.001, length - radius * 2);
    const mesh = createHeroMesh(
      `hero.mesh.${name}.${detail}`,
      new CapsuleGeometry(
        radius,
        cylinderLength,
        segments.cap,
        segments.radial,
      ),
      material,
      options.castShadow,
    );
    mesh.position.fromArray(options.position ?? [0, -length * 0.5, 0]);
    if (options.scale) mesh.scale.fromArray(options.scale);
    if (options.rotation) mesh.rotation.fromArray(options.rotation);
    return mesh;
  });
  return result;
}

export function createEllipsoidLod(
  name: string,
  radii: HeroVec3,
  material: Material,
  lod: HeroLodSpec,
  options: {
    position?: HeroVec3;
    rotation?: HeroVec3;
    castShadow?: boolean;
  } = {},
): LOD {
  return createHeroLod(name, lod, (detail) => {
    const segments = detailSegments[detail];
    const mesh = createHeroMesh(
      `hero.mesh.${name}.${detail}`,
      new SphereGeometry(
        1,
        segments.sphereWidth,
        segments.sphereHeight,
      ),
      material,
      options.castShadow,
    );
    mesh.scale.fromArray(radii);
    if (options.position) mesh.position.fromArray(options.position);
    if (options.rotation) mesh.rotation.fromArray(options.rotation);
    return mesh;
  });
}

export function createBoxLod(
  name: string,
  dimensions: HeroVec3,
  material: Material,
  lod: HeroLodSpec,
  options: {
    position?: HeroVec3;
    rotation?: HeroVec3;
    castShadow?: boolean;
  } = {},
): LOD {
  return createHeroLod(name, lod, (detail) => {
    const segments = detail === "high" ? 2 : 1;
    const mesh = createHeroMesh(
      `hero.mesh.${name}.${detail}`,
      new BoxGeometry(
        dimensions[0],
        dimensions[1],
        dimensions[2],
        segments,
        segments,
        segments,
      ),
      material,
      options.castShadow,
    );
    if (options.position) mesh.position.fromArray(options.position);
    if (options.rotation) mesh.rotation.fromArray(options.rotation);
    return mesh;
  });
}

export function createTorsoLod(
  name: string,
  height: number,
  shoulderRadius: number,
  waistRadius: number,
  depthScale: number,
  material: Material,
  lod: HeroLodSpec,
): LOD {
  return createHeroLod(name, lod, (detail) => {
    const profileSegments =
      detail === "high" ? 8 : detail === "medium" ? 6 : 5;
    const radialSegments =
      detail === "high" ? 24 : detail === "medium" ? 16 : 10;
    const points: Vector2[] = [];
    for (let index = 0; index < profileSegments; index += 1) {
      const t = index / (profileSegments - 1);
      const shoulderEase = Math.pow(Math.sin(t * Math.PI * 0.5), 0.72);
      const upperTaper = 1 - Math.max(0, t - 0.9) * 0.3;
      const radius =
        (waistRadius + (shoulderRadius - waistRadius) * shoulderEase) *
        upperTaper;
      points.push(new Vector2(radius, t * height));
    }
    const mesh = createHeroMesh(
      `hero.mesh.${name}.${detail}`,
      new LatheGeometry(points, radialSegments),
      material,
    );
    mesh.scale.z = depthScale;
    return mesh;
  });
}

export function createCylinderBetween(
  name: string,
  start: HeroVec3,
  end: HeroVec3,
  radius: number,
  material: Material,
  radialSegments = 10,
): Mesh {
  const startVector = new Vector3().fromArray(start);
  const endVector = new Vector3().fromArray(end);
  const direction = endVector.clone().sub(startVector);
  const length = direction.length();
  const mesh = createHeroMesh(
    name,
    new CylinderGeometry(radius, radius, length, radialSegments, 1),
    material,
  );
  mesh.position.copy(startVector).addScaledVector(direction, 0.5);
  mesh.quaternion.setFromUnitVectors(
    new Vector3(0, 1, 0),
    direction.normalize(),
  );
  return mesh;
}

export function createIrregularClothGeometry(
  radii: HeroVec3,
  detail: HeroDetailLevel,
  seed: string | number,
  compressionBands: number[] = [-0.34, 0.08, 0.38],
): SphereGeometry {
  const widthSegments = detail === "high" ? 24 : detail === "medium" ? 16 : 10;
  const heightSegments = detail === "high" ? 18 : detail === "medium" ? 12 : 8;
  const geometry = new SphereGeometry(1, widthSegments, heightSegments);
  const positions = geometry.attributes.position;
  const random = createHeroRandom(seed);

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const theta = Math.atan2(z, x);
    const macro =
      1 +
      Math.sin(theta * 3 + y * 4.7) * 0.027 +
      Math.sin(theta * 5 - y * 7.1) * 0.013;
    const micro = 1 + (random() - 0.5) * (detail === "low" ? 0.018 : 0.032);
    let cinch = 1;
    for (const band of compressionBands) {
      const distance = (y - band) / 0.085;
      cinch -= Math.exp(-(distance * distance)) * 0.055;
    }
    const verticalSlump = 1 - Math.max(0, -y) * 0.025;
    positions.setXYZ(
      index,
      x * radii[0] * macro * micro * cinch,
      y * radii[1] * (1 + Math.sin(theta * 2) * 0.012),
      z * radii[2] * macro * verticalSlump * cinch,
    );
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function createRopeLoop(
  name: string,
  center: HeroVec3,
  radii: HeroVec3,
  axis: "horizontal" | "vertical",
  ropeRadius: number,
  material: Material,
  detail: HeroDetailLevel,
): Mesh {
  const pointCount = detail === "high" ? 28 : detail === "medium" ? 18 : 12;
  const points: Vector3[] = [];
  for (let index = 0; index < pointCount; index += 1) {
    const angle = (index / pointCount) * Math.PI * 2;
    if (axis === "horizontal")
      points.push(
        new Vector3(
          center[0] + Math.cos(angle) * radii[0],
          center[1] + Math.sin(angle * 2) * radii[1] * 0.08,
          center[2] + Math.sin(angle) * radii[2],
        ),
      );
    else
      points.push(
        new Vector3(
          center[0] + Math.sin(angle * 2) * radii[0] * 0.08,
          center[1] + Math.cos(angle) * radii[1],
          center[2] + Math.sin(angle) * radii[2],
        ),
      );
  }
  const curve = new CatmullRomCurve3(points, true, "centripetal");
  return createHeroMesh(
    name,
    new TubeGeometry(
      curve,
      pointCount * 2,
      ropeRadius,
      detail === "high" ? 7 : 5,
      true,
    ),
    material,
  );
}

export function createRopeCurve(
  name: string,
  points: HeroVec3[],
  ropeRadius: number,
  material: Material,
  detail: HeroDetailLevel = "high",
): Mesh {
  const curve = new CatmullRomCurve3(
    points.map((point) => new Vector3().fromArray(point)),
    false,
    "centripetal",
  );
  return createHeroMesh(
    name,
    new TubeGeometry(
      curve,
      detail === "high" ? 24 : detail === "medium" ? 16 : 10,
      ropeRadius,
      detail === "high" ? 7 : 5,
      false,
    ),
    material,
  );
}

export function namedGroup(name: string): Group {
  const group = new Group();
  group.name = name;
  return group;
}
