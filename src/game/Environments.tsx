import { Float, Sparkles, Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { DoubleSide, Group, Shape } from "three";
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
  WicketGateLandmark,
} from "./Visuals";
import { ProceduralCountryside } from "./procedural/ProceduralCountryside";
import { renderingFeatureFlags } from "./rendering/capabilities";
import { playerPosition } from "./Player";
import { requestPlayerImpact } from "./camera";
import { useGame } from "./state";
import { gameAudio } from "./audio";
import { DreamEnvironmentKit } from "./assets/environment/dream";
import {
  GATE_ARROW_LANES,
  GATE_COVER_CENTERS,
  WICKET_GATE_ROOT,
  gateArrowFrame,
  isInsideGateCover,
  segmentCircleContact,
  segmentSegmentContact,
  type GateController,
} from "./gate/GateController";

type Target = [number, number];
const clearsTarget = (position: number[], target: Target, radius = 2.35) =>
  Math.hypot(position[0] - target[0], position[2] - target[1]) > radius;

function StoryCloud({
  position,
  scale = [1, 1, 1],
  opacity = 0.28,
  speed = 0.1,
}: {
  position: [number, number, number];
  scale?: [number, number, number];
  opacity?: number;
  speed?: number;
}) {
  const cloud = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!cloud.current) return;
    cloud.current.position.x = Math.sin(clock.elapsedTime * speed) * 0.45;
    cloud.current.position.y = Math.cos(clock.elapsedTime * speed * 0.7) * 0.08;
  });
  return (
    <group position={position} scale={scale}>
      <group ref={cloud}>
        {[
          [-0.65, 0, 0, 0.72],
          [0, 0.18, 0, 0.92],
          [0.72, 0.02, 0, 0.68],
          [0.2, -0.12, 0.2, 0.76],
        ].map(([x, y, z, size], index) => (
          <mesh key={index} position={[x, y, z]} scale={[1.35, 0.72, 0.85]}>
            <sphereGeometry args={[size, 16, 10]} />
            <meshBasicMaterial
              color="#f6f0df"
              transparent
              opacity={opacity}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

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
function Dream({ stepIndex }: { stepIndex: number }) {
  const reducedMotion = useGame((state) => state.reducedMotion);
  return (
    <DreamEnvironmentKit
      quality="medium"
      water="moonlit"
      atmosphere="fog"
      includeBackground
      lanternLit={stepIndex > 0}
      reducedMotion={reducedMotion}
    />
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
      <group position={[0, 0, -8.5]}>
        <mesh position={[-3.8, -1.65, 0]} scale={[1.35, 0.42, 0.72]}>
          <sphereGeometry args={[6, 24, 12]} />
          <meshStandardMaterial color="#536b65" roughness={1} />
        </mesh>
        <mesh position={[4.2, -1.9, -1.2]} scale={[1.15, 0.36, 0.64]}>
          <sphereGeometry args={[6, 24, 12]} />
          <meshStandardMaterial color="#5e7468" roughness={1} />
        </mesh>
      </group>
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
      <StoryCloud
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
function FlyingArrows({ controller }: { controller: GateController }) {
  const arrows = useRef<(Group | null)[]>([]);
  const warnings = useRef<(Group | null)[]>([]);
  const previousX = useRef<number[]>([]);
  const previousCycle = useRef<number[]>([]);
  const previousPlayer = useRef<[number, number] | null>(null);
  const hitCycle = useRef<number[]>([]);
  const lastPhase = useRef("");
  const lastImpact = useRef(0);
  const impactPosition = useRef<[number, number, number]>([0, 1.25, 0]);
  const [impactVisible, setImpactVisible] = useState(false);
  const impactTimer = useRef<number | undefined>(undefined);
  const setMessage = useGame((state) => state.setMessage);
  const vulnerable = useGame(
    (state) =>
      !state.paused &&
      !state.dialogue &&
      !state.choosing &&
      !state.puzzleActive &&
      !state.sceneComplete,
  );
  useEffect(() => {
    delete document.documentElement.dataset.lastArrowImpact;
    return () => {
      if (impactTimer.current) window.clearTimeout(impactTimer.current);
      delete document.documentElement.dataset.lastArrowImpact;
      delete document.documentElement.dataset.arrowSalvoPhase;
    };
  }, []);
  useFrame(({ clock }) => {
    const now = performance.now();
    const playerEnd: [number, number] = [playerPosition.x, playerPosition.z];
    const playerStart = previousPlayer.current ?? playerEnd;
    previousPlayer.current = playerEnd;
    const sharedFrame = gateArrowFrame(clock.elapsedTime, 0);
    if (lastPhase.current !== sharedFrame.phase) {
      lastPhase.current = sharedFrame.phase;
      document.documentElement.dataset.arrowSalvoPhase = sharedFrame.phase;
    }
    arrows.current.forEach((arrow, index) => {
      if (!arrow) return;
      const frame = gateArrowFrame(clock.elapsedTime, index);
      const z = GATE_ARROW_LANES[index];
      const y = 1.05 + (index % 3) * 0.22;
      const priorX =
        previousCycle.current[index] === frame.cycle
          ? (previousX.current[index] ?? frame.x)
          : -9.4;
      previousCycle.current[index] = frame.cycle;
      previousX.current[index] = frame.x;
      arrow.position.set(frame.x, y, z);
      arrow.visible = frame.visible && hitCycle.current[index] !== frame.cycle;
      if (warnings.current[index])
        warnings.current[index]!.visible =
          frame.targeted && frame.phase === "telegraph";
      if (
        vulnerable &&
        !controller.doorwayOpen &&
        arrow.visible &&
        now - lastImpact.current > 1_450 &&
        !isInsideGateCover([playerPosition.x, playerPosition.z]) &&
        (segmentSegmentContact(
          [priorX, z],
          [frame.x, z],
          playerStart,
          playerEnd,
          0.92,
        ) ||
          segmentCircleContact(
            [priorX, z],
            [frame.x, z],
            playerEnd,
            0.92,
          )) &&
        Math.abs(playerPosition.y - y) < 1.05
      ) {
        lastImpact.current = now;
        hitCycle.current[index] = frame.cycle;
        arrow.visible = false;
        impactPosition.current = [playerPosition.x - 0.35, y, playerPosition.z];
        setImpactVisible(true);
        if (impactTimer.current) window.clearTimeout(impactTimer.current);
        impactTimer.current = window.setTimeout(() => setImpactVisible(false), 650);
        requestPlayerImpact(1, 0);
        gameAudio.impact();
        setMessage("An arrow strikes Christian—keep moving toward the Gate!");
        document.documentElement.dataset.lastArrowImpact = String(Date.now());
      }
    });
  });
  return (
    <group>
      {GATE_ARROW_LANES.map((z, i) => (
        <group key={z}>
          <group
            ref={(element) => {
              warnings.current[i] = element;
            }}
            position={[0, 0.065, z]}
          >
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[18, 0.16]} />
              <meshBasicMaterial color="#ff9b55" transparent opacity={0.36} depthWrite={false} />
            </mesh>
            <mesh position={[-8.3, 0.18, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.17, 0.45, 6]} />
              <meshBasicMaterial color="#ffc06d" />
            </mesh>
          </group>
          <group
            ref={(element) => {
              arrows.current[i] = element;
            }}
            rotation={[0, 0, -Math.PI / 2]}
          >
            <mesh>
              <cylinderGeometry args={[0.025, 0.025, 1.3, 6]} />
              <meshStandardMaterial color="#5b402e" />
            </mesh>
            <mesh position={[0, 0.75, 0]}>
              <coneGeometry args={[0.1, 0.25, 5]} />
              <meshStandardMaterial color="#d5d0c8" metalness={0.7} roughness={0.28} />
            </mesh>
            <mesh position={[0, -0.58, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.065, 0.14, 0.012]} />
              <meshStandardMaterial color="#d8c7ad" roughness={0.78} side={2} />
            </mesh>
            <mesh position={[0, -0.58, 0]} rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.065, 0.14, 0.012]} />
              <meshStandardMaterial color="#bda98f" roughness={0.82} side={2} />
            </mesh>
          </group>
        </group>
      ))}
      {impactVisible && (
        <group position={impactPosition.current}>
          <pointLight color="#ffc56e" intensity={4} distance={2.5} />
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.16, 0.29, 18]} />
            <meshBasicMaterial color="#ffe1a3" transparent opacity={0.82} />
          </mesh>
          <group rotation={[0, 0, -Math.PI / 2]} position={[-0.22, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.025, 0.025, 0.9, 6]} />
              <meshStandardMaterial color="#5b402e" />
            </mesh>
            <mesh position={[0, 0.55, 0]}>
              <coneGeometry args={[0.09, 0.2, 5]} />
              <meshStandardMaterial color="#aaa5a0" metalness={0.7} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}
function GateDuskSky() {
  return (
    <mesh renderOrder={-20}>
      <sphereGeometry args={[36, 32, 18]} />
      <shaderMaterial
        side={1}
        depthWrite={false}
        toneMapped={false}
        vertexShader={`
          varying vec3 vDirection;
          void main() {
            vDirection = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vDirection;
          void main() {
            vec3 direction = normalize(vDirection);
            float horizonBlend = smoothstep(-0.12, 0.68, direction.y);
            float lowerBlend = smoothstep(-0.34, -0.04, direction.y);
            vec3 lower = vec3(0.17, 0.20, 0.24);
            vec3 horizon = vec3(0.62, 0.39, 0.34);
            vec3 zenith = vec3(0.12, 0.15, 0.25);
            vec3 color = mix(lower, horizon, lowerBlend);
            color = mix(color, zenith, horizonBlend);
            vec3 sunDirection = normalize(vec3(0.72, 0.13, -1.0));
            float sunGlow = pow(max(dot(direction, sunDirection), 0.0), 120.0);
            float sunCore = pow(max(dot(direction, sunDirection), 0.0), 1600.0);
            color += vec3(1.0, 0.46, 0.18) * sunGlow * 0.32;
            color += vec3(1.0, 0.82, 0.48) * sunCore;
            gl_FragColor = vec4(color, 1.0);
          }
        `}
      />
    </mesh>
  );
}

function GateRidge({
  position,
  scale,
  color,
  opacity = 1,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  opacity?: number;
}) {
  const silhouette = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(-1.3, 0);
    shape.lineTo(-1.08, 0.28);
    shape.lineTo(-0.72, 0.42);
    shape.lineTo(-0.42, 0.92);
    shape.lineTo(-0.05, 0.58);
    shape.lineTo(0.34, 1.12);
    shape.lineTo(0.7, 0.48);
    shape.lineTo(1.06, 0.66);
    shape.lineTo(1.38, 0);
    shape.closePath();
    return shape;
  }, []);
  return (
    <mesh
      position={position}
      scale={scale}
      renderOrder={-6}
      rotation={[0, 0, 0]}
    >
      <shapeGeometry args={[silhouette]} />
      <meshBasicMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        depthWrite={false}
        side={DoubleSide}
        fog
      />
    </mesh>
  );
}

function GateDistantValley() {
  return (
    <group name="wicket-gate-distant-valley">
      <GateRidge
        position={[-4.6, 1.1, -17.5]}
        scale={[7.5, 4.1, 1]}
        color="#34485a"
        opacity={0.82}
      />
      <GateRidge
        position={[4.4, 1.45, -18.5]}
        scale={[8.8, 3.8, 1]}
        color="#425565"
        opacity={0.72}
      />
      <GateRidge
        position={[0, 2.1, -20.5]}
        scale={[11.5, 4.4, 1]}
        color="#637080"
        opacity={0.48}
      />
      <StoryCloud
        position={[-5.8, 6.1, -14.5]}
        scale={[3.2, 0.78, 1]}
        opacity={0.16}
        speed={0.035}
      />
      <StoryCloud
        position={[5.6, 5.5, -16.5]}
        scale={[2.5, 0.62, 1]}
        opacity={0.12}
        speed={0.028}
      />
    </group>
  );
}
function GateCover({ position }: { position: Target }) {
  return (
    <group position={[position[0], 0, position[1]]} name="gate-cover">
      {[-0.55, 0, 0.55].map((x, index) => (
        <mesh key={x} castShadow receiveShadow position={[x, 0.42 + index * 0.04, 0]}>
          <dodecahedronGeometry args={[0.58 + (index % 2) * 0.12, 0]} />
          <meshStandardMaterial color={index === 1 ? "#69675f" : "#565b55"} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Gate({
  target: _target,
  controller,
}: {
  target: Target;
  controller: GateController;
}) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.gateStep = controller.stepId;
    root.dataset.gateDoor = controller.doorOpen ? "open" : "closed";
    root.dataset.gateBolts = controller.boltsReleased ? "released" : "locked";
    root.dataset.gateGoodwill = controller.goodwillVisible ? "visible" : "hidden";
    return () => {
      delete root.dataset.gateStep;
      delete root.dataset.gateDoor;
      delete root.dataset.gateBolts;
      delete root.dataset.gateGoodwill;
    };
  }, [controller]);
  return (
    <>
      <GateDuskSky />
      <GateDistantValley />
      <mesh position={[0, 0.031, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[10.6, 64]} />
        <meshBasicMaterial color="#4f6c52" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.034, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[10.58, 64]} />
        <shadowMaterial transparent opacity={0.2} />
      </mesh>
      <WicketGateLandmark position={WICKET_GATE_ROOT} controller={controller} />
      {GATE_COVER_CENTERS.map((position) => (
        <GateCover key={`${position[0]}-${position[1]}`} position={position} />
      ))}
      <GrassMeadow count={92} radius={9.2} color="#40563b" />
      <GnarledTree position={[-7.2, 0, -5.4]} color="#314534" scale={1.5} />
      <GnarledTree position={[7.15, 0, -6.2]} color="#354a38" scale={1.28} />
      <Bush position={[-6.2, 0, -5.3]} color="#4f623e" scale={1.25} />
      <Bush position={[6.05, 0, -5.5]} color="#52653f" scale={1.15} />
      <FlyingArrows controller={controller} />
      <Sparkles
        count={28}
        scale={[5, 5, 3]}
        position={[0, 2.3, -7]}
        color="#ffd78b"
        size={2.1}
        speed={0.18}
        opacity={0.34}
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
      <StoryCloud
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
      <StoryCloud position={[-3, 5, -7]} opacity={0.3} speed={0.14} />
      <StoryCloud position={[4, 6, -5]} opacity={0.24} speed={0.1} />
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
      <StoryCloud position={[0, 6, -5]} scale={[3, 1, 1]} opacity={0.24} />
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

function HumiliationValley({ target }: { target: Target }) {
  return (
    <>
      <GrassMeadow count={96} color="#4f6848" flowers />
      {[-7, 7].map((x) => (
        <group key={x} scale={0.58}>
          <Mountain position={[x / 0.58, -0.5, 0]} color="#566253" />
        </group>
      ))}
      {[
        [-5.5, 0, -4],
        [5.5, 0, -4],
        [-6, 0, 4.5],
        [6, 0, 4.5],
      ]
        .filter((position) => clearsTarget(position, target))
        .map((position, index) => (
          <GnarledTree
            key={index}
            position={position as [number, number, number]}
            color="#486044"
            scale={0.85 + index * 0.05}
          />
        ))}
      {Array.from({ length: 12 }, (_, index) => {
        const angle = index * 1.7;
        const position = [Math.sin(angle) * 5.8, 0.12, Math.cos(angle) * 5.3];
        return clearsTarget(position, target) ? (
          <mesh key={index} castShadow position={position as [number, number, number]} rotation={[0.2, angle, 0.1]}>
            <dodecahedronGeometry args={[0.45 + (index % 3) * 0.18]} />
            <meshStandardMaterial color={index % 2 ? "#665c51" : "#4b4b48"} roughness={1} />
          </mesh>
        ) : null;
      })}
      <Sparkles count={45} scale={[13, 4, 13]} color="#e6c788" opacity={0.2} />
    </>
  );
}

function ShadowValley({ target }: { target: Target }) {
  return (
    <>
      <Stars radius={22} depth={13} count={520} factor={1.2} fade speed={0.08} />
      {[-7.4, 7.4].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          {[-5, -1.5, 2, 5.5].map((z, index) => (
            <group key={z} scale={0.52 + index * 0.04}>
              <Mountain position={[0, -0.9, z / (0.52 + index * 0.04)]} color="#292d35" />
            </group>
          ))}
        </group>
      ))}
      {[
        [-5.5, 0, -3],
        [5.5, 0, -1],
        [-5.8, 0, 3],
        [5.8, 0, 4.5],
      ]
        .filter((position) => clearsTarget(position, target))
        .map((position, index) => (
          <GnarledTree key={index} position={position as [number, number, number]} dead scale={1.1} />
        ))}
      {[-4.7, 4.7].map((x) => (
        <mesh key={x} position={[x, -0.2, 1]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.6, 13]} />
          <meshStandardMaterial color={x < 0 ? "#11151d" : "#20251f"} roughness={0.4} />
        </mesh>
      ))}
      {[-3.8, 0, 3.6].map((z, index) => (
        <Float key={z} speed={0.6 + index * 0.12} floatIntensity={0.35}>
          <mesh position={[index % 2 ? 4.8 : -4.8, 0.9, z]}>
            <sphereGeometry args={[0.16, 10, 8]} />
            <meshStandardMaterial color="#78a7bd" emissive="#5f91b2" emissiveIntensity={3} />
          </mesh>
        </Float>
      ))}
      <Sparkles count={55} scale={[14, 4, 14]} color="#75899b" opacity={0.22} />
    </>
  );
}

function FaithfulRoad({ target }: { target: Target }) {
  return (
    <>
      <GrassMeadow count={108} color="#617856" />
      {[
        [-6, 0, -4],
        [6, 0, -4],
        [-6, 0, 3],
        [6, 0, 4],
      ]
        .filter((position) => clearsTarget(position, target))
        .map((position, index) => (
          <GnarledTree key={index} position={position as [number, number, number]} color="#54704f" scale={0.9} />
        ))}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, 15]} />
        <meshStandardMaterial color="#81765f" roughness={1} />
      </mesh>
      {[-4, 0, 4].map((z, index) => (
        <mesh key={z} position={[index % 2 ? -4.7 : 4.7, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.1, 1.22, 24]} />
          <meshStandardMaterial color={["#b07082", "#9b8d61", "#6c6687"][index]} emissive="#8e735d" emissiveIntensity={0.2} />
        </mesh>
      ))}
      <StoryCloud position={[0, 7, -6]} scale={[4, 1.1, 1]} opacity={0.2} />
    </>
  );
}

function TalkativeRoad({ target }: { target: Target }) {
  return (
    <>
      <GrassMeadow count={76} color="#6c7355" flowers={false} />
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 15]} />
        <meshStandardMaterial color="#887c68" roughness={1} />
      </mesh>
      <group position={[5.2, 0, 2.2]}>
        <mesh castShadow position={[0, 0.65, 0]}>
          <cylinderGeometry args={[0.75, 0.9, 1.3, 12]} />
          <meshStandardMaterial color="#786f64" roughness={1} />
        </mesh>
        <WaterPool position={[0, 1.3, 0]} scale={[0.55, 0.55, 0.55]} />
      </group>
      {[-5.8, 5.8].map((x, index) =>
        clearsTarget([x, 0, -4], target) ? (
          <GnarledTree key={x} position={[x, 0, -4]} color="#5e684b" scale={0.9 + index * 0.1} />
        ) : null,
      )}
      <StoneArch position={[0, 0, -7]} />
    </>
  );
}

