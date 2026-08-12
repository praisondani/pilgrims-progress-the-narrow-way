import { TrimeshCollider } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Object3D,
  Uint32BufferAttribute,
  Vector3,
} from "three";
import { detectRenderingCapabilities, renderingFeatureFlags } from "../rendering/capabilities";
import {
  COUNTRYSIDE_DEFAULT_SEED,
  createCountrysideDefinition,
} from "./countrysideDefinition";
import { scatterPoints } from "./ScatterSystem";
import { generateTerrain, terrainHeight } from "./TerrainGenerator";
import type { ProceduralSceneDefinition, ScatterPoint, ScatterRule } from "./types";
import { useGame } from "../state";
import { atmosphericLifeOffset, atmosphericLifeRotation } from "./motion";
import {
  collectOwnedResources,
  deferOwnedResourcesDisposal,
  retainOwnedResources,
} from "../assets/environment/resourceLifecycle";

function currentSeed() {
  if (typeof location === "undefined") return COUNTRYSIDE_DEFAULT_SEED;
  return (
    new URLSearchParams(location.search).get("seed") ||
    COUNTRYSIDE_DEFAULT_SEED
  );
}

function scaledRule(rule: ScatterRule, factor: number): ScatterRule {
  return { ...rule, count: Math.max(1, Math.round(rule.count * factor)) };
}

