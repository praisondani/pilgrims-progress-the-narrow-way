import { Float, Sparkles } from "@react-three/drei";
import {
  CapsuleCollider,
  CuboidCollider,
  RigidBody,
} from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Color, Group, MeshStandardMaterial } from "three";
import { useGame } from "./state";
import { StepKind, storyScenes } from "./story";
import { playerPosition } from "./Player";
import {
  BurdenPack,
  Character,
  CharacterVariant,
  CrossMonument,
  StoneArch,
} from "./Visuals";
import { SceneEnvironment } from "./Environments";
import { renderingFeatureFlags } from "./rendering/capabilities";
import {
  buildDreamTerrainCollisionDescriptors,
  DREAM_SCENE_SEED,
} from "./assets/environment/dream";
import {
  WICKET_GATE_ROOT,
  deriveGateController,
  type GateController,
} from "./gate/GateController";

const dreamTerrainCollisionDescriptors =
  buildDreamTerrainCollisionDescriptors(DREAM_SCENE_SEED, "medium");

function DreamGround({ color }: { color: Color }) {
  const material = useRef<MeshStandardMaterial>(null);
  useEffect(() => {
    if (!material.current) return;
    material.current.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 vDreamGroundPosition;",
        )
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvDreamGroundPosition = transformed;",
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 vDreamGroundPosition;",
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          float meadowGrain =
            sin(vDreamGroundPosition.x * 0.18 + vDreamGroundPosition.y * 0.11) * 0.5 +
            sin(vDreamGroundPosition.x * 0.47 - vDreamGroundPosition.y * 0.23) * 0.24;
          float meadowBand = smoothstep(-0.62, 0.62, meadowGrain);
          diffuseColor.rgb = mix(
            diffuseColor.rgb * 0.84,
            diffuseColor.rgb * 1.08,
            meadowBand
          );`,
        );
    };
    material.current.customProgramCacheKey = () => "dream-ground-breakup-v1";
    material.current.needsUpdate = true;
  }, []);
  return (
    <mesh receiveShadow position={[0, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[44, 44, 32, 32]} />
      <meshStandardMaterial
        ref={material}
        color={color}
        roughness={0.94}
        metalness={0}
      />
    </mesh>
  );
}

function DreamTerrainColliders() {
  return (
    <>
      {dreamTerrainCollisionDescriptors.flatMap((descriptor) => {
        if (!descriptor.blocksPlayer) return [];
        if (descriptor.shape === "box")
          return [
            <CuboidCollider
              key={descriptor.id}
              args={[...descriptor.halfExtents]}
              position={[...descriptor.position]}
              rotation={[0, descriptor.rotationY, 0]}
            />,
          ];
        if (descriptor.shape === "capsule") {
          const radius = descriptor.halfExtents[0];
          return [
            <CapsuleCollider
              key={descriptor.id}
              args={[
                Math.max(0.1, descriptor.halfExtents[1] - radius),
                radius,
              ]}
              position={[...descriptor.position]}
              rotation={[0, descriptor.rotationY, 0]}
            />,
          ];
        }
        if (descriptor.shape !== "ribbon") return [];
        return descriptor.centerline.slice(1).flatMap((end, index) => {
          const start = descriptor.centerline[index];
          const dx = end[0] - start[0];
          const dz = end[1] - start[1];
          const length = Math.hypot(dx, dz);
          if (length < 0.001) return [];
          const midpoint: [number, number] = [
            (start[0] + end[0]) * 0.5,
            (start[1] + end[1]) * 0.5,
          ];
          if (
            descriptor.gaps?.some(
              (gap) =>
                Math.hypot(
                  midpoint[0] - gap.center[0],
                  midpoint[1] - gap.center[1],
                ) < gap.radius,
            )
          )
            return [];
          const offset =
            (descriptor.innerOffset + descriptor.outerOffset) * 0.5;
          const width = Math.abs(
            descriptor.outerOffset - descriptor.innerOffset,
          );
          const normalX = -dz / length;
          const normalZ = dx / length;
          const minimumY = descriptor.elevation[0];
          const maximumY = descriptor.elevation[1];
          return [
            <CuboidCollider
              key={`${descriptor.id}-${index}`}
              args={[
                width * 0.5,
                (maximumY - minimumY) * 0.5,
                length * 0.5,
              ]}
              position={[
                midpoint[0] + normalX * offset,
                (minimumY + maximumY) * 0.5,
                midpoint[1] + normalZ * offset,
              ]}
              rotation={[0, Math.atan2(dx, dz), 0]}
            />,
          ];
        });
      })}
    </>
  );
}

function GateColliders({ controller }: { controller: GateController }) {
  return (
    <>
      <CuboidCollider
        args={[2.35, 1.8, 0.46]}
        position={[-4.05, 1.8, WICKET_GATE_ROOT[2]]}
      />
      <CuboidCollider
        args={[2.35, 1.8, 0.46]}
        position={[4.05, 1.8, WICKET_GATE_ROOT[2]]}
      />
      {!controller.doorwayOpen && (
        <CuboidCollider
          args={[1.38, 1.68, 0.24]}
          position={[0, 1.68, WICKET_GATE_ROOT[2] + 0.27]}
        />
      )}
      <CuboidCollider args={[1.85, 0.25, 1.55]} position={[0, -0.25, -9.2]} />
    </>
  );
}

function personFor(id: string, sceneId = ""): CharacterVariant {
  if (id.includes("evangelist")) return "evangelist";
  if (id.includes("family") || id === "child") return "family";
  if (id.includes("obstinate")) return "obstinate";
  if (id.includes("pliable")) return "pliable";
  if (id === "help") return "help";
  if (id.includes("worldly")) return "worldly";
  if (id === "goodwill") return "goodwill";
  if (id === "cage") return "caged";
  if (id === "new-clothing") return "shining";
  if (id === "simple") return "simple";
  if (id === "sloth") return "sloth";
  if (id === "presumption") return "presumption";
  if (id.includes("formalist")) return "formalist";
  if (id.includes("hypocrisy")) return "hypocrisy";
  if (id === "timorous") return "timorous";
  if (id === "mistrust") return "mistrust";
  if (id.includes("watchful")) return "watchful";
  if (id === "discretion") return "discretion";
  if (id === "prudence") return "prudence";
  if (id === "piety") return "piety";
  if (id === "charity") return "charity";
  if (id.includes("faithful")) return "faithful";
  if (id.includes("hopeful")) return "hopeful";
  if (id.includes("wanton")) return "wanton";
  if (id.includes("adam")) return "adam";
  if (id.includes("discontent")) return "discontent";
  if (id.includes("shame")) return "shame";
  if (id.includes("talkative")) return "talkative";
  if (id.includes("servant")) return "servant";
  if (id.includes("hategood")) return "hategood";
  if (id.includes("envy")) return "envy";
  if (id.includes("superstition")) return "superstition";
  if (id.includes("pickthank")) return "pickthank";
  if (id.includes("byends")) return "byends";
  if (id.includes("money") || id.includes("companions-overheard")) return "moneylove";
  if (sceneId === "byends") return "byends";
  if (id.includes("demas")) return "demas";
  if (id.includes("vain-confidence")) return "vainconfidence";
  if (id.includes("diffidence")) return "diffidence";
  return "interpreter";
}
function TargetShape({
  kind,
  light,
  id,
  sceneId,
}: {
  kind: StepKind;
  light: string;
  id: string;
  sceneId: string;
}) {
  if (id === "burden-roll")
    return (
      <group position={[0, 0.62, 0]} rotation={[0.22, 0.4, 0.72]}>
        <BurdenPack />
      </group>
    );
  if (
    [
      "simple",
      "sloth",
      "presumption",
      "formalist-arrives",
      "hypocrisy-arrives",
      "watchful-gate",
      "discretion",
      "prudence",
      "piety",
      "charity",
    ].includes(id)
  )
    return <group />;
  if (id === "observe-lions")
    return (
      <group position={[0, 0.65, 0]}>
        <mesh castShadow scale={[1.35, 0.8, 0.8]}>
          <sphereGeometry args={[0.55, 14, 10]} />
          <meshStandardMaterial color="#ad7737" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0, 0.3, 0.55]}>
          <sphereGeometry args={[0.4, 14, 10]} />
          <meshStandardMaterial color="#6b4325" roughness={1} />
        </mesh>
      </group>
    );
  if (kind === "person") return <Character variant={personFor(id, sceneId)} />;
  if (kind === "companion")
    if (sceneId === "hopeful" && id !== "hopeful-arrives")
      return (
        <group position={[0, 0.25, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.55, 0.72, 24]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={1.2} />
          </mesh>
        </group>
      );
  if (kind === "companion")
    return (
      <Character
        variant={sceneId === "hopeful" ? "hopeful" : "faithful"}
      />
    );
  if (kind === "enemy")
    if (sceneId === "doubting")
      return <Character variant="despair" scale={1.45} />;
  if (kind === "enemy")
    return (
      <group position={[0, 1.15, 0]} scale={1.15}>
        <mesh castShadow scale={[1.1, 1.35, 0.8]}>
          <sphereGeometry args={[0.7, 14, 10]} />
          <meshStandardMaterial color="#51404c" roughness={0.72} metalness={0.16} />
        </mesh>
        <mesh position={[0, 0.72, 0]} castShadow>
          <sphereGeometry args={[0.42, 14, 10]} />
          <meshStandardMaterial color="#613e48" roughness={0.86} />
        </mesh>
        {[-0.14, 0.14].map((x) => (
          <mesh key={x} position={[x, 0.8, 0.38]}>
            <sphereGeometry args={[0.055, 10, 8]} />
            <meshStandardMaterial color="#ffd26c" emissive="#d84e3e" emissiveIntensity={3} />
          </mesh>
        ))}
        <mesh position={[0, 0.53, 0.4]} rotation={[0.25, 0, 0]}>
          <coneGeometry args={[0.2, 0.34, 5]} />
          <meshStandardMaterial color="#34282e" roughness={0.9} />
        </mesh>
        {[-0.26, 0.26].map((x) => (
          <mesh key={x} position={[x, 1.2, -0.03]} rotation={[0, 0, x * 1.5]}>
            <coneGeometry args={[0.12, 0.75, 7]} />
            <meshStandardMaterial color="#342b31" />
          </mesh>
        ))}
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 0.86, 0.25, -0.25]} rotation={[0.2, 0, side * 0.7]}>
              <coneGeometry args={[0.7, 1.8, 5]} />
              <meshStandardMaterial color="#342f44" side={2} roughness={0.9} />
            </mesh>
            <mesh castShadow position={[side * 0.73, 0.05, 0.15]} rotation={[0.5, 0, side * 0.65]}>
              <capsuleGeometry args={[0.11, 0.72, 7, 10]} />
              <meshStandardMaterial color="#563741" roughness={0.82} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -0.3, -0.52]} rotation={[0.3, 0, 0]}>
          <torusGeometry args={[0.62, 0.09, 8, 24, Math.PI * 1.35]} />
          <meshStandardMaterial color="#47313b" roughness={0.88} />
        </mesh>
        <pointLight position={[0, 0.8, 0.7]} color="#d15c4e" intensity={3} distance={4} />
      </group>
    );
  if (kind === "market")
    return (
      <group position={[0, 0.7, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.8, 1.1, 1]} />
          <meshStandardMaterial color="#754657" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.9, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[1.5, 1.5, 0.12]} />
          <meshStandardMaterial color="#d2a14f" />
        </mesh>
      </group>
    );
  if (kind === "prison")
    return (
      <group position={[0, 1, 0]}>
        {[-0.75, -0.38, 0, 0.38, 0.75].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 2.2, 8]} />
            <meshStandardMaterial color="#383b42" metalness={0.85} roughness={0.25} />
          </mesh>
        ))}
      </group>
    );
  if (kind === "prayer")
    return (
      <group position={[0, 0.8, 0]}>
        {[0.45, 0.7, 0.95].map((radius, index) => (
          <mesh key={radius} rotation={[Math.PI / 2, index * 0.5, 0]}>
            <torusGeometry args={[radius, 0.025, 6, 32]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={1.4 - index * 0.25} transparent opacity={0.8 - index * 0.16} />
          </mesh>
        ))}
      </group>
    );
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
  const usesAuthoredDreamLandmark =
    scene.id === "dream" && step.id === "lantern";
  const usesAuthoredGateLandmark = scene.id === "gate";
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
      {!usesAuthoredDreamLandmark && (
        <>
          {!usesAuthoredGateLandmark && (
            <Float speed={1.25} floatIntensity={0.12}>
              <TargetShape
                kind={step.kind}
                light={scene.palette.light}
                id={step.id}
                sceneId={scene.id}
              />
            </Float>
          )}
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
        </>
      )}
    </group>
  );
}
export function World() {
  const {
    sceneIndex,
    stepIndex,
    visibility,
    dialogue,
    dialogueIndex,
    sceneComplete,
    reducedMotion,
  } = useGame();
  const scene = storyScenes[sceneIndex];
  const step = scene.steps[stepIndex];
  const gateController =
    scene.id === "gate"
      ? deriveGateController({
          stepId: step.id,
          dialogueActive: Boolean(dialogue),
          dialogueIndex,
          sceneComplete,
          reducedMotion,
        })
      : null;
  const bright = visibility !== "standard";
  const ground = new Color(scene.palette.ground).lerp(
    new Color("#7faa61"),
    bright ? 0.28 : 0.16,
  );
  const sky = new Color(scene.palette.sky).lerp(
    new Color("#9ccbd8"),
    bright ? 0.24 : 0.13,
  );
  const earth = ground.clone().lerp(new Color("#75533a"), 0.62);
  const path = ground.clone().lerp(new Color("#e4c887"), 0.28);
  const proceduralField =
    scene.id === "field" && renderingFeatureFlags().advancedTerrain;
  const authoredDream = scene.id === "dream";
  const sceneSky = authoredDream ? new Color("#0d1a2a") : sky;
  const sceneFog = authoredDream
    ? new Color("#2c4050")
    : sky.clone().lerp(new Color(scene.palette.fog), 0.45);
  return (
    <>
      <color attach="background" args={[sceneSky]} />
      <fog
        attach="fog"
        args={[
          sceneFog,
          authoredDream ? 11 : bright ? 20 : 17,
          authoredDream ? 35 : bright ? 52 : 44,
        ]}
      />
      <hemisphereLight
        intensity={authoredDream ? 1.35 : bright ? 2.25 : 1.75}
        color={scene.palette.light}
        groundColor={ground}
      />
      <directionalLight
        castShadow
        position={[7, 12, 6]}
        intensity={authoredDream ? 2.25 : bright ? 3.6 : 3.1}
        color={scene.palette.light}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-radius={4}
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
        {authoredDream && <DreamTerrainColliders />}
        {gateController && <GateColliders controller={gateController} />}
        {authoredDream ? (
          <DreamGround color={ground} />
        ) : (
          <mesh receiveShadow position={[0, -0.34, 0]}>
            <cylinderGeometry args={[10.7, 11.35, 0.68, 64]} />
            <meshStandardMaterial color={earth} roughness={1} />
          </mesh>
        )}
        {!proceduralField && (
          <>
            {!authoredDream && (
              <>
                <mesh receiveShadow position={[0, 0.005, 0]}>
                  <cylinderGeometry args={[10.7, 10.7, 0.04, 64]} />
                  <meshStandardMaterial color={ground} roughness={0.96} />
                </mesh>
                <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[9.72, 10.54, 64]} />
                  <meshStandardMaterial color={path} roughness={1} transparent opacity={0.2} />
                </mesh>
              </>
            )}
          </>
        )}
      </RigidBody>
      <SceneEnvironment
        id={scene.id}
        stepIndex={stepIndex}
        target={step.position}
        gateController={gateController}
      />
      <ActiveTarget />
    </>
  );
}
