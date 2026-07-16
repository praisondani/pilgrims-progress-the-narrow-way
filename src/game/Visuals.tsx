import { useFrame } from "@react-three/fiber";
import { ReactNode, useMemo, useRef } from "react";
import { Group, Mesh } from "three";
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
  const leftArm = useRef<Mesh>(null);
  const rightArm = useRef<Mesh>(null);
  const leftLeg = useRef<Mesh>(null);
  const rightLeg = useRef<Mesh>(null);
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
    if (root.current)
      root.current.position.y = reducedMotion
        ? 0
        : Math.sin(t * (walking ? 9 : 1.6)) * (walking ? 0.035 : 0.018);
  });
  return (
    <group ref={root} scale={scale}>
      <mesh castShadow position={[0, 0.84, 0]}>
        <coneGeometry args={[0.42, 0.92, 7]} />
        <meshStandardMaterial color={cloth} roughness={0.92} />
      </mesh>
      <mesh castShadow position={[0, 1.46, 0]}>
        <dodecahedronGeometry args={[0.27, 1]} />
        <meshStandardMaterial color={skin} roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0, 1.67, -0.02]} scale={[1, 0.45, 1]}>
        <sphereGeometry args={[0.28, 12, 8]} />
        <meshStandardMaterial
          color={variant === "shining" ? "#f7e7b4" : "#392a28"}
          roughness={1}
        />
      </mesh>
      <mesh ref={leftArm} castShadow position={[-0.4, 0.92, 0]}>
        <capsuleGeometry args={[0.09, 0.52, 4, 8]} />
        <meshStandardMaterial color={cloth} />
      </mesh>
      <mesh ref={rightArm} castShadow position={[0.4, 0.92, 0]}>
        <capsuleGeometry args={[0.09, 0.52, 4, 8]} />
        <meshStandardMaterial color={cloth} />
      </mesh>
      <mesh ref={leftLeg} castShadow position={[-0.16, 0.3, 0]}>
        <capsuleGeometry args={[0.1, 0.48, 4, 8]} />
        <meshStandardMaterial color={accent} />
      </mesh>
      <mesh ref={rightLeg} castShadow position={[0.16, 0.3, 0]}>
        <capsuleGeometry args={[0.1, 0.48, 4, 8]} />
        <meshStandardMaterial color={accent} />
      </mesh>
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
        <group position={[0, 0.95, 0.34]} rotation={[0.25, 0, 0]}>
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
      {!dead &&
        [-0.55, 0, 0.55].map((x, i) => (
          <mesh
            key={i}
            castShadow
            position={[x, 2 + (i % 2) * 0.22, 0]}
            scale={[1.2, 1, 0.8]}
          >
            <dodecahedronGeometry args={[0.65, 0]} />
            <meshStandardMaterial color={color} roughness={1} />
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