function setInstances(
  mesh: InstancedMesh | null,
  points: ScatterPoint[],
  transform: (dummy: Object3D, point: ScatterPoint, index: number) => void,
) {
  if (!mesh) return;
  const dummy = new Object3D();
  points.forEach((point, index) => {
    dummy.position.set(point.x, point.y, point.z);
    dummy.rotation.set(0, point.rotation, 0);
    dummy.scale.setScalar(point.scale);
    transform(dummy, point, index);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
}

function createPathGeometry(definition: ProceduralSceneDefinition) {
  const curve = new CatmullRomCurve3(
    definition.path.map((point) => new Vector3(point.x, 0, point.y)),
  );
  const samples = curve.getPoints(72);
  const positions: number[] = [];
  const indices: number[] = [];
  samples.forEach((point, index) => {
    const previous = samples[Math.max(0, index - 1)];
    const next = samples[Math.min(samples.length - 1, index + 1)];
    const tangent = next.clone().sub(previous).normalize();
    const normal = new Vector3(-tangent.z, 0, tangent.x);
    const width = 0.72 + Math.sin(index * 0.73) * 0.07;
    for (const side of [-1, 1]) {
      const vertex = point.clone().addScaledVector(normal, side * width);
      vertex.y = terrainHeight(definition, vertex.x, vertex.z) + 0.09;
      positions.push(vertex.x, vertex.y, vertex.z);
    }
    if (index < samples.length - 1) {
      const offset = index * 2;
      indices.push(offset, offset + 1, offset + 2, offset + 1, offset + 3, offset + 2);
    }
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(new Uint32BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  return geometry;
}

function InstancedLandscape({ definition, density }: { definition: ProceduralSceneDefinition; density: number }) {
  const trunks = useRef<InstancedMesh>(null);
  const crowns = useRef<InstancedMesh>(null);
  const shrubs = useRef<InstancedMesh>(null);
  const grass = useRef<InstancedMesh>(null);
  const flowers = useRef<InstancedMesh>(null);
  const rocks = useRef<InstancedMesh>(null);
  const treesData = useMemo(
    () => scatterPoints(definition, scaledRule(definition.biome.vegetationRules.trees, density), "trees"),
    [definition, density],
  );
  const shrubData = useMemo(
    () => scatterPoints(definition, scaledRule(definition.biome.vegetationRules.shrubs, density), "shrubs"),
    [definition, density],
  );
  const grassData = useMemo(
    () => scatterPoints(definition, scaledRule(definition.biome.vegetationRules.grass, density), "grass"),
    [definition, density],
  );
  const flowerData = useMemo(
    () => scatterPoints(definition, scaledRule(definition.biome.vegetationRules.flowers, density), "flowers"),
    [definition, density],
  );
  const rockData = useMemo(
    () => scatterPoints(definition, scaledRule(definition.biome.rockRules[0], density), "rocks", "rocks"),
    [definition, density],
  );

  useLayoutEffect(() => {
    setInstances(trunks.current, treesData, (dummy, point) => {
      dummy.position.y += 0.78 * point.scale;
      dummy.scale.set(point.scale * 0.34, point.scale * 1.55, point.scale * 0.34);
    });
    setInstances(crowns.current, treesData, (dummy, point) => {
      dummy.position.y += 2.05 * point.scale;
      dummy.scale.set(point.scale * 0.9, point.scale * 0.76, point.scale * 0.86);
    });
    setInstances(shrubs.current, shrubData, (dummy, point) => {
      dummy.position.y += 0.32 * point.scale;
      dummy.scale.set(point.scale, point.scale * 0.7, point.scale * 0.85);
    });
    setInstances(grass.current, grassData, (dummy, point, index) => {
      dummy.position.y += 0.11 * point.scale;
      dummy.rotation.z = ((index % 7) - 3) * 0.035;
      dummy.scale.set(point.scale * 0.72, point.scale, point.scale * 0.72);
    });
    setInstances(flowers.current, flowerData, (dummy, point) => {
      dummy.position.y += 0.18 * point.scale;
      dummy.scale.set(point.scale, point.scale * 1.4, point.scale);
    });
    setInstances(rocks.current, rockData, (dummy, point, index) => {
      dummy.position.y += 0.12 * point.scale;
      dummy.rotation.set(index * 0.17, point.rotation, index * 0.11);
      dummy.scale.set(point.scale * 1.2, point.scale * 0.7, point.scale);
    });
  }, [flowerData, grassData, rockData, shrubData, treesData]);

  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, treesData.length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.48, 1.55, 8]} />
        <meshStandardMaterial color="#6e4c2d" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, treesData.length]} castShadow>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#446b3c" roughness={0.93} />
      </instancedMesh>
      <instancedMesh ref={shrubs} args={[undefined, undefined, shrubData.length]} castShadow>
        <dodecahedronGeometry args={[0.48, 1]} />
        <meshStandardMaterial color="#5b7947" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={grass} args={[undefined, undefined, grassData.length]}>
        <coneGeometry args={[0.035, 0.24, 4]} />
        <meshStandardMaterial color="#718a4b" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={flowers} args={[undefined, undefined, flowerData.length]}>
        <octahedronGeometry args={[0.055, 0]} />
        <meshStandardMaterial color="#f0ce78" emissive="#9c7638" emissiveIntensity={0.18} />
      </instancedMesh>
      <instancedMesh ref={rocks} args={[undefined, undefined, rockData.length]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color="#70776d" roughness={1} />
      </instancedMesh>
    </group>
  );
}

function DistantLandscape() {
  const mountains = useRef<InstancedMesh>(null);
  const clouds = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const dummy = new Object3D();
    for (let index = 0; index < 12; index += 1) {
      const angle = (index / 12) * Math.PI * 2;
      const radius = 29 + (index % 3) * 2.4;
      dummy.position.set(Math.sin(angle) * radius, -1 + (index % 3) * 0.55, Math.cos(angle) * radius);
      dummy.rotation.set(0, -angle, 0);
      dummy.scale.set(4.2 + (index % 3), 7 + (index % 3) * 1.6, 4.2 + (index % 2));
      dummy.updateMatrix();
      mountains.current?.setMatrixAt(index, dummy.matrix);
    }
    if (mountains.current) mountains.current.instanceMatrix.needsUpdate = true;
    for (let index = 0; index < 14; index += 1) {
      dummy.position.set(-14 + index * 2.2, 8 + (index % 3) * 0.65, -15 - (index % 4));
      dummy.rotation.set(0, index * 0.4, 0);
      dummy.scale.set(2.6 + (index % 2), 0.55 + (index % 3) * 0.12, 1.3);
      dummy.updateMatrix();
      clouds.current?.setMatrixAt(index, dummy.matrix);
    }
    if (clouds.current) clouds.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <group>
      <instancedMesh ref={mountains} args={[undefined, undefined, 12]}>
        <coneGeometry args={[1, 1, 7]} />
        <meshStandardMaterial color="#61766a" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={clouds} args={[undefined, undefined, 14]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial color="#f4eddb" transparent opacity={0.26} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}

function AtmosphericLife({ density, reducedMotion }: { density: number; reducedMotion: boolean }) {
  const root = useRef<Group>(null);
  const count = Math.max(24, Math.round(90 * density));
  const positions = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const angle = index * 2.399963;
      const radius = 1.5 + ((index * 47) % 100) * 0.085;
      data[index * 3] = Math.sin(angle) * radius;
      data[index * 3 + 1] = 0.6 + ((index * 31) % 100) * 0.045;
      data[index * 3 + 2] = Math.cos(angle) * radius;
    }
    return data;
  }, [count]);
  useFrame(({ clock }) => {
    if (!root.current) return;
    root.current.rotation.y = atmosphericLifeRotation(
      clock.elapsedTime,
      reducedMotion,
    );
    root.current.position.x = atmosphericLifeOffset(
      clock.elapsedTime,
      reducedMotion,
    );
  });
  return (
    <group ref={root}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#f3dda0" size={0.035} transparent opacity={0.5} depthWrite={false} />
      </points>
      <group position={[0, 5.5, -8]}>
        {[-1.7, 0, 1.8].map((x, index) => (
          <group key={x} position={[x, index * 0.35, -index * 0.8]} rotation={[0.2, 0, index % 2 ? -0.12 : 0.12]}>
            <mesh rotation={[0, 0, 0.6]}>
              <planeGeometry args={[0.42, 0.08]} />
              <meshBasicMaterial color="#33433f" side={2} />
            </mesh>
            <mesh rotation={[0, 0, -0.6]}>
              <planeGeometry args={[0.42, 0.08]} />
              <meshBasicMaterial color="#33433f" side={2} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export function ProceduralCountryside() {
  const reducedMotion = useGame((state) => state.reducedMotion);
  const root = useRef<Group>(null);
  const flags = renderingFeatureFlags();
  const capabilities = detectRenderingCapabilities();
  const mobile = typeof innerWidth !== "undefined" && innerWidth < 700;
  const density = mobile || capabilities.recommendedPreset === "low" ? 0.48 : capabilities.recommendedPreset === "high" ? 1 : 0.72;
  const definition = useMemo(
    () => createCountrysideDefinition(currentSeed()),
    [],
  );
  const terrain = useMemo(() => generateTerrain(definition, mobile ? 14 : 20, mobile ? 56 : 72), [definition, mobile]);
  const pathGeometry = useMemo(() => createPathGeometry(definition), [definition]);
  useLayoutEffect(() => {
    const resources = root.current ? collectOwnedResources(root.current) : [];
    retainOwnedResources(resources);
    return () => deferOwnedResourcesDisposal(resources);
  }, []);
  if (!flags.advancedTerrain) return null;
  return (
    <group ref={root} dispose={null}>
      <TrimeshCollider args={[terrain.vertices, terrain.indices]} />
      <mesh geometry={terrain.geometry} receiveShadow>
        <meshStandardMaterial color="#789350" roughness={0.98} />
      </mesh>
      <mesh geometry={pathGeometry} receiveShadow>
        <meshStandardMaterial color="#b49a67" roughness={1} />
      </mesh>
      <InstancedLandscape definition={definition} density={density} />
      <DistantLandscape />
      <AtmosphericLife density={density} reducedMotion={reducedMotion} />
      <pointLight position={[0, 4, -7]} color="#ffe7a0" intensity={5.5} distance={15} />
    </group>
  );
}
