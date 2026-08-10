import { useFrame } from "@react-three/fiber";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import {
  BufferGeometry,
  Color,
  Group,
  InstancedMesh,
  Material,
  Mesh,
  Object3D,
  PointLight,
  StaticDrawUsage,
} from "three";
import {
  buildDreamComposition,
  DREAM_KEYFRAME_ANCHORS,
  DREAM_SCENE_SEED,
} from "./composition";
import { dreamFogRange, resolveDreamPalette } from "./palette";
import { selectDreamLod } from "./performance";
import {
  createDreamEnvironmentResources,
  type DreamEnvironmentResources,
} from "./resources";
import type {
  DreamAtmosphereMode,
  DreamDressingInstance,
  DreamDressingKind,
  DreamEnvironmentKitProps,
  DreamEnvironmentPalette,
  DreamLodLevel,
  DreamQualityPreset,
} from "./types";

const instanceTints = [
  new Color("#fff6df"),
  new Color("#e1f3df"),
  new Color("#c1dfcf"),
  new Color("#e0c99c"),
] as const;

function applyInstanceTransform(
  dummy: Object3D,
  instance: DreamDressingInstance,
) {
  const [x, y, z] = instance.position;
  const scale = instance.scale;
  dummy.position.set(x, y, z);
  dummy.rotation.set(0, instance.rotation, 0);
  switch (instance.kind) {
    case "tree":
      {
        const heightScale = Math.min(1.12, Math.max(0.86, scale));
      dummy.scale.set(
        scale * (0.72 + instance.variant * 0.02),
        heightScale * (0.94 + instance.variant * 0.018),
        scale * 0.76,
      );
      }
      break;
    case "shrub":
      dummy.scale.set(
        scale * (0.74 + instance.variant * 0.03),
        scale * 0.78,
        scale * (0.82 - instance.variant * 0.018),
      );
      break;
    case "grass":
    case "reed":
      dummy.scale.set(
        scale * (0.9 + instance.variant * 0.04),
        scale * (0.92 + instance.variant * 0.035),
        scale,
      );
      break;
    case "rock":
      if (instance.anchorId === "stream-crossing")
        dummy.position.y = 0.16;
      dummy.scale.set(
        scale * (instance.anchorId === "stream-crossing" ? 1.1 : 0.9),
        scale * (0.86 + instance.variant * 0.04),
        scale *
          (instance.anchorId === "stream-crossing"
            ? 0.88
            : 0.98 - instance.variant * 0.02),
      );
      break;
    case "groundPatch":
      dummy.scale.set(scale * 1.18, scale, scale * 0.82);
      break;
    case "ridge":
      dummy.scale.set(scale * 0.72, scale * 0.6, scale * 0.66);
      break;
  }
  dummy.updateMatrix();
}