function WarningRidge() {
  return (
    <>
      <GrassMeadow count={58} color="#565b47" flowers={false} />
      <Stars radius={28} depth={18} count={480} factor={1.5} fade speed={0.12} />
      <group scale={0.58}>
        <Mountain position={[-10.35, -1, -1]} color="#4d4850" />
        <Mountain position={[10.35, -1, -1]} color="#514852" />
      </group>
      <group position={[0, 0, -10]}>
        {[-5, -2.5, 0, 2.5, 5].map((x, index) => (
          <group key={x} position={[x, 0, index % 2 ? 0.8 : 0]}>
            <mesh position={[0, 1.4, 0]}>
              <boxGeometry args={[1.5, 2.8, 1.5]} />
              <meshStandardMaterial color="#6d4155" />
            </mesh>
            <pointLight position={[0, 2, -1]} color="#f0a44e" intensity={4} distance={5} />
          </group>
        ))}
      </group>
      <StoryCloud position={[0, 6, 3]} scale={[4, 1, 1]} opacity={0.28} />
    </>
  );
}

function MarketStall({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.75, 0]}>
        <boxGeometry args={[2.2, 1.5, 1.5]} />
        <meshStandardMaterial color="#6b5147" roughness={0.92} />
      </mesh>
      <mesh castShadow position={[0, 1.8, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[1.8, 1.8, 0.16]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      {[-0.65, 0, 0.65].map((x) => (
        <mesh key={x} position={[x, 0.9, -0.82]}>
          <sphereGeometry args={[0.18, 10, 8]} />
          <meshStandardMaterial color="#d3a259" />
        </mesh>
      ))}
    </group>
  );
}

