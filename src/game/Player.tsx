import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CapsuleCollider,
  RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { Group, Vector3 } from "three";
import { useGame } from "./state";
import { storyScenes } from "./story";
import { Character } from "./Visuals";
import { PilgrimHero } from "./assets/hero";
import { gameAudio } from "./audio";
import { cameraControl, playerImpact, playerMotion } from "./camera";
import { mobileInput, resetMobileInput } from "./input";
import {
  dreamGuidedWaypoint,
} from "./assets/environment/dream";
import {
  deriveGateController,
  gatePlayerBounds,
} from "./gate/GateController";

const keys = new Set<string>();
export { mobileInput, resetMobileInput } from "./input";
export const PLAYER_SPAWN = { x: 0, y: 1.2, z: 7 } as const;
export const playerPosition = new Vector3(
  PLAYER_SPAWN.x,
  PLAYER_SPAWN.y,
  PLAYER_SPAWN.z,
);
const companionTarget = new Vector3();

export function HopefulCompanion() {
  const group = useRef<Group>(null);
  const [walking, setWalking] = useState(false);
  const walkingRef = useRef(false);
  const { sceneIndex, stepIndex, gameComplete } = useGame();
  const visible =
    sceneIndex > 20 || (sceneIndex === 20 && (stepIndex >= 2 || gameComplete));
  useFrame((_, delta) => {
    if (!group.current || !visible) return;
    const forwardX = Math.sin(playerMotion.yaw);
    const forwardZ = Math.cos(playerMotion.yaw);
    companionTarget.set(
      playerPosition.x - forwardX * 1.5 + forwardZ * 0.8,
      Math.max(0, playerPosition.y - 1.2),
      playerPosition.z - forwardZ * 1.5 - forwardX * 0.8,
    );
    if (group.current.position.distanceTo(companionTarget) > 6)
      group.current.position.copy(companionTarget);
    else
      group.current.position.lerp(
        companionTarget,
        1 - Math.exp(-5.5 * delta),
      );
    group.current.rotation.y = playerMotion.yaw;
    if (walkingRef.current !== playerMotion.moving) {
      walkingRef.current = playerMotion.moving;
      setWalking(playerMotion.moving);
    }
  });
  if (!visible) return null;
  return (
    <group ref={group} position={[0.8, 0, 5.5]}>
      <Character variant="hopeful" walking={walking} hasRoll={false} />
    </group>
  );
}

