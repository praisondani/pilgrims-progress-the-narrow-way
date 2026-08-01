# Christian production asset handoff

The current v17 procedural reconstruction is a reviewed runtime prototype, not
the final studio asset. It now keeps Christian's burden behind his scapulae,
uses two asymmetric cloth lobes with compression folds and rope contact,
embeds facial volume in the skinned body draw, and adds restrained loaded-cloth
secondary motion. The comparison sheet remains below the acceptance bar:

- reference: `public/studio-evidence/hero-reference/christian-turnaround-v1.png`
- v17 profile render: `public/studio-evidence/vertical-slice-01/christian-v17-profile.jpg`
- v17 rear render: `public/studio-evidence/vertical-slice-01/christian-v17-back.jpg`
- staged comparison: `.asset-work/img2threejs/christian-hero/reviews/profile-v17-comparison.png`

The Loop 5 acceptance bar still requires an external DCC-authored character.
The procedural BufferGeometry remains useful as the API/rig and gameplay
fallback while that source sculpt is produced.

## Required deliverables

1. `christian-v1.blend`
   - Editable Blender 4.x source.
   - Applied object scale, unapplied armature pose.
   - Canonical turnaround loaded as locked orthographic image planes.
2. `christian-v1.glb`
   - glTF 2.0 binary.
   - `+Y` up, `+Z` forward, foot-ground origin, 1 Three.js unit = 1 meter.
   - Christian is 1.96–2.00 units tall in bind pose.
3. `christian-v1-validation/`
   - `front.png`, `profile.png`, `back.png`, and `three-quarter.png` at
     1024×1024.
   - The same four views reduced to 96 px character height.
   - `concern-closeup.png`.
   - `loaded-idle.png` and `unloaded-idle.png`.

The runtime file should ultimately live at:

`public/assets/hero/christian/christian-v1.glb`

## Geometry and draw budget

Export exactly four glTF mesh primitives and four material slots:

| Primitive | Triangle target | Material |
| --- | ---: | --- |
| `Christian_Body` | 14,000–17,000 | `M_ChristianBody` |
| `Christian_Burden` | 3,500–5,000 | `M_ChristianBurden` |
| `Christian_Roll` | 500–900 | `M_ChristianProp` |
| `Christian_Equipment` | 1,000–2,000 | `M_ChristianEquipment` |

Total target: 19,000–24,000 triangles. Maximum: 25,000 triangles, four
renderable primitives, four materials, and four draw calls when everything is
visible. Do not split eyes, teeth, hair, beard, straps, buckles, or clothing
layers into extra primitives. Their geometry may be separate islands inside
`Christian_Body` or `Christian_Burden`.

Use one 2048² ORM/base-color/normal atlas per material at most. The stylized
render may use vertex color plus normal data, but the face must retain sculpted
planes without textures.

## Sculpt target

- Adult male, 6.5–7 heads tall.
- Narrower ribcage than the current prototype; clear waist and pelvis block.
- Defined knee, calf, ankle, wrist, and hand taper.
- Sloped attached shoulders with depressed loaded shoulder line.
- Head flows through jaw and sternomastoid planes into the neck without a
  cylindrical neck seam.
- Asymmetrical, swept/tousled hair mass with a readable hairline and sideburns.
- Sculpted brow ridge, lids, eye sockets, nose bridge/ala, cheek planes,
  philtrum, lips, chin, jaw, and beard transition.
- Concerned expression must read in untextured gray clay at close range.
- Linen shirt has visible collar and sleeve thickness.
- Tunic has neckline, shoulder seam, waist compression, uneven hem, and cloth
  folds driven by the burden.
- Harness is physically layered over cloth with thickness and contact.

At 96 px character height, the grayscale silhouette must still show head,
neck, sloped shoulder line, waist/pelvis taper, separate hands, knees/ankles,
boot direction, and the burden’s uneven tied-sack outline.

## Burden construction

`Christian_Burden` is one skinned primitive containing the sack, rope, and
harness islands.

- Width: 1.15–1.25× shoulder width.
- Vertical extent: crown/top-shoulder region to low hip.
- Depth is compressed against the scapula and lumbar curve.
- No visible air gap from profile or three-quarter views.
- Cloth silhouette is asymmetric, sagged, pinched, and rope-compressed—not an
  ellipsoid, shield, or rigid backpack.
- Two continuous shoulder straps run from the upper load, across the
  shoulders, under the arms, and back to the lower load.
- One chest strap joins the shoulder straps.
- One load belt transfers weight at the pelvis.
- Strap and belt compression must visibly dent clothing and sack surfaces.

## Skeleton

Use 38–42 deform bones. Preserve these runtime-facing names exactly:

```text
pelvis
spine
chest
neck
head
jaw
leftShoulder
leftElbow
leftWrist
rightShoulder
rightElbow
rightWrist
leftHip
leftKnee
leftAnkle
rightHip
rightKnee
rightAnkle
```

Add DCC deform helpers as needed:

```text
spineLower spineUpper chestUpper
leftClavicle rightClavicle
leftForearmTwist rightForearmTwist
leftUpperArmTwist rightUpperArmTwist
leftThighTwist rightThighTwist
leftCalfTwist rightCalfTwist
leftBall rightBall
leftToe rightToe
leftThumb rightThumb
leftHandVolume rightHandVolume
burdenUpper burdenCenter burdenLower
strapLeft strapRight loadBelt
```

Limit every vertex to four bone influences. Normalize weights. Eliminate
shoulder collapse, elbow candy-wrapper twist, knee volume loss, wrist seams,
and burden/strap clipping in the supplied loaded poses.

## Pose and animation clips

Export these clips:

```text
UnloadedIdle
LoadedIdle
UnloadedWalk
LoadedWalk
```

Loaded pose requirements:

- 10–15° distributed forward pitch across ankle, pelvis, spine, and chest.
- Pelvis counter-rotation and posterior load response.
- Visible knee flex and ankle compensation.
- Shoulder depression/protraction under the straps.
- Head/neck lift so the eyes return to the horizon.
- Burden secondary motion is restrained and heavy, not bouncy.

The loaded and unloaded silhouettes must differ clearly at 96 px.

## Facial shapes

Export relative morph targets on `Christian_Body` with these exact names:

```text
smile
concern
effort
blink
```

`concern` must affect brows, upper lids, lower lids, cheek tension, mouth
corners, lips, and chin—not only translate flat facial cards. Eyes, brows,
mouth, beard, and hair must remain embedded in or directly continuous with the
head surface through every target.

## Required sockets

Export empty nodes or non-deforming bones with these exact names:

```text
backBurden
chestAction
headAction
leftHandGrip
rightHandGrip
leftHandAction
rightHandAction
beltRoll
beltEquipment
leftFootGround
rightFootGround
```

## Export checks

- No negative object scale.
- No non-manifold visible surfaces, flipped normals, loose geometry, or
  zero-area triangles.
- No unsupported Blender constraints in the exported result.
- No more than four primitives/materials.
- No more than 25,000 triangles.
- No more than 42 deform bones.
- All expected clips, morph targets, runtime bones, and sockets present.
- GLB opens without warnings in Blender re-import and Three.js `GLTFLoader`.
- Front/profile/back clay captures match the canonical turnaround before
  texture review.

Once this GLB exists, the current `HeroRuntime` API, sockets, colliders,
burden/roll/equipment state, expression channels, and disposal lifecycle can
be retained while replacing the procedural geometry factory with a GLTF-backed
runtime.
