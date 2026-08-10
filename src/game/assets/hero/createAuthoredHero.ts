import {
  Bone,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  LOD,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Skeleton,
  SkinnedMesh,
  Vector3,
  type Material,
  type Texture,
} from "three";
import { createHeroAnimator } from "./animation";
import {
  AuthoredGeometryBuilder,
  ellipseLoop,
  type AuthoredLoftRing,
} from "./authoredGeometry";
import { resolveHeroSpec } from "./spec";
import type {
  HeroAttachment,
  HeroCollider,
  HeroExpressionChannel,
  HeroExpressionController,
  HeroExpressionPreset,
  HeroFactoryOptions,
  HeroMaterialId,
  HeroPivotId,
  HeroRuntime,
  HeroSculptRuntimeMetadata,
  HeroSocketId,
  HeroUpdateInput,
  HeroVec3,
} from "./types";

const pivotIds: HeroPivotId[] = [
  "motion",
  "pelvis",
  "spine",
  "chest",
  "neck",
  "head",
  "jaw",
  "leftShoulder",
  "leftElbow",
  "leftWrist",
  "rightShoulder",
  "rightElbow",
  "rightWrist",
  "leftHip",
  "leftKnee",
  "leftAnkle",
  "rightHip",
  "rightKnee",
  "rightAnkle",
];

const socketIds: HeroSocketId[] = [
  "backBurden",
  "chestAction",
  "headAction",
  "leftHandGrip",
  "rightHandGrip",
  "leftHandAction",
  "rightHandAction",
  "beltRoll",
  "beltEquipment",
  "leftFootGround",
  "rightFootGround",
];

const expressionChannels: HeroExpressionChannel[] = [
  "smile",
  "concern",
  "effort",
  "blink",
  "squint",
];

function createVertexMaterial(name: string, roughness: number, metalness = 0) {
  const material = new MeshStandardMaterial({
    color: new Color("#ffffff"),
    vertexColors: true,
    roughness,
    metalness,
    side: DoubleSide,
  });
  material.name = name;
  material.dithering = true;
  return material;
}

function createExpressionController(
  body: SkinnedMesh,
): HeroExpressionController {
  const values = {
    smile: 0,
    concern: 0,
    effort: 0,
    blink: 0,
    squint: 0,
  };
  const target = { ...values };
  const presets: Record<
    HeroExpressionPreset,
    Record<HeroExpressionChannel, number>
  > = {
    neutral: { smile: 0, concern: 0.08, effort: 0, blink: 0, squint: 0 },
    hopeful: { smile: 0.55, concern: 0.08, effort: 0, blink: 0, squint: 0 },
    concerned: {
      smile: 0,
      concern: 0.72,
      effort: 0.08,
      blink: 0,
      squint: 0.08,
    },
    determined: {
      smile: 0.04,
      concern: 0.2,
      effort: 0.48,
      blink: 0,
      squint: 0.22,
    },
    weary: {
      smile: 0,
      concern: 0.45,
      effort: 0.62,
      blink: 0.1,
      squint: 0.32,
    },
  };
  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  const apply = () => {
    const influences = body.morphTargetInfluences;
    if (!influences) return;
    influences[0] = values.smile;
    influences[1] = values.concern;
    influences[2] = values.effort;
    influences[3] = Math.max(values.blink, values.squint * 0.35);
  };
  return {
    values,
    target,
    setPreset(preset, intensity = 1) {
      for (const channel of expressionChannels)
        target[channel] = presets[preset][channel] * clamp(intensity);
    },
    setWeights(weights) {
      for (const channel of expressionChannels) {
        const weight = weights[channel];
        if (weight !== undefined) target[channel] = clamp(weight);
      }
    },
    update(delta, dynamicEffort = 0, automaticBlink = 0) {
      const response = 1 - Math.exp(-Math.max(0, delta) * 15);
      for (const channel of expressionChannels) {
        const wanted =
          channel === "effort"
            ? Math.max(target[channel], dynamicEffort)
            : channel === "blink"
              ? Math.max(target[channel], automaticBlink)
              : target[channel];
        values[channel] += (clamp(wanted) - values[channel]) * response;
      }
      apply();
    },
    reset() {
      for (const channel of expressionChannels) {
        values[channel] = 0;
        target[channel] = 0;
      }
      apply();
    },
  };
}

function materialAliases(
  body: Material,
  burden: Material,
  prop: Material,
  equipment: Material,
) {
  const aliases = {} as Record<HeroMaterialId, Material>;
  const burdenIds: HeroMaterialId[] = [
    "burden",
    "burdenShadow",
    "rope",
  ];
  const propIds: HeroMaterialId[] = ["parchment", "seal"];
  const equipmentIds: HeroMaterialId[] = ["steel", "brass"];
  const all: HeroMaterialId[] = [
    "skin",
    "skinShadow",
    "hair",
    "eyeWhite",
    "iris",
    "pupil",
    "catchlight",
    "mouth",
    "linen",
    "linenShadow",
    "tunic",
    "tunicShadow",
    "trousers",
    "legWrap",
    "leather",
    "leatherDark",
    "brass",
    "steel",
    "burden",
    "burdenShadow",
    "rope",
    "parchment",
    "seal",
  ];
  for (const id of all)
    aliases[id] = burdenIds.includes(id)
      ? burden
      : propIds.includes(id)
        ? prop
        : equipmentIds.includes(id)
          ? equipment
          : body;
  return aliases;
}