function VanityFair({ stepIndex, target }: { stepIndex: number; target: Target }) {
  const stalls = [
    [-5.5, 0, -4, "#a84f61"],
    [5.5, 0, -4, "#4f7fa1"],
    [-6, 0, 0, "#bd8a3d"],
    [6, 0, 0, "#7657a0"],
    [-5.5, 0, 4, "#4d916c"],
    [5.5, 0, 4, "#b55e3f"],
  ] as const;
  const crowd = [
    ["talkative", -3.4, -3.8],
    ["envy", 3.4, -3.6],
    ["pickthank", -3.7, -0.8],
    ["servant", 3.6, -0.5],
    ["superstition", -3.5, 2.5],
    ["wanton", 3.5, 2.7],
    ["discontent", -2.7, 5],
    ["adam", 2.7, 5],
  ] as const;
  return (
    <>
      {stalls
        .filter(([x, y, z]) => clearsTarget([x, y, z], target))
        .map(([x, y, z, color]) => (
          <MarketStall key={`${x}-${z}`} position={[x, y, z]} color={color} />
        ))}
      {crowd
        .filter(([, x, z]) => clearsTarget([x, 0, z], target, 1.8))
        .map(([variant, x, z], index) => (
          <group key={`${variant}-${index}`} position={[x, 0, z]} rotation={[0, index % 2 ? -0.45 : 0.45, 0]}>
            <Character variant={variant} scale={0.68} />
          </group>
        ))}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, 16]} />
        <meshStandardMaterial color="#8a6a5c" roughness={1} />
      </mesh>
      {stepIndex >= 5 && (
        <group position={[0, 0, -9]}>
          <mesh castShadow position={[0, 2, 0]}>
            <boxGeometry args={[8, 4, 3]} />
            <meshStandardMaterial color="#4c4148" roughness={0.95} />
          </mesh>
          {[-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((x) => (
            <mesh key={x} position={[x, 1.2, 1.55]}>
              <cylinderGeometry args={[0.05, 0.05, 2.4, 8]} />
              <meshStandardMaterial color="#25272e" metalness={0.8} />
            </mesh>
          ))}
        </group>
      )}
      {stepIndex >= 7 && (
        <group position={[-5.2, 0, -4]}>
          <mesh position={[0, 1.2, 0]}>
            <boxGeometry args={[3.4, 2.4, 2.2]} />
            <meshStandardMaterial color="#68484b" />
          </mesh>
          <mesh position={[0, 2.7, 0]}>
            <boxGeometry args={[4.2, 0.35, 2.6]} />
            <meshStandardMaterial color="#b08b57" />
          </mesh>
        </group>
      )}
      {stepIndex === 12 && (
        <group position={[3, 0, 5]}>
          <mesh position={[0, 2.7, 0]}>
            <cylinderGeometry args={[0.45, 1.35, 5.4, 16, 1, true]} />
            <meshBasicMaterial color="#f8dda0" transparent opacity={0.2} side={2} />
          </mesh>
          <Float speed={0.65} floatIntensity={0.5}>
            <mesh position={[0, 3.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.9, 0.08, 8, 32]} />
              <meshStandardMaterial color="#fff1b1" emissive="#f4c96f" emissiveIntensity={3} />
            </mesh>
          </Float>
          <pointLight position={[0, 3, 0]} color="#ffe3a0" intensity={12} distance={10} />
          <Sparkles count={70} scale={[3, 7, 3]} color="#fff0b0" opacity={0.75} />
        </group>
      )}
      <Sparkles count={100} scale={[15, 7, 15]} color="#f0bd60" opacity={stepIndex < 5 ? 0.42 : 0.16} />
    </>
  );
}

