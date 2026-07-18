import { useFrame } from "@react-three/fiber";
import { ReactNode, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  CanvasTexture,
  Color,
  Group,
  InstancedMesh,
  Object3D,
  SRGBColorSpace,
} from "three";
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
  | "caged"
  | "simple"
  | "sloth"
  | "presumption"
  | "formalist"
  | "hypocrisy"
  | "timorous"
  | "mistrust"
  | "watchful"
  | "discretion"
  | "prudence"
  | "piety"
  | "charity"
  | "faithful"
  | "hopeful"
  | "wanton"
  | "adam"
  | "discontent"
  | "shame"
  | "talkative"
  | "servant"
  | "hategood"
  | "envy"
  | "superstition"
  | "pickthank"
  | "byends"
  | "moneylove"
  | "demas"
  | "vainconfidence"
  | "despair"
  | "diffidence";
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
  simple: ["#77705e", "#514c43", "#a9755c"],
  sloth: ["#59644d", "#41483b", "#9f6f58"],
  presumption: ["#8a6245", "#c19a58", "#b47a5d"],
  formalist: ["#536a78", "#b88e55", "#ae765b"],
  hypocrisy: ["#76516f", "#d1a86b", "#a86f58"],
  timorous: ["#4f5967", "#3e4651", "#9d6a55"],
  mistrust: ["#584d5d", "#3f3944", "#a76f58"],
  watchful: ["#334f69", "#d2ad68", "#a66f55"],
  discretion: ["#6d536b", "#c69d72", "#aa735b"],
  prudence: ["#405f67", "#c7aa72", "#a96f58"],
  piety: ["#615079", "#d1af75", "#ae765d"],
  charity: ["#7d4f54", "#d1a06f", "#b77b61"],
  faithful: ["#a85f42", "#e0bc72", "#a97056"],
  hopeful: ["#497163", "#d8c373", "#ac755b"],
  wanton: ["#9c4f70", "#e1a86f", "#b97761"],
  adam: ["#68543c", "#b99658", "#9d694f"],
  discontent: ["#565a68", "#8c897e", "#a66e55"],
  shame: ["#633f5f", "#b16c74", "#a76e58"],
  talkative: ["#7a557d", "#d3ad64", "#ae7359"],
  servant: ["#676055", "#887d67", "#9c6852"],
  hategood: ["#552c32", "#a88452", "#b1785c"],
  envy: ["#436346", "#8fa35b", "#9f6954"],
  superstition: ["#564d78", "#9790ac", "#a97058"],
  pickthank: ["#825c43", "#c89e55", "#b0775a"],
  byends: ["#526979", "#d2aa63", "#ae755b"],
  moneylove: ["#6f563b", "#d1b05d", "#a96f55"],
  demas: ["#596b70", "#c7c48d", "#aa7259"],
  vainconfidence: ["#7c6547", "#d1a84f", "#a96e55"],
  despair: ["#3f4651", "#707785", "#93624f"],
  diffidence: ["#514357", "#79667d", "#a36c56"],
};

export function BurdenPack({ weight = 1 }: { weight?: number }) {
  const scale = 1 + Math.max(0, Math.min(1, weight)) * 0.22;
  return (
    <group scale={scale}>
      <mesh castShadow scale={[0.78, 0.92, 0.55]}>
        <sphereGeometry args={[0.62, 16, 12]} />
        <meshStandardMaterial color="#4b3428" roughness={1} />
      </mesh>
      <mesh castShadow position={[0, 0.54, 0]} scale={[0.48, 0.54, 0.4]}>
        <sphereGeometry args={[0.38, 12, 9]} />
        <meshStandardMaterial color="#58402f" roughness={1} />
      </mesh>
      <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.035, 7, 18]} />
        <meshStandardMaterial color="#b08a5a" roughness={0.92} />
      </mesh>
      <mesh position={[0, -0.12, 0.33]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.026, 7, 22]} />
        <meshStandardMaterial color="#805d3c" roughness={0.96} />
      </mesh>
    </group>
  );
}

