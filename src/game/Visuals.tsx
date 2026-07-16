import { useFrame } from "@react-three/fiber";
import { ReactNode, useLayoutEffect, useMemo, useRef } from "react";
import { Color, Group, InstancedMesh, Object3D } from "three";
import { useGame } from "./state";

export type CharacterVariant =
  | "christian"
  | "dreamer"
  | "evangelist"
  | "family"
  | "obstinate"
  | "pliable"
  | "help"
  | "worldly"
  | "goodwill"
  | "interpreter"
  | "shining"
  | "caged";
const clothes: Record<CharacterVariant, [string, string, string]> = {
  christian: ["#8f4939", "#493349", "#b97855"],
  dreamer: ["#4b556d", "#292b3a", "#9f7159"],
  evangelist: ["#3f6382", "#d4b06a", "#9a6a50"],
  family: ["#745263", "#c79570", "#a86f58"],
  obstinate: ["#6f3c34", "#3f2928", "#a56e54"],
  pliable: ["#64754b", "#b08a52", "#ad765b"],
  help: ["#a9894f", "#eee0b0", "#a67155"],
  worldly: ["#665075", "#d0a86a", "#b47b5e"],
  goodwill: ["#8a6339", "#e7c37b", "#aa7257"],
  interpreter: ["#5b3f67", "#c59c58", "#a66d51"],
  shining: ["#e9e2c3", "#fff4bd", "#c79576"],
  caged: ["#34343b", "#53505b", "#876151"],
};