function HopefulRoad({ target }: { target: Target }) {
  return (
    <>
      <GrassMeadow count={92} color="#607359" />
      {[-6, 6].map((x, index) =>
        clearsTarget([x, 0, 2], target) ? (
          <GnarledTree key={x} position={[x, 0, 2]} color="#536c53" scale={1 + index * 0.08} />
        ) : null,
      )}
      <mesh position={[0, 0.05, 4]}>
        <boxGeometry args={[5.6, 0.18, 1.5]} />
        <meshStandardMaterial color="#6e685d" roughness={1} />
      </mesh>
      <mesh position={[0.7, -0.05, 4]} rotation={[0, 0.25, 0]}>
        <boxGeometry args={[1.35, 0.3, 1.8]} />
        <meshStandardMaterial color="#343b3d" />
      </mesh>
      <StoryCloud position={[0, 6, -4]} scale={[4, 1, 1]} opacity={0.22} />
      <Sparkles count={36} scale={[13, 4, 13]} color="#e7d39a" opacity={0.24} />
    </>
  );
}

function ByEndsRoad({ target }: { target: Target }) {
  return (
    <>
      <GrassMeadow count={84} color="#6d7357" flowers={false} />
      <mesh position={[0, 0.02, -1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.1, 15]} />
        <meshStandardMaterial color="#887b68" roughness={1} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 2.2, 0.018, 4.2]}
          rotation={[-Math.PI / 2, side * 0.3, 0]}
        >
          <planeGeometry args={[2.1, 7]} />
          <meshStandardMaterial color={side < 0 ? "#756f62" : "#6c725d"} roughness={1} />
        </mesh>
      ))}
      {[
        [-5.8, 0, -4],
        [5.8, 0, -4],
        [-6, 0, 3.5],
        [6, 0, 3.5],
      ]
        .filter((position) => clearsTarget(position, target))
        .map((position, index) => (
          <GnarledTree key={index} position={position as [number, number, number]} color="#5d684f" scale={0.85} />
        ))}
      <group position={[0, 0, 5.4]}>
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[0.18, 2.2, 0.18]} />
          <meshStandardMaterial color="#5b4938" />
        </mesh>
        <mesh position={[0, 1.8, 0]} rotation={[0, 0, 0.08]}>
          <boxGeometry args={[2.5, 0.55, 0.15]} />
          <meshStandardMaterial color="#8b7556" />
        </mesh>
      </group>
      <StoryCloud position={[0, 6.5, -5]} scale={[4, 1, 1]} opacity={0.24} />
    </>
  );
}