function InstancedDressingBatch({
  kind,
  instances,
  geometry,
  material,
  castShadow = false,
  receiveShadow = false,
}: {
  kind: DreamDressingKind;
  instances: readonly DreamDressingInstance[];
  geometry: BufferGeometry;
  material: Material;
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const dummy = new Object3D();
    mesh.current.instanceMatrix.setUsage(StaticDrawUsage);
    instances.forEach((instance, index) => {
      applyInstanceTransform(dummy, instance);
      mesh.current?.setMatrixAt(index, dummy.matrix);
      mesh.current?.setColorAt(index, instanceTints[instance.variant]);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor)
      mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingBox();
    mesh.current.computeBoundingSphere();
  }, [instances]);

  if (instances.length === 0) return null;
  return (
    <instancedMesh
      ref={mesh}
      name={`dream-${kind}-instances`}
      args={[geometry, material, instances.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  );
}

function NearDressing({
  composition,
  resources,
}: {
  composition: ReturnType<typeof buildDreamComposition>;
  resources: DreamEnvironmentResources;
}) {
  const { batches } = composition;
  const { geometries, materials } = resources;
  return (
    <>
      <InstancedDressingBatch
        kind="tree"
        instances={batches.tree}
        geometry={geometries.treeNear}
        material={materials.treeNear}
        castShadow
      />
      <InstancedDressingBatch
        kind="shrub"
        instances={batches.shrub}
        geometry={geometries.shrub}
        material={materials.shrub}
        castShadow
      />
      <InstancedDressingBatch
        kind="grass"
        instances={batches.grass}
        geometry={geometries.grass}
        material={materials.grass}
      />
      <InstancedDressingBatch
        kind="rock"
        instances={batches.rock}
        geometry={geometries.rock}
        material={materials.rock}
        castShadow
        receiveShadow
      />
      <InstancedDressingBatch
        kind="reed"
        instances={batches.reed}
        geometry={geometries.reed}
        material={materials.reed}
      />
    </>
  );
}

function FarDressing({
  composition,
  resources,
}: {
  composition: ReturnType<typeof buildDreamComposition>;
  resources: DreamEnvironmentResources;
}) {
  const { batches } = composition;
  const { geometries, materials } = resources;
  return (
    <>
      <InstancedDressingBatch
        kind="tree"
        instances={batches.tree}
        geometry={geometries.treeFar}
        material={materials.treeFar}
      />
      <InstancedDressingBatch
        kind="shrub"
        instances={batches.shrub}
        geometry={geometries.shrubFar}
        material={materials.shrub}
      />
      <InstancedDressingBatch
        kind="rock"
        instances={batches.rock}
        geometry={geometries.rock}
        material={materials.rock}
        receiveShadow
      />
    </>
  );
}

function DreamDressingLod({
  composition,
  resources,
  quality,
}: {
  composition: ReturnType<typeof buildDreamComposition>;
  resources: DreamEnvironmentResources;
  quality: DreamQualityPreset;
}) {
  const near = useRef<Group>(null);
  const far = useRef<Group>(null);
  const currentLod = useRef<DreamLodLevel>(
    quality === "low" ? "far" : "near",
  );

  useLayoutEffect(() => {
    currentLod.current = quality === "low" ? "far" : "near";
    if (near.current) near.current.visible = currentLod.current === "near";
    if (far.current) far.current.visible = currentLod.current === "far";
  }, [quality]);

  useFrame(({ camera }) => {
    const distance = Math.hypot(camera.position.x, camera.position.z);
    const nextLod = selectDreamLod(distance, quality, currentLod.current);
    if (nextLod === currentLod.current) return;
    currentLod.current = nextLod;
    if (near.current) near.current.visible = nextLod === "near";
    if (far.current) far.current.visible = nextLod === "far";
  });

  return (
    <>
      <group ref={near} name="dream-lod-near">
        <NearDressing composition={composition} resources={resources} />
      </group>
      <group ref={far} name="dream-lod-far" visible={quality === "low"}>
        <FarDressing composition={composition} resources={resources} />
      </group>
    </>
  );
}

function DreamMotes({
  resources,
  reducedMotion,
}: {
  resources: DreamEnvironmentResources;
  reducedMotion: boolean;
}) {
  const root = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!root.current || reducedMotion) return;
    root.current.rotation.y = clock.elapsedTime * 0.008;
    root.current.position.x = Math.sin(clock.elapsedTime * 0.09) * 0.22;
  });
  return (
    <group ref={root} name="dream-motes">
      <points
        geometry={resources.geometries.motes}
        material={resources.materials.motes}
      />
    </group>
  );
}

