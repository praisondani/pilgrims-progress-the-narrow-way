import { BufferGeometry, Float32BufferAttribute, Uint32BufferAttribute, Vector2 } from "three";
import { distanceToPath } from "./PathMaskGenerator";
import { SeededRandom } from "./SeededRandom";
import type { ProceduralSceneDefinition } from "./types";

const smooth = (value: number) => value * value * (3 - 2 * value);
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;

function hashNoise(seed: number, x: number, z: number) {
  let value = seed ^ Math.imul(x, 374761393) ^ Math.imul(z, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function valueNoise(seed: number, x: number, z: number) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const tx = smooth(x - x0);
  const tz = smooth(z - z0);
  return mix(
    mix(hashNoise(seed, x0, z0), hashNoise(seed, x0 + 1, z0), tx),
    mix(hashNoise(seed, x0, z0 + 1), hashNoise(seed, x0 + 1, z0 + 1), tx),
    tz,
  );
}

export function terrainHeight(definition: ProceduralSceneDefinition, x: number, z: number) {
  const seed = SeededRandom.hash(definition.seed);
  const broad = valueNoise(seed, x * 0.16, z * 0.16) - 0.5;
  const detail = valueNoise(seed ^ 0x9e3779b9, x * 0.52, z * 0.52) - 0.5;
  const radial = Math.min(1, Math.hypot(x, z) / definition.radius);
  let height = broad * 0.78 + detail * 0.16 + radial * radial * 0.3;
  const point = new Vector2(x, z);
  const pathDistance = distanceToPath(point, definition.path);
  const pathFlatten = 1 - smooth(Math.min(1, pathDistance / 1.65));
  height = mix(height, 0, pathFlatten * 0.96);
  for (const landmark of definition.landmarks) {
    const distance = point.distanceTo(new Vector2(...landmark.position));
    const mask = 1 - smooth(Math.min(1, distance / landmark.radius));
    height = mix(height, 0, mask * landmark.flattenStrength);
  }
  if (radial > 0.92) height = mix(height, -0.08, smooth((radial - 0.92) / 0.08));
  return height;
}

export interface TerrainData {
  geometry: BufferGeometry;
  vertices: Float32Array;
  indices: Uint32Array;
}

export function generateTerrain(
  definition: ProceduralSceneDefinition,
  rings = 24,
  segments = 96,
): TerrainData {
  const positions: number[] = [0, terrainHeight(definition, 0, 0), 0];
  for (let ring = 1; ring <= rings; ring += 1) {
    const radius = (ring / rings) * definition.radius;
    for (let segment = 0; segment < segments; segment += 1) {
      const angle = (segment / segments) * Math.PI * 2;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      positions.push(x, terrainHeight(definition, x, z), z);
    }
  }
  const indices: number[] = [];
  for (let segment = 0; segment < segments; segment += 1)
    indices.push(0, 1 + segment, 1 + ((segment + 1) % segments));
  for (let ring = 1; ring < rings; ring += 1) {
    const inner = 1 + (ring - 1) * segments;
    const outer = 1 + ring * segments;
    for (let segment = 0; segment < segments; segment += 1) {
      const next = (segment + 1) % segments;
      indices.push(
        inner + segment,
        outer + segment,
        outer + next,
        inner + segment,
        outer + next,
        inner + next,
      );
    }
  }
  const vertices = new Float32Array(positions);
  const indexArray = new Uint32Array(indices);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(new Uint32BufferAttribute(indexArray, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return { geometry, vertices, indices: indexArray };
}