function DemasMine({ target }: { target: Target }) {
  return (
    <>
      <GrassMeadow count={54} color="#5e6557" flowers={false} />
      <group scale={0.62}>
        <Mountain position={[0, -1, -12]} color="#4f5757" />
      </group>
      <group position={[0, 0, -6.5]}>
        <StoneArch position={[0, 0, 0]} />
        <mesh position={[0, 1.2, -0.15]}>
          <circleGeometry args={[1.25, 20]} />
          <meshStandardMaterial color="#171c20" roughness={1} />
        </mesh>
        {[-1.8, -1.05, -0.35, 0.35, 1.05, 1.8].map((x, index) => (
          <Float key={x} speed={0.45 + index * 0.04} floatIntensity={0.08}>
            <mesh position={[x, 0.4 + (index % 3) * 0.45, 0.5]} rotation={[0.3, index, 0]}>
              <octahedronGeometry args={[0.22 + (index % 2) * 0.12]} />
              <meshStandardMaterial color="#d8d5bb" emissive="#c2c0a4" emissiveIntensity={1.4} metalness={0.7} roughness={0.2} />
            </mesh>
          </Float>
        ))}
      </group>
      <mesh position={[3.6, -0.05, -3]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 24]} />
        <meshStandardMaterial color="#171b1e" roughness={0.3} />
      </mesh>
      {Array.from({ length: 10 }, (_, index) => {
        const position = [Math.sin(index * 1.7) * 5.3, 0.1, Math.cos(index * 1.7) * 5];
        return clearsTarget(position, target) ? (
          <mesh key={index} castShadow position={position as [number, number, number]}>
            <dodecahedronGeometry args={[0.35 + (index % 3) * 0.18]} />
            <meshStandardMaterial color="#555856" roughness={0.95} />
          </mesh>
        ) : null;
      })}
      <group position={[-3, 0, 4]}>
        <mesh position={[0, 1.3, 0]}>
          <cylinderGeometry args={[0.42, 0.55, 2.6, 12]} />
          <meshStandardMaterial color="#c8c1a4" roughness={0.85} />
        </mesh>
      </group>
      <Sparkles count={55} scale={[12, 4, 12]} color="#ddd5a6" opacity={0.3} />
    </>
  );
}