export function Character({
  variant = "christian",
  walking = false,
  burden = false,
  scale = 1,
}: {
  variant?: CharacterVariant;
  walking?: boolean;
  burden?: boolean;
  scale?: number;
}) {
  const root = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const [cloth, accent, skin] = clothes[variant];
  const reducedMotion = useGame((s) => s.reducedMotion);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const swing = reducedMotion
      ? 0
      : walking
        ? Math.sin(t * 9) * 0.55
        : Math.sin(t * 1.6) * 0.035;
    if (leftArm.current) leftArm.current.rotation.x = swing;
    if (rightArm.current) rightArm.current.rotation.x = -swing;
    if (leftLeg.current) leftLeg.current.rotation.x = -swing;
    if (rightLeg.current) rightLeg.current.rotation.x = swing;
    if (torso.current)
      torso.current.rotation.z = reducedMotion
        ? 0
        : walking
          ? Math.sin(t * 9) * 0.025
          : Math.sin(t * 1.2) * 0.008;
    if (root.current)
      root.current.position.y = reducedMotion
        ? 0
        : Math.sin(t * (walking ? 9 : 1.6)) * (walking ? 0.035 : 0.018);
  });
  const darkHair = variant === "shining" ? "#f4dda0" : "#392a28";
  const hasBeard = [
    "christian",
    "evangelist",
    "help",
    "worldly",
    "goodwill",
    "interpreter",
  ].includes(variant);
  return (
    <group ref={root} scale={scale}>
      <group ref={torso}>
        <mesh castShadow position={[0, 1.02, 0]} scale={[0.86, 1, 0.58]}>
          <capsuleGeometry args={[0.32, 0.52, 8, 16]} />
          <meshStandardMaterial color={cloth} roughness={0.88} />
        </mesh>
        <mesh castShadow position={[0, 0.76, 0]}>
          <cylinderGeometry args={[0.33, 0.39, 0.48, 12]} />
          <meshStandardMaterial color={cloth} roughness={0.92} />
        </mesh>
        <mesh position={[0, 1.18, 0.29]} scale={[1, 0.65, 0.3]}>
          <sphereGeometry args={[0.25, 12, 8]} />
          <meshStandardMaterial color={accent} roughness={0.9} />
        </mesh>
      </group>

      <mesh castShadow position={[0, 1.48, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.18, 10]} />
        <meshStandardMaterial color={skin} roughness={0.78} />
      </mesh>
      <group position={[0, 1.7, 0]}>
        <mesh castShadow scale={[0.92, 1.08, 0.9]}>
          <sphereGeometry args={[0.27, 18, 14]} />
          <meshStandardMaterial color={skin} roughness={0.76} />
        </mesh>
        <mesh castShadow position={[0, 0.16, -0.025]} scale={[1, 0.55, 1]}>
          <sphereGeometry args={[0.285, 16, 10]} />
          <meshStandardMaterial color={darkHair} roughness={0.95} />
        </mesh>
        <mesh position={[0, -0.015, 0.255]} scale={[0.55, 0.8, 0.75]}>
          <sphereGeometry args={[0.065, 10, 8]} />
          <meshStandardMaterial color={skin} roughness={0.8} />
        </mesh>
        {[-0.095, 0.095].map((x) => (
          <group key={x} position={[x, 0.055, 0.247]}>
            <mesh scale={[1, 0.7, 0.35]}>
              <sphereGeometry args={[0.032, 10, 8]} />
              <meshStandardMaterial color="#f1dfcf" />
            </mesh>
            <mesh position={[0, 0, 0.012]}>
              <sphereGeometry args={[0.013, 8, 6]} />
              <meshStandardMaterial color="#29241f" />
            </mesh>
          </group>
        ))}
        {hasBeard && (
          <mesh position={[0, -0.145, 0.19]} scale={[0.75, 0.9, 0.45]}>
            <sphereGeometry args={[0.19, 12, 9]} />
            <meshStandardMaterial color={darkHair} roughness={1} />
          </mesh>
        )}
        <mesh position={[0, -0.085, 0.264]} rotation={[0.12, 0, 0]}>
          <torusGeometry args={[0.055, 0.012, 6, 16, Math.PI]} />
          <meshStandardMaterial color="#70423d" />
        </mesh>
      </group>

      {([-1, 1] as const).map((side) => (
        <group
          key={`arm-${side}`}
          ref={side < 0 ? leftArm : rightArm}
          position={[side * 0.39, 1.25, 0]}
        >
          <mesh castShadow position={[0, -0.21, 0]}>
            <capsuleGeometry args={[0.105, 0.3, 6, 10]} />
            <meshStandardMaterial color={cloth} roughness={0.88} />
          </mesh>
          <mesh castShadow position={[0, -0.51, 0.015]}>
            <capsuleGeometry args={[0.085, 0.25, 6, 10]} />
            <meshStandardMaterial color={skin} roughness={0.78} />
          </mesh>
          <mesh castShadow position={[0, -0.72, 0.025]} scale={[0.8, 1.1, 0.7]}>
            <sphereGeometry args={[0.1, 10, 8]} />
            <meshStandardMaterial color={skin} roughness={0.78} />
          </mesh>
        </group>
      ))}

      {([-1, 1] as const).map((side) => (
        <group
          key={`leg-${side}`}
          ref={side < 0 ? leftLeg : rightLeg}
          position={[side * 0.17, 0.68, 0]}
        >
          <mesh castShadow position={[0, -0.24, 0]}>
            <capsuleGeometry args={[0.12, 0.3, 6, 10]} />
            <meshStandardMaterial color={accent} roughness={0.9} />
          </mesh>
          <mesh castShadow position={[0, -0.56, 0]}>
            <capsuleGeometry args={[0.105, 0.29, 6, 10]} />
            <meshStandardMaterial color={accent} roughness={0.92} />
          </mesh>
          <mesh castShadow position={[0, -0.77, 0.08]} scale={[1, 0.7, 1.65]}>
            <sphereGeometry args={[0.13, 10, 8]} />
            <meshStandardMaterial color="#302820" roughness={1} />
          </mesh>
        </group>
      ))}
      {(variant === "evangelist" || variant === "interpreter") && (
        <mesh position={[0.42, 0.95, 0.08]} rotation={[0, 0, -0.18]}>
          <boxGeometry args={[0.3, 0.48, 0.06]} />
          <meshStandardMaterial color="#d8c699" />
        </mesh>
      )}
      {variant === "worldly" && (
        <mesh position={[0, 1.72, 0]}>
          <cylinderGeometry args={[0.34, 0.28, 0.18, 8]} />
          <meshStandardMaterial color="#2d2534" />
        </mesh>
      )}
      {variant === "shining" && (
        <pointLight
          position={[0, 1.1, 0]}
          color="#ffe9a6"
          intensity={5}
          distance={4}
        />
      )}
      {burden && (
        <group position={[0, 1.02, -0.38]} rotation={[-0.18, 0, 0]}>
          <mesh castShadow>
            <dodecahedronGeometry args={[0.55, 0]} />
            <meshStandardMaterial color="#30231f" roughness={1} />
          </mesh>
          <mesh rotation={[0, 0, 0.7]}>
            <torusGeometry args={[0.38, 0.035, 6, 14]} />
            <meshStandardMaterial color="#8b6a4b" />
          </mesh>
        </group>
      )}
    </group>
  );
}

