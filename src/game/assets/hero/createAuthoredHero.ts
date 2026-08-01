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
      radiusX: 0.3,
      radiusZ: 0.155,
      color: palette.tunicShadow,
      skin: { bone: boneIndex.pelvis },
    },
    {
      center: [0, 0.86, 0.006],
      radiusX: 0.29,
      radiusZ: 0.16,
      color: palette.tunic,
      skin: { bone: boneIndex.pelvis },
    },
    {
      center: [0, 1.05, 0],
      radiusX: 0.235,
      radiusZ: 0.14,
      color: palette.tunic,
      skin: { bone: boneIndex.pelvis, nextBone: boneIndex.spine, blend: 0.4 },
    },
    {
      center: [0, 1.24, 0],
      radiusX: 0.3,
      radiusZ: 0.16,
      color: palette.tunic,
      skin: { bone: boneIndex.spine, nextBone: boneIndex.chest, blend: 0.45 },
    },
    {
      center: [0, 1.43, -0.002],
      radiusX: 0.33,
      radiusZ: 0.18,
      color: palette.tunic,
      skin: { bone: boneIndex.chest },
    },
    {
      center: [0, 1.5, -0.004],
      radiusX: 0.34,
      radiusZ: 0.175,
      color: palette.tunic,
      skin: { bone: boneIndex.chest },
    },
    {
      center: [0, 1.555, -0.002],
      radiusX: 0.185,
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
    ellipseLoop([0, 0.74, 0], [0.29, 0, 0.16], "xz", 20),
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
        [x, 0.78, 0.16],
        [x + bend, 1.05, 0.17],
        [x - bend * 0.5, 1.32, 0.17],
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
    const x = side * 0.29;
    bodyBuilder.addLoft(
      [
        {
          center: [side * 0.245, 1.49, -0.002],
          radiusX: 0.13,
          radiusZ: 0.12,
          color: palette.tunic,
          skin: { bone: shoulderBone },
        },
        {
          center: [side * 0.305, 1.41, 0],
          radiusX: 0.112,
          radiusZ: 0.105,
          color: palette.tunic,
          skin: { bone: shoulderBone },
        },
        {
          center: [side * 0.325, 1.33, 0.004],
          radiusX: 0.102,
          radiusZ: 0.096,
          color: palette.linen,
          skin: { bone: shoulderBone },
        },
        {
          center: [side * 0.332, 1.21, 0.008],
          radiusX: 0.085,
          radiusZ: 0.082,
          color: palette.linenShadow,
          skin: { bone: shoulderBone, nextBone: elbowBone, blend: 0.7 },
        },
        {
          center: [side * 0.332, 1.13, 0.01],
          radiusX: 0.078,
          radiusZ: 0.074,
          color: palette.skinShadow,
          skin: { bone: elbowBone },
        },
        {
          center: [side * 0.332, 0.94, 0.014],
          radiusX: 0.066,
          radiusZ: 0.06,
          color: palette.skin,
          skin: { bone: elbowBone, nextBone: wristBone, blend: 0.55 },
        },
        {
          center: [side * 0.332, 0.84, 0.018],
          radiusX: 0.058,
          radiusZ: 0.052,
          color: palette.skin,
          skin: { bone: wristBone },
        },
      ],
      12,
      false,
    );
    bodyBuilder.addEllipsoid(
      [side * 0.332, 0.745, 0.032],
      [0.064, 0.105, 0.047],
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
          radiusX: 0.14,
          radiusZ: 0.13,
          color: palette.trousers,
          skin: { bone: hipBone },
        },
        {
          center: [x, 0.67, 0],
          radiusX: 0.125,
          radiusZ: 0.12,
          color: palette.trousers,
          skin: { bone: hipBone },
        },
        {
          center: [x, 0.55, 0.01],
          radiusX: 0.105,
          radiusZ: 0.105,
          color: palette.trousers,
          skin: { bone: hipBone, nextBone: kneeBone, blend: 0.75 },
        },
        {
          center: [x, 0.47, 0.015],
          radiusX: 0.112,
          radiusZ: 0.108,
          color: palette.trousers,
          skin: { bone: kneeBone },
        },
        {
          center: [x, 0.29, 0.008],
          radiusX: 0.09,
          radiusZ: 0.085,
          color: palette.trousers,
          skin: { bone: kneeBone, nextBone: ankleBone, blend: 0.45 },
        },
        {
          center: [x, 0.18, 0.01],
          radiusX: 0.092,
          radiusZ: 0.088,
          color: palette.legWrap,
          skin: { bone: ankleBone },
        },
        {
          center: [x, 0.07, 0.025],
          radiusX: 0.085,
          radiusZ: 0.08,
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
  };
  addLeg(-1, boneIndex.leftHip, boneIndex.leftKnee, boneIndex.leftAnkle);
  addLeg(1, boneIndex.rightHip, boneIndex.rightKnee, boneIndex.rightAnkle);

  const headCenter = new Vector3(0, 1.805, 0.006);
  bodyBuilder.addEllipsoid(
    [headCenter.x, headCenter.y, headCenter.z],
    [0.132, 0.16, 0.132],
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
      const localY = (position.y - headCenter.y) / 0.155;
      if (localY < -0.18) {
        const jawTaper = 1 - (-localY - 0.18) * 0.16;
        position.x *= jawTaper;
      }
      if (normal.z > 0.45) {
        const x = position.x / 0.13;
        const noseY = (position.y - (headCenter.y + 0.012)) / 0.055;
        position.z +=
          Math.exp(-(x * x * 11 + noseY * noseY * 2.8)) * 0.032;
        const cheekY = (position.y - (headCenter.y - 0.015)) / 0.07;
        position.z +=
          Math.exp(-((Math.abs(x) - 0.46) ** 2 * 12 + cheekY * cheekY * 2)) *
          0.012;
      }
      return position;
    },
  );

  // Sculpted facial volume stays in same skinned body draw. These embedded
  // forms replace flat mask-like patches at gameplay distance: ears, nose,
  // beard plane, brow ridge, and a tapered hair cap give face readable light.
  bodyBuilder.addEllipsoid(
    [0, 1.807, 0.137],
    [0.031, 0.045, 0.052],
    (normal) => (normal.y < -0.45 ? palette.skinShadow : palette.skin),
    { bone: boneIndex.head },
    12,
    8,
  );
  for (const side of [-1, 1] as const)
    bodyBuilder.addEllipsoid(
      [side * 0.131, 1.805, 0.002],
      [0.028, 0.06, 0.047],
      palette.skin,
      { bone: boneIndex.head },
      12,
      8,
    );
  bodyBuilder.addEllipsoid(
    [0, 1.758, 0.114],
    [0.087, 0.076, 0.036],
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
  bodyBuilder.addLoft(
    [
      {
        center: [0, 1.89, 0.006],
        radiusX: 0.132,
        radiusZ: 0.132,
        color: palette.hair,
        skin: { bone: boneIndex.head },
      },
      {
        center: [0, 1.942, 0.005],
        radiusX: 0.108,
        radiusZ: 0.112,
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
        [side * 0.105, 1.886, 0.09],
        [side * 0.128, 1.83, 0.102],
        [side * 0.12, 1.78, 0.086],
      ],
      0.018,
      palette.hair,
      { bone: boneIndex.head },
      6,
    );
  for (const side of [-1, 1] as const)
    bodyBuilder.addTube(
      [
        [side * 0.075, 1.866, 0.137],
        [side * 0.045, 1.873, 0.146],
        [side * 0.015, 1.868, 0.147],
      ],
      0.008,
      palette.hair,
      { bone: boneIndex.head },
      5,
    );
  for (const side of [-1, 1] as const)
    bodyBuilder.addEllipsoid(
      [side * 0.047, 1.831, 0.149],
      [0.015, 0.017, 0.009],
      palette.iris,
      { bone: boneIndex.head },
      10,
      7,
    );

  for (const side of [-1, 1] as const) {
    const x = side * 0.047;
    bodyBuilder.addPatch(
      [
        [x - 0.018, 1.838, 0.143],
        [x + 0.018, 1.838, 0.143],
        [x + 0.016, 1.823, 0.146],
        [x - 0.016, 1.823, 0.146],
      ],
      palette.eyeWhite,
      { bone: boneIndex.head },
      { blink: [0, -0.012, 0.002] },
    );
    bodyBuilder.addPatch(
      [
        [x - 0.006, 1.837, 0.147],
        [x + 0.006, 1.837, 0.147],
        [x + 0.006, 1.824, 0.149],
        [x - 0.006, 1.824, 0.149],
      ],
      palette.iris,
      { bone: boneIndex.head },
      { blink: [0, -0.012, 0.002] },
    );
    bodyBuilder.addPatch(
      [
        [x - 0.027, 1.868, 0.136],
        [x + 0.026, 1.867, 0.137],
        [x + 0.024, 1.862, 0.138],
        [x - 0.025, 1.863, 0.137],
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
      [-0.038, 1.764, 0.139],
      [0.038, 1.764, 0.139],
      [0.032, 1.757, 0.14],
      [-0.032, 1.757, 0.14],
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
      { center: [0, 0.72, 0], radiusX: 0.2, radiusZ: 0.14, color: palette.tunicShadow, skin: { bone: 0 } },
      { center: [0, 1.12, 0], radiusX: 0.28, radiusZ: 0.18, color: palette.tunic, skin: { bone: 0 } },
      { center: [0, 1.52, 0], radiusX: 0.3, radiusZ: 0.19, color: palette.tunic, skin: { bone: 0 } },
      { center: [0, 1.66, 0], radiusX: 0.17, radiusZ: 0.14, color: palette.skin, skin: { bone: 0 } },
    ],
    8,
  );
  for (const side of [-1, 1] as const) {
    bodyFarBuilder.addLoft(
      [
        { center: [side * 0.13, 0.64, 0], radiusX: 0.1, radiusZ: 0.09, color: palette.trousers, skin: { bone: 0 } },
        { center: [side * 0.13, 0.28, 0], radiusX: 0.085, radiusZ: 0.08, color: palette.trousers, skin: { bone: 0 } },
        { center: [side * 0.13, 0.08, 0.02], radiusX: 0.082, radiusZ: 0.078, color: palette.leather, skin: { bone: 0 } },
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
  const backBurden = socket("backBurden", chest, [0, 0.08, -0.16]);
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
        center: [-0.07, -0.52, 0.008],
        radiusX: 0.23,
        radiusZ: 0.18,
        color: palette.burdenShadow,
        skin: { bone: 0 },
      },
      {
        center: [-0.045, -0.4, 0.012],
        radiusX: 0.34,
        radiusZ: 0.24,
        color: burdenCloth,
        skin: { bone: 0 },
      },
      {
        center: [-0.02, -0.12, -0.018],
        radiusX: 0.4,
        radiusZ: 0.29,
        color: new Color(burdenCloth).lerp(new Color("#5a4637"), 0.18),
        skin: { bone: 0 },
      },
      {
        center: [0.02, 0.13, 0.006],
        radiusX: 0.38,
        radiusZ: 0.28,
        color: new Color(burdenCloth).lerp(new Color("#b19779"), 0.14),
        skin: { bone: 0 },
      },
      {
        center: [0.065, 0.36, 0.014],
        radiusX: 0.28,
        radiusZ: 0.22,
        color: burdenCloth,
        skin: { bone: 0 },
      },
      {
        center: [0.09, 0.43, 0.018],
        radiusX: 0.13,
        radiusZ: 0.13,
        color: palette.burdenShadow,
        skin: { bone: 0 },
      },
    ],
    22,
  );
  for (const [y, radiusX, radiusZ] of [
    [-0.25, 0.25, 0.22],
    [0.0, 0.3, 0.26],
    [0.2, 0.25, 0.22],
  ] as const)
    burdenBuilder.addTube(
      ellipseLoop([0, y, 0], [radiusX, 0, radiusZ], "xz", 26),
      0.009,
      palette.rope,
      { bone: 0 },
      5,
      true,
    );
  for (const x of [-0.115, 0.115])
    burdenBuilder.addTube(
      ellipseLoop([x, -0.01, 0], [0, 0.31, 0.22], "yz", 28),
      0.009,
      palette.rope,
      { bone: 0 },
      5,
      true,
    );
  for (const side of [-1, 1] as const)
    burdenBuilder.addTube(
      [
        [side * 0.12, 0.29, 0.01],
        [side * 0.17, 0.22, 0.11],
        [side * 0.18, 0.1, 0.17],
        [side * 0.16, -0.08, 0.15],
        [side * 0.2, -0.2, 0.11],
        [side * 0.17, -0.29, 0.03],
      ],
      0.014,
      palette.leather,
      { bone: 0 },
      6,
    );
  // Irregular cloth folds replace the old flat rear panel. The sack should
  // compress under the rope, not read as a shield bolted to Christian's back.
  for (const [x, top, bottom] of [
    [-0.15, 0.26, -0.28],
    [0.08, 0.3, -0.36],
    [0.19, 0.18, -0.22],
  ] as const)
    burdenBuilder.addTube(
      [
        [x, top, -0.24],
        [x + (x < 0 ? -0.018 : 0.014), (top + bottom) * 0.45, -0.255],
        [x + (x < 0 ? 0.01 : -0.012), bottom, -0.23],
      ],
      0.012,
      palette.burdenShadow,
      { bone: 0 },
      5,
    );
  burdenBuilder.addTube(
    [
      [0, 0.31, -0.285],
      [0.01, 0.08, -0.295],
      [-0.015, -0.18, -0.285],
      [0, -0.41, -0.24],
    ],
    0.012,
    palette.rope,
    { bone: 0 },
    5,
  );
  // Rear harness stays proud of cloth surface so burden contact reads from
  // gameplay camera and turnaround back view.
  for (const side of [-1, 1] as const)
    burdenBuilder.addTube(
      [
        [side * 0.24, 0.36, -0.22],
        [side * 0.29, 0.14, -0.27],
        [side * 0.3, -0.14, -0.27],
        [side * 0.24, -0.4, -0.22],
      ],
      0.018,
      palette.leather,
      { bone: 0 },
      6,
    );
  burdenBuilder.addTube(
    [
      [-0.34, 0.12, -0.27],
      [0, 0.08, -0.29],
      [0.34, 0.12, -0.27],
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
      { center: [0, -0.48, 0], radiusX: 0.2, radiusZ: 0.13, color: palette.burdenShadow, skin: { bone: 0 } },
      { center: [0.02, -0.18, 0], radiusX: 0.34, radiusZ: 0.21, color: burdenCloth, skin: { bone: 0 } },
      { center: [0.05, 0.16, 0], radiusX: 0.31, radiusZ: 0.2, color: burdenCloth, skin: { bone: 0 } },
      { center: [0.08, 0.38, 0], radiusX: 0.17, radiusZ: 0.13, color: palette.burdenShadow, skin: { bone: 0 } },
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
  burdenVisual.position.set(0, -0.1, -0.035);
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