function ByPathMeadow({ stepIndex, target }: { stepIndex: number; target: Target }) {
  return (
    <>
      <GrassMeadow count={132} color="#526f4f" flowers={stepIndex < 6} />
      <mesh position={[-3.6, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.7, 15]} />
        <meshStandardMaterial color="#766f63" roughness={1} />
      </mesh>
      <mesh position={[2.3, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.8, 15]} />
        <meshStandardMaterial color="#638459" roughness={1} />
      </mesh>
      {[-5.2, -4.4, -3.6, -2.8, -2].map((z) => (
        <mesh key={z} position={[-0.7, 0.5, z]}>
          <boxGeometry args={[0.12, 1, 0.12]} />
          <meshStandardMaterial color="#61513f" />
        </mesh>
      ))}
      <mesh position={[0, -0.04, 5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.3, 24]} />
        <meshStandardMaterial color="#171d1f" roughness={0.4} />
      </mesh>
      {stepIndex >= 6 && (
        <>
          <WaterPool position={[2.6, 0.035, 1.8]} scale={[2.3, 1.2, 1.7]} color="#425f62" />
          <WaterPool position={[-2.2, 0.035, 3.3]} scale={[1.8, 1, 1.2]} color="#3f5d61" />
          <Sparkles count={90} scale={[14, 6, 14]} color="#9ab2ba" opacity={0.28} />
        </>
      )}
      {[
        [-6, 0, -4],
        [6, 0, -4],
        [-6, 0, 4],
        [6, 0, 4],
      ]
        .filter((position) => clearsTarget(position, target))
        .map((position, index) => (
          <GnarledTree key={index} position={position as [number, number, number]} color="#476145" dead={stepIndex >= 6} scale={0.9} />
        ))}
      <StoryCloud position={[0, 6, -4]} scale={[5, 1.2, 1]} opacity={stepIndex >= 6 ? 0.58 : 0.2} />
    </>
  );
}

