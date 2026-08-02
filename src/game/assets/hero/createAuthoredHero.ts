import {
  Bone,
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
  const burdenCloth = new Color(palette.burden).lerp(
    new Color("#765c46"),
    0.58,
  );
  const burdenFold = new Color(burdenCloth).lerp(
    new Color(palette.burdenShadow),
    0.52,
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
      radiusX: 0.255,
      radiusZ: 0.145,
      color: palette.tunicShadow,
      skin: { bone: boneIndex.pelvis },
    },
    {
      center: [0, 0.86, 0.006],
      radiusX: 0.265,
      radiusZ: 0.15,
      color: palette.tunic,
      skin: { bone: boneIndex.pelvis },
    },
    {
      center: [0, 0.99, 0],
      radiusX: 0.215,
      radiusZ: 0.132,
      color: palette.tunic,
      skin: { bone: boneIndex.pelvis, nextBone: boneIndex.spine, blend: 0.4 },
    },
    {
      center: [0, 1.17, 0],
      radiusX: 0.225,
      radiusZ: 0.14,
      color: palette.tunic,
      skin: { bone: boneIndex.spine, nextBone: boneIndex.chest, blend: 0.45 },
    },
    {
      center: [0, 1.35, -0.002],
      radiusX: 0.275,
      radiusZ: 0.155,
      color: palette.tunic,
      skin: { bone: boneIndex.chest },
    },
    {
      center: [0, 1.5, -0.004],
      radiusX: 0.325,
      radiusZ: 0.175,
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
  const tunicFold = new Color(palette.tunic).lerp(
    new Color(palette.tunicShadow),
    0.42,
  );
  bodyBuilder.addTube(
    ellipseLoop([0, 0.74, 0], [0.255, 0, 0.15], "xz", 20),
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
      0.008,
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
          // A small deltoid cap, then a deliberate sleeve/forearm taper.
          center: [side * 0.25, 1.49, -0.002],
          radiusX: 0.118,
          radiusZ: 0.112,
          color: palette.tunic,
          skin: { bone: shoulderBone },
        },
        {
          center: [side * 0.305, 1.415, 0],
          radiusX: 0.105,
          radiusZ: 0.098,
          color: palette.tunic,
          skin: { bone: shoulderBone },
        },
        {
          center: [side * 0.325, 1.33, 0.004],
          radiusX: 0.09,
          radiusZ: 0.086,
          color: palette.linen,
          skin: { bone: shoulderBone },
        },
        {
          center: [side * 0.332, 1.21, 0.008],
          radiusX: 0.076,
          radiusZ: 0.073,
          color: palette.linenShadow,
          skin: { bone: shoulderBone, nextBone: elbowBone, blend: 0.7 },
        },
        {
          center: [side * 0.332, 1.13, 0.01],
          radiusX: 0.07,
          radiusZ: 0.066,
          color: palette.skinShadow,
          skin: { bone: elbowBone },
        },
        {
          center: [side * 0.332, 0.94, 0.014],
          radiusX: 0.058,
          radiusZ: 0.053,
          color: palette.skin,
          skin: { bone: elbowBone, nextBone: wristBone, blend: 0.55 },
        },
        {
          center: [side * 0.332, 0.84, 0.018],
          radiusX: 0.049,
          radiusZ: 0.045,
          color: palette.skin,
          skin: { bone: wristBone },
        },
      ],
      12,
      false,
    );
    bodyBuilder.addEllipsoid(
      [side * 0.332, 0.745, 0.032],
      [0.07, 0.11, 0.052],
      (normal) => (normal.y < -0.45 ? palette.skinShadow : palette.skin),
      { bone: wristBone },
      14,
      9,
      (position, normal) => {
        position.x += side * Math.max(0, -normal.y) * 0.01;
        return position;
      },
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
          center: [x, 0.67, 0],
          radiusX: 0.11,
          radiusZ: 0.108,
          color: palette.trousers,
          skin: { bone: hipBone },
        },
        {
          center: [x, 0.55, 0.01],
          radiusX: 0.094,
          radiusZ: 0.096,
          color: palette.trousers,
          skin: { bone: hipBone, nextBone: kneeBone, blend: 0.75 },
        },
        {
          center: [x, 0.47, 0.015],
          radiusX: 0.103,
          radiusZ: 0.101,
          color: palette.trousers,
          skin: { bone: kneeBone },
        },
        {
          center: [x, 0.29, 0.008],
          radiusX: 0.076,
          radiusZ: 0.074,
          color: palette.trousers,
          skin: { bone: kneeBone, nextBone: ankleBone, blend: 0.45 },
        },
        {
          center: [x, 0.18, 0.01],
          radiusX: 0.07,
          radiusZ: 0.069,
          color: palette.legWrap,
          skin: { bone: ankleBone },
        },
        {
          center: [x, 0.07, 0.025],
          radiusX: 0.075,
          radiusZ: 0.073,
          color: palette.leather,
          skin: { bone: ankleBone },
        },
      ],
      14,
    );
    bodyBuilder.addEllipsoid(
      [x, 0.065, 0.105],
      [0.09, 0.062, 0.145],
      palette.leatherDark,
      { bone: ankleBone },
      14,
      8,
      (position, normal) => {
        if (normal.z > 0.3) position.y += normal.z * 0.012;
        if (normal.y < -0.4) position.y = Math.max(position.y, 0.012);
        return position;
      },
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
  };
  addLeg(-1, boneIndex.leftHip, boneIndex.leftKnee, boneIndex.leftAnkle);
  addLeg(1, boneIndex.rightHip, boneIndex.rightKnee, boneIndex.rightAnkle);

  const headCenter = new Vector3(0, 1.81, 0.008);
  bodyBuilder.addEllipsoid(
    [headCenter.x, headCenter.y, headCenter.z],
    [0.145, 0.17, 0.145],
    (normal) => {
      if (
        normal.y > 0.5 ||
        (normal.z < -0.28 && normal.y > -0.2) ||
        (Math.abs(normal.x) > 0.72 && normal.y > 0.02)
      )
        return palette.hair;
      if (
        normal.y <
          -0.48 + Math.min(0.16, Math.abs(normal.x) * 0.2) &&
        normal.z > -0.18
      )
        return beardColor;
      return palette.skin;
    },
    { bone: boneIndex.head },
    24,
    26,
    (position, normal) => {
      const localY = (position.y - headCenter.y) / 0.165;
      if (localY < -0.18) {
        const jawTaper = 1 - (-localY - 0.18) * 0.2;
        position.x *= jawTaper;
      }
      if (normal.z > 0.45) {
        const x = position.x / 0.14;
        const noseY = (position.y - (headCenter.y + 0.008)) / 0.058;
        position.z +=
          Math.exp(-(x * x * 11 + noseY * noseY * 2.8)) * 0.04;
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
    [0, 1.81, 0.142],
    [0.034, 0.048, 0.056],
    (normal) => (normal.y < -0.45 ? palette.skinShadow : palette.skin),
    { bone: boneIndex.head },
    12,
    8,
  );
  for (const side of [-1, 1] as const) {
    // Recessed socket lip catches a shadow under brow/upper lid while rounded
    // eye volume remains in front. Both are one body draw/material.
    bodyBuilder.addEllipsoid(
      [side * 0.052, 1.825, 0.126],
      [0.05, 0.034, 0.019],
      (normal) => (normal.y > 0.35 ? palette.skinShadow : palette.skin),
      { bone: boneIndex.head },
      14,
      8,
    );
    bodyBuilder.addEllipsoid(
      [side * 0.076, 1.785, 0.108],
      [0.066, 0.062, 0.036],
      (normal) => (normal.y < -0.35 ? palette.skinShadow : palette.skin),
      { bone: boneIndex.head },
      14,
      9,
    );
    bodyBuilder.addTube(
      [
        [side * 0.082, 1.858, 0.139],
        [side * 0.052, 1.866, 0.15],
        [side * 0.018, 1.862, 0.15],
      ],
      0.008,
      palette.skinShadow,
      { bone: boneIndex.head },
      6,
    );
  }
  // Continuous nose bridge, alae, and tip keep face readable in profile
  // without a flat facial card. All forms remain skinned body islands.
  bodyBuilder.addEllipsoid(
    [0, 1.816, 0.148],
    [0.026, 0.056, 0.043],
    (normal) => (normal.z > 0.35 ? palette.skin : palette.skinShadow),
    { bone: boneIndex.head },
    12,
    8,
  );
  bodyBuilder.addEllipsoid(
    [0, 1.792, 0.178],
    [0.019, 0.019, 0.016],
    palette.skinShadow,
    { bone: boneIndex.head },
    10,
    6,
  );
  for (const side of [-1, 1] as const)
    bodyBuilder.addEllipsoid(
      [side * 0.018, 1.793, 0.174],
      [0.018, 0.014, 0.018],
      palette.skinShadow,
      { bone: boneIndex.head },
      10,
      6,
    );
  bodyBuilder.addEllipsoid(
    [0, 1.718, 0.11],
    [0.08, 0.064, 0.044],
    palette.skinShadow,
    { bone: boneIndex.head },
    14,
    8,
  );
  for (const side of [-1, 1] as const)
    bodyBuilder.addEllipsoid(
      [side * 0.14, 1.81, 0.002],
      [0.028, 0.06, 0.047],
      palette.skin,
      { bone: boneIndex.head },
      12,
      8,
    );
  bodyBuilder.addEllipsoid(
    [0, 1.748, 0.118],
    [0.09, 0.066, 0.043],
    beardColor,
    { bone: boneIndex.head },
    16,
    10,
    (position, normal) => {
      position.y -= Math.max(0, -normal.y) * 0.018;
      position.z += Math.max(0, -normal.y) * 0.008;
      return position;
    },
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
        center: [0, 1.89, 0.006],
        radiusX: 0.145,
        radiusZ: 0.145,
        color: palette.hair,
        skin: { bone: boneIndex.head },
      },
      {
        center: [0, 1.942, 0.005],
        radiusX: 0.118,
        radiusZ: 0.12,
        color: palette.hair,
        skin: { bone: boneIndex.head },
      },
      {
        center: [0, 1.985, 0.002],
        radiusX: 0.045,
        radiusZ: 0.05,
        color: palette.hair,
        skin: { bone: boneIndex.head },
      },
    ],
    18,
    "end",
  );
  for (const side of [-1, 1] as const)
    bodyBuilder.addTube(
      [
        [side * 0.112, 1.892, 0.09],
        [side * 0.14, 1.83, 0.102],
        [side * 0.13, 1.775, 0.086],
      ],
      0.018,
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
      [0.019, 0.015, 0.012],
      palette.iris,
      { bone: boneIndex.head },
      10,
      7,
    );
  for (const side of [-1, 1] as const) {
    bodyBuilder.addEllipsoid(
      [side * 0.052, 1.825, 0.169],
      [0.0075, 0.0085, 0.005],
      palette.pupil,
      { bone: boneIndex.head },
      8,
      5,
    );
    bodyBuilder.addEllipsoid(
      [side * 0.049, 1.829, 0.174],
      [0.003, 0.0035, 0.0018],
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
        [x - 0.019, 1.833, 0.153],
        [x + 0.019, 1.833, 0.153],
        [x + 0.016, 1.818, 0.156],
        [x - 0.016, 1.818, 0.156],
      ],
      palette.eyeWhite,
      { bone: boneIndex.head },
      { blink: [0, -0.012, 0.002] },
    );
    bodyBuilder.addPatch(
      [
        [x - 0.0065, 1.832, 0.157],
        [x + 0.0065, 1.832, 0.157],
        [x + 0.0065, 1.819, 0.159],
        [x - 0.0065, 1.819, 0.159],
      ],
      palette.iris,
      { bone: boneIndex.head },
      { blink: [0, -0.012, 0.002] },
    );
    bodyBuilder.addPatch(
      [
        [x - 0.029, 1.868, 0.145],
        [x + 0.028, 1.867, 0.146],
        [x + 0.026, 1.862, 0.147],
        [x - 0.027, 1.863, 0.146],
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
    ellipseLoop([0, 1.0, 0], [0.255, 0, 0.165], "xz", 28),
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

  // Continuous harness contact keeps burden visibly carried, not floating.
  for (const side of [-1, 1] as const)
    bodyBuilder.addTube(
      [
        [side * 0.215, 1.53, 0.14],
        [side * 0.195, 1.34, 0.18],
        [side * 0.17, 1.12, 0.18],
        [side * 0.15, 0.93, 0.15],
      ],
      0.026,
      palette.leather,
      { bone: boneIndex.chest, nextBone: boneIndex.pelvis, blend: 0.42 },
      7,
    );
  bodyBuilder.addTube(
    [
      [-0.27, 1.28, 0.175],
      [0, 1.25, 0.19],
      [0.27, 1.28, 0.175],
    ],
    0.022,
    palette.leather,
    { bone: boneIndex.chest },
    7,
  );

  const bodyGeometry = bodyBuilder.toGeometry("hero.authored.body.geometry");
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
      { center: [0, 1.68, 0], radiusX: 0.18, radiusZ: 0.145, color: palette.skin, skin: { bone: 0 } },
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
  const bodyFarMesh = new Mesh(
    bodyFarBuilder.toGeometry("hero.authored.body.far.geometry"),
    bodyMaterial,
  );
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
  burdenBuilder.addLoft(
    [
      {
        center: [-0.07, -0.52, -0.012],
        radiusX: 0.16,
        radiusZ: 0.13,
        color: palette.burdenShadow,
        skin: { bone: 0 },
      },
      {
        center: [-0.045, -0.4, -0.028],
        radiusX: 0.25,
        radiusZ: 0.18,
        color: burdenCloth,
        skin: { bone: 0 },
      },
      {
        center: [-0.02, -0.12, -0.038],
        radiusX: 0.31,
        radiusZ: 0.21,
        color: new Color(burdenCloth).lerp(new Color("#5a4637"), 0.18),
        skin: { bone: 0 },
      },
      {
        center: [0.02, 0.13, -0.025],
        radiusX: 0.3,
        radiusZ: 0.2,
        color: new Color(burdenCloth).lerp(new Color("#b19779"), 0.14),
        skin: { bone: 0 },
      },
      {
        center: [0.065, 0.36, -0.012],
        radiusX: 0.21,
        radiusZ: 0.16,
        color: burdenCloth,
        skin: { bone: 0 },
      },
      {
        center: [0.09, 0.43, -0.006],
        radiusX: 0.095,
        radiusZ: 0.095,
        color: palette.burdenShadow,
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
        Math.sin(position.y * 18 + position.x * 13 + normal.z * 2.4) * 0.014 +
        Math.cos(position.y * 7 - normal.x * 3.2) * 0.005;
      const sag = Math.sin(((ringIndex + 0.35) / 5) * Math.PI) * 0.016;
      position.x += fold * (0.45 + Math.abs(normal.x) * 0.55);
      position.z +=
        sag * (0.25 + Math.abs(normal.z) * 0.75) +
        Math.sin(position.y * 15 + normal.x * 3.1) * 0.01;
      return position;
    },
  );
  // Two offset stuffed lobes keep the load from reading as one rigid board.
  // They share the burden geometry/material budget while giving the cloth a
  // tied, asymmetrical shoulder silhouette from front, profile, and rear.
  for (const [x, y, rx, ry, rz, phase] of [
    [-0.115, 0.18, 0.17, 0.22, 0.155, 0.4],
    [0.12, 0.1, 0.16, 0.24, 0.165, 1.9],
  ] as const)
    burdenBuilder.addEllipsoid(
      [x, y, -0.04],
      [rx, ry, rz],
      (normal, position) => {
        position.x += Math.sin(position.y * 23 + phase) * 0.012;
        position.z += Math.sin(position.x * 18 + phase) * 0.012;
        return normal.y > 0.35
          ? burdenCloth
          : new Color(burdenCloth).lerp(new Color(palette.burdenShadow), 0.18);
      },
      { bone: 0 },
      20,
      14,
    );
  for (const [y, radiusX, radiusZ] of [
    [-0.25, 0.21, 0.19],
    [0.0, 0.25, 0.22],
    [0.2, 0.21, 0.19],
  ] as const)
    burdenBuilder.addTube(
      ellipseLoop([0, y, 0], [radiusX, 0, radiusZ], "xz", 30),
      0.011,
      palette.rope,
      { bone: 0 },
      5,
      true,
    );
  for (const x of [-0.095, 0.095])
    burdenBuilder.addTube(
      ellipseLoop([x, -0.01, 0], [0, 0.27, 0.19], "yz", 30),
      0.011,
      palette.rope,
      { bone: 0 },
      5,
      true,
    );
  for (const side of [-1, 1] as const)
    burdenBuilder.addTube(
      [
        [side * 0.1, 0.27, 0.01],
        [side * 0.14, 0.21, 0.1],
        [side * 0.16, 0.1, 0.15],
        [side * 0.14, -0.08, 0.13],
        [side * 0.17, -0.2, 0.1],
        [side * 0.14, -0.28, 0.03],
      ],
      0.014,
      palette.leather,
      { bone: 0 },
      6,
    );
  // Irregular cloth folds replace the old flat rear panel. The sack should
  // compress under the rope, not read as a shield bolted to Christian's back.
  for (const [x, top, bottom] of [
    [-0.12, 0.24, -0.26],
    [0.06, 0.28, -0.34],
    [0.15, 0.17, -0.21],
  ] as const)
    burdenBuilder.addTube(
      [
        [x, top, -0.21],
        [x + (x < 0 ? -0.022 : 0.016), (top + bottom) * 0.45, -0.235],
        [x + (x < 0 ? 0.012 : -0.014), bottom, -0.205],
      ],
      0.014,
      burdenFold,
      { bone: 0 },
      5,
    );
  burdenBuilder.addTube(
    [
      [0, 0.29, -0.25],
      [0.012, 0.08, -0.265],
      [-0.018, -0.18, -0.25],
      [0, -0.4, -0.215],
    ],
    0.012,
    palette.rope,
    { bone: 0 },
    5,
  );
  for (const [x, y] of [
    [-0.095, 0.01],
    [0.095, -0.02],
  ] as const)
    burdenBuilder.addEllipsoid(
      [x, y, -0.25],
      [0.038, 0.03, 0.025],
      palette.rope,
      { bone: 0 },
      8,
      6,
    );
  // Rear harness stays proud of cloth surface so burden contact reads from
  // gameplay camera and turnaround back view.
  for (const side of [-1, 1] as const)
    burdenBuilder.addTube(
      [
        [side * 0.19, 0.34, -0.18],
        [side * 0.23, 0.14, -0.22],
        [side * 0.24, -0.14, -0.22],
        [side * 0.2, -0.38, -0.18],
      ],
      0.018,
      palette.leather,
      { bone: 0 },
      6,
    );
  burdenBuilder.addTube(
    [
      [-0.27, 0.12, -0.22],
      [0, 0.08, -0.24],
      [0.27, 0.12, -0.22],
    ],
    0.018,
    palette.rope,
    { bone: 0 },
    6,
  );
  const burdenGeometry = burdenBuilder.toGeometry(
    "hero.authored.burden.geometry",
  );
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
      { center: [-0.035, -0.48, -0.01], radiusX: 0.14, radiusZ: 0.1, color: palette.burdenShadow, skin: { bone: 0 } },
      { center: [0, -0.18, -0.02], radiusX: 0.25, radiusZ: 0.16, color: burdenCloth, skin: { bone: 0 } },
      { center: [0.025, 0.16, -0.015], radiusX: 0.24, radiusZ: 0.15, color: burdenCloth, skin: { bone: 0 } },
      { center: [0.05, 0.38, -0.01], radiusX: 0.16, radiusZ: 0.1, color: palette.burdenShadow, skin: { bone: 0 } },
    ],
    8,
  );
  const burdenFarMesh = new Mesh(
    burdenFarBuilder.toGeometry("hero.authored.burden.far.geometry"),
    burdenMaterial,
  );
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
  burdenVisual.position.set(0, -0.1, -0.08);
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
