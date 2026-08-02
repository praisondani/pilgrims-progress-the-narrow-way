import type { Group } from "three";
import type {
  HeroExpressionChannel,
  HeroExpressionController,
  HeroExpressionPreset,
} from "./types";

export interface HeroFaceRig {
  leftBrow: Group;
  rightBrow: Group;
  leftLid: Group;
  rightLid: Group;
  leftMouthCorner: Group;
  rightMouthCorner: Group;
  lowerLip: Group;
  jaw: Group;
}

const channels: HeroExpressionChannel[] = [
  "smile",
  "concern",
  "effort",
  "blink",
  "squint",
];

const presetWeights: Record<
  HeroExpressionPreset,
  Record<HeroExpressionChannel, number>
> = {
  neutral: { smile: 0, concern: 0.08, effort: 0, blink: 0, squint: 0 },
  hopeful: { smile: 0.52, concern: 0.12, effort: 0, blink: 0, squint: 0.04 },
  concerned: {
    smile: 0,
    concern: 0.78,
    effort: 0.08,
    blink: 0,
    squint: 0.12,
  },
  determined: {
    smile: 0.04,
    concern: 0.24,
    effort: 0.42,
    blink: 0,
    squint: 0.28,
  },
  weary: {
    smile: 0,
    concern: 0.48,
    effort: 0.58,
    blink: 0.16,
    squint: 0.32,
  },
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function createHeroExpressionController(
  rig: HeroFaceRig,
): HeroExpressionController {
  const values = Object.fromEntries(
    channels.map((channel) => [channel, 0]),
  ) as Record<HeroExpressionChannel, number>;
  const target = { ...values };

  const rest = {
    leftBrowY: rig.leftBrow.position.y,
    rightBrowY: rig.rightBrow.position.y,
    leftBrowZ: rig.leftBrow.rotation.z,
    rightBrowZ: rig.rightBrow.rotation.z,
    leftLidY: rig.leftLid.position.y,
    rightLidY: rig.rightLid.position.y,
    leftCornerX: rig.leftMouthCorner.position.x,
    rightCornerX: rig.rightMouthCorner.position.x,
    leftCornerY: rig.leftMouthCorner.position.y,
    rightCornerY: rig.rightMouthCorner.position.y,
    lowerLipY: rig.lowerLip.position.y,
    jawX: rig.jaw.rotation.x,
  };

  const apply = () => {
    const { smile, concern, effort, blink, squint } = values;
    const lidClosure = Math.max(blink, squint * 0.34);
    const browLift = concern * 0.014 - effort * 0.006;

    rig.leftBrow.position.y = rest.leftBrowY + browLift;
    rig.rightBrow.position.y = rest.rightBrowY + browLift;
    rig.leftBrow.rotation.z =
      rest.leftBrowZ + concern * 0.22 - effort * 0.12;
    rig.rightBrow.rotation.z =
      rest.rightBrowZ - concern * 0.22 + effort * 0.12;

    rig.leftLid.position.y = rest.leftLidY - lidClosure * 0.018;
    rig.rightLid.position.y = rest.rightLidY - lidClosure * 0.018;
    rig.leftLid.scale.y = 1 + lidClosure * 5.2;
    rig.rightLid.scale.y = 1 + lidClosure * 5.2;

    const mouthSpread = smile * 0.011;
    const cornerLift = smile * 0.014 - concern * 0.008 - effort * 0.004;
    rig.leftMouthCorner.position.x = rest.leftCornerX - mouthSpread;
    rig.rightMouthCorner.position.x = rest.rightCornerX + mouthSpread;
    rig.leftMouthCorner.position.y = rest.leftCornerY + cornerLift;
    rig.rightMouthCorner.position.y = rest.rightCornerY + cornerLift;
    rig.lowerLip.position.y =
      rest.lowerLipY - effort * 0.012 - concern * 0.003;
    rig.jaw.rotation.x = rest.jawX + effort * 0.105;
  };

  const controller: HeroExpressionController = {
    values,
    target,
    setPreset(preset, intensity = 1) {
      const weights = presetWeights[preset];
      const amount = clamp01(intensity);
      for (const channel of channels)
        target[channel] = weights[channel] * amount;
    },
    setWeights(weights) {
      for (const channel of channels) {
        const value = weights[channel];
        if (value !== undefined) target[channel] = clamp01(value);
      }
    },
    update(delta, dynamicEffort = 0, automaticBlink = 0) {
      const response = 1 - Math.exp(-Math.max(0, delta) * 15);
      for (const channel of channels) {
        const dynamicTarget =
          channel === "effort"
            ? Math.max(target[channel], clamp01(dynamicEffort))
            : channel === "blink"
              ? Math.max(target[channel], clamp01(automaticBlink))
              : target[channel];
        values[channel] += (dynamicTarget - values[channel]) * response;
      }
      apply();
    },
    reset() {
      for (const channel of channels) {
        values[channel] = 0;
        target[channel] = 0;
      }
      apply();
    },
  };

  controller.setPreset("concerned", 0.72);
  controller.update(1);
  return controller;
}