function DoubtingCastle({ stepIndex }: { stepIndex: number }) {
  return (
    <>
      <Stars radius={25} depth={15} count={360} factor={1.2} fade speed={0.05} />
      <group position={[0, 0, -8]}>
        <mesh castShadow position={[0, 2.5, 0]}>
          <boxGeometry args={[9, 5, 4]} />
          <meshStandardMaterial color="#373b42" roughness={0.96} />
        </mesh>
        {[-3.5, 3.5].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh castShadow position={[0, 3.4, 0]}>
              <cylinderGeometry args={[1.35, 1.55, 6.8, 7]} />
              <meshStandardMaterial color="#30353d" roughness={1} />
            </mesh>
            <mesh position={[0, 7.1, 0]}>
              <coneGeometry args={[1.7, 2, 7]} />
              <meshStandardMaterial color="#262a32" />
            </mesh>
          </group>
        ))}
        {[-2.4, -1.2, 0, 1.2, 2.4].map((x) => (
          <mesh key={x} position={[x, 1.25, 2.05]}>
            <cylinderGeometry args={[0.055, 0.055, 2.5, 8]} />
            <meshStandardMaterial color="#171a20" metalness={0.82} />
          </mesh>
        ))}
      </group>
      {[-6.3, 6.3].map((x) => (
        <GnarledTree key={x} position={[x, 0, 1]} dead scale={1.15} />
      ))}
      {stepIndex >= 7 && (
        <Float speed={0.8} floatIntensity={0.12}>
          <group position={[-5, 0.85, 1]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.38, 0.095, 8, 18]} />
              <meshStandardMaterial color="#d8b85e" emissive="#bc8f34" emissiveIntensity={2} metalness={0.7} />
            </mesh>
            <mesh position={[0.55, 0, 0]}>
              <boxGeometry args={[0.8, 0.13, 0.13]} />
              <meshStandardMaterial color="#d8b85e" metalness={0.75} />
            </mesh>
          </group>
        </Float>
      )}
      <Sparkles count={42} scale={[14, 6, 14]} color={stepIndex >= 7 ? "#d9bd75" : "#697582"} opacity={0.22} />
    </>
  );
}

