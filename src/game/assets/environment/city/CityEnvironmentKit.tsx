import { Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  CapsuleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
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
    facade: "#a66a70",
    roof: "#514252",
    beam: "#c28b63",
    window: "#2c3440",
  },
  brick: {
    facade: "#a85c53",
    roof: "#58404a",
    beam: "#cd8a5f",
    window: "#29303a",
  },
  ochre: {
    facade: "#bd8b58",
    roof: "#55434a",
    beam: "#d3a36b",
    window: "#30323b",
  },
  slate: {
    facade: "#70818b",
    roof: "#3d4854",
    beam: "#b58d6e",
    window: "#293846",
  },
} as const;

const CITY_FACADE_MATERIAL = new MeshStandardMaterial({
  color: "#ffffff",
  roughness: 0.94,
  emissive: "#34202b",
  emissiveIntensity: 0.42,
  vertexColors: true,
});
const CITY_ROOF_MATERIAL = new MeshStandardMaterial({
  color: "#ffffff",
  roughness: 0.98,
  emissive: "#28202d",
  emissiveIntensity: 0.28,
  vertexColors: true,
});
const CITY_BEAM_MATERIAL = new MeshStandardMaterial({
  color: "#ffffff",
  roughness: 0.88,
  emissive: "#2d1c1b",
  emissiveIntensity: 0.32,
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
    () => ({
      facade: makeFacadeGeometry("steep"),
      facadeAlt: makeFacadeGeometry("broad"),
      roof: makeRoofGeometry("steep"),
      roofAlt: makeRoofGeometry("broad"),
      beam: new BoxGeometry(1, 1, 1),
      window: new BoxGeometry(1, 1, 1),
      windowTrim: new BoxGeometry(1, 1, 1),
      awning: new BoxGeometry(1, 1, 1),
      wear: new BoxGeometry(1, 1, 1),
      door: new BoxGeometry(1, 1, 1),
      doorFrame: new BoxGeometry(1, 1, 1),
      chimney: new BoxGeometry(1, 1, 1),
    }),
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
      colorFor: (site: CityBuildingSite) => string,
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
        mesh.setColorAt(index, new Color(colorFor(site)));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    };

    setBuildingBatch(facade.current, "steep", 0.08, (site) => CITY_STYLE_COLORS[site.style].facade);
    setBuildingBatch(facadeAlt.current, "broad", 0.08, (site) => CITY_STYLE_COLORS[site.style].facade);
    setBuildingBatch(roof.current, "steep", 0, (site) => CITY_STYLE_COLORS[site.style].roof);
    setBuildingBatch(roofAlt.current, "broad", 0, (site) => CITY_STYLE_COLORS[site.style].roof);
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
        color="#ffd5ad"
        groundColor="#4a3040"
        intensity={mobile ? 0.42 : 0.58}
      />
      <directionalLight
        position={[-6, 9, 8]}
        color="#ffd8b0"
        intensity={mobile ? 0.7 : 1.05}
      />
      <directionalLight
        position={[6, 7, 5]}
        color="#e9b8a6"
        intensity={mobile ? 0.36 : 0.62}
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
      <mesh position={[0, 1.18, -9.78]} receiveShadow castShadow>
        <boxGeometry args={[9.2, 2.35, 0.92]} />
        <meshStandardMaterial color="#654650" roughness={0.96} />
      </mesh>
      <mesh position={[0, 2.47, -9.38]} castShadow>
        <boxGeometry args={[9.85, 0.28, 1.24]} />
        <meshStandardMaterial color="#866058" roughness={0.9} />
      </mesh>
      {[-4.35, 4.35].map((x) => (
        <mesh key={x} position={[x, 1.35, -9.35]} castShadow>
          <boxGeometry args={[0.48, 2.72, 1.16]} />
          <meshStandardMaterial color="#4e3b49" roughness={0.98} />
        </mesh>
      ))}
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
