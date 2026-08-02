import {
  BoxGeometry,
  CapsuleGeometry,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  LOD,
  Mesh,
  Object3D,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type Material,
  type Texture,
} from "three";
import { createHeroAnimator } from "./animation";
import { createHeroExpressionController } from "./expressions";
import { createHeroMaterials } from "./materials";
import {
  createBoxLod,
  createCapsuleLod,
  createCylinderBetween,
  createEllipsoidLod,
  createHeroLod,
  createHeroMesh,
  createHeroRandom,
  createIrregularClothGeometry,
  createRopeCurve,
  createRopeLoop,
  createTorsoLod,
  namedGroup,
  type HeroDetailLevel,
} from "./procedural";
import { resolveHeroSpec } from "./spec";
import type {
  HeroAttachment,
  HeroCollider,
  HeroExpressionChannel,
  HeroFactoryOptions,
  HeroMaterialId,
  HeroPivotId,
  HeroRuntime,
  HeroSculptRuntimeMetadata,
  HeroSocketId,
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

function setTransform(
  object: Object3D,
  position: HeroVec3,
  rotation: HeroVec3 = [0, 0, 0],
) {
  object.position.fromArray(position);
  object.rotation.fromArray(rotation);
  return object;
}

function materialOf(
  materials: Record<HeroMaterialId, Material>,
  id: HeroMaterialId,
) {
  return materials[id];
}

function createLegacyPilgrimHero(
  options: HeroFactoryOptions = {},
): HeroRuntime {
  const spec = resolveHeroSpec(options.spec, options.seed);
  const { anatomy, face, outfit, lod } = spec;
  const materials = createHeroMaterials(spec.palette);
  const root = namedGroup(`hero.root.${spec.id}`);
  root.userData.heroAsset = true;
  root.userData.referenceId = spec.referenceId;

  const pivots = {} as Record<HeroPivotId, Group>;
  const lods = new Map<string, LOD>();
  const registerLod = (id: string, parent: Object3D, object: LOD) => {
    lods.set(id, object);
    parent.add(object);
    return object;
  };
  const createPivot = (
    id: HeroPivotId,
    parent: Object3D,
    position: HeroVec3 = [0, 0, 0],
  ) => {
    const pivot = namedGroup(`hero.pivot.${id}`);
    pivot.userData.heroPivot = id;
    pivot.position.fromArray(position);
    parent.add(pivot);
    pivots[id] = pivot;
    return pivot;
  };

  const hipHeight =
    anatomy.ankleHeight + anatomy.shinLength + anatomy.thighLength;
  const motionRoot = createPivot("motion", root);
  const pelvis = createPivot("pelvis", motionRoot, [0, hipHeight, 0]);
  const spine = createPivot("spine", pelvis);
  const chest = createPivot("chest", spine, [
    0,
    anatomy.torsoLength * 0.62,
    0,
  ]);
  const neck = createPivot("neck", chest, [
    0,
    anatomy.torsoLength * 0.38,
    0,
  ]);
  const head = createPivot("head", neck, [0, anatomy.neckLength, 0]);
  const jaw = createPivot("jaw", head, [
    0,
    anatomy.headHeight * 0.235,
    anatomy.headDepth * 0.06,
  ]);

  const shoulderY = anatomy.torsoLength * 0.28;
  const leftShoulder = createPivot("leftShoulder", chest, [
    -anatomy.shoulderWidth * 0.5,
    shoulderY,
    0,
  ]);
  const rightShoulder = createPivot("rightShoulder", chest, [
    anatomy.shoulderWidth * 0.5,
    shoulderY,
    0,
  ]);
  const leftElbow = createPivot("leftElbow", leftShoulder, [
    0,
    -anatomy.upperArmLength,
    0,
  ]);
  const rightElbow = createPivot("rightElbow", rightShoulder, [
    0,
    -anatomy.upperArmLength,
    0,
  ]);
  const leftWrist = createPivot("leftWrist", leftElbow, [
    0,
    -anatomy.forearmLength,
    0,
  ]);
  const rightWrist = createPivot("rightWrist", rightElbow, [
    0,
    -anatomy.forearmLength,
    0,
  ]);

  const leftHip = createPivot("leftHip", pelvis, [
    -anatomy.hipWidth * 0.5,
    0,
    0,
  ]);
  const rightHip = createPivot("rightHip", pelvis, [
    anatomy.hipWidth * 0.5,
    0,
    0,
  ]);
  const leftKnee = createPivot("leftKnee", leftHip, [
    0,
    -anatomy.thighLength,
    0,
  ]);
  const rightKnee = createPivot("rightKnee", rightHip, [
    0,
    -anatomy.thighLength,
    0,
  ]);
  const leftAnkle = createPivot("leftAnkle", leftKnee, [
    0,
    -anatomy.shinLength,
    0,
  ]);
  const rightAnkle = createPivot("rightAnkle", rightKnee, [
    0,
    -anatomy.shinLength,
    0,
  ]);

  // Torso silhouette: tapered adult ribcage, sleeveless rust tunic, lower skirt.
  registerLod(
    "torso",
    spine,
    createTorsoLod(
      "torso",
      anatomy.torsoLength,
      anatomy.shoulderWidth * 0.47,
      anatomy.hipWidth * 0.62,
      0.62,
      materialOf(materials, "tunic"),
      lod,
    ),
  );
  registerLod(
    "shoulderYoke",
    chest,
    createCapsuleLod(
      "shoulderYoke",
      anatomy.shoulderWidth * 0.82,
      0.105,
      materialOf(materials, "tunic"),
      lod,
      {
        position: [0, shoulderY, 0],
        rotation: [0, 0, Math.PI * 0.5],
        scale: [1, 1, 0.72],
      },
    ),
  );

  const tunicSkirtLength = Math.max(0.16, hipHeight - outfit.tunicHemHeight);
  registerLod(
    "tunicSkirt",
    spine,
    createHeroLod("tunicSkirt", lod, (detail) => {
      const radial = detail === "high" ? 24 : detail === "medium" ? 16 : 10;
      const mesh = createHeroMesh(
        `hero.mesh.tunicSkirt.${detail}`,
        new CylinderGeometry(
          anatomy.hipWidth * 0.66,
          anatomy.hipWidth * 0.78,
          tunicSkirtLength,
          radial,
          detail === "high" ? 3 : 1,
        ),
        materialOf(materials, "tunic"),
      );
      mesh.position.y = -tunicSkirtLength * 0.5;
      mesh.scale.z = 0.69;
      return mesh;
    }),
  );

  const tatterGroup = namedGroup("hero.detail.tunic-tattered-hem");
  spine.add(tatterGroup);
  const tatterRandom = createHeroRandom(`${spec.seed}:tunic-hem`);
  for (let index = 0; index < 9; index += 1) {
    const x = -anatomy.hipWidth * 0.31 + index * anatomy.hipWidth * 0.078;
    const length = 0.022 + tatterRandom() * 0.03;
    const tatter = createHeroMesh(
      `hero.mesh.tunic-tatter.${index}`,
      new ConeGeometry(0.026, length, 3),
      materialOf(materials, index % 3 === 0 ? "tunicShadow" : "tunic"),
    );
    tatter.position.set(
      x,
      -tunicSkirtLength - length * 0.32,
      anatomy.hipWidth * 0.25,
    );
    tatter.rotation.z = (tatterRandom() - 0.5) * 0.22;
    tatterGroup.add(tatter);
  }

  // Linen V-neck and stitched lacing remain independent detail parts.
  const collar = namedGroup("hero.detail.linen-collar");
  collar.position.set(0, anatomy.torsoLength * 0.86, anatomy.headDepth * 0.43);
  spine.add(collar);
  for (const side of [-1, 1] as const) {
    const strip = createHeroMesh(
      `hero.mesh.collar.${side < 0 ? "left" : "right"}`,
      new CapsuleGeometry(0.018, 0.13, 5, 9),
      materialOf(materials, "linen"),
    );
    strip.position.set(side * 0.055, -0.02, 0);
    strip.rotation.z = side * 0.47;
    collar.add(strip);
  }
  for (let index = 0; index < 3; index += 1) {
    const lace = createCylinderBetween(
      `hero.mesh.collar-lace.${index}`,
      [-0.035 + index * 0.005, -0.035 - index * 0.038, 0.018],
      [0.035 - index * 0.005, -0.035 - index * 0.038, 0.018],
      0.004,
      materialOf(materials, "leatherDark"),
      6,
    );
    collar.add(lace);
  }

  const tunicFolds = namedGroup("hero.detail.tunic-folds");
  spine.add(tunicFolds);
  for (let index = 0; index < 5; index += 1) {
    const x = (index - 2) * anatomy.hipWidth * 0.105;
    const fold = createHeroMesh(
      `hero.mesh.tunic-fold.${index}`,
      new CapsuleGeometry(0.0055, 0.24 - Math.abs(index - 2) * 0.018, 4, 7),
      materialOf(
        materials,
        index % 2 === 0 ? "tunicShadow" : "tunic",
      ),
    );
    fold.position.set(
      x,
      anatomy.torsoLength * 0.36,
      anatomy.headDepth * 0.455 + Math.abs(x) * 0.08,
    );
    fold.scale.z = 0.5;
    fold.rotation.z = (index - 2) * 0.025;
    tunicFolds.add(fold);
  }
  for (const side of [-1, 1] as const) {
    const hemFold = createHeroMesh(
      `hero.mesh.tunic-hem-fold.${side}`,
      new CapsuleGeometry(0.006, tunicSkirtLength * 0.64, 4, 7),
      materialOf(materials, "tunicShadow"),
    );
    hemFold.position.set(
      side * anatomy.hipWidth * 0.24,
      -tunicSkirtLength * 0.48,
      anatomy.hipWidth * 0.27,
    );
    hemFold.rotation.z = side * 0.035;
    tunicFolds.add(hemFold);
  }

  const beltY = outfit.beltHeight - hipHeight;
  const belt = createHeroMesh(
    "hero.mesh.waist-belt",
    new CylinderGeometry(
      anatomy.hipWidth * 0.7,
      anatomy.hipWidth * 0.7,
      0.075,
      24,
      1,
    ),
    materialOf(materials, "leather"),
  );
  belt.position.set(0, beltY, 0);
  belt.scale.z = 0.69;
  spine.add(belt);
  const beltBuckle = createHeroMesh(
    "hero.mesh.waist-buckle",
    new TorusGeometry(0.052, 0.009, 6, 14),
    materialOf(materials, "brass"),
  );
  beltBuckle.position.set(0.025, beltY, anatomy.hipWidth * 0.48);
  spine.add(beltBuckle);

  // Neck is a joint-rooted capsule, embedded into torso and head.
  registerLod(
    "neck",
    neck,
    createCapsuleLod(
      "neck",
      anatomy.neckLength + 0.055,
      anatomy.headWidth * 0.27,
      materialOf(materials, "skin"),
      lod,
      { position: [0, anatomy.neckLength * 0.38, 0] },
    ),
  );

  // Adult head mass uses the measured near-seven-head-unit turnaround.
  registerLod(
    "head",
    head,
    createEllipsoidLod(
      "head",
      [
        anatomy.headWidth * 0.5,
        anatomy.headHeight * 0.5,
        anatomy.headDepth * 0.5,
      ],
      materialOf(materials, "skin"),
      lod,
      { position: [0, anatomy.headHeight * 0.5, 0] },
    ),
  );
  registerLod(
    "jaw",
    jaw,
    createEllipsoidLod(
      "jaw",
      [
        anatomy.headWidth * 0.38,
        anatomy.headHeight * 0.19,
        anatomy.headDepth * 0.28,
      ],
      materialOf(materials, "skinShadow"),
      lod,
      { position: [0, 0.008, 0.022] },
    ),
  );

  const eyeY = anatomy.headHeight * (1 - face.eyeLine);
  const eyeX = anatomy.headWidth * 0.285;
  const faceZ = anatomy.headDepth * 0.49;
  const faceDetailHigh = namedGroup("hero.face.high");
  const faceDetailMedium = namedGroup("hero.face.medium");
  const faceDetailLow = namedGroup("hero.face.low");
  const leftBrow = namedGroup("hero.face.leftBrow");
  const rightBrow = namedGroup("hero.face.rightBrow");
  const leftLid = namedGroup("hero.face.leftLid");
  const rightLid = namedGroup("hero.face.rightLid");
  const leftMouthCorner = namedGroup("hero.face.leftMouthCorner");
  const rightMouthCorner = namedGroup("hero.face.rightMouthCorner");
  const lowerLip = namedGroup("hero.face.lowerLip");
  faceDetailHigh.add(
    leftBrow,
    rightBrow,
    leftLid,
    rightLid,
    leftMouthCorner,
    rightMouthCorner,
    lowerLip,
  );

  for (const side of [-1, 1] as const) {
    const cheek = createHeroMesh(
      `hero.mesh.cheek.${side}`,
      new SphereGeometry(1, 14, 10),
      materialOf(materials, "skin"),
    );
    cheek.position.set(
      side * anatomy.headWidth * 0.215,
      anatomy.headHeight * 0.39,
      faceZ + 0.002,
    );
    cheek.scale.set(
      anatomy.headWidth * 0.17,
      anatomy.headHeight * 0.115,
      anatomy.headDepth * 0.085,
    );
    faceDetailHigh.add(cheek);
  }

  for (const side of [-1, 1] as const) {
    const eyeGroup = namedGroup(
      `hero.face.${side < 0 ? "left" : "right"}Eye`,
    );
    eyeGroup.position.set(side * eyeX, eyeY, faceZ);
    const sclera = createHeroMesh(
      `hero.mesh.eye-sclera.${side}`,
      new SphereGeometry(1, 16, 12),
      materialOf(materials, "eyeWhite"),
      false,
    );
    sclera.scale.set(0.029, 0.014, 0.01);
    eyeGroup.add(sclera);
    const iris = createHeroMesh(
      `hero.mesh.eye-iris.${side}`,
      new CircleGeometry(0.0085, 16),
      materialOf(materials, "iris"),
      false,
    );
    iris.position.z = 0.009;
    eyeGroup.add(iris);
    const pupil = createHeroMesh(
      `hero.mesh.eye-pupil.${side}`,
      new CircleGeometry(0.0039, 12),
      materialOf(materials, "pupil"),
      false,
    );
    pupil.position.z = 0.0097;
    eyeGroup.add(pupil);
    const catchlight = createHeroMesh(
      `hero.mesh.eye-catchlight.${side}`,
      new CircleGeometry(0.0016, 8),
      materialOf(materials, "catchlight"),
      false,
    );
    catchlight.position.set(-0.0018, 0.0024, 0.0102);
    eyeGroup.add(catchlight);
    faceDetailHigh.add(eyeGroup);

    const mediumEye = createHeroMesh(
      `hero.mesh.eye-medium.${side}`,
      new SphereGeometry(1, 10, 7),
      materialOf(materials, "pupil"),
      false,
    );
    mediumEye.position.set(side * eyeX, eyeY, faceZ + 0.002);
    mediumEye.scale.set(0.018, 0.009, 0.006);
    faceDetailMedium.add(mediumEye);

    const lid = side < 0 ? leftLid : rightLid;
    lid.position.set(side * eyeX, eyeY + 0.01, faceZ + 0.011);
    const lidMesh = createHeroMesh(
      `hero.mesh.eyelid.${side}`,
      new CapsuleGeometry(0.0026, 0.036, 4, 8),
      materialOf(materials, "skinShadow"),
      false,
    );
    lidMesh.rotation.z = Math.PI * 0.5;
    lid.add(lidMesh);

    const brow = side < 0 ? leftBrow : rightBrow;
    brow.position.set(side * eyeX, eyeY + 0.035, faceZ + 0.011);
    brow.rotation.z = side < 0 ? face.browTilt : -face.browTilt;
    const browMesh = createHeroMesh(
      `hero.mesh.eyebrow.${side}`,
      new CapsuleGeometry(0.005, 0.038, 4, 8),
      materialOf(materials, "hair"),
      false,
    );
    browMesh.rotation.z = Math.PI * 0.5;
    brow.add(browMesh);
  }

  const noseY = anatomy.headHeight * (1 - face.noseBase);
  const noseBridge = createHeroMesh(
    "hero.mesh.nose-bridge",
    new CapsuleGeometry(0.009, 0.032, 5, 9),
    materialOf(materials, "skinShadow"),
  );
  noseBridge.position.set(0, (eyeY + noseY) * 0.5, faceZ + 0.007);
  faceDetailHigh.add(noseBridge);
  const noseTip = createHeroMesh(
    "hero.mesh.nose-tip",
    new SphereGeometry(1, 12, 9),
    materialOf(materials, "skinShadow"),
  );
  noseTip.position.set(0, noseY + 0.004, faceZ + 0.017);
  noseTip.scale.set(0.015, 0.012, 0.019);
  faceDetailHigh.add(noseTip);
  const noseMedium = noseTip.clone();
  noseMedium.name = "hero.mesh.nose.medium";
  noseMedium.scale.multiplyScalar(0.9);
  faceDetailMedium.add(noseMedium);

  const mouthY = anatomy.headHeight * (1 - face.mouthLine);
  const mouthCenter = createHeroMesh(
    "hero.mesh.mouth-center",
    new CapsuleGeometry(0.004, 0.042, 4, 8),
    materialOf(materials, "mouth"),
    false,
  );
  mouthCenter.position.set(0, mouthY, faceZ + 0.015);
  mouthCenter.rotation.z = Math.PI * 0.5;
  faceDetailHigh.add(mouthCenter);
  for (const [side, corner] of [
    [-1, leftMouthCorner],
    [1, rightMouthCorner],
  ] as const) {
    corner.position.set(side * 0.027, mouthY, faceZ + 0.016);
    const mesh = createHeroMesh(
      `hero.mesh.mouth-corner.${side}`,
      new SphereGeometry(0.005, 8, 6),
      materialOf(materials, "mouth"),
      false,
    );
    corner.add(mesh);
  }
  lowerLip.position.set(0, mouthY - 0.008, faceZ + 0.015);
  const lowerLipMesh = createHeroMesh(
    "hero.mesh.lower-lip",
    new CapsuleGeometry(0.0035, 0.035, 4, 8),
    materialOf(materials, "mouth"),
    false,
  );
  lowerLipMesh.rotation.z = Math.PI * 0.5;
  lowerLip.add(lowerLipMesh);

  const mediumMouth = createHeroMesh(
    "hero.mesh.mouth.medium",
    new CapsuleGeometry(0.004, 0.04, 3, 6),
    materialOf(materials, "mouth"),
    false,
  );
  mediumMouth.position.set(0, mouthY, faceZ + 0.012);
  mediumMouth.rotation.z = Math.PI * 0.5;
  faceDetailMedium.add(mediumMouth);

  const faceLod = new LOD();
  faceLod.name = "hero.lod.faceDetails";
  faceLod.addLevel(faceDetailHigh, lod.highDistance);
  faceLod.userData.heroLod = {
    id: "faceDetails",
    distances: [lod.highDistance, lod.mediumDistance, lod.lowDistance],
  };
  registerLod("faceDetails", head, faceLod);

  // Ears follow measured eye-to-nose vertical bracket.
  for (const side of [-1, 1] as const) {
    const earY =
      anatomy.headHeight *
      (1 - (face.earTop + face.earBottom) * 0.5);
    registerLod(
      `ear.${side}`,
      head,
      createEllipsoidLod(
        `ear.${side}`,
        [0.014, 0.027, 0.009],
        materialOf(materials, "skinShadow"),
        lod,
        { position: [side * anatomy.headWidth * 0.5, earY, 0] },
      ),
    );
  }

  // Hair is layered in deterministic major masses; no strand-level noise.
  const hairLod = createHeroLod("hair", lod, (detail: HeroDetailLevel) => {
    const group = namedGroup(`hero.hair.${detail}`);
    const cap = createHeroMesh(
      `hero.mesh.hair-cap.${detail}`,
      new SphereGeometry(
        1,
        detail === "high" ? 20 : detail === "medium" ? 14 : 9,
        detail === "high" ? 14 : detail === "medium" ? 10 : 7,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.68,
      ),
      materialOf(materials, "hair"),
    );
    cap.position.set(
      0,
      anatomy.headHeight * 0.57,
      -anatomy.headDepth * 0.04,
    );
    cap.scale.set(
      anatomy.headWidth * 0.54,
      anatomy.headHeight * 0.54,
      anatomy.headDepth * 0.54,
    );
    group.add(cap);
    const count = detail === "high" ? 14 : detail === "medium" ? 7 : 0;
    const random = createHeroRandom(`${spec.seed}:hair:${detail}`);
    for (let index = 0; index < count; index += 1) {
      const t = index / Math.max(1, count - 1);
      const angle = -Math.PI * 0.82 + t * Math.PI * 1.64;
      const clump = createHeroMesh(
        `hero.mesh.hair-clump.${detail}.${index}`,
        new SphereGeometry(
          1,
          detail === "high" ? 12 : 9,
          detail === "high" ? 9 : 7,
        ),
        materialOf(materials, "hair"),
      );
      const crownBias = Math.sin(t * Math.PI);
      clump.position.set(
        Math.sin(angle) * anatomy.headWidth * (0.43 + random() * 0.04),
        anatomy.headHeight *
          (0.53 + crownBias * 0.38 + (random() - 0.5) * 0.07),
        Math.cos(angle) * anatomy.headDepth * 0.36 +
          (random() - 0.5) * 0.012,
      );
      clump.scale.set(
        0.027 + random() * 0.016,
        0.05 + random() * 0.035,
        0.025 + random() * 0.018,
      );
      clump.rotation.z = (random() - 0.5) * 0.8;
      clump.rotation.x = (random() - 0.5) * 0.35;
      group.add(clump);
    }
    return group;
  });
  registerLod("hair", head, hairLod);

  // Beard and moustache anchor the canonical turnaround's face identity.
  const beardLod = createHeroLod("beard", lod, (detail) => {
    const group = namedGroup(`hero.beard.${detail}`);
    const beard = createHeroMesh(
      `hero.mesh.beard.${detail}`,
      new SphereGeometry(
        1,
        detail === "high" ? 18 : detail === "medium" ? 12 : 8,
        detail === "high" ? 12 : detail === "medium" ? 9 : 6,
      ),
      materialOf(materials, "hair"),
    );
    beard.position.set(
      0,
      anatomy.headHeight * 0.125,
      anatomy.headDepth * 0.41,
    );
    beard.scale.set(
      anatomy.headWidth * 0.33,
      face.beardLength * 0.54,
      anatomy.headDepth * 0.09,
    );
    group.add(beard);
    if (detail !== "low") {
      for (const side of [-1, 1] as const) {
        const moustache = createHeroMesh(
          `hero.mesh.moustache.${detail}.${side}`,
          new CapsuleGeometry(0.006, 0.036, 4, 7),
          materialOf(materials, "hair"),
        );
        moustache.position.set(
          side * 0.018,
          anatomy.headHeight * 0.235,
          anatomy.headDepth * 0.51,
        );
        moustache.rotation.z = side * 0.84;
        group.add(moustache);
      }
    }
    return group;
  });
  registerLod("beard", head, beardLod);

  const expressions = createHeroExpressionController({
    leftBrow,
    rightBrow,
    leftLid,
    rightLid,
    leftMouthCorner,
    rightMouthCorner,
    lowerLip,
    jaw,
  });

  function buildArm(
    sideName: "left" | "right",
    shoulderPivot: Group,
    elbowPivot: Group,
    wristPivot: Group,
  ) {
    const sideSign = sideName === "left" ? -1 : 1;
    registerLod(
      `${sideName}UpperArm`,
      shoulderPivot,
      createHeroLod(`${sideName}UpperArm`, lod, (detail) => {
        const radial = detail === "high" ? 18 : detail === "medium" ? 12 : 8;
        const group = namedGroup(`hero.${sideName}UpperArm.${detail}`);
        const deltoid = createHeroMesh(
          `hero.mesh.${sideName}-deltoid.${detail}`,
          new SphereGeometry(1, radial, Math.max(6, radial - 5)),
          materialOf(materials, "linen"),
        );
        deltoid.position.set(0, -0.05, 0);
        deltoid.scale.set(0.115, 0.145, 0.105);
        group.add(deltoid);

        const segmentLength = anatomy.upperArmLength - 0.025;
        const sleeve = createHeroMesh(
          `hero.mesh.${sideName}-upper-arm.${detail}`,
          new CylinderGeometry(
            0.102,
            0.079,
            segmentLength,
            radial,
            detail === "high" ? 3 : 1,
          ),
          materialOf(materials, "linen"),
        );
        sleeve.position.y = -segmentLength * 0.52;
        sleeve.scale.z = 0.92;
        group.add(sleeve);

        if (detail !== "low") {
          for (let index = 0; index < 2; index += 1) {
            const fold = createHeroMesh(
              `hero.mesh.${sideName}-sleeve-fold.${detail}.${index}`,
              new CapsuleGeometry(0.004, 0.12, 3, 6),
              materialOf(materials, "linenShadow"),
            );
            fold.position.set(
              (index * 2 - 1) * 0.032,
              -anatomy.upperArmLength * (0.42 + index * 0.17),
              0.083,
            );
            fold.rotation.z = (index * 2 - 1) * 0.1;
            group.add(fold);
          }
        }
        return group;
      }),
    );
    const sleeveCuff = createHeroMesh(
      `hero.mesh.${sideName}-sleeve-cuff`,
      new CylinderGeometry(0.08, 0.09, 0.06, 14),
      materialOf(materials, "linenShadow"),
    );
    sleeveCuff.position.y = -anatomy.upperArmLength + 0.018;
    shoulderPivot.add(sleeveCuff);

    registerLod(
      `${sideName}Forearm`,
      elbowPivot,
      createHeroLod(`${sideName}Forearm`, lod, (detail) => {
        const radial = detail === "high" ? 16 : detail === "medium" ? 11 : 8;
        const group = namedGroup(`hero.${sideName}Forearm.${detail}`);
        const elbow = createHeroMesh(
          `hero.mesh.${sideName}-elbow.${detail}`,
          new SphereGeometry(1, radial, Math.max(6, radial - 4)),
          materialOf(materials, "skinShadow"),
        );
        elbow.position.set(0, -0.018, 0.006);
        elbow.scale.set(0.078, 0.082, 0.069);
        group.add(elbow);
        const segmentLength = anatomy.forearmLength - 0.025;
        const forearm = createHeroMesh(
          `hero.mesh.${sideName}-forearm.${detail}`,
          new CylinderGeometry(
            0.073,
            0.052,
            segmentLength,
            radial,
            detail === "high" ? 3 : 1,
          ),
          materialOf(materials, "skin"),
        );
        forearm.position.set(0, -segmentLength * 0.54, 0.006);
        forearm.scale.z = 0.9;
        group.add(forearm);
        return group;
      }),
    );
    registerLod(
      `${sideName}Hand`,
      wristPivot,
      createHeroLod(`${sideName}Hand`, lod, (detail) => {
        const group = namedGroup(`hero.${sideName}Hand.${detail}`);
        const radial = detail === "high" ? 14 : detail === "medium" ? 10 : 8;
        const palm = createHeroMesh(
          `hero.mesh.${sideName}-palm.${detail}`,
          new SphereGeometry(1, radial, Math.max(6, radial - 4)),
          materialOf(materials, "skin"),
        );
        palm.position.set(sideSign * 0.004, -0.066, 0.012);
        palm.scale.set(0.069, 0.08, 0.047);
        group.add(palm);

        if (detail === "low") return group;
        const fingerCount = detail === "high" ? 4 : 3;
        for (let index = 0; index < fingerCount; index += 1) {
          const normalized = index / (fingerCount - 1);
          const finger = createHeroMesh(
            `hero.mesh.${sideName}-finger.${detail}.${index}`,
            new CapsuleGeometry(
              detail === "high" ? 0.011 : 0.014,
              0.052 - Math.abs(normalized - 0.5) * 0.009,
              4,
              detail === "high" ? 7 : 6,
            ),
            materialOf(materials, "skinShadow"),
          );
          finger.position.set(
            (normalized - 0.5) * 0.092,
            -0.151 - Math.abs(normalized - 0.5) * 0.004,
            0.018,
          );
          finger.rotation.z = (normalized - 0.5) * 0.08;
          group.add(finger);
        }
        const thumb = createHeroMesh(
          `hero.mesh.${sideName}-thumb.${detail}`,
          new CapsuleGeometry(0.014, 0.055, 4, 7),
          materialOf(materials, "skin"),
        );
        thumb.position.set(sideSign * 0.067, -0.08, 0.017);
        thumb.rotation.z = -sideSign * 0.62;
        group.add(thumb);
        return group;
      }),
    );
  }

  buildArm("left", leftShoulder, leftElbow, leftWrist);
  buildArm("right", rightShoulder, rightElbow, rightWrist);

  function buildLeg(
    sideName: "left" | "right",
    hipPivot: Group,
    kneePivot: Group,
    anklePivot: Group,
  ) {
    registerLod(
      `${sideName}Thigh`,
      hipPivot,
      createHeroLod(`${sideName}Thigh`, lod, (detail) => {
        const radial = detail === "high" ? 18 : detail === "medium" ? 12 : 8;
        const group = namedGroup(`hero.${sideName}Thigh.${detail}`);
        const hipMass = createHeroMesh(
          `hero.mesh.${sideName}-hip.${detail}`,
          new SphereGeometry(1, radial, Math.max(6, radial - 5)),
          materialOf(materials, "trousers"),
        );
        hipMass.position.y = -0.052;
        hipMass.scale.set(0.137, 0.16, 0.126);
        group.add(hipMass);
        const segmentLength = anatomy.thighLength - 0.035;
        const thigh = createHeroMesh(
          `hero.mesh.${sideName}-thigh.${detail}`,
          new CylinderGeometry(
            0.128,
            0.101,
            segmentLength,
            radial,
            detail === "high" ? 3 : 1,
          ),
          materialOf(materials, "trousers"),
        );
        thigh.position.y = -segmentLength * 0.54;
        thigh.scale.z = 0.94;
        group.add(thigh);
        return group;
      }),
    );
    registerLod(
      `${sideName}Shin`,
      kneePivot,
      createHeroLod(`${sideName}Shin`, lod, (detail) => {
        const radial = detail === "high" ? 16 : detail === "medium" ? 11 : 8;
        const group = namedGroup(`hero.${sideName}Shin.${detail}`);
        const knee = createHeroMesh(
          `hero.mesh.${sideName}-knee.${detail}`,
          new SphereGeometry(1, radial, Math.max(6, radial - 4)),
          materialOf(materials, "trousers"),
        );
        knee.position.set(0, -0.018, 0.012);
        knee.scale.set(0.113, 0.105, 0.108);
        group.add(knee);
        const segmentLength = anatomy.shinLength - 0.025;
        const shin = createHeroMesh(
          `hero.mesh.${sideName}-shin.${detail}`,
          new CylinderGeometry(
            0.106,
            0.083,
            segmentLength,
            radial,
            detail === "high" ? 3 : 1,
          ),
          materialOf(materials, "trousers"),
        );
        shin.position.y = -segmentLength * 0.54;
        shin.scale.z = 0.91;
        group.add(shin);
        if (detail !== "low") {
          for (let index = 0; index < 2; index += 1) {
            const crease = createHeroMesh(
              `hero.mesh.${sideName}-knee-crease.${detail}.${index}`,
              new CapsuleGeometry(0.004, 0.11, 3, 6),
              materialOf(materials, "leatherDark"),
            );
            crease.position.set(
              0,
              -0.075 - index * 0.04,
              0.098 - index * 0.006,
            );
            crease.rotation.z = Math.PI * 0.5 + (index - 0.5) * 0.08;
            group.add(crease);
          }
        }
        return group;
      }),
    );

    const wrapGroup = namedGroup(`hero.detail.${sideName}-leg-wrap`);
    kneePivot.add(wrapGroup);
    for (let index = 0; index < 5; index += 1) {
      const wrap = createHeroMesh(
        `hero.mesh.${sideName}-leg-wrap.${index}`,
        new TorusGeometry(0.103 - index * 0.002, 0.012, 6, 14),
        materialOf(materials, "legWrap"),
      );
      wrap.position.y = -anatomy.shinLength * (0.62 + index * 0.07);
      wrap.rotation.x = Math.PI * 0.5;
      wrap.rotation.z = (index % 2 ? -1 : 1) * 0.08;
      wrap.scale.z = 0.9;
      wrapGroup.add(wrap);
    }

    const bootShaft = createHeroMesh(
      `hero.mesh.${sideName}-boot-shaft`,
      new CylinderGeometry(0.098, 0.087, anatomy.ankleHeight * 1.5, 14),
      materialOf(materials, "leather"),
    );
    bootShaft.position.y = -anatomy.ankleHeight * 0.18;
    anklePivot.add(bootShaft);
    registerLod(
      `${sideName}Boot`,
      anklePivot,
      createHeroLod(`${sideName}Boot`, lod, (detail) => {
        const group = namedGroup(`hero.${sideName}Boot.${detail}`);
        const radial = detail === "high" ? 16 : detail === "medium" ? 11 : 8;
        const foot = createHeroMesh(
          `hero.mesh.${sideName}-boot-foot.${detail}`,
          new CapsuleGeometry(
            anatomy.footWidth * 0.43,
            anatomy.footLength - anatomy.footWidth * 0.86,
            detail === "high" ? 7 : 4,
            radial,
          ),
          materialOf(materials, "leatherDark"),
        );
        foot.position.set(0, -anatomy.ankleHeight * 0.7, 0.07);
        foot.rotation.x = Math.PI * 0.5;
        foot.scale.set(1.13, 0.76, 1);
        group.add(foot);
        const sole = createHeroMesh(
          `hero.mesh.${sideName}-boot-sole.${detail}`,
          new BoxGeometry(
            anatomy.footWidth,
            0.022,
            anatomy.footLength * 0.93,
          ),
          materialOf(materials, "leatherDark"),
        );
        sole.position.set(0, -anatomy.ankleHeight + 0.008, 0.065);
        group.add(sole);
        const heel = createHeroMesh(
          `hero.mesh.${sideName}-boot-heel.${detail}`,
          new BoxGeometry(anatomy.footWidth * 0.8, 0.075, 0.085),
          materialOf(materials, "leather"),
        );
        heel.position.set(0, -anatomy.ankleHeight * 0.72, -0.075);
        group.add(heel);
        return group;
      }),
    );
  }

  buildLeg("left", leftHip, leftKnee, leftAnkle);
  buildLeg("right", rightHip, rightKnee, rightAnkle);

  const sockets = {} as Record<HeroSocketId, Object3D>;
  const createSocket = (
    id: HeroSocketId,
    parent: Object3D,
    position: HeroVec3,
    rotation: HeroVec3 = [0, 0, 0],
  ) => {
    const socket = new Object3D();
    socket.name = `hero.socket.${id}`;
    socket.userData.heroSocket = id;
    setTransform(socket, position, rotation);
    parent.add(socket);
    sockets[id] = socket;
    return socket;
  };

  const burdenSocket = createSocket(
    "backBurden",
    chest,
    outfit.burdenSocketOffset,
    [-0.08, 0, 0],
  );
  createSocket("chestAction", chest, [
    0,
    anatomy.torsoLength * 0.12,
    anatomy.headDepth * 0.55,
  ]);
  createSocket("headAction", head, [0, anatomy.headHeight, 0]);
  createSocket("leftHandGrip", leftWrist, [
    0,
    -anatomy.handLength * 0.5,
    0.02,
  ]);
  createSocket("rightHandGrip", rightWrist, [
    0,
    -anatomy.handLength * 0.5,
    0.02,
  ]);
  createSocket("leftHandAction", leftWrist, [
    0,
    -anatomy.handLength,
    0.025,
  ]);
  createSocket("rightHandAction", rightWrist, [
    0,
    -anatomy.handLength,
    0.025,
  ]);
  createSocket("beltRoll", pelvis, [
    anatomy.hipWidth * 0.66,
    beltY - 0.02,
    anatomy.hipWidth * 0.3,
  ]);
  createSocket("beltEquipment", pelvis, [
    -anatomy.hipWidth * 0.74,
    beltY - 0.05,
    -0.015,
  ]);
  createSocket("leftFootGround", leftAnkle, [
    0,
    -anatomy.ankleHeight,
    anatomy.footLength * 0.2,
  ]);
  createSocket("rightFootGround", rightAnkle, [
    0,
    -anatomy.ankleHeight,
    anatomy.footLength * 0.2,
  ]);

  const burdenVisual = namedGroup("hero.attachment.burden");
  burdenVisual.position.set(0, -0.11, -outfit.burdenDepth * 0.2);
  burdenSocket.add(burdenVisual);
  const createBurdenLevel = (detail: HeroDetailLevel) => {
    const group = namedGroup(`hero.burden.${detail}`);
    const base = createHeroMesh(
      `hero.mesh.burden-core.${detail}`,
      createIrregularClothGeometry(
        [
          outfit.burdenWidth * 0.45,
          outfit.burdenHeight * 0.5,
          outfit.burdenDepth * 0.47,
        ],
        detail,
        `${spec.seed}:burden-core:${detail}`,
      ),
      materialOf(materials, "burden"),
    );
    base.position.x = -outfit.burdenWidth * 0.025;
    base.rotation.z = -0.045;
    group.add(base);

    const lobeDefinitions: {
      position: HeroVec3;
      radii: HeroVec3;
      rotation: HeroVec3;
    }[] = [
      {
        position: [
          -outfit.burdenWidth * 0.025,
          outfit.burdenHeight * 0.325,
          -outfit.burdenDepth * 0.005,
        ],
        radii: [
          outfit.burdenWidth * 0.405,
          outfit.burdenHeight * 0.235,
          outfit.burdenDepth * 0.455,
        ],
        rotation: [0.05, -0.04, -0.08],
      },
      {
        position: [
          outfit.burdenWidth * 0.02,
          -outfit.burdenHeight * 0.325,
          outfit.burdenDepth * 0.01,
        ],
        radii: [
          outfit.burdenWidth * 0.42,
          outfit.burdenHeight * 0.235,
          outfit.burdenDepth * 0.46,
        ],
        rotation: [-0.04, 0.05, 0.07],
      },
      {
        position: [
          -outfit.burdenWidth * 0.29,
          outfit.burdenHeight * 0.035,
          0,
        ],
        radii: [
          outfit.burdenWidth * 0.19,
          outfit.burdenHeight * 0.3,
          outfit.burdenDepth * 0.4,
        ],
        rotation: [0.04, 0.08, -0.12],
      },
      {
        position: [
          outfit.burdenWidth * 0.29,
          -outfit.burdenHeight * 0.015,
          -outfit.burdenDepth * 0.005,
        ],
        radii: [
          outfit.burdenWidth * 0.19,
          outfit.burdenHeight * 0.29,
          outfit.burdenDepth * 0.4,
        ],
        rotation: [-0.05, -0.08, 0.1],
      },
    ];
    // One continuous compressed sack. Shape asymmetry lives in core topology;
    // no separately readable balloon lobes are mounted around it.
    const visibleLobes = lobeDefinitions.slice(0, 0);
    for (let index = 0; index < visibleLobes.length; index += 1) {
      const definition = visibleLobes[index];
      const lobe = createHeroMesh(
        `hero.mesh.burden-lobe.${detail}.${index}`,
        createIrregularClothGeometry(
          definition.radii,
          detail,
          `${spec.seed}:burden-lobe:${detail}:${index}`,
          [-0.28, 0.22],
        ),
        materialOf(materials, "burden"),
      );
      lobe.position.fromArray(definition.position);
      lobe.rotation.fromArray(definition.rotation);
      group.add(lobe);
    }

    const horizontalBands = [-0.32, 0.04, 0.36];
    for (let index = 0; index < horizontalBands.length; index += 1) {
      group.add(
        createRopeLoop(
          `hero.mesh.burden-rope-horizontal.${detail}.${index}`,
          [0, outfit.burdenHeight * horizontalBands[index], 0],
          [
            outfit.burdenWidth * (0.445 - index * 0.008),
            0.02,
            outfit.burdenDepth * 0.46,
          ],
          "horizontal",
          0.0115,
          materialOf(materials, "rope"),
          detail,
        ),
      );
    }

    const verticalOffsets = detail === "low" ? [0] : [-0.19, 0.19];
    for (let index = 0; index < verticalOffsets.length; index += 1) {
      group.add(
        createRopeLoop(
          `hero.mesh.burden-rope-vertical.${detail}.${index}`,
          [outfit.burdenWidth * verticalOffsets[index], 0, 0],
          [
            0.018,
            outfit.burdenHeight * 0.46,
            outfit.burdenDepth * 0.47,
          ],
          "vertical",
          0.011,
          materialOf(materials, "rope"),
          detail,
        ),
      );
    }

    if (detail !== "low") {
      for (const direction of [-1, 1] as const) {
        group.add(
          createRopeCurve(
            `hero.mesh.burden-rope-diagonal.${direction}`,
            [
              [
                direction * -outfit.burdenWidth * 0.33,
                -outfit.burdenHeight * 0.43,
                -outfit.burdenDepth * 0.3,
              ],
              [
                direction * -outfit.burdenWidth * 0.2,
                -outfit.burdenHeight * 0.22,
                -outfit.burdenDepth * 0.45,
              ],
              [0, 0, -outfit.burdenDepth * 0.475],
              [
                direction * outfit.burdenWidth * 0.2,
                outfit.burdenHeight * 0.22,
                -outfit.burdenDepth * 0.45,
              ],
              [
                direction * outfit.burdenWidth * 0.33,
                outfit.burdenHeight * 0.43,
                -outfit.burdenDepth * 0.3,
              ],
            ],
            0.01,
            materialOf(materials, "rope"),
            detail,
          ),
        );
      }
      const knot = createHeroMesh(
        "hero.mesh.burden-knot",
        new TorusGeometry(0.045, 0.012, 6, 12),
        materialOf(materials, "rope"),
      );
      knot.position.set(
        outfit.burdenWidth * 0.04,
        outfit.burdenHeight * 0.04,
        -outfit.burdenDepth * 0.485,
      );
      knot.rotation.x = 0.25;
      group.add(knot);

      for (let index = 0; index < 3; index += 1) {
        const patch = createHeroMesh(
          `hero.mesh.burden-patch.${index}`,
          createIrregularClothGeometry(
            [0.075, 0.09, 0.012],
            "medium",
            `${spec.seed}:burden-patch:${index}`,
            [],
          ),
          materialOf(materials, "burdenShadow"),
        );
        patch.position.set(
          (index - 1) * outfit.burdenWidth * 0.18,
          (index - 1) * outfit.burdenHeight * 0.13,
          -outfit.burdenDepth * 0.465,
        );
        patch.rotation.z = (index - 1) * 0.28;
        group.add(patch);
      }
    }
    return group;
  };
  const burdenLod = new LOD();
  burdenLod.name = "hero.lod.burden";
  burdenLod.autoUpdate = true;
  burdenLod.addLevel(createBurdenLevel("medium"), lod.highDistance);
  burdenLod.userData.heroLod = {
    id: "burden",
    distances: [lod.highDistance],
  };
  registerLod("burden", burdenVisual, burdenLod);

  const burdenHarness = namedGroup("hero.attachment.burdenHarness");
  chest.add(burdenHarness);
  for (const side of [-1, 1] as const) {
    burdenHarness.add(
      createRopeCurve(
        `hero.mesh.burden-continuous-strap.${side}`,
        [
          [
            side * anatomy.shoulderWidth * 0.34,
            anatomy.torsoLength * 0.36,
            -anatomy.headDepth * 0.62,
          ],
          [
            side * anatomy.shoulderWidth * 0.36,
            anatomy.torsoLength * 0.42,
            -anatomy.headDepth * 0.08,
          ],
          [
            side * anatomy.shoulderWidth * 0.3,
            anatomy.torsoLength * 0.27,
            anatomy.headDepth * 0.56,
          ],
          [
            side * anatomy.shoulderWidth * 0.29,
            -anatomy.torsoLength * 0.12,
            anatomy.headDepth * 0.57,
          ],
          [
            side * anatomy.shoulderWidth * 0.47,
            -anatomy.torsoLength * 0.28,
            anatomy.headDepth * 0.04,
          ],
          [
            side * anatomy.shoulderWidth * 0.4,
            -anatomy.torsoLength * 0.69,
            -anatomy.headDepth * 0.48,
          ],
        ],
        0.023,
        materialOf(materials, "leather"),
        "medium",
      ),
    );
  }
  const chestStrap = createHeroMesh(
    "hero.mesh.burden-chest-strap",
    new BoxGeometry(anatomy.shoulderWidth * 0.68, 0.05, 0.02),
    materialOf(materials, "leather"),
  );
  chestStrap.position.set(
    0,
    anatomy.torsoLength * 0.07,
    anatomy.headDepth * 0.555,
  );
  burdenHarness.add(chestStrap);
  const chestBuckle = createHeroMesh(
    "hero.mesh.burden-chest-buckle",
    new TorusGeometry(0.027, 0.006, 5, 10),
    materialOf(materials, "brass"),
  );
  chestBuckle.position.set(
    0,
    anatomy.torsoLength * 0.07,
    anatomy.headDepth * 0.57,
  );
  burdenHarness.add(chestBuckle);
  burdenHarness.add(
    createRopeLoop(
      "hero.mesh.burden-lower-load-belt",
      [0, -anatomy.torsoLength * 0.68, -0.01],
      [
        anatomy.hipWidth * 0.78,
        0.02,
        anatomy.hipWidth * 0.5,
      ],
      "horizontal",
      0.021,
      materialOf(materials, "leather"),
      "high",
    ),
  );

  const rollVisual = namedGroup("hero.attachment.sealed-roll");
  sockets.beltRoll.add(rollVisual);
  rollVisual.rotation.z = -0.14;
  const parchment = createHeroMesh(
    "hero.mesh.sealed-roll",
    new CylinderGeometry(0.055, 0.055, 0.34, 14),
    materialOf(materials, "parchment"),
  );
  rollVisual.add(parchment);
  for (const y of [-0.15, 0.15]) {
    const tie = createHeroMesh(
      `hero.mesh.sealed-roll-tie.${y}`,
      new TorusGeometry(0.058, 0.008, 5, 12),
      materialOf(materials, "seal"),
    );
    tie.position.y = y;
    tie.rotation.x = Math.PI * 0.5;
    rollVisual.add(tie);
  }

  const equipmentVisuals: Group[] = [];
  const breastplate = namedGroup("hero.equipment.breastplate");
  chest.add(breastplate);
  equipmentVisuals.push(breastplate);
  registerLod(
    "breastplate",
    breastplate,
    createEllipsoidLod(
      "breastplate",
      [
        anatomy.shoulderWidth * 0.36,
        anatomy.torsoLength * 0.28,
        0.055,
      ],
      materialOf(materials, "steel"),
      lod,
      {
        position: [
          0,
          anatomy.torsoLength * 0.06,
          anatomy.headDepth * 0.51,
        ],
      },
    ),
  );

  const sword = namedGroup("hero.equipment.sword");
  sockets.beltEquipment.add(sword);
  sword.rotation.z = 0.13;
  equipmentVisuals.push(sword);
  const blade = createHeroMesh(
    "hero.mesh.sword-blade",
    new BoxGeometry(0.04, 0.67, 0.018),
    materialOf(materials, "steel"),
  );
  blade.position.y = -0.31;
  sword.add(blade);
  const guard = createHeroMesh(
    "hero.mesh.sword-guard",
    new BoxGeometry(0.22, 0.035, 0.04),
    materialOf(materials, "brass"),
  );
  guard.position.y = 0.035;
  sword.add(guard);
  const grip = createHeroMesh(
    "hero.mesh.sword-grip",
    new CylinderGeometry(0.022, 0.026, 0.18, 10),
    materialOf(materials, "leatherDark"),
  );
  grip.position.y = 0.135;
  sword.add(grip);

  const shield = namedGroup("hero.equipment.shield");
  sockets.leftHandAction.add(shield);
  shield.position.set(-0.06, 0.04, -0.03);
  shield.rotation.set(Math.PI * 0.5, 0.12, -0.08);
  equipmentVisuals.push(shield);
  const shieldFace = createHeroMesh(
    "hero.mesh.shield",
    new CylinderGeometry(0.27, 0.27, 0.045, 20),
    materialOf(materials, "steel"),
  );
  shield.add(shieldFace);
  const shieldBoss = createHeroMesh(
    "hero.mesh.shield-boss",
    new SphereGeometry(0.085, 14, 10),
    materialOf(materials, "brass"),
  );
  shieldBoss.position.y = 0.045;
  shield.scale.setScalar(0.82);
  shield.add(shieldBoss);

  const helmet = namedGroup("hero.equipment.helmet");
  sockets.headAction.add(helmet);
  helmet.position.y = -anatomy.headHeight * 0.47;
  equipmentVisuals.push(helmet);
  const helmetShell = createHeroMesh(
    "hero.mesh.helmet",
    new SphereGeometry(
      anatomy.headWidth * 0.54,
      18,
      12,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.58,
    ),
    materialOf(materials, "steel"),
  );
  helmetShell.scale.z = anatomy.headDepth / anatomy.headWidth;
  helmet.add(helmetShell);

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
      center: [0, anatomy.headHeight * 0.5, 0],
      rotation: [0, 0, 0],
      radius: anatomy.headWidth * 0.55,
      trigger: false,
      activeWhen: "always",
    },
    {
      id: "burden-hit",
      parent: "backBurden",
      shape: "box",
      center: [0, -0.11, -outfit.burdenDepth * 0.2],
      rotation: [-0.08, 0, 0],
      halfExtents: [
        outfit.burdenWidth * 0.5,
        outfit.burdenHeight * 0.54,
        outfit.burdenDepth * 0.52,
      ],
      trigger: false,
      activeWhen: "burden",
    },
  ];

  const attachments: HeroAttachment[] = [
    {
      id: "left-upper-arm",
      parent: "chest",
      parentSocket: "leftShoulder",
      localStart: [-anatomy.shoulderWidth * 0.5, shoulderY, 0],
      localEnd: [
        -anatomy.shoulderWidth * 0.5,
        shoulderY - anatomy.upperArmLength,
        0,
      ],
      baseRadius: 0.1,
      endRadius: 0.088,
      embedDepth: 0.025,
      contactType: "embedded",
      gapTolerance: 0.006,
      evidenceRef: "turnaround front/profile: linen sleeve shoulder seam",
    },
    {
      id: "right-upper-arm",
      parent: "chest",
      parentSocket: "rightShoulder",
      localStart: [anatomy.shoulderWidth * 0.5, shoulderY, 0],
      localEnd: [
        anatomy.shoulderWidth * 0.5,
        shoulderY - anatomy.upperArmLength,
        0,
      ],
      baseRadius: 0.1,
      endRadius: 0.088,
      embedDepth: 0.025,
      contactType: "embedded",
      gapTolerance: 0.006,
      evidenceRef: "turnaround front/profile: linen sleeve shoulder seam",
    },
    {
      id: "left-leg",
      parent: "pelvis",
      parentSocket: "leftHip",
      localStart: [-anatomy.hipWidth * 0.5, 0, 0],
      localEnd: [
        -anatomy.hipWidth * 0.5,
        -anatomy.thighLength - anatomy.shinLength,
        0,
      ],
      baseRadius: 0.125,
      endRadius: 0.098,
      embedDepth: 0.03,
      contactType: "embedded",
      gapTolerance: 0.006,
      evidenceRef: "turnaround front/back: trouser line beneath tunic hem",
    },
    {
      id: "right-leg",
      parent: "pelvis",
      parentSocket: "rightHip",
      localStart: [anatomy.hipWidth * 0.5, 0, 0],
      localEnd: [
        anatomy.hipWidth * 0.5,
        -anatomy.thighLength - anatomy.shinLength,
        0,
      ],
      baseRadius: 0.125,
      endRadius: 0.098,
      embedDepth: 0.03,
      contactType: "embedded",
      gapTolerance: 0.006,
      evidenceRef: "turnaround front/back: trouser line beneath tunic hem",
    },
    {
      id: "burden-pack",
      parent: "backBurden",
      parentSocket: "backBurden",
      localStart: [0, 0, 0],
      localEnd: [0, -0.11, -outfit.burdenDepth * 0.2],
      baseRadius: outfit.burdenWidth * 0.3,
      endRadius: outfit.burdenWidth * 0.46,
      embedDepth: 0.035,
      contactType: "socket",
      gapTolerance: 0.01,
      evidenceRef: "turnaround profile/back: pack rests against upper and lower back",
    },
  ];

  const animator = createHeroAnimator({
    motionRoot,
    pivots,
    burdenVisual,
    burdenHarness,
    rollVisual,
    equipmentVisuals,
    expressions,
    seed: spec.seed,
  });

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
    update(delta, input = {}) {
      if (disposed) return;
      animator.update(delta, input);
    },
    setExpression(preset, intensity = 1) {
      if (disposed) return;
      expressions.setPreset(preset, intensity);
    },
    getSocket(id) {
      return sockets[id];
    },
    getSocketWorldPosition(id, target = new Vector3()) {
      root.updateWorldMatrix(true, true);
      return sockets[id].getWorldPosition(target);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      root.removeFromParent();
      const geometries = new Set<{
        dispose(): void;
      }>();
      root.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        geometries.add(object.geometry);
      });
      for (const geometry of geometries) geometry.dispose();

      const textures = new Set<Texture>();
      for (const material of Object.values(materials)) {
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
    version: 1,
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

  expressions.setPreset(options.expression ?? "concerned");
  animator.update(0, {
    burden: options.burden ?? 0,
    hasRoll: options.hasRoll ?? false,
    equipped: options.equipped ?? false,
  });
  burdenVisual.visible = (options.burden ?? 0) > 0;
  burdenHarness.visible = (options.burden ?? 0) > 0;
  rollVisual.visible = options.hasRoll ?? false;
  for (const visual of equipmentVisuals)
    visual.visible = options.equipped ?? false;

  return runtime;
}

export { createAuthoredPilgrimHero as createPilgrimHero } from "./createAuthoredHero";