export function SceneEnvironment({
  id,
  stepIndex,
  target,
  gateController,
}: {
  id: string;
  stepIndex: number;
  target: Target;
  gateController: GateController | null;
}) {
  if (id === "dream") return <Dream stepIndex={stepIndex} />;
  if (id === "city") return <City target={target} />;
  if (id === "field")
    return renderingFeatureFlags().advancedTerrain ? (
      <ProceduralCountryside />
    ) : (
      <Field target={target} />
    );
  if (id === "slough") return <Slough />;
  if (id === "worldly") return <Worldly target={target} />;
  if (id === "gate" && gateController)
    return <Gate target={target} controller={gateController} />;
  if (id === "interpreter") return <Interpreter stepIndex={stepIndex} />;
  if (id === "cross") return <CrossScene stepIndex={stepIndex} />;
  if (id === "sleepers") return <RoadsideSleepers target={target} />;
  if (id === "wall") return <WalledHighway target={target} />;
  if (id === "hill") return <DifficultyHill />;
  if (id === "arbor") return <ArborShelter />;
  if (id === "lions") return <LionsApproach />;
  if (id === "palace") return <PalaceGarden stepIndex={stepIndex} />;
  if (id === "humiliation") return <HumiliationValley target={target} />;
  if (id === "shadow") return <ShadowValley target={target} />;
  if (id === "faithful") return <FaithfulRoad target={target} />;
  if (id === "talkative") return <TalkativeRoad target={target} />;
  if (id === "warning") return <WarningRidge />;
  if (id === "vanity") return <VanityFair stepIndex={stepIndex} target={target} />;
  if (id === "hopeful") return <HopefulRoad target={target} />;
  if (id === "byends") return <ByEndsRoad target={target} />;
  if (id === "demas") return <DemasMine target={target} />;
  if (id === "bypath") return <ByPathMeadow stepIndex={stepIndex} target={target} />;
  return <DoubtingCastle stepIndex={stepIndex} />;
}
