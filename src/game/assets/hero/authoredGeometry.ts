import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Uint16BufferAttribute,
  Vector3,
  type ColorRepresentation,
} from "three";
import type { HeroVec3 } from "./types";

export type AuthoredMorph = "smile" | "concern" | "effort" | "blink";

export interface AuthoredSkin {
  bone: number;
  nextBone?: number;
  blend?: number;
}

export interface AuthoredLoftRing {
  center: HeroVec3;
  radiusX: number;
  radiusZ: number;
  color: ColorRepresentation;
  skin: AuthoredSkin;
}

type MorphDeltas = Partial<Record<AuthoredMorph, HeroVec3>>;

const morphNames: AuthoredMorph[] = [
  "smile",
  "concern",
  "effort",
  "blink",
];

export class AuthoredGeometryBuilder {
  private readonly positions: number[] = [];
  private readonly colors: number[] = [];
  private readonly indices: number[] = [];
  private readonly skinIndices: number[] = [];
  private readonly skinWeights: number[] = [];
  private readonly morphDeltas = Object.fromEntries(
    morphNames.map((name) => [name, [] as number[]]),
  ) as Record<AuthoredMorph, number[]>;

  get vertexCount() {
    return this.positions.length / 3;
  }

  private vertex(
    position: HeroVec3,
    colorValue: ColorRepresentation,
    skin: AuthoredSkin,
    morphs: MorphDeltas = {},
  ) {
    const index = this.vertexCount;
    const color = new Color(colorValue);
    const blend = Math.max(0, Math.min(1, skin.blend ?? 0));
    this.positions.push(...position);
    this.colors.push(color.r, color.g, color.b);
    this.skinIndices.push(skin.bone, skin.nextBone ?? skin.bone, 0, 0);
    this.skinWeights.push(1 - blend, blend, 0, 0);
    for (const name of morphNames)
      this.morphDeltas[name].push(...(morphs[name] ?? [0, 0, 0]));
    return index;
  }

  addLoft(
    rings: AuthoredLoftRing[],
    radialSegments = 14,
    cap: boolean | "start" | "end" = true,
  ) {
    const ringStarts: number[] = [];
    for (const ring of rings) {
      ringStarts.push(this.vertexCount);
      for (let segment = 0; segment < radialSegments; segment += 1) {
        const angle = (segment / radialSegments) * Math.PI * 2;
        this.vertex(
          [
            ring.center[0] + Math.cos(angle) * ring.radiusX,
            ring.center[1],
            ring.center[2] + Math.sin(angle) * ring.radiusZ,
          ],
          ring.color,
          ring.skin,
        );
      }
    }
    for (let ring = 0; ring < rings.length - 1; ring += 1) {
      const current = ringStarts[ring];
      const next = ringStarts[ring + 1];
      for (let segment = 0; segment < radialSegments; segment += 1) {
        const following = (segment + 1) % radialSegments;
        this.indices.push(
          current + segment,
          next + segment,
          next + following,
          current + segment,
          next + following,
          current + following,
        );
      }
    }
    if (!cap) return;
    const first = rings[0];
    const last = rings[rings.length - 1];
    const capStart = cap === true || cap === "start";
    const capEnd = cap === true || cap === "end";
    const firstCenter = capStart
      ? this.vertex(first.center, first.color, first.skin)
      : -1;
    const lastCenter = capEnd
      ? this.vertex(last.center, last.color, last.skin)
      : -1;
    for (let segment = 0; segment < radialSegments; segment += 1) {
      const following = (segment + 1) % radialSegments;
      if (capStart)
        this.indices.push(
          firstCenter,
          ringStarts[0] + following,
          ringStarts[0] + segment,
        );
      if (capEnd)
        this.indices.push(
          lastCenter,
          ringStarts.at(-1)! + segment,
          ringStarts.at(-1)! + following,
        );
    }
  }