export function GnarledTree({
  position,
  color = "#253326",
  dead = false,
  scale = 1,
}: {
  position: [number, number, number];
  color?: string;
  dead?: boolean;
  scale?: number;
}) {
  const lean = ((position[0] * 13) % 7) * 0.025;
  return (
    <group position={position} scale={scale} rotation={[0, position[2], lean]}>
      <mesh castShadow position={[0, 1, 0]}>
        <cylinderGeometry args={[0.18, 0.34, 2.1, 7]} />
        <meshStandardMaterial color="#49372d" roughness={1} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          castShadow
          position={[side * 0.38, 1.55, 0]}
          rotation={[0, 0, side * -0.72]}
        >
          <cylinderGeometry args={[0.07, 0.12, 0.95, 6]} />
          <meshStandardMaterial color="#49372d" roughness={1} />
        </mesh>
      ))}
      {!dead &&
        [-0.62, -0.3, 0, 0.34, 0.65].map((x, i) => (
          <mesh
            key={i}
            castShadow
            position={[x, 1.9 + (i % 3) * 0.25, ((i % 2) - 0.5) * 0.3]}
            scale={[1.1 + (i % 2) * 0.15, 0.9, 0.9]}
          >
            <dodecahedronGeometry args={[0.58, 1]} />
            <meshStandardMaterial
              color={i % 2 ? color : "#344b35"}
              roughness={0.96}
            />
          </mesh>
        ))}
    </group>
  );
}
export function CrookedHouse({
  position,
  color = "#4d2d31",
  lit = false,
  scale = 1,
}: {
  position: [number, number, number];
  color?: string;
  lit?: boolean;
  scale?: number;
}) {
  return (
    <group
      position={position}
      scale={scale}
      rotation={[0, position[0] * 0.08, position[0] * 0.018]}
    >
      <mesh castShadow position={[0, 0.9, 0]}>
        <boxGeometry args={[1.8, 1.8, 1.5]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0, 2, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.45, 1.1, 4]} />
        <meshStandardMaterial color="#281c22" roughness={1} />
      </mesh>
      <mesh position={[0, 0.72, 0.77]}>
        <boxGeometry args={[0.45, 0.85, 0.08]} />
        <meshStandardMaterial
          color={lit ? "#e5a64c" : "#211820"}
          emissive={lit ? "#c8782f" : "#000"}
          emissiveIntensity={lit ? 1.2 : 0}
        />
      </mesh>
      {lit && (
        <pointLight
          position={[0, 0.8, 1]}
          color="#ffad58"
          intensity={4}
          distance={4}
        />
      )}
    </group>
  );
}
export function StoneArch({
  position,
  gate = false,
}: {
  position: [number, number, number];
  gate?: boolean;
}) {
  return (
    <group position={position}>
      <mesh castShadow position={[-1.05, 1.25, 0]}>
        <boxGeometry args={[0.55, 2.5, 0.8]} />
        <meshStandardMaterial color="#5b5860" roughness={1} />
      </mesh>
      <mesh castShadow position={[1.05, 1.25, 0]}>
        <boxGeometry args={[0.55, 2.5, 0.8]} />
        <meshStandardMaterial color="#5b5860" roughness={1} />
      </mesh>
      <mesh castShadow position={[0, 2.48, 0]}>
        <boxGeometry args={[2.65, 0.5, 0.8]} />
        <meshStandardMaterial color="#5b5860" roughness={1} />
      </mesh>
      {gate && (
        <mesh position={[0, 1.12, 0.1]}>
          <boxGeometry args={[1.55, 2.15, 0.18]} />
          <meshStandardMaterial color="#84532e" roughness={0.8} />
        </mesh>
      )}
    </group>
  );
}
export function Mountain({
  position = [0, 0, -8],
  color = "#7b6b60",
}: {
  position?: [number, number, number];
  color?: string;
}) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 3, 0]} rotation={[0, 0.3, 0.08]}>
        <coneGeometry args={[6, 8, 5]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <mesh position={[0, 5.5, 0.8]}>
        <coneGeometry args={[2.3, 3.5, 5]} />
        <meshStandardMaterial color="#b2a7a0" roughness={1} />
      </mesh>
    </group>
  );
}
export function CrossMonument({
  position = [0, 0, 0] as [number, number, number],
}) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 2, 0]}>
        <boxGeometry args={[0.35, 4, 0.35]} />
        <meshStandardMaterial color="#6f4e35" roughness={1} />
      </mesh>
      <mesh castShadow position={[0, 2.65, 0]}>
        <boxGeometry args={[2.2, 0.35, 0.35]} />
        <meshStandardMaterial color="#6f4e35" roughness={1} />
      </mesh>
      <pointLight
        position={[0, 2.5, 1]}
        color="#fff0b5"
        intensity={12}
        distance={9}
      />
    </group>
  );
}
export function Grave({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.65, 1.1, 20]} />
        <meshStandardMaterial color="#544a3d" />
      </mesh>
      <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.67, 20]} />
        <meshStandardMaterial color="#09090b" />
      </mesh>
    </group>
  );
}
export function Reeds({
  count = 20,
  radius = 6,
  color = "#65704d",
}: {
  count?: number;
  radius?: number;
  color?: string;
}) {
  const values = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: Math.sin(i * 8.31) * radius,
        z: Math.cos(i * 5.17) * radius,
        h: 0.5 + (i % 5) * 0.12,
      })),
    [count, radius],
  );
  return (
    <>
      {values.map((v, i) => (
        <mesh
          key={i}
          position={[v.x, v.h / 2, v.z]}
          rotation={[0, 0, ((i % 3) - 0.8) * 0.08]}
        >
          <cylinderGeometry args={[0.025, 0.045, v.h, 5]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </>
  );
}

export function GrassMeadow({
  count = 70,
  radius = 7,
  color = "#617348",
  flowers = true,
}: {
  count?: number;
  radius?: number;
  color?: string;
  flowers?: boolean;
}) {
  const blades = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = i * 2.399;
        const distance = 1.2 + ((i * 47) % 100) * 0.058 * (radius / 7);
        return {
          x: Math.cos(angle) * Math.min(distance, radius),
          z: Math.sin(angle) * Math.min(distance, radius),
          height: 0.16 + (i % 5) * 0.035,
          lean: ((i % 7) - 3) * 0.035,
        };
      }),
    [count, radius],
  );
  const bladeInstances = useRef<InstancedMesh>(null);
  const stemInstances = useRef<InstancedMesh>(null);
  const flowerInstances = useRef<InstancedMesh>(null);
  const flowerCount = flowers ? Math.ceil(count / 11) : 0;
  useLayoutEffect(() => {
    const dummy = new Object3D();
    blades.forEach((blade, i) => {
      [-0.06, 0, 0.06].forEach((offset, bladeIndex) => {
        dummy.position.set(blade.x + offset, blade.height / 2, blade.z);
        dummy.rotation.set(0, i * 0.71, blade.lean + bladeIndex * 0.025);
        dummy.scale.set(1, blade.height / 0.25, 1);
        dummy.updateMatrix();
        bladeInstances.current?.setMatrixAt(i * 3 + bladeIndex, dummy.matrix);
      });
    });
    if (bladeInstances.current)
      bladeInstances.current.instanceMatrix.needsUpdate = true;
    if (!flowers) return;
    let flowerIndex = 0;
    blades.forEach((blade, i) => {
      if (i % 11 !== 0) return;
      dummy.position.set(blade.x, 0.15, blade.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      stemInstances.current?.setMatrixAt(flowerIndex, dummy.matrix);
      dummy.position.set(blade.x, 0.28, blade.z);
      dummy.updateMatrix();
      flowerInstances.current?.setMatrixAt(flowerIndex, dummy.matrix);
      flowerInstances.current?.setColorAt(
        flowerIndex,
        new Color(i % 22 ? "#eacb77" : "#d9b7d0"),
      );
      flowerIndex += 1;
    });
    if (stemInstances.current)
      stemInstances.current.instanceMatrix.needsUpdate = true;
    if (flowerInstances.current) {
      flowerInstances.current.instanceMatrix.needsUpdate = true;
      if (flowerInstances.current.instanceColor)
        flowerInstances.current.instanceColor.needsUpdate = true;
    }
  }, [blades, flowers]);
  return (
    <group>
      <instancedMesh
        ref={bladeInstances}
        args={[undefined, undefined, count * 3]}
      >
        <coneGeometry args={[0.026, 0.25, 4]} />
        <meshStandardMaterial color={color} roughness={1} />
      </instancedMesh>
      {flowers && (
        <>
          <instancedMesh
            ref={stemInstances}
            args={[undefined, undefined, flowerCount]}
          >
            <cylinderGeometry args={[0.009, 0.014, 0.25, 5]} />
            <meshStandardMaterial color="#536d3e" />
          </instancedMesh>
          <instancedMesh
            ref={flowerInstances}
            args={[undefined, undefined, flowerCount]}
          >
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshStandardMaterial roughness={0.8} />
          </instancedMesh>
        </>
      )}
    </group>
  );
}

export function Bush({
  position,
  color = "#4f683d",
  scale = 1,
}: {
  position: [number, number, number];
  color?: string;
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      {[
        [-0.28, 0.32, 0],
        [0.24, 0.3, 0.08],
        [0, 0.5, -0.08],
      ].map((point, i) => (
        <mesh
          key={i}
          castShadow
          position={point as [number, number, number]}
          scale={[1.2, 0.9, 1]}
        >
          <dodecahedronGeometry args={[0.42, 1]} />
          <meshStandardMaterial
            color={i === 2 ? color : "#3f5935"}
            roughness={0.96}
          />
        </mesh>
      ))}
    </group>
  );
}

export function WaterPool({
  position = [0, 0.025, 0],
  scale = [1, 1, 1],
  color = "#446f79",
}: {
  position?: [number, number, number];
  scale?: [number, number, number];
  color?: string;
}) {
  const ripples = useRef<Group>(null);
  const reducedMotion = useGame((s) => s.reducedMotion);
  useFrame(({ clock }) => {
    if (!ripples.current || reducedMotion) return;
    ripples.current.rotation.z = clock.elapsedTime * 0.08;
    ripples.current.position.y = Math.sin(clock.elapsedTime * 1.3) * 0.008;
  });
  return (
    <group position={position} scale={scale} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh receiveShadow>
        <circleGeometry args={[1, 48]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.12}
          metalness={0.18}
          transmission={0.12}
          transparent
          opacity={0.78}
          clearcoat={0.8}
          clearcoatRoughness={0.15}
        />
      </mesh>
      <group ref={ripples} position={[0, 0, 0.012]}>
        {[0.32, 0.58, 0.84].map((radius) => (
          <mesh key={radius}>
            <ringGeometry args={[radius, radius + 0.012, 48]} />
            <meshBasicMaterial color="#b7d8d6" transparent opacity={0.34} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 0, -0.012]}>
        <ringGeometry args={[0.98, 1.07, 48]} />
        <meshStandardMaterial color="#495540" roughness={1} />
      </mesh>
    </group>
  );
}
export function Room({
  children,
  color = "#35293b",
}: {
  children?: ReactNode;
  color?: string;
}) {
  return (
    <group>
      {(
        [
          [-7, 2.5, 0],
          [7, 2.5, 0],
          [0, 2.5, -7],
        ] as [number, number, number][]
      ).map((p, i) => (
        <mesh key={i} receiveShadow position={p}>
          <boxGeometry args={[i === 2 ? 14 : 0.35, 5, i === 2 ? 0.35 : 14]} />
          <meshStandardMaterial color={color} roughness={1} />
        </mesh>
      ))}
      {children}
    </group>
  );
}
