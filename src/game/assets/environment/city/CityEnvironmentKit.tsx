import { Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  Path,
  Shape,
  StaticDrawUsage,
} from "three";
import {
  CITY_BUILDING_SITES,
  CITY_LANDMARK_ANCHORS,
  CITY_MARKET_STALL_POSITIONS,
  CITY_QUALITY_COUNTS,
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
    facade: "#67404a",
    roof: "#252534",
    beam: "#332833",
    window: "#1c1a25",
  },
  brick: {
    facade: "#713c3e",
    roof: "#2b2630",
    beam: "#422a2a",
    window: "#171823",
  },
  ochre: {
    facade: "#886449",
    roof: "#2d2830",
    beam: "#49342b",
    window: "#211b20",
  },
  slate: {
    facade: "#4c5660",
    roof: "#202631",
    beam: "#303038",
    window: "#161a23",
  },
} as const;

const CITY_FACADE_MATERIAL = new MeshStandardMaterial({
  color: "#ffffff",
  roughness: 0.94,
  vertexColors: true,
});
const CITY_ROOF_MATERIAL = new MeshStandardMaterial({
  color: "#ffffff",
  roughness: 0.98,
  vertexColors: true,
});
const CITY_BEAM_MATERIAL = new MeshStandardMaterial({
  color: "#ffffff",
  roughness: 0.88,
  vertexColors: true,
});
const CITY_WINDOW_MATERIAL = new MeshStandardMaterial({
  color: "#ffffff",
  roughness: 0.58,
  metalness: 0.05,
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

function makeFacadeGeometry() {
  const profile = new Shape();
  profile.moveTo(-1, 0);
  profile.lineTo(-0.96, 1.35);
  profile.lineTo(-0.54, 1.57);
  profile.lineTo(-0.12, 1.47);
  profile.lineTo(0.34, 1.67);
  profile.lineTo(0.88, 1.46);
  profile.lineTo(1, 1.32);
  profile.lineTo(1, 0);
  profile.closePath();
  const geometry = new ExtrudeGeometry(profile, {
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

function makeRoofGeometry() {
  const profile = new Shape();
  profile.moveTo(-1.2, 0);
  profile.lineTo(-0.94, 0.32);
  profile.lineTo(-0.42, 0.88);
  profile.lineTo(0, 1.06);
  profile.lineTo(0.48, 0.86);
  profile.lineTo(0.96, 0.31);
  profile.lineTo(1.2, 0);
  profile.closePath();
  const geometry = new ExtrudeGeometry(profile, {
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
}: {
  sites: readonly CityBuildingSite[];
}) {
  const facade = useRef<InstancedMesh>(null);
  const roof = useRef<InstancedMesh>(null);
  const beams = useRef<InstancedMesh>(null);
  const windows = useRef<InstancedMesh>(null);
  const doors = useRef<InstancedMesh>(null);
  const chimneys = useRef<InstancedMesh>(null);

  const geometries = useMemo(
    () => ({
      facade: makeFacadeGeometry(),
      roof: makeRoofGeometry(),
      beam: new BoxGeometry(1, 1, 1),
      window: new BoxGeometry(1, 1, 1),
      door: new BoxGeometry(1, 1, 1),
      chimney: new BoxGeometry(1, 1, 1),
    }),
    [],
  );

  const detailTransforms = useMemo(() => {
    const beamTransforms: LocalTransform[] = [];
    const windowTransforms: LocalTransform[] = [];
    const doorTransforms: LocalTransform[] = [];
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

      doorTransforms.push({ local: [0, 0.37, 0.88], scale: [0.42, 0.72, 0.08] });
      chimneyTransforms.push({ local: [0.54, 2.1, -0.24], scale: [0.25, 0.62, 0.25] });
    });
    return {
      beamTransforms,
      windowTransforms,
      doorTransforms,
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

    if (facade.current) {
      facade.current.instanceMatrix.setUsage(StaticDrawUsage);
      sites.forEach((site, index) => {
        placeLocal(dummy, site, { local: [0, 0.08, 0], scale: [1, 1, 1] });
        facade.current?.setMatrixAt(index, dummy.matrix);
        facade.current?.setColorAt(index, new Color(CITY_STYLE_COLORS[site.style].facade));
      });
      facade.current.instanceMatrix.needsUpdate = true;
      if (facade.current.instanceColor) facade.current.instanceColor.needsUpdate = true;
      facade.current.computeBoundingSphere();
    }
    if (roof.current) {
      roof.current.instanceMatrix.setUsage(StaticDrawUsage);
      sites.forEach((site, index) => {
        placeLocal(dummy, site, { local: [0, 0, 0], scale: [1, 1, 1] });
        roof.current?.setMatrixAt(index, dummy.matrix);
        roof.current?.setColorAt(index, new Color(CITY_STYLE_COLORS[site.style].roof));
      });
      roof.current.instanceMatrix.needsUpdate = true;
      if (roof.current.instanceColor) roof.current.instanceColor.needsUpdate = true;
      roof.current.computeBoundingSphere();
    }
    setBatch(beams.current, detailTransforms.beamTransforms, (_, site) => CITY_STYLE_COLORS[site.style].beam);
    setBatch(windows.current, detailTransforms.windowTransforms, (index, site) => {
      const siteIndex = Math.floor(index / 2);
      return siteIndex === 2 || siteIndex === 4 ? "#d98a4d" : CITY_STYLE_COLORS[site.style].window;
    });
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
        ref={roof}
        args={[geometries.roof, CITY_ROOF_MATERIAL, sites.length]}
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
        ref={doors}
        args={[geometries.door, CITY_DOOR_MATERIAL, detailTransforms.doorTransforms.length]}
      />
      <instancedMesh
        ref={chimneys}
        args={[geometries.chimney, CITY_CHIMNEY_MATERIAL, detailTransforms.chimneyTransforms.length]}
        castShadow
      />
    </group>
  );
}

function CityStreet({ quality }: { quality: CityQualityPreset }) {
  const count = CITY_QUALITY_COUNTS[quality].streetStones;
  const stones = useMemo(() => CITY_STREET_STONES.slice(0, count), [count]);
  const stoneMesh = useRef<InstancedMesh>(null);
  const stoneGeometry = useMemo(() => new CylinderGeometry(0.2, 0.27, 0.08, 6), []);
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

function CityThresholdLandmark({ reducedMotion }: { reducedMotion: boolean }) {
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
      <CityLantern reducedMotion={reducedMotion} />
    </group>
  );
}

function CityBackdrop({ quality }: { quality: CityQualityPreset }) {
  const count = CITY_QUALITY_COUNTS[quality].skylineTowers;
  const towers = [
    [-7.35, 2.1, 1.65],
    [-4.45, 1.55, 1.25],
    [0, 3.9, 2.4],
    [4.6, 1.8, 1.5],
    [7.2, 2.5, 1.82],
    [-9.2, 1.35, 1.05],
    [9.1, 1.55, 1.15],
  ] as const;
  return (
    <group name="city-depth-backdrop">
      <mesh position={[0, 1.08, -10.35]} receiveShadow>
        <boxGeometry args={[17.8, 2.16, 0.7]} />
        <meshStandardMaterial color="#3c3440" roughness={1} />
      </mesh>
      {towers.slice(0, count).map(([x, height, width], index) => (
        <group key={x} position={[x, 0, -10.1]}>
          <mesh position={[0, height * 0.5, 0]} castShadow>
            <boxGeometry args={[width, height, 0.85]} />
            <meshStandardMaterial color={index % 2 ? "#514047" : "#453742"} roughness={1} />
          </mesh>
          <mesh position={[0, height + 0.26, 0]} castShadow>
            <coneGeometry args={[width * 0.72, 0.52, 4]} />
            <meshStandardMaterial color="#292633" roughness={1} />
          </mesh>
          {index % 2 === 0 && (
            <mesh position={[0, height * 0.62, 0.46]}>
              <boxGeometry args={[width * 0.28, height * 0.2, 0.04]} />
              <meshStandardMaterial color="#b36d4a" emissive="#7b412e" emissiveIntensity={0.55} />
            </mesh>
          )}
        </group>
      ))}
      <mesh position={[-8.8, 0.36, -8.95]} rotation={[0, 0, -0.08]}>
        <boxGeometry args={[3.6, 0.72, 0.46]} />
        <meshStandardMaterial color="#56434a" roughness={1} />
      </mesh>
      <mesh position={[8.7, 0.4, -8.85]} rotation={[0, 0, 0.08]}>
        <boxGeometry args={[3.5, 0.8, 0.46]} />
        <meshStandardMaterial color="#4b3d48" roughness={1} />
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
      <CityStreet quality={effectiveQuality} />
      <CityBackdrop quality={effectiveQuality} />
      <CityBuildingBatches sites={visibleSites} />
      {!mobile && visibleSites.some((site) => site.id === "west-north") && (
        <pointLight
          position={[-5.5, 0.95, 4.85]}
          color="#f1a15a"
          intensity={2.1}
          distance={4.8}
        />
      )}
      <CityMarket quality={effectiveQuality} />
      <CityThresholdLandmark reducedMotion={reducedMotion} />
      <Sparkles
        count={mobile ? 16 : 34}
        scale={[14, 6, 14]}
        position={[0, 2.2, -0.8]}
        color="#d4865c"
        size={mobile ? 1.8 : 2.2}
        speed={reducedMotion ? 0 : 0.08}
        opacity={0.2}
      />
    </group>
  );
}
