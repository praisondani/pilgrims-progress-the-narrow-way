import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { PerspectiveCamera as PerspectiveCameraType, Raycaster, Vector3 } from "three";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import { HopefulCompanion, Player, playerPosition } from "./Player";
import { World } from "./World";
import { useGame } from "./state";
import { storyScenes } from "./story";
import { cameraControl, playerMotion } from "./camera";
import { chapterCameraProfile, cinematicEase } from "./cinematics";
import { createGameRenderer } from "./rendering/renderer";

function shortestAngle(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

function CameraRig() {
  const rig = useRef<PerspectiveCameraType>(null);
  const controls = useRef<OrbitControlsType>(null);
  const desired = useRef(new Vector3());
  const priorFocus = useRef(new Vector3(0, 2, 5));
  const offset = useRef(new Vector3());
  const cameraRay = useRef(new Raycaster());
  const dragging = useRef(false);
  const lastLook = useRef(0);
  const chapterFlight = useRef({
    sceneIndex: -1,
    elapsed: 0,
    active: true,
    startedAt: 0,
  });
  const flightStart = useRef(new Vector3());
  const flightEnd = useRef(new Vector3());
  const flightTarget = useRef(new Vector3());
  const { gl, scene, size } = useThree();
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
  const sceneId = storyScenes[sceneIndex].id;
  const portrait = size.height > size.width * 1.12;
  const profile = chapterCameraProfile(sceneId, portrait);

  useEffect(() => {
    chapterFlight.current = {
      sceneIndex,
      elapsed: 0,
      active: cinematicCamera,
      startedAt: performance.now(),
    };
    gl.domElement.dataset.cameraTransition = cinematicCamera ? sceneId : "";
    gl.domElement.dataset.cameraMood = profile.mood;
  }, [cinematicCamera, gl, profile.mood, sceneId, sceneIndex]);

  useFrame((_, dt) => {
    if (!rig.current || !controls.current) return;
    const orbit = controls.current;
    if (chapterFlight.current.active) {
      const flight = chapterFlight.current;
      if (flight.elapsed === 0) {
        flightTarget.current.set(
          playerPosition.x,
          playerPosition.y + 0.95,
          playerPosition.z,
        );
        flightStart.current.set(
          flightTarget.current.x,
          flightTarget.current.y + profile.startHeight,
          flightTarget.current.z + profile.startDistance,
        );
        flightEnd.current.set(
          flightTarget.current.x,
          flightTarget.current.y + profile.playHeight,
          flightTarget.current.z + profile.playDistance,
        );
        rig.current.position.copy(flightStart.current);
      }
      orbit.enabled = false;
      // Use wall-clock elapsed time as a floor. Software WebGL and background
      // tabs can deliver sparse frames or tiny deltas; camera flights must
      // still settle instead of holding the transition veil indefinitely.
      flight.elapsed = Math.max(
        flight.elapsed + Math.max(0, dt),
        (performance.now() - flight.startedAt) / 1000,
      );
      const progress = reducedMotion
        ? 1
        : Math.min(1, flight.elapsed / profile.duration);
      rig.current.position.lerpVectors(
        flightStart.current,
        flightEnd.current,
        cinematicEase(progress),
      );
      orbit.target.copy(flightTarget.current);
      rig.current.lookAt(flightTarget.current);
      cameraControl.yaw = 0;
      gl.domElement.dataset.cameraYaw = "0.000";
      if (progress >= 1) {
        flight.active = false;
        gl.domElement.dataset.cameraTransition = "";
        orbit.enabled = true;
        orbit.update();
      }
      return;
    }
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
    // Keep a full orbit playable when the camera swings behind a tree, arch,
    // or other authored landmark. OrbitControls otherwise allows the camera
    // to pass through scenery, turning a 360-degree view into a black wall.
    // The world is isolated in a named group below, so the ray never treats
    // Christian or the companion as an occluder. A short dynamic max distance
    // lets OrbitControls slide the camera toward the player until the view is
    // clear, then restores the normal follow distance as soon as it is safe.
    const world = scene.getObjectByName("game-world");
    let safeMaxDistance = 12.5;
    if (world) {
      const focus = orbit.target;
      const cameraOffset = offset.current.copy(rig.current.position).sub(focus);
      const cameraDistance = cameraOffset.length();
      if (cameraDistance > 0.001) {
        cameraRay.current.set(focus, cameraOffset.normalize());
        const hit = cameraRay.current
          .intersectObjects(world.children, true)
          .find(
            (intersection) =>
              intersection.object.visible && intersection.distance > 0.85,
          );
        if (hit)
          safeMaxDistance = Math.max(
            4.6,
            Math.min(12.5, hit.distance - 0.55),
          );
      }
    }
    orbit.maxDistance = safeMaxDistance;
    orbit.minDistance = Math.min(5.2, safeMaxDistance);
    orbit.update();
  });
  return (
    <>
      <PerspectiveCamera
        ref={rig}
        makeDefault
        fov={profile.fov}
        position={[0, profile.playHeight, profile.playDistance]}
      />
      <OrbitControls
        ref={controls}
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        minDistance={5.2}
        maxDistance={12.5}
        minPolarAngle={0.42}
        maxPolarAngle={1.28}
        onStart={() => {
          dragging.current = true;
          lastLook.current = performance.now();
          if (!useGame.getState().onboarding.looked)
            useGame.getState().completeOnboardingMilestone("looked");
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
  useEffect(() => {
    if (ready) return;
    // FrameReady is preferred because it keeps the veil over the first real
    // frame. Software WebGL and backgrounded mobile tabs can delay the render
    // loop for much longer; a bounded fallback prevents a playable canvas from
    // being hidden behind an indefinite loader in that case.
    const fallback = window.setTimeout(() => setReadyKey(sceneKey), 3_500);
    return () => window.clearTimeout(fallback);
  }, [ready, sceneKey]);
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
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={createGameRenderer as never}
      >
        <Exposure />
        <Physics gravity={[0, -12, 0]}>
          <group name="game-world">
            <World />
          </group>
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