  addEllipsoid(
    center: HeroVec3,
    radii: HeroVec3,
    color:
      | ColorRepresentation
      | ((normal: Vector3, position: Vector3) => ColorRepresentation),
    skin: AuthoredSkin,
    segments = 18,
    rows = 12,
    deform?: (position: Vector3, normal: Vector3) => Vector3,
  ) {
    const start = this.vertexCount;
    for (let row = 0; row <= rows; row += 1) {
      const phi = (row / rows) * Math.PI;
      for (let segment = 0; segment <= segments; segment += 1) {
        const theta = (segment / segments) * Math.PI * 2;
        const normal = new Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.cos(phi),
          Math.sin(phi) * Math.sin(theta),
        );
        let position = new Vector3(
          center[0] + normal.x * radii[0],
          center[1] + normal.y * radii[1],
          center[2] + normal.z * radii[2],
        );
        if (deform) position = deform(position, normal);
        const vertexColor =
          typeof color === "function" ? color(normal, position) : color;
        this.vertex([position.x, position.y, position.z], vertexColor, skin);
      }
    }
    for (let row = 0; row < rows; row += 1) {
      for (let segment = 0; segment < segments; segment += 1) {
        const a = start + row * (segments + 1) + segment;
        const b = a + segments + 1;
        this.indices.push(a, b, b + 1, a, b + 1, a + 1);
      }
    }
  }

  addTube(
    points: HeroVec3[],
    radius: number,
    color: ColorRepresentation,
    skin: AuthoredSkin,
    radialSegments = 6,
    closed = false,
    morphs: MorphDeltas = {},
  ) {
    const vectors = points.map((point) => new Vector3().fromArray(point));
    const ringStarts: number[] = [];
    for (let pointIndex = 0; pointIndex < vectors.length; pointIndex += 1) {
      const previous =
        vectors[
          pointIndex === 0
            ? closed
              ? vectors.length - 1
              : 0
            : pointIndex - 1
        ];
      const next =
        vectors[
          pointIndex === vectors.length - 1
            ? closed
              ? 0
              : vectors.length - 1
            : pointIndex + 1
        ];
      const tangent = next.clone().sub(previous).normalize();
      const reference =
        Math.abs(tangent.y) > 0.88
          ? new Vector3(1, 0, 0)
          : new Vector3(0, 1, 0);
      const normal = new Vector3().crossVectors(tangent, reference).normalize();
      const binormal = new Vector3().crossVectors(tangent, normal).normalize();
      ringStarts.push(this.vertexCount);
      for (let segment = 0; segment < radialSegments; segment += 1) {
        const angle = (segment / radialSegments) * Math.PI * 2;
        const position = vectors[pointIndex]
          .clone()
          .addScaledVector(normal, Math.cos(angle) * radius)
          .addScaledVector(binormal, Math.sin(angle) * radius);
        this.vertex(
          [position.x, position.y, position.z],
          color,
          skin,
          morphs,
        );
      }
    }
    const connectionCount = closed ? vectors.length : vectors.length - 1;
    for (let ring = 0; ring < connectionCount; ring += 1) {
      const nextRing = (ring + 1) % vectors.length;
      for (let segment = 0; segment < radialSegments; segment += 1) {
        const following = (segment + 1) % radialSegments;
        this.indices.push(
          ringStarts[ring] + segment,
          ringStarts[nextRing] + segment,
          ringStarts[nextRing] + following,
          ringStarts[ring] + segment,
          ringStarts[nextRing] + following,
          ringStarts[ring] + following,
        );
      }
    }
  }

  addPatch(
    corners: [HeroVec3, HeroVec3, HeroVec3, HeroVec3],
    color: ColorRepresentation,
    skin: AuthoredSkin,
    morphs: MorphDeltas = {},
  ) {
    const start = this.vertexCount;
    for (const corner of corners) this.vertex(corner, color, skin, morphs);
    this.indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  }

  toGeometry(name: string) {
    const geometry = new BufferGeometry();
    geometry.name = name;
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(this.positions, 3),
    );
    geometry.setAttribute("color", new Float32BufferAttribute(this.colors, 3));
    geometry.setAttribute(
      "skinIndex",
      new Uint16BufferAttribute(this.skinIndices, 4),
    );
    geometry.setAttribute(
      "skinWeight",
      new Float32BufferAttribute(this.skinWeights, 4),
    );
    geometry.setIndex(this.indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    geometry.morphTargetsRelative = true;
    geometry.morphAttributes.position = morphNames.map(
      (name) => new Float32BufferAttribute(this.morphDeltas[name], 3),
    );
    return geometry;
  }
}

export function ellipseLoop(
  center: HeroVec3,
  radii: HeroVec3,
  axis: "xz" | "yz",
  segments = 24,
): HeroVec3[] {
  const points: HeroVec3[] = [];
  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    points.push(
      axis === "xz"
        ? [
            center[0] + Math.cos(angle) * radii[0],
            center[1],
            center[2] + Math.sin(angle) * radii[2],
          ]
        : [
            center[0],
            center[1] + Math.cos(angle) * radii[1],
            center[2] + Math.sin(angle) * radii[2],
          ],
    );
  }
  return points;
}
