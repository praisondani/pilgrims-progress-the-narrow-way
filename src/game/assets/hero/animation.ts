import type { Group, Object3D } from "three";
import { hashHeroSeed } from "./procedural";
import type {
  HeroExpressionController,
  HeroPivotId,
  HeroUpdateInput,
} from "./types";

export interface HeroAnimationRig {
  motionRoot: Group;
  pivots: Record<HeroPivotId, Object3D>;
  burdenVisual: Group;
  burdenHarness: Group;
  rollVisual: Group;
  equipmentVisuals: Group[];
  expressions: HeroExpressionController;
  seed: string;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function createHeroAnimator(rig: HeroAnimationRig) {
  const state: Required<HeroUpdateInput> = {
    walking: false,
    burden: 0,
    hasRoll: false,
    equipped: false,
    reducedMotion: false,
    locomotionSpeed: 1,
  };
  const smooth = { walking: 0, burden: 0 };
  const rest = {
    motionY: rig.motionRoot.position.y,
    burdenX: rig.burdenVisual.rotation.x,
    burdenY: rig.burdenVisual.position.y,
    burdenZ: rig.burdenVisual.rotation.z,
  };
  const blinkOffset = (hashHeroSeed(rig.seed) % 997) / 997;
  let phase = 0;
  let elapsed = blinkOffset * 3.7;

  const update = (delta: number, input: HeroUpdateInput = {}) => {
    if (input.walking !== undefined) state.walking = input.walking;
    if (input.burden !== undefined) state.burden = clamp01(input.burden);
    if (input.hasRoll !== undefined) state.hasRoll = input.hasRoll;
    if (input.equipped !== undefined) state.equipped = input.equipped;
    if (input.reducedMotion !== undefined)
      state.reducedMotion = input.reducedMotion;
    if (input.locomotionSpeed !== undefined)
      state.locomotionSpeed = Math.max(0, input.locomotionSpeed);

    const safeDelta = Math.max(0, Math.min(delta, 0.1));
    const response = 1 - Math.exp(-safeDelta * 10);
    smooth.walking += (Number(state.walking) - smooth.walking) * response;
    smooth.burden += (state.burden - smooth.burden) * response;
    elapsed += safeDelta;

    const cadence =
      (7.6 - smooth.burden * 1.45) *
      Math.max(0.2, state.locomotionSpeed);
    phase += safeDelta * cadence;
    const motionScale = state.reducedMotion ? 0 : smooth.walking;
    const stride = Math.sin(phase);
    const oppositeStride = Math.sin(phase + Math.PI);
    const strideAmplitude = (0.46 - smooth.burden * 0.1) * motionScale;
    const armAmplitude =
      strideAmplitude * (state.equipped ? 0.54 : 0.88);
    const idleBreath = state.reducedMotion ? 0 : Math.sin(elapsed * 1.45);

    const loadedHipCounter = smooth.burden * 0.035;
    const loadedKneeFlex = smooth.burden * 0.105;
    rig.pivots.leftHip.rotation.x =
      oppositeStride * strideAmplitude - loadedHipCounter;
    rig.pivots.rightHip.rotation.x =
      stride * strideAmplitude - loadedHipCounter;
    rig.pivots.leftKnee.rotation.x =
      loadedKneeFlex + Math.max(0, stride) * 0.42 * motionScale;
    rig.pivots.rightKnee.rotation.x =
      loadedKneeFlex +
      Math.max(0, oppositeStride) * 0.42 * motionScale;
    rig.pivots.leftAnkle.rotation.x =
      -smooth.burden * 0.055 - stride * 0.13 * motionScale;
    rig.pivots.rightAnkle.rotation.x =
      -smooth.burden * 0.055 - oppositeStride * 0.13 * motionScale;

    rig.pivots.leftShoulder.rotation.x =
      stride * armAmplitude - smooth.burden * 0.085;
    rig.pivots.rightShoulder.rotation.x =
      oppositeStride * armAmplitude - smooth.burden * 0.085;
    rig.pivots.leftElbow.rotation.x =
      0.08 + Math.max(0, -stride) * 0.18 * motionScale;
    rig.pivots.rightElbow.rotation.x =
      0.08 + Math.max(0, stride) * 0.18 * motionScale;

    // Load travels through pelvis and spine. Forward pitch is deliberately
    // readable in silhouette; Christian should not stand upright under guilt.
    rig.pivots.pelvis.rotation.x = -smooth.burden * 0.045;
    rig.pivots.pelvis.rotation.y = stride * 0.045 * motionScale;
    rig.pivots.spine.rotation.x = smooth.burden * 0.14;
    rig.pivots.chest.rotation.x = smooth.burden * 0.05;
    rig.pivots.chest.rotation.y = -stride * 0.07 * motionScale;
    rig.pivots.chest.rotation.z =
      stride * 0.018 * motionScale + idleBreath * 0.004;
    rig.pivots.neck.rotation.y = stride * 0.024 * motionScale;
    rig.pivots.head.rotation.y = stride * 0.018 * motionScale;
    rig.pivots.head.rotation.x =
      -smooth.burden * 0.075 + idleBreath * 0.004;

    rig.motionRoot.position.y =
      rest.motionY +
      Math.abs(Math.sin(phase)) * 0.027 * motionScale +
      idleBreath * 0.006;
    rig.motionRoot.rotation.x = smooth.burden * 0.08;

    rig.burdenVisual.visible = smooth.burden > 0.002;
    rig.burdenHarness.visible = smooth.burden > 0.002;
    rig.burdenVisual.scale.set(
      1.1 + smooth.burden * 0.08,
      1.15 + smooth.burden * 0.1,
      1.05 + smooth.burden * 0.08,
    );
    const loadLag = Math.sin(phase - 0.32) * motionScale;
    rig.burdenVisual.position.y =
      rest.burdenY + Math.abs(loadLag) * 0.009;
    rig.burdenVisual.rotation.x =
      rest.burdenX - smooth.burden * 0.105 - loadLag * 0.014;
    rig.burdenVisual.rotation.z =
      rest.burdenZ + loadLag * 0.024;
    rig.rollVisual.visible = state.hasRoll;
    for (const visual of rig.equipmentVisuals)
      visual.visible = state.equipped;

    const blinkCycle = elapsed % 4.1;
    const blink =
      blinkCycle < 0.09
        ? Math.sin((blinkCycle / 0.09) * Math.PI)
        : blinkCycle > 0.23 && blinkCycle < 0.3
          ? Math.sin(((blinkCycle - 0.23) / 0.07) * Math.PI) * 0.42
          : 0;
    const dynamicEffort =
      smooth.burden * 0.42 + smooth.walking * 0.12;
    rig.expressions.update(safeDelta, dynamicEffort, blink);
  };

  return { state, update };
}
