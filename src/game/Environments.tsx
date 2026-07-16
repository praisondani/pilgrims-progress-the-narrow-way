import { Cloud, Float, Sparkles, Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group } from "three";
import {
  Bush,
  Character,
  CrookedHouse,
  CrossMonument,
  GnarledTree,
  GrassMeadow,
  Grave,
  Mountain,
  Reeds,
  Room,
  StoneArch,
  WaterPool,
} from "./Visuals";

type Target = [number, number];
const clearsTarget = (position: number[], target: Target, radius = 2.35) =>
  Math.hypot(position[0] - target[0], position[2] - target[1]) > radius;

function Rocks({ pale = false, target }: { pale?: boolean; target: Target }) {
  return (
    <>
      {Array.from({ length: 18 }, (_, i) => {
        const a = i * 0.93;
        const r = 5.2 + (i % 3) * 0.8;
        const p = [Math.sin(a) * r, (i % 4) * 0.12, Math.cos(a) * r];
        return clearsTarget(p, target) ? (
          <mesh
            key={i}
            castShadow
            position={p as [number, number, number]}
            rotation={[i * 0.4, i * 0.7, 0]}
          >
            <dodecahedronGeometry args={[0.45 + (i % 4) * 0.18, 0]} />
            <meshStandardMaterial
              color={pale ? "#837f7b" : "#353746"}
              roughness={1}
            />
          </mesh>
        ) : null;
      })}
    </>
  );
}
function Dream({ target }: { target: Target }) {
  return (
    <>
      <Stars radius={30} depth={18} count={900} factor={2} fade speed={0.2} />
      <Rocks target={target} />
      {[
        [-5, 0, -3],
        [5, 0, 1],
      ]
        .filter((p) => clearsTarget(p, target))
        .map((p, i) => (
          <GnarledTree
            key={i}
            position={p as [number, number, number]}
            dead
            scale={i ? 1.3 : 1}
          />
        ))}
      <StoneArch position={[0, 0, -6]} />
      <pointLight
        position={[-4, 2, -3]}
        color="#d8a25f"
        intensity={5}
        distance={6}
      />
    </>
  );
}
function City({ target }: { target: Target }) {
  return (
    <>
      {[
        [-5.7, 0, -5],
        [-5.8, 0, -1],
        [-5.5, 0, 4],
        [5.7, 0, -4],
        [5.8, 0, 1],
        [5.4, 0, 5],
      ]
        .filter((p) => clearsTarget(p, target))
        .map((p, i) => (
          <CrookedHouse
            key={`${p[0]}-${p[2]}`}
            position={p as [number, number, number]}
            color={i % 2 ? "#4d292e" : "#593033"}
            lit={i === 2}
          />
        ))}
      <StoneArch position={[0, 0, -7]} />
      <Sparkles
        count={55}
        scale={[14, 8, 14]}
        position={[0, 3, 0]}
        color="#8b5345"
        size={3}
        speed={0.08}
        opacity={0.24}
      />
    </>
  );
}
function Field({ target }: { target: Target }) {
  return (
    <>
      <Stars radius={35} depth={20} count={450} factor={1.5} fade />
      <GrassMeadow count={82} color="#536b45" />
      <mesh position={[0, -1, -8]} scale={[2, 1, 1]}>
        <sphereGeometry args={[6, 24, 12]} />
        <meshStandardMaterial color="#344660" roughness={1} />
      </mesh>
      {[
        [-6, 0, -4],
        [6, 0, -2],
        [-6, 0, 4],
        [6, 0, 5],
      ]
        .filter((p) => clearsTarget(p, target))
        .map((p, i) => (
          <GnarledTree
            key={`${p[0]}-${p[2]}`}
            position={p as [number, number, number]}
            color={i % 2 ? "#374a42" : "#3f4f46"}
          />
        ))}
      <Bush position={[-5.7, 0, 0.5]} scale={0.9} />
      <Bush position={[5.8, 0, 2.2]} color="#596f43" scale={1.1} />
      <Float speed={0.5}>
        <mesh position={[0, 4, -7]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshBasicMaterial color="#ffe7a0" />
        </mesh>
        <pointLight
          position={[0, 4, -7]}
          color="#ffe09a"
          intensity={7}
          distance={12}
        />
      </Float>
    </>
  );
}
function Slough() {
  return (
    <>
      <Reeds count={42} radius={6.5} />
      {[
        [-3, 0, -2],
        [2, 0, -3],
        [-1, 0, 2],
        [4, 0, 4],
      ].map((p, i) => (
        <WaterPool
          key={i}
          position={[p[0], 0.025, p[2]]}
          scale={[1.5 + (i % 2) * 0.7, 1.1 + (i % 2) * 0.35, 1]}
          color={i % 2 ? "#344f49" : "#293f3b"}
        />
      ))}
      <GrassMeadow count={46} radius={7} color="#4b5c3d" flowers={false} />
      {[-4, -2, 0, 2, 4].map((x, i) => (
        <mesh
          key={x}
          castShadow
          position={[x * 0.75, 0.08, -4 + i * 1.9]}
          rotation={[0, i * 0.4, 0]}
        >
          <cylinderGeometry args={[0.6, 0.7, 0.16, 8]} />
          <meshStandardMaterial color="#77745c" roughness={1} />
        </mesh>
      ))}
      <Cloud
        position={[0, 3, -6]}
        scale={[3, 1, 1]}
        opacity={0.22}
        speed={0.08}
      />
    </>
  );
}
function Worldly({ target }: { target: Target }) {
  return (
    <>
      <Mountain position={[0, 0, -9]} color="#756b67" />
      <GrassMeadow count={90} color="#667749" />
      {[
        [-5.5, 0, -4],
        [-5.7, 0, 3],
        [5.5, 0, -4],
        [5.7, 0, 3],
      ]
        .filter((p) => clearsTarget(p, target))
        .map((p) => (
          <CrookedHouse
            key={`${p[0]}-${p[2]}`}
            position={p as [number, number, number]}
            color="#88664f"
            lit
            scale={0.9}
          />
        ))}
      <Bush position={[-3.7, 0, 2.8]} color="#687c4c" />
      <Bush position={[3.8, 0, 2.5]} color="#687c4c" />
      {[-4, 0, 4]
        .map((x, i) => [x, 0, 5.8])
        .filter((p) => clearsTarget(p, target))
        .map((p, i) => (
          <GnarledTree
            key={p[0]}
            position={p as [number, number, number]}
            color="#6d714b"
            scale={0.8 + i * 0.1}
          />
        ))}
      <pointLight
        position={[0, 6, -5]}
        color="#f5f1ff"
        intensity={9}
        distance={12}
      />
    </>
  );
}
function FlyingArrows() {
  const root = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (root.current)
      root.current.position.x = ((clock.elapsedTime * 3) % 14) - 7;
  });
  return (
    <group ref={root} position={[0, 1, -2]}>
      {[0, 1.4, 2.8].map((z, i) => (
        <group
          key={z}
          position={[i * -2, 1 + i * 0.25, z]}
          rotation={[0, 0, -Math.PI / 2]}
        >
          <mesh>
            <cylinderGeometry args={[0.025, 0.025, 1.3, 6]} />
            <meshStandardMaterial color="#5b402e" />
          </mesh>
          <mesh position={[0, 0.75, 0]}>
            <coneGeometry args={[0.1, 0.25, 5]} />
            <meshStandardMaterial color="#aaa5a0" metalness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
function Gate({ target }: { target: Target }) {
  const walls = [
    [-5.5, 1.7, -4],
    [5.5, 1.7, -4],
  ].filter((p) => clearsTarget(p, target, 2.6));
  return (
    <>
      {walls.map((p) => (
        <mesh key={p[0]} position={p as [number, number, number]}>
          <boxGeometry args={[3, 3.4, 1.2]} />
          <meshStandardMaterial color="#383b49" roughness={1} />
        </mesh>
      ))}
      <StoneArch position={[0, 0, -6]} gate />
      <pointLight
        position={[0, 2, -5]}
        color="#ffc66d"
        intensity={12}
        distance={10}
      />
      <FlyingArrows />
      <Sparkles
        count={45}
        scale={[5, 6, 4]}
        position={[0, 2, -6]}
        color="#ffd78b"
      />
    </>
  );
}
function Interpreter({ stepIndex }: { stepIndex: number }) {
  return (
    <Room color="#312638">
      <pointLight
        position={[0, 3, 0]}
        color="#d99b59"
        intensity={8}
        distance={12}
      />
      {stepIndex === 0 && (
        <>
          <mesh position={[0, 1.4, -6.7]}>
            <boxGeometry args={[2, 2.7, 0.12]} />
            <meshStandardMaterial color="#8b6547" />
          </mesh>
          <spotLight
            position={[-4, 3, 2]}
            target-position={[0, 1, -6]}
            color="#f3c986"
            intensity={8}
            angle={0.3}
          />
        </>
      )}
      {stepIndex === 1 && (
        <Sparkles
          count={120}
          scale={[10, 4, 10]}
          color="#aa9073"
          size={5}
          speed={0.5}
        />
      )}{" "}
      {stepIndex === 2 && (
        <>
          <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[3, 28]} />
            <meshStandardMaterial color="#506a71" transparent opacity={0.5} />
          </mesh>
        </>
      )}
      {stepIndex === 3 && (
        <>
          <Character variant="pliable" scale={0.9} />
          <Character variant="help" scale={0.9} />
        </>
      )}
      {stepIndex === 4 && (
        <>
          <mesh position={[0, 1, -5]}>
            <boxGeometry args={[4, 2, 0.4]} />
            <meshStandardMaterial color="#40333f" />
          </mesh>
          <pointLight position={[0, 1, -4.5]} color="#ff8b3d" intensity={10} />
        </>
      )}
      {stepIndex === 5 && <StoneArch position={[0, 0, -6]} />}{" "}
      {stepIndex === 6 && <Character variant="caged" />}
    </Room>
  );
}
function CrossScene({ stepIndex }: { stepIndex: number }) {
  return (
    <>
      <GrassMeadow count={105} color="#5f7b4c" />
      <WaterPool
        position={[0, 0.02, 6.7]}
        scale={[5.4, 0.42, 1]}
        color="#578894"
      />
      <Reeds count={18} radius={6.5} color="#71845a" />
      <mesh position={[0, -1.5, -5]} scale={[1.6, 0.45, 1]}>
        <sphereGeometry args={[6, 28, 16]} />
        <meshStandardMaterial color="#687e55" roughness={1} />
      </mesh>
      <CrossMonument position={[0, 0, -5]} />
      <Grave position={[4, 0.05, -3]} />
      <Bush position={[-5.4, 0, 2.2]} color="#607b49" />
      <Bush position={[5.2, 0, 1.4]} color="#607b49" />
      {stepIndex >= 4 && (
        <>
          <Character variant="shining" scale={0.9} />
          <group position={[-2, 0, -3]}>
            <Character variant="shining" scale={0.9} />
          </group>
          <group position={[2, 0, -2]}>
            <Character variant="shining" scale={0.9} />
          </group>
        </>
      )}
      <Sparkles count={140} scale={[15, 8, 15]} color="#fff1b6" opacity={0.6} />
      <Cloud
        position={[0, 6, -7]}
        scale={[4, 1, 1]}
        opacity={0.18}
        speed={0.05}
      />
    </>
  );
}

export function SceneEnvironment({
  id,
  stepIndex,
  target,
}: {
  id: string;
  stepIndex: number;
  target: Target;
}) {
  if (id === "dream") return <Dream target={target} />;
  if (id === "city") return <City target={target} />;
  if (id === "field") return <Field target={target} />;
  if (id === "slough") return <Slough />;
  if (id === "worldly") return <Worldly target={target} />;
  if (id === "gate") return <Gate target={target} />;
  if (id === "interpreter") return <Interpreter stepIndex={stepIndex} />;
  return <CrossScene stepIndex={stepIndex} />;
}