export function createAuthoredPilgrimHero(
  options: HeroFactoryOptions = {},
): HeroRuntime {
  const spec = resolveHeroSpec(options.spec, options.seed);
  const palette = spec.palette;
  const beardColor = new Color(palette.hair).lerp(
    new Color(palette.skinShadow),
    0.28,
  );
  const bootToe = new Color(palette.leatherDark).lerp(
    new Color(palette.leather),
    0.26,
  );
  const bootSole = new Color(palette.leatherDark).lerp(
    new Color("#171411"),
    0.34,
  );
  // Keep the load in the reference's charcoal/brown cloth family, but lift
  // the base enough for packed folds to separate from the shadow side. A
  // nearly-black vertex base made the sack read as one rigid shell under the
  // warm key light.
  const burdenCloth = new Color("#5b4a3d").lerp(
    new Color(palette.burden),
    0.16,
  );
  const burdenShade = new Color(palette.burdenShadow).lerp(
    burdenCloth,
    0.32,
  );
  const burdenFold = new Color("#987a5f").lerp(burdenCloth, 0.22);
  const burdenFacet = new Color("#a18263").lerp(burdenCloth, 0.24);
  const burdenDeepFold = new Color("#2f241d").lerp(burdenCloth, 0.28);
  const burdenHarnessLeather = new Color("#79583f").lerp(
    new Color(palette.leather),
    0.22,
  );
  const burdenRope = new Color("#5b4634").lerp(
    new Color(palette.rope),
    0.28,
  );
  const root = new Group();
  root.name = `hero.root.${spec.id}.authored`;
  const motionRoot = new Group();
  motionRoot.name = "hero.pivot.motion";
  root.add(motionRoot);

  const pivots = {} as Record<HeroPivotId, Object3D>;
  pivots.motion = motionRoot;
  const bones: Bone[] = [];
  const boneIndex = {} as Record<Exclude<HeroPivotId, "motion">, number>;
  const addBone = (
    id: Exclude<HeroPivotId, "motion">,
    parent: Object3D,
    position: HeroVec3,
  ) => {
    const bone = new Bone();
    bone.name = `hero.pivot.${id}`;
    bone.position.fromArray(position);
    bone.userData.heroPivot = id;
    parent.add(bone);
    boneIndex[id] = bones.length;
    bones.push(bone);
    pivots[id] = bone;
    return bone;
  };

  const pelvis = addBone("pelvis", motionRoot, [0, 1.02, 0]);
  const spine = addBone("spine", pelvis, [0, 0, 0]);
  const chest = addBone("chest", spine, [0, 0.38, 0]);
  const neck = addBone("neck", chest, [0, 0.22, 0]);
  const head = addBone("head", neck, [0, 0.08, 0]);
  // The turnaround reads as an adult traveler with a compact, angular head,
  // not a mascot. Scale the complete head hierarchy (face, beard, hair, and
  // expression patches) together so every facial socket stays registered.
  head.scale.set(0.86, 0.88, 0.86);
  addBone("jaw", head, [0, 0.07, 0.045]);
  const leftShoulder = addBone("leftShoulder", chest, [-0.31, 0.12, 0]);
  const leftElbow = addBone("leftElbow", leftShoulder, [0, -0.335, 0]);
  const leftWrist = addBone("leftWrist", leftElbow, [0, -0.295, 0]);
  const rightShoulder = addBone("rightShoulder", chest, [0.31, 0.12, 0]);
  const rightElbow = addBone("rightElbow", rightShoulder, [0, -0.335, 0]);
  const rightWrist = addBone("rightWrist", rightElbow, [0, -0.295, 0]);
  const leftHip = addBone("leftHip", pelvis, [-0.15, 0, 0]);
  const leftKnee = addBone("leftKnee", leftHip, [0, -0.46, 0]);
  const leftAnkle = addBone("leftAnkle", leftKnee, [0, -0.43, 0]);
  const rightHip = addBone("rightHip", pelvis, [0.15, 0, 0]);
  const rightKnee = addBone("rightKnee", rightHip, [0, -0.46, 0]);
  const rightAnkle = addBone("rightAnkle", rightKnee, [0, -0.43, 0]);

  const bodyBuilder = new AuthoredGeometryBuilder();
  const torsoRings: AuthoredLoftRing[] = [
    {
      center: [0, 0.72, 0.008],
      // Keep tunic hem just outside the hips. The previous near-constant
      // radius made torso read as one barrel from front and profile.
      radiusX: 0.22,
      radiusZ: 0.145,
      color: palette.tunicShadow,
      skin: { bone: boneIndex.pelvis },
    },
    {
      center: [0, 0.86, 0.006],
      radiusX: 0.235,
      radiusZ: 0.15,
      color: palette.tunic,
      skin: { bone: boneIndex.pelvis },
    },
    {
      center: [0, 0.99, 0],
      radiusX: 0.205,
      radiusZ: 0.132,
      color: palette.tunic,
      skin: { bone: boneIndex.pelvis, nextBone: boneIndex.spine, blend: 0.4 },
    },
    {
      center: [0, 1.17, 0],
      radiusX: 0.23,
      radiusZ: 0.14,
      color: palette.tunic,
      skin: { bone: boneIndex.spine, nextBone: boneIndex.chest, blend: 0.45 },
    },
    {
      center: [0, 1.35, -0.002],
      radiusX: 0.26,
      radiusZ: 0.155,
      color: palette.tunic,
      skin: { bone: boneIndex.chest },
    },
    {
      center: [0, 1.5, -0.004],
      radiusX: 0.28,
      radiusZ: 0.165,
      color: palette.tunic,
      skin: { bone: boneIndex.chest },
    },
    {
      center: [0, 1.555, -0.002],
      radiusX: 0.2,
      radiusZ: 0.14,
      color: palette.tunic,
      skin: { bone: boneIndex.chest },
    },
    {
      center: [0, 1.59, 0.002],
      radiusX: 0.115,
      radiusZ: 0.105,
      color: palette.tunic,
      skin: { bone: boneIndex.chest },
    },
  ];
  bodyBuilder.addLoft(torsoRings, 20, "start");
  const tunicFold = new Color(palette.tunicShadow).lerp(
    new Color(palette.tunic),
    0.3,
  );
  bodyBuilder.addTube(
    ellipseLoop([0, 0.74, 0], [0.22, 0, 0.15], "xz", 20),
    0.011,
    palette.tunicShadow,
    { bone: boneIndex.pelvis },
    5,
    true,
  );
  for (const [x, bend] of [
    [-0.13, -0.016],
    [0.0, 0.012],
    [0.14, -0.01],
  ] as const)
    bodyBuilder.addTube(
      [
        [x, 0.78, 0.15],
        [x + bend, 1.02, 0.145],
        [x - bend * 0.5, 1.25, 0.158],
        [x + bend, 1.47, 0.16],
      ],
      0.0055,
      tunicFold,
      { bone: boneIndex.pelvis, nextBone: boneIndex.chest, blend: 0.45 },
      5,
    );

  bodyBuilder.addLoft(
    [
      {
        center: [0, 1.535, 0],
        radiusX: 0.105,
        radiusZ: 0.095,
        color: palette.skinShadow,
        skin: { bone: boneIndex.neck },
      },
      {
        center: [0, 1.655, 0.004],
        radiusX: 0.09,
        radiusZ: 0.085,
        color: palette.skin,
        skin: { bone: boneIndex.neck, nextBone: boneIndex.head, blend: 0.45 },
      },
    ],
    14,
    false,
  );

  const addArm = (
    side: -1 | 1,
    shoulderBone: number,
    elbowBone: number,
    wristBone: number,
  ) => {
    bodyBuilder.addLoft(
      [
        {
          // A sloped deltoid cap flows into the sleeve instead of starting as
          // a straight cylinder at the clavicle. The reference has a relaxed
          // A-pose with the elbows slightly outside the wrists.
          center: [side * 0.255, 1.49, -0.002],
          radiusX: 0.108,
          radiusZ: 0.103,
          color: palette.tunic,
          skin: { bone: shoulderBone },
        },
        {
          center: [side * 0.31, 1.41, 0],
          radiusX: 0.096,
          radiusZ: 0.09,
          color: palette.tunic,
          skin: { bone: shoulderBone },
        },
        {
          center: [side * 0.335, 1.32, 0.004],
          radiusX: 0.076,
          radiusZ: 0.073,
          color: palette.linen,
          skin: { bone: shoulderBone },
        },
        {
          center: [side * 0.343, 1.2, 0.008],
          radiusX: 0.068,
          radiusZ: 0.065,
          color: palette.linenShadow,
          skin: { bone: shoulderBone, nextBone: elbowBone, blend: 0.7 },
        },
        {
          center: [side * 0.345, 1.09, 0.01],
          radiusX: 0.058,
          radiusZ: 0.054,
          color: palette.skinShadow,
          skin: { bone: elbowBone },
        },
        {
          center: [side * 0.34, 0.89, 0.014],
          radiusX: 0.049,
          radiusZ: 0.044,
          color: palette.skin,
          skin: { bone: elbowBone, nextBone: wristBone, blend: 0.55 },
        },
        {
          center: [side * 0.335, 0.77, 0.018],
          // Narrow wrist taper leaves a deliberate transition into the palm
          // instead of carrying the forearm's toy-like oval into the hand.
          radiusX: 0.037,
          radiusZ: 0.034,
          color: palette.skin,
          skin: { bone: wristBone },
        },
      ],
      12,
      false,
    );
    // Palm volume is deliberately compact and slightly canted. Four fingers
    // and a thumb overlap it at the wrist so the silhouette reads as a hand,
    // not an oval mitten, while remaining inside the unified body draw.
    bodyBuilder.addEllipsoid(
      [side * 0.335, 0.67, 0.032],
      [0.044, 0.059, 0.037],
      (normal) => (normal.y < -0.45 ? palette.skinShadow : palette.skin),
      { bone: wristBone },
      14,
      9,
      (position, normal) => {
        position.x += side * Math.max(0, -normal.y) * 0.005;
        position.z += Math.max(0, -normal.y) * 0.007;
        return position;
      },
    );
    const fingerOffsets = [-0.036, -0.013, 0.013, 0.036];
    for (const [fingerIndex, offset] of fingerOffsets.entries()) {
      // Longer, slightly separated fingers turn the hand into an adult
      // taper. Narrow tubes keep each digit legible without a mitten mass.
      const length = 0.088 - fingerIndex * 0.006;
      bodyBuilder.addTube(
        [
          [side * (0.335 + offset), 0.638, 0.045],
          [side * (0.337 + offset * 0.92), 0.596 - length * 0.3, 0.054],
          [side * (0.34 + offset * 0.78), 0.558 - length * 0.2, 0.047],
        ],
        0.0085,
        palette.skin,
        { bone: wristBone },
        5,
      );
      bodyBuilder.addEllipsoid(
        [side * (0.34 + offset * 0.78), 0.558 - length * 0.2, 0.047],
        [0.0095, 0.013, 0.0095],
        palette.skinShadow,
        { bone: wristBone },
        7,
        5,
      );
    }
    bodyBuilder.addTube(
      [
        [side * 0.368, 0.684, 0.056],
        [side * 0.39, 0.648, 0.066],
        [side * 0.388, 0.606, 0.055],
      ],
      0.011,
      palette.skin,
      { bone: wristBone },
      6,
    );
  };
  addArm(
    -1,
    boneIndex.leftShoulder,
    boneIndex.leftElbow,
    boneIndex.leftWrist,
  );
  addArm(
    1,
    boneIndex.rightShoulder,
    boneIndex.rightElbow,
    boneIndex.rightWrist,
  );

  const addLeg = (
    side: -1 | 1,
    hipBone: number,
    kneeBone: number,
    ankleBone: number,
  ) => {
    // Keep the upper leg close to the pelvis, then let the knee/calf drift a
    // few millimetres outward. This small lateral arc breaks the mannequin
    // cylinder and leaves a readable negative space between the legs.
    const x = side * 0.15;
    bodyBuilder.addLoft(
      [
        {
          center: [x, 0.83, 0],
          radiusX: 0.12,
          radiusZ: 0.115,
          color: palette.trousers,
          skin: { bone: hipBone },
        },
        {
          center: [x + side * 0.006, 0.67, 0],
          radiusX: 0.112,
          radiusZ: 0.11,
          color: palette.trousers,
          skin: { bone: hipBone },
        },
        {
          center: [x + side * 0.012, 0.55, 0.01],
          radiusX: 0.09,
          radiusZ: 0.094,
          color: palette.trousers,
          skin: { bone: hipBone, nextBone: kneeBone, blend: 0.75 },
        },
        {
          center: [x + side * 0.014, 0.47, 0.015],
          radiusX: 0.107,
          radiusZ: 0.103,
          color: palette.trousers,
          skin: { bone: kneeBone },
        },
        {
          center: [x + side * 0.008, 0.29, 0.008],
          radiusX: 0.074,
          radiusZ: 0.072,
          color: palette.trousers,
          skin: { bone: kneeBone, nextBone: ankleBone, blend: 0.45 },
        },
        {
          center: [x, 0.18, 0.01],
          // Wrap hugs the ankle before the boot shaft widens below it.
          radiusX: 0.066,
          radiusZ: 0.064,
          color: palette.legWrap,
          skin: { bone: ankleBone },
        },
        {
          center: [x, 0.07, 0.025],
          radiusX: 0.068,
          radiusZ: 0.066,
          color: palette.leather,
          skin: { bone: ankleBone },
        },
      ],
      14,
    );
    bodyBuilder.addEllipsoid(
      [x, 0.055, 0.11],
      [0.074, 0.046, 0.13],
      (normal) => (normal.y < -0.25 ? bootSole : bootToe),
      { bone: ankleBone },
      14,
      8,
      (position, normal) => {
        // Flatten sole, taper heel, and pitch toe upward so profile reads as a
        // directional leather foot rather than a dark round ball.
        if (normal.z > 0.3) {
          position.y += normal.z * 0.01;
          position.x *= 1 - normal.z * 0.08;
        }
        if (normal.z < -0.35) position.z -= 0.008;
        if (normal.y < -0.4) position.y = Math.max(position.y, 0.012);
        return position;
      },
    );
    bodyBuilder.addEllipsoid(
      [x, 0.05, 0.205],
      [0.068, 0.024, 0.078],
      (normal) => (normal.y < -0.35 ? bootSole : bootToe),
      { bone: ankleBone },
      14,
      7,
      (position, normal) => {
        // Low toe cap extends forward from shaft and shares same skinned body
        // draw. Narrow front normal keeps cap pointed without changing width.
        position.y = Math.max(position.y, 0.012);
        if (normal.z > 0.2) {
          position.x *= 1 - normal.z * 0.16;
          position.y += normal.z * 0.004;
        }
        return position;
      },
    );
    bodyBuilder.addTube(
      ellipseLoop([x, 0.075, 0.016], [0.067, 0, 0.062], "xz", 16),
      0.005,
      bootToe,
      { bone: ankleBone },
      5,
      true,
    );
    bodyBuilder.addTube(
      ellipseLoop([x, 0.46, 0.008], [0.1, 0, 0.098], "xz", 16),
      0.007,
      palette.trousers,
      { bone: kneeBone },
      5,
      true,
    );
    bodyBuilder.addTube(
      ellipseLoop([x, 0.2, 0.012], [0.073, 0, 0.072], "xz", 16),
      0.009,
      palette.legWrap,
      { bone: ankleBone },
      5,
      true,
    );
    // Sparse, broad cloth ridges give the trousers a knee fold and a tapered
    // calf without splitting the four-material hero budget.
    for (const [offset, depth] of [
      [-0.045, 0.085],
      [0.028, 0.092],
    ] as const)
      bodyBuilder.addTube(
        [
          [x + offset, 0.72, depth],
          [x + offset * 0.7 + side * 0.012, 0.55, depth + 0.012],
          [x + offset * 0.5, 0.41, depth + 0.008],
        ],
        0.006,
        palette.trousers,
        { bone: hipBone, nextBone: kneeBone, blend: 0.6 },
        5,
      );
  };
  addLeg(-1, boneIndex.leftHip, boneIndex.leftKnee, boneIndex.leftAnkle);
  addLeg(1, boneIndex.rightHip, boneIndex.rightKnee, boneIndex.rightAnkle);

  const headCenter = new Vector3(0, 1.81, 0.008);
  bodyBuilder.addEllipsoid(
    [headCenter.x, headCenter.y, headCenter.z],
    [0.137, 0.179, 0.138],
    (normal) => {
      if (
        normal.y > 0.5 ||
        (normal.z < -0.28 && normal.y > -0.2) ||
        (Math.abs(normal.x) > 0.72 && normal.y > 0.02)
      )
        return palette.hair;
      if (
        normal.y <
          -0.6 + Math.min(0.12, Math.abs(normal.x) * 0.16) &&
        normal.z > -0.18
      )
        return beardColor;
      return palette.skin;
    },
    { bone: boneIndex.head },
    24,
    26,
    (position, normal) => {
      const localY = (position.y - headCenter.y) / 0.175;
      if (localY < -0.12) {
        const jawTaper = Math.max(0.76, 1 - (-localY - 0.12) * 0.42);
        position.x *= jawTaper;
        position.z -= Math.max(0, -localY - 0.12) * 0.008;
      }
      if (normal.z > 0.45) {
        const x = position.x / 0.132;
        const noseY = (position.y - (headCenter.y + 0.008)) / 0.058;
        position.z +=
          Math.exp(-(x * x * 11 + noseY * noseY * 2.8)) * 0.029;
        const cheekY = (position.y - (headCenter.y - 0.02)) / 0.074;
        position.z +=
          Math.exp(-((Math.abs(x) - 0.48) ** 2 * 12 + cheekY * cheekY * 2)) *
          0.018;
      }
      return position;
    },
  );

  // Sculpted facial volume stays in same skinned body draw. Orbital pockets,
  // cheek planes, brow ridge, and chin give eyes/expressions a continuous
  // surface instead of a stack of flat cards at gameplay distance.
  bodyBuilder.addEllipsoid(
    [0, 1.81, 0.137],
    [0.03, 0.044, 0.05],
    (normal) => (normal.y < -0.45 ? palette.skinShadow : palette.skin),
    { bone: boneIndex.head },
    12,
    8,
  );
  for (const side of [-1, 1] as const) {
    // Recessed socket lip catches a shadow under brow/upper lid while rounded
    // eye volume remains in front. Both are one body draw/material.
    bodyBuilder.addEllipsoid(
      [side * 0.052, 1.824, 0.123],
      [0.044, 0.029, 0.017],
      (normal) => (normal.y > 0.35 ? palette.skinShadow : palette.skin),
      { bone: boneIndex.head },
      14,
      8,
    );
    bodyBuilder.addEllipsoid(
      [side * 0.072, 1.784, 0.102],
      [0.046, 0.041, 0.025],
      (normal) => (normal.y < -0.35 ? palette.skinShadow : palette.skin),
      { bone: boneIndex.head },
      14,
      9,
    );
    bodyBuilder.addTube(
      [
        [side * 0.078, 1.858, 0.136],
        [side * 0.05, 1.866, 0.145],
        [side * 0.018, 1.862, 0.145],
      ],
      0.006,
      palette.skinShadow,
      { bone: boneIndex.head },
      6,
    );
  }
  // Continuous nose bridge, alae, and tip keep face readable in profile
  // without a flat facial card. All forms remain skinned body islands.
  bodyBuilder.addEllipsoid(
    [0, 1.816, 0.145],
    [0.023, 0.054, 0.038],
    (normal) => (normal.z > 0.35 ? palette.skin : palette.skinShadow),
    { bone: boneIndex.head },
    12,
    8,
  );
  bodyBuilder.addEllipsoid(
    [0, 1.792, 0.173],
    [0.017, 0.017, 0.014],
    palette.skinShadow,
    { bone: boneIndex.head },
    10,
    6,
  );
  for (const side of [-1, 1] as const)
    bodyBuilder.addEllipsoid(
      [side * 0.017, 1.793, 0.17],
      [0.016, 0.012, 0.016],
      palette.skinShadow,
      { bone: boneIndex.head },
      10,
      6,
    );
  bodyBuilder.addEllipsoid(
    [0, 1.718, 0.105],
    [0.064, 0.052, 0.035],
    palette.skinShadow,
    { bone: boneIndex.head },
    14,
    8,
  );
  for (const side of [-1, 1] as const)
    bodyBuilder.addEllipsoid(
      [side * 0.13, 1.81, -0.002],
      [0.018, 0.044, 0.03],
      palette.skinShadow,
      { bone: boneIndex.head },
      12,
      8,
    );
  bodyBuilder.addEllipsoid(
    [0, 1.735, 0.11],
    [0.064, 0.048, 0.032],
    beardColor,
    { bone: boneIndex.head },
    16,
    10,
    (position, normal) => {
      position.y -= Math.max(0, -normal.y) * 0.022;
      position.z += Math.max(0, -normal.y) * 0.007;
      return position;
    },
  );
  bodyBuilder.addEllipsoid(
    [0, 1.696, 0.105],
    [0.046, 0.049, 0.028],
    beardColor,
    { bone: boneIndex.head },
    12,
    8,
  );
  // Trimmed moustache and lip/chin volume keep mouth line visible through the
  // beard instead of producing one dark planar mask.
  for (const side of [-1, 1] as const)
    bodyBuilder.addTube(
      [
        [side * 0.037, 1.781, 0.158],
        [side * 0.02, 1.787, 0.164],
        [side * 0.005, 1.783, 0.166],
      ],
      0.009,
      beardColor,
      { bone: boneIndex.head },
      6,
    );
  bodyBuilder.addEllipsoid(
    [0, 1.765, 0.16],
    [0.039, 0.011, 0.009],
    "#74483f",
    { bone: boneIndex.head },
    12,
    6,
  );
  bodyBuilder.addEllipsoid(
    [0, 1.753, 0.158],
    [0.032, 0.009, 0.011],
    "#8a5146",
    { bone: boneIndex.head },
    12,
    6,
  );
  bodyBuilder.addLoft(
    [
      {
        center: [0, 1.9, 0.004],
        radiusX: 0.124,
        radiusZ: 0.124,
        color: palette.hair,
        skin: { bone: boneIndex.head },
      },
      {
        center: [0.008, 1.95, 0.003],
        radiusX: 0.105,
        radiusZ: 0.105,
        color: palette.hair,
        skin: { bone: boneIndex.head },
      },
      {
        center: [-0.012, 1.985, 0.0],
        radiusX: 0.04,
        radiusZ: 0.035,
        color: palette.hair,
        skin: { bone: boneIndex.head },
      },
    ],
    20,
    "end",
    (position, normal, ringIndex) => {
      // Slightly broken rings keep the crown from becoming a helmet. The
      // offset is deterministic and low amplitude so facial sockets remain
      // stable under animation.
      position.x += Math.sin(ringIndex * 2.1 + normal.z * 3.4) * 0.009;
      position.z +=
        Math.sin(ringIndex * 1.7 + normal.x * 2.8) * 0.007 +
        Math.max(0, normal.z) * 0.004;
      return position;
    },
  );
  // Small overlapping crown/temple clumps break the procedural cap into an
  // asymmetrical, swept hairline that survives the three-quarter camera.
  for (const [x, y, z, rx, ry, rz, phase] of [
    [-0.082, 1.95, 0.048, 0.052, 0.032, 0.04, 0.4],
    [0.028, 1.984, 0.026, 0.066, 0.023, 0.045, 1.2],
    [0.086, 1.958, 0.025, 0.044, 0.036, 0.037, 2.1],
    [-0.115, 1.902, 0.064, 0.037, 0.052, 0.033, 2.8],
    [0.118, 1.904, 0.055, 0.034, 0.048, 0.03, 3.5],
  ] as const)
    bodyBuilder.addEllipsoid(
      [x, y, z],
      [rx, ry, rz],
      palette.hair,
      { bone: boneIndex.head },
      10,
      7,
      (position, normal) => {
        position.x += Math.sin(position.y * 34 + phase) * 0.006;
        position.z += Math.sin(position.x * 31 + phase) * 0.005;
        if (normal.y < -0.25) position.y -= 0.004;
        return position;
      },
    );
  for (const side of [-1, 1] as const)
    bodyBuilder.addTube(
      [
        [side * 0.112, 1.892, 0.09],
        [side * 0.14, 1.83, 0.102],
        [side * 0.13, 1.775, 0.086],
      ],
      0.015,
      palette.hair,
      { bone: boneIndex.head },
      6,
    );
  for (const side of [-1, 1] as const)
    bodyBuilder.addTube(
      [
        [side * 0.082, 1.862, 0.14],
        [side * 0.048, 1.87, 0.153],
        [side * 0.015, 1.865, 0.154],
      ],
      0.008,
      palette.hair,
      { bone: boneIndex.head },
      5,
    );
  for (const side of [-1, 1] as const)
    bodyBuilder.addEllipsoid(
      [side * 0.052, 1.825, 0.156],
      [0.012, 0.009, 0.008],
      palette.iris,
      { bone: boneIndex.head },
      10,
      7,
    );
  for (const side of [-1, 1] as const) {
    bodyBuilder.addEllipsoid(
      [side * 0.052, 1.825, 0.169],
      [0.0045, 0.0055, 0.003],
      palette.pupil,
      { bone: boneIndex.head },
      8,
      5,
    );
    bodyBuilder.addEllipsoid(
      [side * 0.049, 1.829, 0.174],
      [0.0024, 0.0028, 0.0015],
      palette.eyeWhite,
      { bone: boneIndex.head },
      6,
      4,
    );
  }

  for (const side of [-1, 1] as const) {
    const x = side * 0.052;
    bodyBuilder.addPatch(
      [
        [x - 0.012, 1.83, 0.151],
        [x + 0.012, 1.83, 0.151],
        [x + 0.011, 1.822, 0.154],
        [x - 0.011, 1.822, 0.154],
      ],
      palette.eyeWhite,
      { bone: boneIndex.head },
      { blink: [0, -0.012, 0.002] },
    );
    bodyBuilder.addPatch(
      [
        [x - 0.004, 1.829, 0.156],
        [x + 0.004, 1.829, 0.156],
        [x + 0.004, 1.822, 0.158],
        [x - 0.004, 1.822, 0.158],
      ],
      palette.iris,
      { bone: boneIndex.head },
      { blink: [0, -0.012, 0.002] },
    );
    bodyBuilder.addPatch(
      [
        [x - 0.022, 1.866, 0.145],
        [x + 0.021, 1.865, 0.146],
        [x + 0.02, 1.862, 0.147],
        [x - 0.021, 1.863, 0.146],
      ],
      palette.hair,
      { bone: boneIndex.head },
      {
        concern: [0, side < 0 ? 0.008 : 0.006, 0],
        effort: [0, -0.004, 0],
      },
    );
  }
  bodyBuilder.addPatch(
    [
      [-0.04, 1.766, 0.158],
      [0.04, 1.766, 0.158],
      [0.034, 1.759, 0.159],
      [-0.034, 1.759, 0.159],
    ],
    "#74483f",
    { bone: boneIndex.head },
    {
      smile: [0, 0.01, 0.002],
      concern: [0, -0.006, 0],
      effort: [0, -0.008, 0.002],
    },
  );

  bodyBuilder.addTube(
    ellipseLoop([0, 1.0, 0], [0.22, 0, 0.155], "xz", 28),
    0.025,
    palette.leather,
    { bone: boneIndex.pelvis },
    6,
    true,
  );

  // Linen collar and restrained front creases create a layered, tailored
  // outfit at gameplay distance. Geometry stays embedded in body topology so
  // it survives orbiting camera and loaded-pose deformation.
  bodyBuilder.addTube(
    [
      [0, 1.575, 0.145],
      [-0.055, 1.59, 0.132],
      [-0.11, 1.56, 0.115],
    ],
    0.018,
    palette.linen,
    { bone: boneIndex.chest },
    6,
  );
  bodyBuilder.addTube(
    [
      [0, 1.575, 0.145],
      [0.055, 1.59, 0.132],
      [0.11, 1.56, 0.115],
    ],
    0.018,
    palette.linen,
    { bone: boneIndex.chest },
    6,
  );
  for (const [x, sway] of [
    [-0.18, -0.014],
    [-0.06, 0.009],
    [0.07, -0.008],
    [0.19, 0.012],
  ] as const)
    bodyBuilder.addTube(
      [
        [x, 1.47, 0.166],
        [x + sway, 1.31, 0.17],
        [x - sway * 0.5, 1.08, 0.166],
      ],
      0.006,
      tunicFold,
      { bone: boneIndex.chest, nextBone: boneIndex.pelvis, blend: 0.48 },
      5,
    );

  // Leave the tunic front open. Earlier versions baked full-length harness
  // rails into the body mesh, so the chest read as armour even after the
  // burden was removed. The authored burden now owns the visible rear
  // webbing; these short leather tabs only mark shoulder contact from front.
  for (const side of [-1, 1] as const)
    bodyBuilder.addTube(
      [
        [side * 0.215, 1.53, 0.145],
        [side * 0.205, 1.45, 0.17],
      ],
      0.007,
      palette.leather,
      { bone: boneIndex.chest },
      6,
    );

  const bodyGeometry = bodyBuilder.toGeometry("hero.authored.body.geometry");
  const lengthenLowerBody = (geometry: BufferGeometry) => {
    const positions = geometry.getAttribute("position");
    for (let index = 0; index < positions.count; index += 1) {
      const x = positions.getX(index);
      const y = positions.getY(index);
      // Christian's reference is roughly seven heads tall. Stretch only the
      // leg column below the tunic hem, preserving the chest/head sockets and
      // avoiding a global scale that would also enlarge the burden.
      if (
        Math.abs(x) > 0.055 &&
        Math.abs(x) < 0.27 &&
        Math.abs(positions.getZ(index)) < 0.12 &&
        y < 0.98
      )
        positions.setY(index, y * 1.12);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  };
  lengthenLowerBody(bodyGeometry);
  const bodyMaterial = createVertexMaterial(
    "hero.authored.body.material",
    0.82,
  );
  const bodyMesh = new SkinnedMesh(bodyGeometry, bodyMaterial);
  bodyMesh.name = "hero.mesh.authored-body";
  bodyMesh.castShadow = true;
  bodyMesh.frustumCulled = false;
  bodyMesh.updateMorphTargets();

  // A deliberately simple silhouette proxy keeps the loaded traveler readable
  // when the camera pulls beyond the gameplay close range. It is a real LOD,
  // not a second high-detail copy: no facial patches or skinning attributes,
  // just the head/torso/legs mass that preserves the burdened outline.
  const bodyFarBuilder = new AuthoredGeometryBuilder();
  bodyFarBuilder.addLoft(
    [
      { center: [0, 0.72, 0], radiusX: 0.18, radiusZ: 0.13, color: palette.tunicShadow, skin: { bone: 0 } },
      { center: [0, 0.98, 0], radiusX: 0.2, radiusZ: 0.135, color: palette.tunic, skin: { bone: 0 } },
      { center: [0, 1.28, 0], radiusX: 0.25, radiusZ: 0.16, color: palette.tunic, skin: { bone: 0 } },
      { center: [0, 1.52, 0], radiusX: 0.29, radiusZ: 0.18, color: palette.tunic, skin: { bone: 0 } },
      { center: [0, 1.68, 0], radiusX: 0.12, radiusZ: 0.105, color: palette.skin, skin: { bone: 0 } },
    ],
    8,
  );
  for (const side of [-1, 1] as const) {
    bodyFarBuilder.addLoft(
      [
        { center: [side * 0.13, 0.64, 0], radiusX: 0.085, radiusZ: 0.08, color: palette.trousers, skin: { bone: 0 } },
        { center: [side * 0.13, 0.28, 0], radiusX: 0.07, radiusZ: 0.068, color: palette.trousers, skin: { bone: 0 } },
        { center: [side * 0.13, 0.08, 0.02], radiusX: 0.07, radiusZ: 0.067, color: palette.leather, skin: { bone: 0 } },
      ],
      6,
    );
  }
  // Preserve head/neck/shoulder cues when the far LOD is selected. These
  // small masses keep a rear thumbnail from collapsing into load plus legs.
  bodyFarBuilder.addLoft(
    [
      { center: [0, 1.57, 0], radiusX: 0.095, radiusZ: 0.09, color: palette.skinShadow, skin: { bone: 0 } },
      { center: [0, 1.72, 0], radiusX: 0.085, radiusZ: 0.08, color: palette.skin, skin: { bone: 0 } },
    ],
    6,
  );
  bodyFarBuilder.addEllipsoid(
    [0, 1.84, 0],
    [0.125, 0.145, 0.12],
    palette.skin,
    { bone: 0 },
    10,
    7,
  );
  for (const side of [-1, 1] as const)
    bodyFarBuilder.addLoft(
      [
        { center: [side * 0.28, 1.44, 0], radiusX: 0.08, radiusZ: 0.075, color: palette.linen, skin: { bone: 0 } },
        { center: [side * 0.31, 1.18, 0.01], radiusX: 0.058, radiusZ: 0.055, color: palette.linenShadow, skin: { bone: 0 } },
        { center: [side * 0.315, 0.96, 0.02], radiusX: 0.046, radiusZ: 0.044, color: palette.skin, skin: { bone: 0 } },
      ],
      5,
      false,
    );
  const bodyFarMesh = new Mesh(
    bodyFarBuilder.toGeometry("hero.authored.body.far.geometry"),
    bodyMaterial,
  );
  lengthenLowerBody(bodyFarMesh.geometry);
  bodyFarMesh.name = "hero.mesh.authored-body-far";
  bodyFarMesh.castShadow = true;

  const skeleton = new Skeleton(bones);
  const bodyLod = new LOD();
  bodyLod.name = "hero.lod.authored-body";
  bodyLod.addLevel(bodyMesh, 0);
  bodyLod.addLevel(bodyFarMesh, 10);
  motionRoot.add(bodyLod);
  root.updateMatrixWorld(true);
  bodyMesh.bind(skeleton);

  const sockets = {} as Record<HeroSocketId, Object3D>;
  const socket = (
    id: HeroSocketId,
    parent: Object3D,
    position: HeroVec3,
  ) => {
    const node = new Object3D();
    node.name = `hero.socket.${id}`;
    node.position.fromArray(position);
    node.userData.heroSocket = id;
    parent.add(node);
    sockets[id] = node;
    return node;
  };
  const backBurden = socket("backBurden", chest, [0, 0.08, -0.18]);
  socket("chestAction", chest, [0, 0.05, 0.18]);
  socket("headAction", head, [0, 0.29, 0]);
  socket("leftHandGrip", leftWrist, [0, -0.13, 0.025]);
  socket("rightHandGrip", rightWrist, [0, -0.13, 0.025]);
  socket("leftHandAction", leftWrist, [0, -0.2, 0.03]);
  socket("rightHandAction", rightWrist, [0, -0.2, 0.03]);
  socket("beltRoll", pelvis, [0.25, -0.05, 0.15]);
  socket("beltEquipment", pelvis, [-0.27, -0.04, 0]);
  socket("leftFootGround", leftAnkle, [0, -0.14, 0.08]);
  socket("rightFootGround", rightAnkle, [0, -0.14, 0.08]);

  const burdenBuilder = new AuthoredGeometryBuilder();
  const moveLoadTowardScapula = (geometry: BufferGeometry, offset: number) => {
    const positions = geometry.getAttribute("position");
    for (let index = 0; index < positions.count; index += 1)
      positions.setZ(index, positions.getZ(index) + offset);
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  };
  burdenBuilder.addLoft(
    [
      {
        center: [-0.08, -0.56, -0.05],
        radiusX: 0.12,
        // Flatten depth against the lumbar curve. Width stays generous in X
        // so the front silhouette reads as a load, while profile no longer
        // reads as a rigid shell strapped several inches off Christian's
        // back.
        radiusZ: 0.1,
        color: burdenShade,
        skin: { bone: 0 },
      },
      {
        center: [-0.055, -0.42, -0.062],
        radiusX: 0.18,
        radiusZ: 0.12,
        color: burdenCloth,
        skin: { bone: 0 },
      },
      {
        center: [-0.02, -0.12, -0.072],
        radiusX: 0.205,
        radiusZ: 0.13,
        color: new Color(burdenCloth).lerp(new Color("#5a4637"), 0.18),
        skin: { bone: 0 },
      },
      {
        center: [0.045, 0.15, -0.062],
        radiusX: 0.195,
        radiusZ: 0.125,
        color: new Color(burdenCloth).lerp(new Color("#8b725b"), 0.06),
        skin: { bone: 0 },
      },
      {
        center: [0.08, 0.31, -0.046],
        radiusX: 0.16,
        radiusZ: 0.11,
        color: burdenCloth,
        skin: { bone: 0 },
      },
      {
        center: [0.12, 0.36, -0.035],
        radiusX: 0.07,
        radiusZ: 0.07,
        color: burdenShade,
        skin: { bone: 0 },
      },
    ],
    26,
    true,
    (position, normal, ringIndex) => {
      // Broad, low-frequency relief gives the smaller sack a stuffed-cloth
      // silhouette instead of a flat shield. Keep the deformation deterministic
      // and restrained so the attachment remains stable in gameplay.
      const fold =
        Math.sin(position.y * 18 + position.x * 13 + normal.z * 2.4) * 0.021 +
        Math.cos(position.y * 7 - normal.x * 3.2) * 0.009;
      const sag = Math.sin(((ringIndex + 0.35) / 5) * Math.PI) * 0.024;
      position.x += fold * (0.45 + Math.abs(normal.x) * 0.55);
      position.z +=
        sag * (0.25 + Math.abs(normal.z) * 0.75) +
        Math.sin(position.y * 15 + normal.x * 3.1) * 0.014;
      // Seat cloth into Christian's scapulae and waist. Front-facing vertices
      // move a little toward the body, while the two contact bands are
      // pinched on the rear face so straps leave a real compression line.
      const front = Math.max(0, normal.z);
      const shoulderSeat =
        Math.exp(-Math.pow((position.y - 0.25) / 0.075, 2)) *
        Math.exp(-Math.pow((Math.abs(position.x) - 0.18) / 0.1, 2));
      const waistSeat = Math.exp(-Math.pow((position.y + 0.34) / 0.06, 2));
      const rearBand = Math.max(0, -normal.z);
      const bandPress =
        Math.exp(-Math.pow((position.y - 0.2) / 0.045, 2)) *
          (0.75 + 0.25 * Math.cos(position.x * 16)) +
        Math.exp(-Math.pow((position.y + 0.34) / 0.045, 2));
      position.z += front * (shoulderSeat * 0.024 + waistSeat * 0.018);
      position.z += rearBand * bandPress * 0.022;
      // A shallow rear-facing center seam separates the stuffed lobes. It is
      // enough to catch grazing light without cutting a visible front gap.
      if (normal.z < -0.3) {
        const lobeGap = Math.max(0, 1 - Math.abs(position.x) / 0.21);
        position.z += lobeGap * 0.028;
      }
      return position;
    },
  );
  // A padded shoulder saddle overlaps the upper back instead of leaving the
  // profile's air wedge between tunic and load. It is lighter than the deep
  // shadow cloth so shoulder contact remains legible from profile/back.
  burdenBuilder.addEllipsoid(
    [0, 0.27, 0.02],
    [0.26, 0.075, 0.07],
    burdenShade,
    { bone: 0 },
    16,
    8,
    (position, normal) => {
      if (normal.z > 0.05) position.z += 0.012;
      position.x += Math.sin(position.y * 24 + position.z * 13) * 0.006;
      return position;
    },
  );
  // Two offset stuffed lobes keep the load from reading as one rigid board.
  // They share the burden geometry/material budget while giving the cloth a
  // tied, asymmetrical shoulder silhouette from front, profile, and rear.
  for (const [x, y, rx, ry, rz, phase] of [
    // Two broad vertical lobes (upper shoulder pack + weighted lower pack)
    // leave a visible concave gutter down the center without becoming four
    // disconnected balloon primitives in the rear silhouette.
    [-0.065, 0.08, 0.245, 0.2, 0.105, 0.4],
    [0.065, -0.19, 0.235, 0.255, 0.11, 2.3],
  ] as const)
    burdenBuilder.addEllipsoid(
      [x, y, -0.078],
      [rx, ry, rz],
      (normal, position) => {
        position.x += Math.sin(position.y * 23 + phase) * 0.012;
        position.z += Math.sin(position.x * 18 + phase) * 0.012;
        // Rear-facing cloth carries the readable base color. Previous shading
        // only lit upward normals, so the turnaround rear collapsed to black.
        const rear = Math.max(0, -normal.z);
        const top = Math.max(0, normal.y);
        const shadow = new Color(burdenCloth).lerp(burdenShade, 0.72);
        const shoulderPress =
          Math.exp(-Math.pow((position.y - 0.2) / 0.05, 2)) *
          (0.65 +
            0.35 * Math.exp(-Math.pow((Math.abs(position.x) - 0.18) / 0.06, 2)));
        const waistPress = Math.exp(-Math.pow((position.y + 0.34) / 0.05, 2));
        const gutter =
          Math.max(0, 1 - Math.abs(position.x) / 0.07) *
          Math.max(0, -normal.z);
        // Low-profile tension ridges break the lobe's generated sphere without
        // adding cylindrical rods. They stay shallow enough to preserve the
        // front/profile silhouette, but catch grazing light on the rear cloth.
        const foldChannel =
          Math.sin(position.y * 11 + position.x * 8 + phase) * 0.018 +
          Math.sin(position.y * 23 - position.x * 13 + phase * 1.7) * 0.009;
        const clothRelief =
          Math.sin(position.y * 19 + phase) * 0.014 +
          Math.sin(position.x * 13 - position.y * 9 + phase * 1.7) * 0.008;
        position.z +=
          (clothRelief + foldChannel) *
          Math.max(0, -normal.z) *
          (0.72 + top * 0.28);
        // Keep tonal breakup broad and woven into vertex color. It avoids
        // floating plate silhouettes while preserving readable rear facets at
        // the 96px review crop.
        const facetSignal =
          Math.sin(position.y * 24 + position.x * 12 + phase) * 0.6 +
          Math.cos(position.x * 15 - position.y * 8 + phase * 1.4) * 0.4;
        if (normal.z > 0.18)
          position.z += shoulderPress * 0.018 + waistPress * 0.014;
        if (normal.z < -0.2)
          position.z += (shoulderPress * 0.8 + waistPress) * 0.018 + gutter * 0.035;
        if (top > 0.42)
          return new Color(burdenCloth).lerp(burdenFold, 0.28);
        if (rear > 0.2 && facetSignal > 0.28)
          return new Color(burdenCloth).lerp(burdenFacet, 0.44);
        if (rear > 0.2 && facetSignal < -0.28)
          return new Color(burdenCloth).lerp(burdenDeepFold, 0.34);
        return rear > 0.2 ? burdenCloth : shadow;
      },
      { bone: 0 },
      20,
      14,
    );
  for (const [y, radiusX, radiusZ] of [
    [-0.27, 0.24, 0.12],
    [0.0, 0.29, 0.135],
    [0.2, 0.25, 0.12],
  ] as const)
    burdenBuilder.addTube(
      ellipseLoop([0, y, 0], [radiusX, 0, radiusZ], "xz", 30),
      0.007,
      burdenRope,
      { bone: 0 },
      5,
      true,
    );
  for (const x of [-0.115, 0.11])
    burdenBuilder.addTube(
      ellipseLoop([x, -0.01, -0.045], [0, 0.29, 0.145], "yz", 30),
      0.007,
      burdenShade,
      { bone: 0 },
      5,
      true,
    );
  // Irregular cloth folds replace the old flat rear panel. The sack should
  // compress under the rope, not read as a shield bolted to Christian's back.
  for (const [x, top, bottom] of [
    [-0.15, 0.27, -0.3],
    [0.04, 0.3, -0.38],
    [0.18, 0.2, -0.24],
  ] as const)
    burdenBuilder.addLoft(
      [
        {
          center: [x, top, -0.176],
          radiusX: 0.026,
          radiusZ: 0.011,
          color: burdenFold,
          skin: { bone: 0 },
        },
        {
          center: [
            x + (x < 0 ? -0.028 : 0.02),
            (top + bottom) * 0.45,
            -0.204,
          ],
          radiusX: 0.034,
          radiusZ: 0.014,
          color: burdenDeepFold,
          skin: { bone: 0 },
        },
        {
          center: [x + (x < 0 ? 0.016 : -0.018), bottom, -0.17],
          radiusX: 0.022,
          radiusZ: 0.009,
          color: burdenFold,
          skin: { bone: 0 },
        },
      ],
      8,
      true,
    );
  burdenBuilder.addTube(
    [
      [0, 0.31, -0.2],
      [0.012, 0.08, -0.218],
      [-0.018, -0.2, -0.204],
      [0, -0.44, -0.17],
    ],
    0.012,
    burdenRope,
    { bone: 0 },
    5,
  );
  for (const [x, y] of [
    [-0.095, 0.01],
    [0.095, -0.02],
  ] as const)
    burdenBuilder.addEllipsoid(
      [x, y, -0.18],
      [0.038, 0.03, 0.022],
      burdenRope,
      { bone: 0 },
      8,
      6,
    );
  // Cinched mouth and loose tie make top of load read as hand-packed cloth,
  // not a smooth capsule. Offset knot gives silhouette an authored asymmetry.
  burdenBuilder.addTube(
    ellipseLoop([0.035, 0.31, -0.01], [0.125, 0, 0.095], "xz", 24),
    0.013,
    burdenRope,
    { bone: 0 },
    6,
    true,
  );
  burdenBuilder.addEllipsoid(
    [0.105, 0.335, -0.145],
    [0.045, 0.035, 0.026],
    burdenRope,
    { bone: 0 },
    10,
    7,
  );
  burdenBuilder.addTube(
    [
      [0.105, 0.335, -0.145],
      [0.16, 0.41, -0.112],
      [0.13, 0.49, -0.085],
    ],
    0.011,
    burdenRope,
    { bone: 0 },
    6,
  );
  burdenBuilder.addTube(
    [
      [0.08, 0.33, -0.14],
      [0.035, 0.4, -0.112],
      [0.07, 0.445, -0.09],
    ],
    0.008,
    burdenRope,
    { bone: 0 },
    6,
  );
  // Short radiating folds show fabric gathered into cinch before it falls
  // into the two uneven lobes.
  for (const [x, bend] of [
    [-0.08, -0.018],
    [0.0, 0.012],
    [0.085, -0.014],
  ] as const)
    burdenBuilder.addTube(
      [
        [x, 0.3, -0.13],
        [x + bend, 0.23, -0.157],
        [x - bend * 0.4, 0.16, -0.16],
      ],
      0.011,
      burdenFold,
      { bone: 0 },
      5,
    );
  // Broad rear webbing makes the load's force path legible without the
  // previous forest of cylindrical rods. Each stitched strip runs from a
  // shoulder seat to the waist and is coplanar with the sack's rear cloth.
  for (const side of [-1, 1] as const) {
    burdenBuilder.addPatch(
      [
        [side * 0.14, 0.29, -0.192],
        [side * 0.175, 0.29, -0.192],
        [side * 0.2, -0.31, -0.192],
        [side * 0.16, -0.31, -0.192],
      ],
      burdenHarnessLeather,
      { bone: 0 },
    );
    burdenBuilder.addEllipsoid(
      [side * 0.16, 0.29, -0.16],
      [0.065, 0.04, 0.025],
      burdenFold,
      { bone: 0 },
      12,
      8,
    );
  }
  burdenBuilder.addPatch(
    [
      [-0.2, -0.34, -0.194],
      [0.2, -0.34, -0.194],
      [0.2, -0.39, -0.194],
      [-0.2, -0.39, -0.194],
    ],
    burdenHarnessLeather,
    { bone: 0 },
  );
  // Lower load belt transfers the weight into the waist instead of stopping
  // in mid-cloth. It is intentionally below the rear rope band.
  burdenBuilder.addTube(
    [
      [-0.29, -0.34, 0.015],
      [0, -0.37, 0.055],
      [0.29, -0.34, 0.015],
    ],
    0.022,
    burdenHarnessLeather,
    { bone: 0 },
    6,
  );
  burdenBuilder.addTube(
    [
      [-0.27, 0.12, -0.11],
      [0, 0.08, -0.14],
      [0.27, 0.12, -0.11],
    ],
    0.018,
    burdenRope,
    { bone: 0 },
    6,
  );
  const burdenGeometry = burdenBuilder.toGeometry(
    "hero.authored.burden.geometry",
  );
  // The burden socket stays stable for gameplay attachments, while its local
  // cloth/strap assembly seats forward into the scapulae. This keeps the
  // whole primitive behind the torso but removes the visible profile gap.
  moveLoadTowardScapula(burdenGeometry, 0.055);
  const burdenMaterial = createVertexMaterial(
    "hero.authored.burden.material",
    0.94,
  );
  const burdenMesh = new Mesh(burdenGeometry, burdenMaterial);
  burdenMesh.name = "hero.mesh.authored-burden";
  burdenMesh.castShadow = true;
  const burdenFarBuilder = new AuthoredGeometryBuilder();
  burdenFarBuilder.addLoft(
    [
      { center: [-0.035, -0.48, -0.04], radiusX: 0.11, radiusZ: 0.09, color: burdenShade, skin: { bone: 0 } },
      { center: [0, -0.18, -0.055], radiusX: 0.17, radiusZ: 0.12, color: burdenCloth, skin: { bone: 0 } },
      { center: [0.025, 0.16, -0.05], radiusX: 0.18, radiusZ: 0.12, color: burdenCloth, skin: { bone: 0 } },
      { center: [0.05, 0.31, -0.035], radiusX: 0.12, radiusZ: 0.085, color: burdenShade, skin: { bone: 0 } },
    ],
    8,
  );
  for (const [x, y, rx, ry, rz] of [
    [-0.03, 0.08, 0.24, 0.19, 0.1],
    [0.04, -0.2, 0.235, 0.25, 0.105],
  ] as const)
    burdenFarBuilder.addEllipsoid(
      [x, y, -0.07],
      [rx, ry, rz],
      burdenCloth,
      { bone: 0 },
      10,
      7,
    );
  // Keep the burden's identity at distance: two quiet webbing strips and a
  // waist transfer survive the far LOD/96 px review without reintroducing the
  // high-detail rope noise of the close mesh.
  for (const side of [-1, 1] as const)
    burdenFarBuilder.addPatch(
      [
        [side * 0.12, 0.27, -0.145],
        [side * 0.165, 0.27, -0.145],
        [side * 0.19, -0.29, -0.145],
        [side * 0.145, -0.29, -0.145],
      ],
      burdenHarnessLeather,
      { bone: 0 },
    );
  burdenFarBuilder.addPatch(
    [
      [-0.19, -0.31, -0.147],
      [0.19, -0.31, -0.147],
      [0.19, -0.37, -0.147],
      [-0.19, -0.37, -0.147],
    ],
    burdenHarnessLeather,
    { bone: 0 },
  );
  const burdenFarMesh = new Mesh(
    burdenFarBuilder.toGeometry("hero.authored.burden.far.geometry"),
    burdenMaterial,
  );
  moveLoadTowardScapula(burdenFarMesh.geometry, 0.055);
  burdenFarMesh.name = "hero.mesh.authored-burden-far";
  burdenFarMesh.castShadow = true;
  const burdenLod = new LOD();
  burdenLod.name = "hero.lod.authored-burden";
  burdenLod.addLevel(burdenMesh, 0);
  burdenLod.addLevel(burdenFarMesh, 10);
  const burdenVisual = new Group();
  burdenVisual.name = "hero.attachment.burden";
  // Keep sack front plane behind Christian's scapulae. Earlier versions let
  // depth wrap around torso, making burden read like chest armor.
  burdenVisual.position.set(0, -0.08, -0.04);
  // A real tied pack is broad at the shoulders but compresses toward the
  // spine in profile. Scale the authored cloth as a single unit so the ropes,
  // knot, and lower belt keep their relative contact while the load stops
  // reading like a rigid shield behind the head.
  burdenVisual.scale.set(0.8, 0.92, 0.62);
  burdenVisual.add(burdenLod);
  backBurden.add(burdenVisual);
  const burdenHarness = burdenVisual;

  const rollBuilder = new AuthoredGeometryBuilder();
  rollBuilder.addEllipsoid(
    [0.27, 0.94, 0.16],
    [0.105, 0.055, 0.058],
    palette.parchment,
    { bone: boneIndex.pelvis },
    14,
    8,
  );
  rollBuilder.addEllipsoid(
    [0.27, 0.94, 0.16],
    [0.032, 0.061, 0.063],
    palette.seal,
    { bone: boneIndex.pelvis },
    10,
    7,
  );
  const propMaterial = createVertexMaterial("hero.authored.prop.material", 0.8);
  const rollMesh = new SkinnedMesh(
    rollBuilder.toGeometry("hero.authored.roll.geometry"),
    propMaterial,
  );
  rollMesh.name = "hero.mesh.authored-roll";
  rollMesh.bind(skeleton);
  rollMesh.castShadow = true;
  const rollVisual = new Group();
  rollVisual.name = "hero.attachment.sealed-roll";
  rollVisual.add(rollMesh);
  motionRoot.add(rollVisual);

  const equipmentBuilder = new AuthoredGeometryBuilder();
  equipmentBuilder.addEllipsoid(
    [0, 1.34, 0.17],
    [0.25, 0.27, 0.035],
    palette.steel,
    { bone: boneIndex.chest },
    16,
    10,
  );
  equipmentBuilder.addEllipsoid(
    [-0.47, 0.89, 0],
    [0.24, 0.28, 0.04],
    palette.steel,
    { bone: boneIndex.leftWrist },
    16,
    10,
  );
  equipmentBuilder.addTube(
    [
      [0.28, 1.05, 0],
      [0.36, 0.79, 0],
      [0.43, 0.5, 0],
    ],
    0.025,
    palette.steel,
    { bone: boneIndex.pelvis },
    6,
  );
  equipmentBuilder.addEllipsoid(
    [0, 1.91, 0],
    [0.14, 0.1, 0.14],
    palette.steel,
    { bone: boneIndex.head },
    16,
    9,
  );
  const equipmentMaterial = createVertexMaterial(
    "hero.authored.equipment.material",
    0.38,
    0.55,
  );
  const equipmentMesh = new SkinnedMesh(
    equipmentBuilder.toGeometry("hero.authored.equipment.geometry"),
    equipmentMaterial,
  );
  equipmentMesh.name = "hero.mesh.authored-equipment";
  equipmentMesh.bind(skeleton);
  equipmentMesh.castShadow = true;
  const equipmentVisual = new Group();
  equipmentVisual.name = "hero.equipment.authored";
  equipmentVisual.add(equipmentMesh);
  motionRoot.add(equipmentVisual);

  const expressions = createExpressionController(bodyMesh);
  expressions.setPreset(options.expression ?? "concerned");
  expressions.update(1);

  const colliders: HeroCollider[] = [
    {
      id: "controller",
      parent: "root",
      shape: "capsule",
      center: [...spec.collision.controllerCenter],
      rotation: [0, 0, 0],
      radius: spec.collision.controllerRadius,
      halfHeight: spec.collision.controllerHalfHeight,
      trigger: false,
      activeWhen: "always",
    },
    {
      id: "interaction",
      parent: "root",
      shape: "capsule",
      center: [...spec.collision.interactionCenter],
      rotation: [0, 0, 0],
      radius: spec.collision.interactionRadius,
      halfHeight: spec.collision.interactionHalfHeight,
      trigger: true,
      activeWhen: "always",
    },
    {
      id: "head-hit",
      parent: "head",
      shape: "sphere",
      center: [0, 0.11, 0],
      rotation: [0, 0, 0],
      radius: 0.14,
      trigger: false,
      activeWhen: "always",
    },
    {
      id: "burden-hit",
      parent: "backBurden",
      shape: "box",
      center: [0, -0.08, -0.06],
      rotation: [0, 0, 0],
      halfExtents: [0.39, 0.5, 0.22],
      trigger: false,
      activeWhen: "burden",
    },
  ];
  const attachments: HeroAttachment[] = [
    {
      id: "authored-body-skin",
      parent: "root",
      parentSocket: "pelvis",
      localStart: [0, 0, 0],
      localEnd: [0, 1.98, 0],
      baseRadius: 0.18,
      endRadius: 0.13,
      embedDepth: 0.03,
      contactType: "embedded",
      gapTolerance: 0,
      evidenceRef: "turnaround full body: unified tailored silhouette",
    },
    {
      id: "burden-pack",
      parent: "backBurden",
      parentSocket: "backBurden",
      localStart: [0, 0, 0],
      localEnd: [0, -0.08, -0.06],
      baseRadius: 0.24,
      endRadius: 0.39,
      embedDepth: 0.08,
      contactType: "socket",
      gapTolerance: 0,
      evidenceRef: "turnaround profile/back: compressed load against spine",
    },
  ];

  const animator = createHeroAnimator({
    motionRoot,
    pivots,
    burdenVisual,
    burdenHarness,
    rollVisual,
    equipmentVisuals: [equipmentVisual],
    expressions,
    seed: spec.seed,
  });

  const materials = materialAliases(
    bodyMaterial,
    burdenMaterial,
    propMaterial,
    equipmentMaterial,
  );
  const lods = new Map<string, LOD>([
    ["body", bodyLod],
    ["burden", burdenLod],
  ]);
  const renderMeshes = [
    bodyMesh,
    burdenMesh,
    bodyFarMesh,
    burdenFarMesh,
    rollMesh,
    equipmentMesh,
  ];
  const triangleCount = [bodyMesh, burdenMesh, rollMesh, equipmentMesh].reduce(
    (sum, mesh) =>
      sum +
      (mesh.geometry.index
        ? mesh.geometry.index.count / 3
        : mesh.geometry.attributes.position.count / 3),
    0,
  );
  let sceneNodes = 0;
  root.traverse(() => {
    sceneNodes += 1;
  });
  root.userData.heroBudget = {
    drawCalls: 4,
    materials: 4,
    renderMeshes: 4,
    sceneNodes,
    triangles: triangleCount,
    topology: "single-gameplay-topology",
  };

  let disposed = false;
  const runtime = {
    root,
    motionRoot,
    spec,
    pivots,
    sockets,
    lods,
    materials,
    colliders,
    attachments,
    expressions,
    state: animator.state,
    get disposed() {
      return disposed;
    },
    update(delta: number, input: HeroUpdateInput = {}) {
      if (disposed) return;
      animator.update(delta, input);
    },
    setExpression(preset: HeroExpressionPreset, intensity = 1) {
      if (!disposed) expressions.setPreset(preset, intensity);
    },
    getSocket(id: HeroSocketId) {
      return sockets[id];
    },
    getSocketWorldPosition(id: HeroSocketId, target = new Vector3()) {
      root.updateWorldMatrix(true, true);
      return sockets[id].getWorldPosition(target);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      root.removeFromParent();
      const geometries = new Set(
        renderMeshes.map((mesh) => mesh.geometry),
      );
      for (const geometry of geometries) geometry.dispose();
      const uniqueMaterials = new Set(Object.values(materials));
      const textures = new Set<Texture>();
      for (const material of uniqueMaterials) {
        for (const value of Object.values(material)) {
          if (
            value &&
            typeof value === "object" &&
            "isTexture" in value &&
            value.isTexture
          )
            textures.add(value as Texture);
        }
        material.dispose();
      }
      for (const texture of textures) texture.dispose();
      root.clear();
      lods.clear();
    },
  } satisfies HeroRuntime;

  const metadata: HeroSculptRuntimeMetadata = {
    kind: "pilgrims-progress-procedural-hero",
    version: 2,
    specId: spec.id,
    referenceId: spec.referenceId,
    seed: spec.seed,
    coordinateSystem: {
      up: "+Y",
      forward: "+Z",
      origin: "foot-ground-center",
    },
    pivotUuids: Object.fromEntries(
      pivotIds.map((id) => [id, pivots[id].uuid]),
    ) as Record<HeroPivotId, string>,
    socketUuids: Object.fromEntries(
      socketIds.map((id) => [id, sockets[id].uuid]),
    ) as Record<HeroSocketId, string>,
    lodNames: [...lods.keys()],
    colliderIds: colliders.map((collider) => collider.id),
    expressionChannels,
  };
  const sculptRuntime = { ...metadata };
  Object.defineProperties(sculptRuntime, {
    pivots: { value: pivots, enumerable: false },
    sockets: { value: sockets, enumerable: false },
    lods: { value: lods, enumerable: false },
    expressions: { value: expressions, enumerable: false },
    update: { value: runtime.update.bind(runtime), enumerable: false },
  });
  root.userData.sculptRuntime = sculptRuntime;

  animator.update(0, {
    burden: options.burden ?? 0,
    hasRoll: options.hasRoll ?? false,
    equipped: options.equipped ?? false,
  });
  burdenVisual.visible = (options.burden ?? 0) > 0;
  rollVisual.visible = options.hasRoll ?? false;
  equipmentVisual.visible = options.equipped ?? false;
  return runtime;
}
