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

function RoadsideSleepers({ target }: { target: Target }) {
  return (
    <>
      <GrassMeadow count={96} color="#587047" />
      {[
        [-6, 0, -4],
        [6, 0, -2],
        [-6, 0, 5],
        [6, 0, 5],
      ]
        .filter((position) => clearsTarget(position, target))
        .map((position, index) => (
          <GnarledTree
            key={`${position[0]}-${position[2]}`}
            position={position as [number, number, number]}
            color={index % 2 ? "#466342" : "#536d45"}
            scale={0.9 + (index % 2) * 0.18}
          />
        ))}
      {[
        [-5, 0.42, 4, "simple"],
        [0, 0.42, 5, "sloth"],
        [5, 0.42, 4, "presumption"],
      ].map(([x, y, z, variant]) => (
        <group
          key={String(variant)}
          position={[x as number, y as number, z as number]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <Character variant={variant as "simple"} scale={0.88} />
          <mesh position={[0, 0.26, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.2, 0.025, 6, 14]} />
            <meshStandardMaterial color="#4d4a45" metalness={0.7} />
          </mesh>
        </group>
      ))}
      {[-7.2, 7.2].map((x) => (
        <mesh key={x} position={[x, 0.55, 0]}>
          <boxGeometry args={[0.45, 1.1, 18]} />
          <meshStandardMaterial color="#777568" roughness={1} />
        </mesh>
      ))}
    </>
  );
}

function WalledHighway({ target }: { target: Target }) {
  return (
    <>
      <GrassMeadow count={72} color="#5d744c" />
      {[-7, 7].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.8, 0]}>
            <boxGeometry args={[0.55, 1.6, 19]} />
            <meshStandardMaterial color="#77776b" roughness={0.98} />
          </mesh>
          {[-7, -4, -1, 2, 5, 8].map((z) => (
            <mesh key={z} position={[0, 1.55, z]} rotation={[0, 0, 0.25]}>
              <boxGeometry args={[0.7, 0.32, 1.4]} />
              <meshStandardMaterial color="#858274" roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
      <StoneArch position={[0, 0, -7]} />
      <group position={[-4, 1.2, 2]} rotation={[0, 0, -0.35]}>
        <Character variant="formalist" scale={0.9} />
      </group>
      <group position={[4, 1.25, 2]} rotation={[0, 0, 0.35]}>
        <Character variant="hypocrisy" scale={0.9} />
      </group>
      {[
        [-5.5, 0, -5],
        [5.6, 0, 5],
      ]
        .filter((position) => clearsTarget(position, target))
        .map((position, index) => (
          <GnarledTree
            key={index}
            position={position as [number, number, number]}
            color="#506a43"
          />
        ))}
    </>
  );
}

function DifficultyHill() {
  return (
    <>
      <Mountain position={[0, -1, -12]} color="#6c7369" />
      <GrassMeadow count={74} color="#58694a" flowers={false} />
      {Array.from({ length: 9 }, (_, index) => (
        <mesh
          key={index}
          castShadow
          position={[0, index * 0.18, -6 + index * 1.35]}
          rotation={[0, (index % 2 ? -1 : 1) * 0.05, 0]}
        >
          <boxGeometry args={[2.5 - index * 0.07, 0.28, 1.05]} />
          <meshStandardMaterial color="#797b70" roughness={1} />
        </mesh>
      ))}
      <group position={[5.8, 2.2, 0]} rotation={[0, -0.35, 0]}>
        <mesh rotation={[0, 0, 0.08]}>
          <planeGeometry args={[1.6, 8]} />
          <meshPhysicalMaterial
            color="#8fc2cf"
            transparent
            opacity={0.58}
            roughness={0.12}
            transmission={0.2}
            side={2}
          />
        </mesh>
        <Sparkles count={55} scale={[2, 8, 1]} color="#d6f1ed" size={2} />
      </group>
      <WaterPool
        position={[5.6, 0.03, 4.8]}
        scale={[1.4, 0.7, 1]}
        color="#5d8f98"
      />
      <Cloud position={[-3, 5, -7]} opacity={0.3} speed={0.14} />
      <Cloud position={[4, 6, -5]} opacity={0.24} speed={0.1} />
    </>
  );
}

function ArborShelter() {
  return (
    <>
      <GrassMeadow count={82} color="#4f6444" />
      {[-5.5, 5.5].map((x, index) => (
        <GnarledTree
          key={x}
          position={[x, 0, index ? 3 : -2]}
          color="#405b3f"
          scale={1.15}
        />
      ))}
      <group position={[0, 0, -1]}>
        {[-1.7, 1.7].flatMap((x) =>
          [-1.5, 1.5].map((z) => (
            <mesh key={`${x}-${z}`} castShadow position={[x, 1.4, z]}>
              <cylinderGeometry args={[0.13, 0.18, 2.8, 8]} />
              <meshStandardMaterial color="#6d543d" roughness={1} />
            </mesh>
          )),
        )}
        <mesh castShadow position={[0, 2.9, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[2.9, 1.15, 4]} />
          <meshStandardMaterial color="#42523c" roughness={1} />
        </mesh>
        <mesh position={[0, 0.48, 0]}>
          <boxGeometry args={[2.8, 0.22, 0.7]} />
          <meshStandardMaterial color="#75583e" roughness={1} />
        </mesh>
        <Sparkles count={35} scale={[4, 4, 4]} color="#d9b86e" opacity={0.3} />
      </group>
      <pointLight
        position={[0, 2.2, -1]}
        color="#e7b96f"
        intensity={5}
        distance={8}
      />
    </>
  );
}

function Lion({
  position,
  facing,
}: {
  position: [number, number, number];
  facing: number;
}) {
  return (
    <group position={position} rotation={[0, facing, 0]}>
      <mesh castShadow position={[0, 0.75, 0]} scale={[1.5, 0.85, 0.8]}>
        <sphereGeometry args={[0.55, 16, 12]} />
        <meshStandardMaterial color="#b17a36" roughness={0.92} />
      </mesh>
      <group position={[0, 1.08, 0.68]}>
        <mesh castShadow>
          <sphereGeometry args={[0.48, 16, 12]} />
          <meshStandardMaterial color="#6c4425" roughness={1} />
        </mesh>
        <mesh position={[0, 0, 0.34]}>
          <sphereGeometry args={[0.3, 14, 10]} />
          <meshStandardMaterial color="#b98547" roughness={0.9} />
        </mesh>
        {[-0.14, 0.14].map((x) => (
          <mesh key={x} position={[x, 0.1, 0.57]}>
            <sphereGeometry args={[0.035, 8, 6]} />
            <meshStandardMaterial color="#17120e" />
          </mesh>
        ))}
      </group>
      {[-0.3, 0.3].flatMap((x) =>
        [-0.22, 0.22].map((z) => (
          <mesh key={`${x}-${z}`} castShadow position={[x, 0.32, z]}>
            <capsuleGeometry args={[0.1, 0.42, 6, 8]} />
            <meshStandardMaterial color="#a66f32" />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.4, -0.65]} rotation={[0.6, 0, 0]}>
        <torusGeometry args={[0.5, 0.04, 6, 18, Math.PI * 1.3]} />
        <meshStandardMaterial color="#9a672f" />
      </mesh>
      <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.15, 0.035, 6, 24]} />
        <meshStandardMaterial color="#3f4040" metalness={0.8} />
      </mesh>
    </group>
  );
}

function LionsApproach() {
  return (
    <>
      <GrassMeadow count={68} color="#465a43" flowers={false} />
      <Lion position={[-3.2, 0, 2.5]} facing={Math.PI / 2} />
      <Lion position={[3.2, 0, 2.5]} facing={-Math.PI / 2} />
      <PalaceBuilding position={[0, 0, -9]} />
      <pointLight
        position={[0, 4, -5]}
        color="#f5bc6d"
        intensity={10}
        distance={14}
      />
      <Cloud position={[0, 6, -5]} scale={[3, 1, 1]} opacity={0.24} />
    </>
  );
}

function PalaceBuilding({ position = [0, 0, -7] as [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 2.2, 0]}>
        <boxGeometry args={[8.5, 4.4, 3.8]} />
        <meshStandardMaterial color="#7f6f68" roughness={0.92} />
      </mesh>
      {[-3.4, 3.4].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh castShadow position={[0, 3.2, 0]}>
            <cylinderGeometry args={[1.25, 1.45, 6.4, 8]} />
            <meshStandardMaterial color="#756761" roughness={0.95} />
          </mesh>
          <mesh castShadow position={[0, 6.9, 0]}>
            <coneGeometry args={[1.7, 2, 8]} />
            <meshStandardMaterial color="#3e4352" roughness={0.88} />
          </mesh>
        </group>
      ))}
      <StoneArch position={[0, 0, 2]} gate />
      {[-2.3, 0, 2.3].map((x) => (
        <mesh key={x} position={[x, 2.9, 1.94]}>
          <boxGeometry args={[0.72, 1.1, 0.08]} />
          <meshStandardMaterial
            color="#f1bd65"
            emissive="#e39a42"
            emissiveIntensity={1.5}
          />
        </mesh>
      ))}
    </group>
  );
}

function PalaceGarden({ stepIndex }: { stepIndex: number }) {
  const residents = [
    ["discretion", -4, -2],
    ["prudence", -5, 2],
    ["piety", 0, 3],
    ["charity", 5, 2],
    ["watchful", 0, -5],
  ] as const;
  return (
    <>
      <GrassMeadow count={112} color="#526d49" />
      <PalaceBuilding />
      {[
        [-5.8, 0, -4.5],
        [5.8, 0, -4.5],
        [-6, 0, 4.5],
        [6, 0, 4.5],
      ].map((position, index) => (
        <GnarledTree
          key={index}
          position={position as [number, number, number]}
          color="#4c6847"
          scale={0.9}
        />
      ))}
      {residents.map(([variant, x, z]) => (
        <group key={variant} position={[x, 0, z]}>
          <Character variant={variant} scale={0.88} />
        </group>
      ))}
      {stepIndex >= 6 && (
        <group position={[-4, 0, 5]}>
          <mesh position={[0, 1.2, 0]}>
            <boxGeometry args={[2.6, 2.4, 0.4]} />
            <meshStandardMaterial color="#684a3a" />
          </mesh>
          {[-0.8, 0, 0.8].map((x) => (
            <mesh key={x} position={[x, 1.2, 0.25]}>
              <boxGeometry args={[0.5, 1.7, 0.12]} />
              <meshStandardMaterial color="#d2bb86" />
            </mesh>
          ))}
        </group>
      )}
      <pointLight
        position={[0, 4, -4]}
        color="#f4bd69"
        intensity={12}
        distance={15}
      />
      <Sparkles count={65} scale={[14, 7, 14]} color="#f0cd88" opacity={0.32} />
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
  if (id === "cross") return <CrossScene stepIndex={stepIndex} />;
  if (id === "sleepers") return <RoadsideSleepers target={target} />;
  if (id === "wall") return <WalledHighway target={target} />;
  if (id === "hill") return <DifficultyHill />;
  if (id === "arbor") return <ArborShelter />;
  if (id === "lions") return <LionsApproach />;
  return <PalaceGarden stepIndex={stepIndex} />;
}
