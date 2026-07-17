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
import { gameAudio } from "./audio";
import { cameraControl, playerMotion } from "./camera";

const keys = new Set<string>();
export const mobileInput = { x: 0, z: 0 };
export const playerPosition = new Vector3(0, 1.2, 7);
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
  } = useGame();
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.add(e.code);
      if (e.code === "KeyE") useGame.getState().interact();
      if (e.code === "KeyR") cameraControl.resetRequested = true;
      if (e.code === "Space")
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
  useFrame(({ camera }) => {
    if (!body.current || paused || puzzleActive || dialogue || choosing) {
      playerMotion.moving = false;
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
    const forward = camera.getWorldDirection(new Vector3());
    forward.y = 0;
    forward.normalize();
    const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();
    const manual = right.multiplyScalar(x).add(forward.multiplyScalar(-z));
    if (manual.lengthSq() > 0 && guidedTravel)
      useGame.getState().stopGuidedTravel();
    const step = storyScenes[sceneIndex].steps[useGame.getState().stepIndex];
    const guided = new Vector3(
      step.position[0] - p.x,
      0,
      step.position[1] - p.z,
    );
    const guidedDistance = guided.length();
    if (guidedTravel && guidedDistance < 1.45) {
      useGame.getState().stopGuidedTravel();
      body.current.setLinvel({ x: 0, y: velocity.y, z: 0 }, true);
      playerMotion.moving = false;
      if (walkingRef.current) {
        walkingRef.current = false;
        setWalking(false);
      }
      playerPosition.set(p.x, p.y, p.z);
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
    const speed =
      (guidedTravel ? 14 : inSlough ? 2.1 : keys.has("ShiftLeft") ? 5.2 : 3.5) *
      (burden ? 0.88 : 1);
    gameAudio.walking(moving, inSlough);
    body.current.setLinvel(
      { x: dir.x * speed, y: velocity.y, z: dir.z * speed },
      true,
    );
    if (dir.lengthSq()) {
      playerMotion.yaw = Math.atan2(dir.x, dir.z);
      if (model.current) model.current.rotation.y = playerMotion.yaw;
    }
    const clampedX = Math.max(-7.2, Math.min(7.2, p.x));
    const clampedZ = Math.max(-7.2, Math.min(7.2, p.z));
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
        <Character
          variant="christian"
          walking={walking}
          burden={burden > 0}
          hasRoll={hasRoll}
          equipped={equipment.length > 0}
        />
      </group>
    </RigidBody>
  );
}
