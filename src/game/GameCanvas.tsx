import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { PerspectiveCamera as PerspectiveCameraType, Vector3 } from "three";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import { HopefulCompanion, Player, playerPosition } from "./Player";
import { World } from "./World";
import { useGame } from "./state";
import { storyScenes } from "./story";
import { cameraControl, playerMotion } from "./camera";

function shortestAngle(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

function CameraRig() {
  const rig = useRef<PerspectiveCameraType>(null);
  const controls = useRef<OrbitControlsType>(null);
  const desired = useRef(new Vector3());
  const priorFocus = useRef(new Vector3(0, 2, 5));
  const offset = useRef(new Vector3());
  const dragging = useRef(false);
  const lastLook = useRef(0);
  const { gl } = useThree();
  const {
    dialogue,
    choosing,
    sceneComplete,
    sceneIndex,
    stepIndex,
    reducedMotion,
    cinematicCamera,
  } = useGame();
  const step = storyScenes[sceneIndex].steps[stepIndex];

  useFrame((_, dt) => {
    if (!rig.current || !controls.current) return;
    const orbit = controls.current;
    if (sceneComplete && cinematicCamera) {
      orbit.enabled = false;
      desired.current.set(8, 9, 10);
      rig.current.position.lerp(desired.current, 1 - Math.exp(-1.5 * dt));
      rig.current.lookAt(0, 0, 0);
      return;
    }
    if ((dialogue || choosing) && cinematicCamera) {
      orbit.enabled = false;
      const [x, z] = step.position;
      desired.current.set(x + 3.5, 2.7, z + 4.2);
      rig.current.position.lerp(desired.current, 1 - Math.exp(-2.8 * dt));
      rig.current.lookAt(x, 1, z);
      return;
    }
    orbit.enabled = true;
    desired.current.set(
      playerPosition.x,
      playerPosition.y + 0.95,
      playerPosition.z,
    );
    priorFocus.current.copy(orbit.target);
    orbit.target.lerp(
      desired.current,
      reducedMotion ? 1 : 1 - Math.exp(-7 * dt),
    );
    rig.current.position.add(
      desired.current.copy(orbit.target).sub(priorFocus.current),
    );
    offset.current.copy(rig.current.position).sub(orbit.target);
    let yaw = Math.atan2(offset.current.x, offset.current.z);
    const shouldRecenter =
      cameraControl.resetRequested ||
      (playerMotion.moving &&
        !dragging.current &&
        performance.now() - lastLook.current > 1100);
    if (shouldRecenter) {
      const behind = playerMotion.yaw + Math.PI;
      yaw +=
        shortestAngle(yaw, behind) *
        (reducedMotion ? 1 : 1 - Math.exp(-3.2 * dt));
      const horizontal = Math.hypot(offset.current.x, offset.current.z);
      rig.current.position.set(
        orbit.target.x + Math.sin(yaw) * horizontal,
        orbit.target.y + offset.current.y,
        orbit.target.z + Math.cos(yaw) * horizontal,
      );
      cameraControl.resetRequested = false;
    }
    cameraControl.yaw = yaw;
    gl.domElement.dataset.cameraYaw = yaw.toFixed(3);
    orbit.update();
  });
  return (
    <>
      <PerspectiveCamera ref={rig} makeDefault fov={48} position={[0, 5, 12]} />
      <OrbitControls
        ref={controls}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={5.2}
        maxDistance={12.5}
        minPolarAngle={0.2}
        maxPolarAngle={1.35}
        onStart={() => {
          dragging.current = true;
          lastLook.current = performance.now();
        }}
        onEnd={() => {
          dragging.current = false;
          lastLook.current = performance.now();
        }}
      />
    </>
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
function FrameReady({ onReady }: { onReady: () => void }) {
  const signaled = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useFrame(() => {
    if (signaled.current) return;
    signaled.current = true;
    timer.current = window.setTimeout(onReady, 220);
  });
  return null;
}
export function GameCanvas() {
  const { sceneIndex, stepIndex, gameComplete } = useGame();
  const checkpointRevision = useGame((s) => s.checkpointRevision);
  const sceneKey = `${sceneIndex}-${checkpointRevision}`;
  const [readyKey, setReadyKey] = useState("");
  const ready = readyKey === sceneKey;
  const companionVisible =
    sceneIndex > 20 || (sceneIndex === 20 && (stepIndex >= 2 || gameComplete));
  return (
    <div
      className="canvas-shell"
      data-companion={companionVisible ? "hopeful" : undefined}
    >
      {!ready && (
        <div className="scene-loader" role="status" aria-live="polite">
          <span>Preparing the road</span>
          <strong>{storyScenes[sceneIndex].title}</strong>
        </div>
      )}
      <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true }}>
        <Exposure />
        <Physics gravity={[0, -12, 0]}>
          <World />
          <Player key={sceneKey} />
          <HopefulCompanion />
        </Physics>
        <CameraRig />
        <FrameReady
          key={sceneKey}
          onReady={() => setReadyKey(sceneKey)}
        />
      </Canvas>
    </div>
  );
}