export function Player() {
  const body = useRef<RapierRigidBody>(null);
  const model = useRef<Group>(null);
  const [walking, setWalking] = useState(false);
  const walkingRef = useRef(false);
  const impactRevision = useRef(playerImpact.revision);
  const impactLean = useRef(0);
  const {
    paused,
    burden,
    hasRoll,
    equipment,
    sceneIndex,
    puzzleActive,
    dialogue,
    choosing,
    guidedTravel,
    reducedMotion,
  } = useGame();
  const burdenWeight = burden > 0 ? Math.min(1, 0.55 + sceneIndex * 0.07) : 0;
  useEffect(() => {
    // Player is remounted for every scene/checkpoint. Reset the shared
    // position before ActiveTarget, arrows, and the camera can observe the
    // previous scene's coordinates during the first sparse frame.
    playerPosition.set(PLAYER_SPAWN.x, PLAYER_SPAWN.y, PLAYER_SPAWN.z);
    body.current?.setTranslation(PLAYER_SPAWN, true);
    body.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
    playerMotion.moving = false;
    playerMotion.yaw = Math.PI;
    resetMobileInput();
    return resetMobileInput;
  }, [sceneIndex]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.add(e.code);
      const state = useGame.getState();
      if (e.code === "KeyE") {
        if (
          state.nearby &&
          !state.dialogue &&
          !state.choosing &&
          !state.puzzleActive &&
          !state.sceneComplete &&
          !state.paused
        )
          gameAudio.interact();
        state.interact();
      }
      if (e.code === "KeyR") cameraControl.resetRequested = true;
      if (
        e.code === "Space" &&
        !e.repeat &&
        !state.paused &&
        !state.dialogue &&
        !state.choosing &&
        !state.puzzleActive &&
        !state.sceneComplete
      )
        body.current?.applyImpulse({ x: 0, y: 3.8, z: 0 }, true);
    };
    const up = (e: KeyboardEvent) => keys.delete(e.code);
    addEventListener("keydown", down);
    addEventListener("keyup", up);
    return () => {
      removeEventListener("keydown", down);
      removeEventListener("keyup", up);
      keys.clear();
    };
  }, []);
  useFrame(({ camera }, delta) => {
    if (!body.current || paused || puzzleActive || dialogue || choosing) {
      keys.clear();
      resetMobileInput();
      playerMotion.moving = false;
      if (walkingRef.current) {
        walkingRef.current = false;
        setWalking(false);
      }
      if (body.current)
        body.current.setLinvel(
          { x: 0, y: body.current.linvel().y, z: 0 },
          true,
        );
      return;
    }
    const x =
      Number(keys.has("KeyD") || keys.has("ArrowRight")) -
      Number(keys.has("KeyA") || keys.has("ArrowLeft")) +
      mobileInput.x;
    const z =
      Number(keys.has("KeyS") || keys.has("ArrowDown")) -
      Number(keys.has("KeyW") || keys.has("ArrowUp")) +
      mobileInput.z;
    const p = body.current.translation();
    const velocity = body.current.linvel();
    const impacted = impactRevision.current !== playerImpact.revision;
    if (impacted) {
      impactRevision.current = playerImpact.revision;
      body.current.applyImpulse(
        { x: playerImpact.x * 1.15, y: 0.34, z: playerImpact.z * 1.15 },
        true,
      );
      impactLean.current = -Math.sign(playerImpact.x || playerImpact.z) * 0.24;
    }
    impactLean.current *= Math.exp(-6.5 * delta);
    if (model.current) model.current.rotation.z = impactLean.current;
    if (impacted) {
      playerMotion.moving = false;
      playerPosition.set(p.x, p.y, p.z);
      return;
    }
    const forward = camera.getWorldDirection(new Vector3());
    forward.y = 0;
    forward.normalize();
    const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();
    const manual = right.multiplyScalar(x).add(forward.multiplyScalar(-z));
    if (manual.lengthSq() > 0 && !useGame.getState().onboarding.moved)
      useGame.getState().completeOnboardingMilestone("moved");
    if (manual.lengthSq() > 0 && guidedTravel)
      useGame.getState().stopGuidedTravel();
    const step = storyScenes[sceneIndex].steps[useGame.getState().stepIndex];
    const dreamGuided = storyScenes[sceneIndex].id === "dream";
    const guidedPoint =
      dreamGuided
        ? dreamGuidedWaypoint(
            [p.x, p.z],
            [step.position[0], step.position[1]],
          )
        : step.position;
    const guidedWaypointIsFinal =
      !dreamGuided ||
      (guidedPoint[0] === step.position[0] &&
        guidedPoint[1] === step.position[1]);
    const guided = new Vector3(
      guidedPoint[0] - p.x,
      0,
      guidedPoint[1] - p.z,
    );
    const guidedDistance = guided.length();
    const guidedSpeed = 14 * (1 - burdenWeight * 0.18);
    const guidedArrivalDistance = Math.max(
      1.45,
      guidedSpeed * Math.max(delta, 1 / 60) * 1.5,
    );
    if (guidedTravel && guidedDistance <= guidedArrivalDistance) {
      // Low-FPS frames can cross a short authored waypoint in one integration
      // step. Snap to it instead of reversing and oscillating around the
      // bend. Intermediate Dream waypoints stay guided; the final one stops
      // guidance so the interaction prompt can take over on the next frame.
      body.current.setTranslation(
        { x: guidedPoint[0], y: p.y, z: guidedPoint[1] },
        true,
      );
      body.current.setLinvel({ x: 0, y: velocity.y, z: 0 }, true);
      if (guidedWaypointIsFinal) useGame.getState().stopGuidedTravel();
      playerMotion.moving = false;
      if (walkingRef.current) {
        walkingRef.current = false;
        setWalking(false);
      }
      playerPosition.set(guidedPoint[0], p.y, guidedPoint[1]);
      return;
    }
    const dir = (guidedTravel ? guided : manual).normalize();
    const moving = dir.lengthSq() > 0;
    if (moving !== walkingRef.current) {
      walkingRef.current = moving;
      setWalking(moving);
    }
    playerMotion.moving = moving;
    const inSlough = storyScenes[sceneIndex].id === "slough";
    const speed = guidedTravel
      ? guidedSpeed
      : (inSlough ? 2.1 : keys.has("ShiftLeft") ? 5.2 : 3.5) *
        (1 - burdenWeight * 0.18);
    gameAudio.walking(moving, inSlough);
    body.current.setLinvel(
      { x: dir.x * speed, y: velocity.y, z: dir.z * speed },
      true,
    );
    if (dir.lengthSq()) {
      playerMotion.yaw = Math.atan2(dir.x, dir.z);
      if (model.current) model.current.rotation.y = playerMotion.yaw;
    }
    const runtimeState = useGame.getState();
    const runtimeScene = storyScenes[runtimeState.sceneIndex];
    const runtimeStep = runtimeScene.steps[runtimeState.stepIndex];
    const bounds =
      runtimeScene.id === "gate"
        ? gatePlayerBounds(
            deriveGateController({
              stepId: runtimeStep.id,
              dialogueActive: Boolean(runtimeState.dialogue),
              dialogueIndex: runtimeState.dialogueIndex,
              sceneComplete: runtimeState.sceneComplete,
              reducedMotion: runtimeState.reducedMotion,
            }),
          )
        : {
            minimumX: -7.2,
            maximumX: 7.2,
            minimumZ: -7.2,
            maximumZ: 7.2,
          };
    const clampedX = Math.max(bounds.minimumX, Math.min(bounds.maximumX, p.x));
    const clampedZ = Math.max(bounds.minimumZ, Math.min(bounds.maximumZ, p.z));
    if (clampedX !== p.x || clampedZ !== p.z)
      body.current.setTranslation({ x: clampedX, y: p.y, z: clampedZ }, true);
    if (p.y < -3) body.current.setTranslation({ x: 0, y: 1.2, z: 7 }, true);
    playerPosition.set(p.x, p.y, p.z);
  });
  return (
    <RigidBody
      ref={body}
      position={[0, 1.2, 7]}
      colliders={false}
      enabledRotations={[false, false, false]}
    >
      <CapsuleCollider args={[0.42, 0.38]} />
      <group ref={model} position={[0, -0.58, 0]} rotation={[0, Math.PI, 0]}>
        <PilgrimHero
          variant="christian"
          walking={walking}
          burden={burdenWeight}
          hasRoll={hasRoll}
          equipped={equipment.length > 0}
          reducedMotion={reducedMotion}
        />
      </group>
    </RigidBody>
  );
}
