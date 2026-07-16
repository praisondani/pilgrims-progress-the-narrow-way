import { Float, Sparkles, Text } from "@react-three/drei";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Color, Group } from "three";
import { useGame } from "./state";
import { StepKind, storyScenes } from "./story";
import { playerPosition } from "./Player";
import {
  Character,
  CharacterVariant,
  CrossMonument,
  StoneArch,
} from "./Visuals";
import { SceneEnvironment } from "./Environments";

function personFor(id: string): CharacterVariant {
  if (id.includes("evangelist")) return "evangelist";
  if (id.includes("family") || id === "child") return "family";
  if (id.includes("obstinate")) return "obstinate";
  if (id.includes("pliable")) return "pliable";
  if (id === "help") return "help";
  if (id.includes("worldly")) return "worldly";
  if (id === "goodwill") return "goodwill";
  if (id === "cage") return "caged";
  if (id === "new-clothing") return "shining";
  return "interpreter";
}
function TargetShape({
  kind,
  light,
  id,
}: {
  kind: StepKind;
  light: string;
  id: string;
}) {
  if (kind === "person") return <Character variant={personFor(id)} />;
  if (kind === "gate") return <StoneArch position={[0, 0, 0]} gate />;
  if (kind === "cross") return <CrossMonument />;
  if (kind === "cage")
    return (
      <group position={[0, 0.8, 0]}>
        {[-0.65, -0.35, -0.05, 0.25, 0.55].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <boxGeometry args={[0.055, 1.8, 0.8]} />
            <meshStandardMaterial color="#35343b" metalness={0.8} />
          </mesh>
        ))}
        <Character variant="caged" scale={0.7} />
      </group>
    );
  if (kind === "fire")
    return (
      <>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.35, 0.5, 0.25, 8]} />
          <meshStandardMaterial color="#493328" />
        </mesh>
        <mesh position={[0, 0.65, 0]}>
          <coneGeometry args={[0.3, 0.8, 7]} />
          <meshStandardMaterial
            color="#e17935"
            emissive="#ff7e32"
            emissiveIntensity={2}
          />
        </mesh>
        <pointLight
          position={[0, 0.8, 0]}
          color="#ff9a45"
          intensity={8}
          distance={4}
        />
      </>
    );
  if (kind === "book" || kind === "roll")
    return (
      <group position={[0, 0.6, 0]} rotation={[-0.35, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.9, 0.13, 0.7]} />
          <meshStandardMaterial
            color={kind === "roll" ? "#e7d9aa" : "#6c3a2d"}
            emissive={light}
            emissiveIntensity={0.18}
          />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.75, 0.02, 0.57]} />
          <meshStandardMaterial color="#d8c99d" />
        </mesh>
      </group>
    );
  if (kind === "portrait")
    return (
      <group position={[0, 1, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.3, 1.9, 0.15]} />
          <meshStandardMaterial color="#8c684d" />
        </mesh>
        <mesh position={[0, 0, 0.09]}>
          <circleGeometry args={[0.5, 10]} />
          <meshStandardMaterial color="#3f5261" />
        </mesh>
      </group>
    );
  if (kind === "water")
    return (
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.45, 0.32, 0.7, 12]} />
        <meshStandardMaterial color="#648ca0" metalness={0.2} roughness={0.2} />
      </mesh>
    );
  if (kind === "armor")
    return (
      <group position={[0, 0.8, 0]}>
        <mesh>
          <octahedronGeometry args={[0.75]} />
          <meshStandardMaterial
            color="#9a9893"
            metalness={0.8}
            roughness={0.25}
          />
        </mesh>
        <mesh position={[0.75, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.12, 12]} />
          <meshStandardMaterial color="#766d63" metalness={0.7} />
        </mesh>
      </group>
    );
  if (kind === "light")
    return (
      <mesh position={[0, 0.8, 0]}>
        <octahedronGeometry args={[0.38]} />
        <meshStandardMaterial
          color="#fff0aa"
          emissive={light}
          emissiveIntensity={4}
        />
      </mesh>
    );
  if (kind === "mud")
    return (
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1, 20]} />
        <meshStandardMaterial color="#292d22" roughness={0.25} />
      </mesh>
    );
  return (
    <mesh castShadow position={[0, 0.25, 0]}>
      <cylinderGeometry args={[0.7, 0.85, 0.35, 7]} />
      <meshStandardMaterial color="#7d755d" roughness={1} />
    </mesh>
  );
}
function ActiveTarget() {
  const group = useRef<Group>(null);
  const beacon = useRef<Group>(null);
  const { sceneIndex, stepIndex, nearby, setNearby, interact, setMessage } =
    useGame();
  const scene = storyScenes[sceneIndex];
  const step = scene.steps[stepIndex];
  useFrame((_, delta) => {
    if (!group.current) return;
    if (beacon.current) beacon.current.rotation.y += delta * 0.8;
    const isNear = playerPosition.distanceTo(group.current.position) < 2.3;
    if (isNear !== nearby) setNearby(isNear);
  });
  return (
    <group
      ref={group}
      position={[step.position[0], 0, step.position[1]]}
      onClick={() =>
        nearby ? interact() : setMessage("Move closer to interact.")
      }
    >
      <Float speed={1.25} floatIntensity={0.12}>
        <TargetShape
          kind={step.kind}
          light={scene.palette.light}
          id={step.id}
        />
      </Float>
      <Sparkles
        count={22}
        scale={[1.8, 2.5, 1.8]}
        color={scene.palette.light}
        size={2.2}
        speed={0.25}
      />
      <group ref={beacon} position={[0, 2.65, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={12}>
          <torusGeometry args={[0.48, 0.045, 8, 28]} />
          <meshBasicMaterial color={scene.palette.light} depthTest={false} />
        </mesh>
        <mesh
          position={[0, 0.38, 0]}
          rotation={[0, 0, Math.PI]}
          renderOrder={12}
        >
          <coneGeometry args={[0.16, 0.34, 8]} />
          <meshBasicMaterial color={scene.palette.light} depthTest={false} />
        </mesh>
      </group>
      <mesh position={[0, 1.35, 0]} renderOrder={2}>
        <cylinderGeometry args={[0.42, 0.8, 2.7, 16, 1, true]} />
        <meshBasicMaterial
          color={scene.palette.light}
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>
      <Text
        position={[0, 2.35, 0]}
        fontSize={0.27}
        maxWidth={3.2}
        textAlign="center"
        color="#fff1d1"
        outlineWidth={0.014}
        outlineColor="#17121b"
        renderOrder={11}
        material-depthTest={false}
      >
        {step.action}
      </Text>
    </group>
  );
}
export function World() {
  const { sceneIndex, stepIndex, visibility } = useGame();
  const scene = storyScenes[sceneIndex];
  const bright = visibility !== "standard";
  const ground = new Color(scene.palette.ground).lerp(
    new Color("#b9ad98"),
    bright ? 0.14 : 0.06,
  );
  return (
    <>
      <color
        attach="background"
        args={[
          new Color(scene.palette.sky).lerp(
            new Color("#887f87"),
            bright ? 0.13 : 0.04,
          ),
        ]}
      />
      <fog
        attach="fog"
        args={[scene.palette.fog, bright ? 18 : 15, bright ? 48 : 40]}
      />
      <hemisphereLight
        intensity={bright ? 2.25 : 1.75}
        color={scene.palette.light}
        groundColor={ground}
      />
      <directionalLight
        castShadow
        position={[7, 12, 6]}
        intensity={bright ? 3.6 : 3.1}
        color={scene.palette.light}
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight
        position={[
          storyScenes[sceneIndex].steps[stepIndex].position[0],
          3,
          storyScenes[sceneIndex].steps[stepIndex].position[1],
        ]}
        intensity={visibility === "highContrast" ? 7 : 4}
        color={scene.palette.light}
        distance={8}
      />
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[8, 0.25, 8]} position={[0, -0.25, 0]} />
        <mesh receiveShadow position={[0, -0.3, 0]}>
          <boxGeometry args={[40, 0.5, 40]} />
          <meshStandardMaterial color={ground} roughness={0.96} />
        </mesh>
      </RigidBody>
      <SceneEnvironment
        id={scene.id}
        stepIndex={stepIndex}
        target={scene.steps[stepIndex].position}
      />
      <ActiveTarget />
    </>
  );
}
