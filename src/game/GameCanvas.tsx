import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { PerspectiveCamera } from "@react-three/drei";
import { useRef } from "react";
import { PerspectiveCamera as PerspectiveCameraType, Vector3 } from "three";
import { Player, playerPosition } from "./Player";
import { World } from "./World";
import { useGame } from "./state";
import { storyScenes } from "./story";
import { useEffect } from "react";

function CameraRig() {
  const rig = useRef<PerspectiveCameraType>(null);
  const desired = new Vector3();
  const { dialogue, choosing, sceneComplete, sceneIndex, stepIndex } =
    useGame();
  const step = storyScenes[sceneIndex].steps[stepIndex];
  useFrame((_, dt) => {
    if (!rig.current) return;
    if (sceneComplete) {
      desired.set(8, 9, 10);
      rig.current.position.lerp(desired, 1 - Math.exp(-1.5 * dt));
      rig.current.lookAt(0, 0, 0);
      return;
    }
    if (dialogue || choosing) {
      const [x, z] = step.position;
      desired.set(x + 3.5, 2.7, z + 4.2);
      rig.current.position.lerp(desired, 1 - Math.exp(-2.8 * dt));
      rig.current.lookAt(x, 1, z);
      return;
    }
    desired.set(
      playerPosition.x,
      playerPosition.y + 4.6,
      playerPosition.z + 7.5,
    );
    rig.current.position.lerp(desired, 1 - Math.exp(-4 * dt));
    rig.current.lookAt(
      playerPosition.x,
      playerPosition.y + 0.8,
      playerPosition.z - 1.8,
    );
  });
  return (
    <PerspectiveCamera ref={rig} makeDefault fov={48} position={[0, 5, 12]} />
  );
}
function Exposure() {
  const visibility = useGame((s) => s.visibility);
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMappingExposure =
      visibility === "standard" ? 1.2 : visibility === "bright" ? 1.6 : 1.45;
  }, [gl, visibility]);
  return null;
}
export function GameCanvas() {
  const sceneIndex = useGame((s) => s.sceneIndex);
  return (
    <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true }}>
      <Exposure />
      <Physics gravity={[0, -12, 0]}>
        <World />
        <Player key={sceneIndex} />
      </Physics>
      <CameraRig />
    </Canvas>
  );
}