function DreamLanternLandmark({
  resources,
  lit,
  reducedMotion,
}: {
  resources: DreamEnvironmentResources;
  lit: boolean;
  reducedMotion: boolean;
}) {
  const base = useRef<InstancedMesh>(null);
  const flame = useRef<Mesh>(null);
  const light = useRef<PointLight>(null);
  useLayoutEffect(() => {
    if (!base.current) return;
    const placements = [
      [-0.62, -0.44, 1.12, 0.1],
      [0.58, -0.46, 0.98, 0.8],
      [-0.72, 0.43, 0.92, 1.5],
      [0.7, 0.4, 1.08, 2.1],
      [0.02, 0.28, 1.32, 2.7],
    ] as const;
    const dummy = new Object3D();
    base.current.instanceMatrix.setUsage(StaticDrawUsage);
    placements.forEach(([x, z, scale, rotation], index) => {
      dummy.position.set(x, 0, z);
      dummy.rotation.set(0, rotation, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      base.current?.setMatrixAt(index, dummy.matrix);
    });
    base.current.instanceMatrix.needsUpdate = true;
    base.current.computeBoundingSphere();
  }, []);

  useFrame(({ clock }) => {
    if (light.current) {
      const pulse =
        lit && !reducedMotion ? Math.sin(clock.elapsedTime * 2.1) * 0.38 : 0;
      light.current.intensity = (lit ? 5.8 : 1.25) + pulse;
    }
    if (!lit || reducedMotion) return;
    const flamePulse = 1 + Math.sin(clock.elapsedTime * 2.4) * 0.07;
    if (flame.current) flame.current.scale.set(1, flamePulse, 1);
  });

  return (
    <group
      name="dream-lantern-landmark"
      position={[
        DREAM_KEYFRAME_ANCHORS.lanternShrine[0],
        0.14,
      DREAM_KEYFRAME_ANCHORS.lanternShrine[1],
    ]}
      scale={1.52}
    >
      <instancedMesh
        ref={base}
        args={[
          resources.geometries.lanternBaseRock,
          resources.materials.lanternBaseRock,
          5,
        ]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={resources.geometries.lanternFrame}
        material={resources.materials.lanternFrame}
        castShadow
      />
      <mesh
        geometry={resources.geometries.lanternGlass}
        material={resources.materials.lanternGlass}
        renderOrder={2}
      />
      {lit && (
        <mesh
          ref={flame}
          geometry={resources.geometries.lanternFlame}
          material={resources.materials.lanternFlame}
          renderOrder={3}
        />
      )}
      <pointLight
        ref={light}
        position={[0, 1.5, 0]}
        color="#ffd58a"
        intensity={lit ? 5.8 : 1.25}
        distance={lit ? 8.2 : 5.6}
        decay={2}
      />
    </group>
  );
}

export function DreamAtmosphere({
  palette: paletteOverrides,
  quality = "medium",
  mode = "fog-and-lights",
  includeBackground = false,
}: {
  palette?: Partial<DreamEnvironmentPalette>;
  quality?: DreamQualityPreset;
  mode?: DreamAtmosphereMode;
  includeBackground?: boolean;
}) {
  const palette = resolveDreamPalette(paletteOverrides);
  const fog = dreamFogRange(palette, quality);
  if (mode === "none" && !includeBackground) return null;
  return (
    <>
      {includeBackground && (
        <color attach="background" args={[palette.background]} />
      )}
      {mode !== "none" && (
        <fog attach="fog" args={[palette.fog, fog.near, fog.far]} />
      )}
      {mode === "fog-and-lights" && (
        <>
          <hemisphereLight
            color={palette.hemisphereSky}
            groundColor={palette.hemisphereGround}
            intensity={palette.hemisphereIntensity}
          />
          <directionalLight
            position={[6, 10, 4]}
            color={palette.keyLight}
            intensity={palette.keyLightIntensity}
            castShadow
            shadow-mapSize={[
              quality === "high" ? 2048 : quality === "medium" ? 1024 : 512,
              quality === "high" ? 2048 : quality === "medium" ? 1024 : 512,
            ]}
            shadow-bias={-0.0004}
            shadow-radius={4}
          />
        </>
      )}
    </>
  );
}

export function DreamEnvironmentKit({
  seed = DREAM_SCENE_SEED,
  quality = "medium",
  water = "ink",
  palette: paletteOverrides,
  atmosphere = "none",
  includeBackground = false,
  lanternLit = true,
  reducedMotion = false,
  visible = true,
}: DreamEnvironmentKitProps) {
  const palette = useMemo(
    () => resolveDreamPalette(paletteOverrides),
    [paletteOverrides],
  );
  const composition = useMemo(
    () => buildDreamComposition(seed, quality),
    [quality, seed],
  );
  const resources = useMemo(
    () => createDreamEnvironmentResources(palette, quality, water),
    [palette, quality, water],
  );

  useEffect(() => {
    resources.retain();
    return () => resources.release();
  }, [resources]);

  if (!visible) return null;
  return (
    <>
      <DreamAtmosphere
        palette={palette}
        quality={quality}
        mode={atmosphere}
        includeBackground={includeBackground}
      />
      <group name="dream-environment-kit" dispose={null}>
        <DreamDressingLod
          composition={composition}
          resources={resources}
          quality={quality}
        />
        <mesh
          name="dream-depth-masses"
          geometry={resources.geometries.depthMasses}
          material={resources.materials.depthMasses}
          castShadow
          receiveShadow
        />
        <mesh
          name="dream-s-curve-path"
          geometry={resources.geometries.path}
          material={resources.materials.path}
          receiveShadow
        />
        <mesh
          name="dream-stream-bed"
          geometry={resources.geometries.streamBed}
          material={resources.materials.streamBed}
          receiveShadow
        />
        {resources.materials.stream && (
          <mesh
            name="dream-stream"
            geometry={resources.geometries.stream}
            material={resources.materials.stream}
            renderOrder={1}
          />
        )}
        <mesh
          name="dream-moon"
          position={[-5.2, 7.6, -13.6]}
          geometry={resources.geometries.moon}
          material={resources.materials.moon}
        />
        <DreamLanternLandmark
          resources={resources}
          lit={lanternLit}
          reducedMotion={reducedMotion}
        />
      </group>
    </>
  );
}