export function Character({
  variant = "christian",
  walking = false,
  burden = 0,
  hasRoll = false,
  equipped = false,
  scale = 1,
}: {
  variant?: CharacterVariant;
  walking?: boolean;
  burden?: number;
  hasRoll?: boolean;
  equipped?: boolean;
  scale?: number;
}) {
  const root = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const [cloth, accent, skin] = clothes[variant];
  const burdenWeight = Math.max(0, Math.min(1, burden));
  const torsoScale: [number, number, number] =
    variant === "faithful"
      ? [0.86, 0.88, 0.64]
      : variant === "hopeful"
        ? [0.92, 0.86, 0.68]
        : [0.98, 0.84, 0.7];
  const reducedMotion = useGame((s) => s.reducedMotion);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const cadence = walking ? 9 - burdenWeight * 2.1 : 1.6;
    const swing = reducedMotion
      ? 0
      : walking
        ? Math.sin(t * cadence) * (0.55 - burdenWeight * 0.13)
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
      {
        root.current.position.y = reducedMotion
          ? 0
          : Math.sin(t * cadence) * (walking ? 0.035 : 0.018);
        root.current.rotation.x = burdenWeight * 0.13;
      }
  });
  const darkHair = variant === "shining" ? "#f4dda0" : "#392a28";
  const hasBeard = [
    "evangelist",
    "help",
    "worldly",
    "goodwill",
    "interpreter",
    "faithful",
    "hopeful",
    "adam",
    "talkative",
    "hategood",
  ].includes(variant);
  return (
    <group ref={root} scale={scale}>
      <group ref={torso}>
        <mesh castShadow position={[0, 1.02, 0]} scale={torsoScale}>
          <capsuleGeometry args={[0.38, 0.42, 10, 18]} />
          <meshStandardMaterial color={cloth} roughness={0.88} />
        </mesh>
        <mesh castShadow position={[0, 0.75, 0]}>
          <cylinderGeometry args={[0.38, 0.45, 0.48, 18]} />
          <meshStandardMaterial color={cloth} roughness={0.92} />
        </mesh>
        {variant !== "christian" && (
          <mesh position={[0, 1.18, 0.29]} scale={[1, 0.65, 0.3]}>
            <sphereGeometry args={[0.25, 12, 8]} />
            <meshStandardMaterial color={accent} roughness={0.9} />
          </mesh>
        )}
        {variant === "christian" && (
          <mesh position={[0, 1.3, 0.31]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.19, 0.035, 7, 20, Math.PI]} />
            <meshStandardMaterial color={accent} roughness={0.92} />
          </mesh>
        )}
        {variant === "faithful" && (
          <mesh position={[0, 1.02, 0.37]} rotation={[0, 0, -0.55]}>
            <boxGeometry args={[0.12, 0.9, 0.05]} />
            <meshStandardMaterial color="#d9bd72" roughness={0.82} />
          </mesh>
        )}
        {variant === "hopeful" && (
          <mesh position={[0, 1.25, 0.34]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.28, 0.055, 7, 18]} />
            <meshStandardMaterial color="#e1ca78" roughness={0.86} />
          </mesh>
        )}
      </group>

      <mesh castShadow position={[0, 1.39, 0]}>
        <cylinderGeometry args={[0.11, 0.13, 0.16, 12]} />
        <meshStandardMaterial color={skin} roughness={0.78} />
      </mesh>
      <group position={[0, 1.65, 0]}>
        <mesh castShadow scale={[0.92, 1.08, 0.96]}>
          <sphereGeometry args={[0.36, 24, 18]} />
          <meshStandardMaterial color={skin} roughness={0.76} />
        </mesh>
        <mesh castShadow position={[0, 0.035, 0]} scale={[1, 1.12, 1]}>
          <sphereGeometry args={[0.375, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2.05]} />
          <meshStandardMaterial color={darkHair} roughness={0.95} />
        </mesh>
        {([-1, 1] as const).map((side) => (
          <mesh key={`ear-${side}`} position={[side * 0.342, -0.015, 0]} scale={[0.55, 1, 0.45]}>
            <sphereGeometry args={[0.08, 12, 9]} />
            <meshStandardMaterial color={skin} roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, -0.02, 0.35]} scale={[0.58, 0.9, 0.68]}>
          <sphereGeometry args={[0.068, 12, 9]} />
          <meshStandardMaterial color={skin} roughness={0.8} />
        </mesh>
        {[-0.13, 0.13].map((x) => (
          <group key={x} position={[x, 0.055, 0.34]}>
            <mesh scale={[1, 0.72, 0.38]}>
              <sphereGeometry args={[0.041, 12, 9]} />
              <meshStandardMaterial color="#f1dfcf" />
            </mesh>
            <mesh position={[0, 0, 0.012]}>
              <sphereGeometry args={[0.018, 10, 8]} />
              <meshStandardMaterial color="#29241f" />
            </mesh>
            <mesh position={[0, 0.075, 0.002]} rotation={[0, 0, x > 0 ? -0.12 : 0.12]}>
              <capsuleGeometry args={[0.012, 0.085, 5, 8]} />
              <meshStandardMaterial color={darkHair} roughness={1} />
            </mesh>
          </group>
        ))}
        {[-0.21, 0.21].map((x) => (
          <mesh key={`cheek-${x}`} position={[x, -0.07, 0.326]} scale={[1.5, 0.7, 0.35]}>
            <sphereGeometry args={[0.04, 10, 8]} />
            <meshStandardMaterial color="#d98b79" transparent opacity={0.48} />
          </mesh>
        ))}
        {hasBeard && (
          <mesh position={[0, -0.19, 0.255]} scale={[0.8, 0.82, 0.42]}>
            <sphereGeometry args={[0.23, 14, 10]} />
            <meshStandardMaterial color={darkHair} roughness={1} />
          </mesh>
        )}
        <mesh position={[0, -0.13, 0.35]} rotation={[0.12, 0, 0]}>
          <torusGeometry args={[0.055, 0.011, 7, 18, Math.PI]} />
          <meshStandardMaterial color="#70423d" />
        </mesh>
        {variant === "hategood" && (
          <>
            <mesh position={[0, 0.28, 0]}>
              <cylinderGeometry args={[0.38, 0.38, 0.08, 12]} />
              <meshStandardMaterial color="#32282c" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.44, 0]}>
              <cylinderGeometry args={[0.25, 0.3, 0.3, 10]} />
              <meshStandardMaterial color="#4b3138" roughness={0.88} />
            </mesh>
          </>
        )}
      </group>

      {([-1, 1] as const).map((side) => (
        <group
          key={`arm-${side}`}
          ref={side < 0 ? leftArm : rightArm}
          position={[side * 0.45, 1.21, 0]}
        >
          <mesh castShadow position={[0, -0.17, 0]}>
            <capsuleGeometry args={[0.125, 0.22, 8, 12]} />
            <meshStandardMaterial color={cloth} roughness={0.88} />
          </mesh>
          <mesh castShadow position={[0, -0.42, 0.015]}>
            <capsuleGeometry args={[0.1, 0.18, 8, 12]} />
            <meshStandardMaterial color={skin} roughness={0.78} />
          </mesh>
          <mesh castShadow position={[0, -0.59, 0.025]} scale={[0.86, 1, 0.74]}>
            <sphereGeometry args={[0.13, 12, 9]} />
            <meshStandardMaterial color={skin} roughness={0.78} />
          </mesh>
        </group>
      ))}

      {([-1, 1] as const).map((side) => (
        <group
          key={`leg-${side}`}
          ref={side < 0 ? leftLeg : rightLeg}
          position={[side * 0.19, 0.63, 0]}
        >
          <mesh castShadow position={[0, -0.17, 0]}>
            <capsuleGeometry args={[0.145, 0.2, 8, 12]} />
            <meshStandardMaterial color={accent} roughness={0.9} />
          </mesh>
          <mesh castShadow position={[0, -0.4, 0]}>
            <capsuleGeometry args={[0.125, 0.16, 8, 12]} />
            <meshStandardMaterial color={accent} roughness={0.92} />
          </mesh>
          <mesh castShadow position={[0, -0.56, 0.1]} scale={[1.05, 0.72, 1.65]}>
            <sphereGeometry args={[0.15, 12, 9]} />
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
      {burdenWeight > 0 && (
        <group>
          <group position={[0, 1.02, -0.66]} rotation={[-0.12, 0, 0]}>
            <BurdenPack weight={burdenWeight} />
          </group>
          {([-1, 1] as const).map((side) => (
            <mesh
              key={`burden-strap-${side}`}
              position={[side * 0.23, 1.18, -0.24]}
              rotation={[0.48, 0, side * 0.09]}
            >
              <capsuleGeometry args={[0.028, 0.7, 5, 9]} />
              <meshStandardMaterial color="#9b744b" roughness={0.96} />
            </mesh>
          ))}
        </group>
      )}
      {hasRoll && (
        <group position={[0.31, 0.78, 0.23]} rotation={[0, 0, -0.12]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.075, 0.075, 0.42, 12]} />
            <meshStandardMaterial color="#e4d3a0" roughness={0.86} />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <torusGeometry args={[0.08, 0.014, 6, 12]} />
            <meshStandardMaterial color="#9b4338" />
          </mesh>
        </group>
      )}
      {equipped && (
        <>
          <mesh castShadow position={[0, 1.04, 0.31]} scale={[0.86, 1, 0.42]}>
            <sphereGeometry args={[0.31, 12, 10]} />
            <meshStandardMaterial
              color="#7f8586"
              metalness={0.65}
              roughness={0.34}
            />
          </mesh>
          <group position={[-0.49, 0.92, 0]} rotation={[0, 0, 0.08]}>
            <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.34, 0.34, 0.08, 16]} />
              <meshStandardMaterial
                color="#65747a"
                metalness={0.7}
                roughness={0.35}
              />
            </mesh>
            <mesh position={[0, 0, 0.06]}>
              <boxGeometry args={[0.06, 0.5, 0.06]} />
              <meshStandardMaterial color="#d1ae67" metalness={0.5} />
            </mesh>
          </group>
          <group position={[0.48, 0.72, -0.05]} rotation={[0, 0, -0.18]}>
            <mesh position={[0, 0.34, 0]}>
              <boxGeometry args={[0.055, 0.78, 0.035]} />
              <meshStandardMaterial
                color="#b8bdba"
                metalness={0.82}
                roughness={0.24}
              />
            </mesh>
            <mesh>
              <boxGeometry args={[0.3, 0.05, 0.06]} />
              <meshStandardMaterial color="#a77b43" />
            </mesh>
          </group>
        </>
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

export function GateInscription({
  position,
}: {
  position: [number, number, number];
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#f7dfaa";
    context.shadowColor = "rgba(25, 12, 4, 0.9)";
    context.shadowBlur = 8;
    context.font = "700 58px Georgia, serif";
    context.fillText("KNOCK, AND IT SHALL BE", canvas.width / 2, 88);
    context.font = "700 66px Georgia, serif";
    context.fillText("OPENED UNTO YOU", canvas.width / 2, 170);

    const canvasTexture = new CanvasTexture(canvas);
    canvasTexture.colorSpace = SRGBColorSpace;
    return canvasTexture;
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);

  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[4.35, 0.92, 0.18]} />
        <meshStandardMaterial color="#473b38" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0, 0.101]}>
        <planeGeometry args={[4.08, 0.78]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} />
      </mesh>
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
