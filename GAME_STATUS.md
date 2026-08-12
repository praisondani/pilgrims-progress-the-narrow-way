# Game Status

## Completed

- Phase 1 Vite/React/TypeScript foundation
- React Three Fiber + Rapier runtime
- Keyboard and coarse-pointer movement controls
- 360-degree third-person orbit/follow camera with zoom, camera-relative movement, and smooth recenter
- Local persisted story state
- Title, HUD, objectives, pause, and journal UI
- 223 gated story beats across 30 chapters from Dream through the Celestial City
- Multi-line dialogue, response choices, chapter transitions, journal discoveries, and ending
- Burden appears in City, affects movement, and is removed only at Cross
- Automated story structure and save-ID invariants
- Thirty scene-authored painterly low-poly environment families
- Forty-two reusable human character variants plus a bespoke Apollyon silhouette, with articulated walk and idle animation
- Cinematic conversation camera, chapter pullback shots, and letterbox framing
- Procedural Web Audio ambience, footsteps, interaction cues, and sound toggle
- Bounded audio source gains, four-voice transient cap, coalesced browser unlock,
  interruption-aware AudioContext state reporting, and decoded-bed RMS/peak
  calibration with safe per-source lift before the shared bus limiter
- Title-screen journey action now unlocks sound on first play; bounded native
  `<audio>` fallback covers Web Audio context/decode failures without speaker
  spikes.
- Native fallback now preserves movement footsteps when `AudioContext` is
  unavailable by switching cadence to a monotonic wall clock; audio tests cover
  the fallback SFX path, including an immediate first-step cue before the
  cadence timer has elapsed. Focus-puzzle cues now use the same explicit
  unplayed state so the first slider interaction cannot be silently dropped.
  Native fallback voices now enforce the same four-voice ceiling as the Web
  Audio graph, stopping the oldest HTML audio element before a new transient
  starts so Safari/WebKit cannot stack speaker-spiking bursts.
- Audio tests now verify every scene’s resolved ambience alias and all eight SFX
  assets exist locally and contain an MPEG frame; finale scenes still reuse
  nearby mastered beds until dedicated compositions are authored.
- Forty-seven symbolic trials using ordered-action and focus mechanics
- Persistent sealed-roll loss/recovery and Palace equipment state with visible character gear
- Bright-by-default gameplay with standard/bright/high-contrast visibility presets
- WASD and arrow-key movement documented and browser-tested
- Enter/Return/Numpad Enter now advances narration from any focused surface
  without double-advancing; modal input clears held movement and blocks jump
  impulses while dialogue, choices, puzzles, or pause are open. Focus trials
  place keyboard focus on their slider so Enter can confirm without reaching
  for the mouse.
- Bounded scene-loader fallback and wall-clock camera-flight settling for slow or
  backgrounded render loops
- Guided travel snaps across low-FPS target crossings instead of oscillating
  outside interaction range
- Split production chunks with enforced bundle budget
- Dream environment resources now pass repeated remount/release coverage across
  twelve low-quality transition cycles; each owned geometry/material disposes
  exactly once after final release.
- Title loading pass: `GameCanvas` now lazy-loads after the trusted Begin
  gesture, keeping Three.js/Rapier out of the title entry. The current
  production entry is 252 KB and the deferred `GameCanvas` chunk is 113 KB;
  `check:bundle` enforces the deferred-chunk contract and a 400 KB entry cap.
- Desktop and mobile Chromium smoke tests plus legacy exhaustive and finale real-control journey coverage
- GitHub Actions unit/build/bundle/asset/secret quality gates; Playwright browser
  suites remain available locally but are intentionally disabled in CI to conserve
  runner credits and avoid long pipelines
- A single browser-free `npm run release:check` now composes the unit, 3D
  asset, build, bundle, secret, and diff gates used for local and CI release
  verification.
- Verified dist-only release `b2e61d1` was pushed to `master` and deployed
  atomically to `https://pilgrims.biblequick.com`; the public endpoint returns
  HTTPS 200 with the expected CSP/security headers, and the server release
  contains no source, `.env`, key, certificate, or source-map artifacts.
- Persistent normal/large/largest text settings
- Reduced-motion and cinematic-camera comfort controls
- Recover-current-checkpoint action and persisted-save index clamping
- Persisted payloads now sanitize replay scene/step indices, booleans, arrays,
  settings, and onboarding flags; fractional replay requests are ignored before
  chapter lookup, with malformed-save regression coverage.
- Persisted-state migration is now an exported, directly tested boundary:
  legacy completion flags require literal booleans, partial snapshots preserve
  live chapter indices, and migration/merge tests cover the save contract
  without mounting the renderer.
- Chapter-complete state is now persisted and sanitized, so a reload at the
  final beat restores the chapter handoff instead of reopening an already
  finished objective; migration coverage verifies the flag.
- Persisted numeric fields now reject null/empty corruption instead of
  coercing it to zero; merges preserve the live chapter, step, and burden when
  malformed local values arrive.
- Replay requests now clamp non-finite step inputs before chapter lookup, so a
  malformed drawer/API request cannot write a `NaN` step into live state.
- Save and replay completion flags now require the chapter’s final beat; early
  or stale `sceneComplete` values are discarded before the handoff UI can open.
- Persisted `puzzleActive` is now validated against the restored story beat;
  stale saves cannot open a missing puzzle overlay or crash the game shell.
- `gameComplete` now requires the final scene’s final beat in saves and replay
  checkpoints, preventing malformed local state from unlocking every chapter.
- `continueScene()` now requires `sceneComplete`, so an out-of-band click or
  stale keyboard event cannot bypass the final interaction of a chapter.
- Choice responses and puzzle completion now require their active modal state;
  stale callbacks are ignored instead of mutating story progression.
- Interaction callbacks are ignored while a dialogue-choice or puzzle modal is
  active, preventing repeated `E`/pointer events from reopening or stacking
  trials.
- Multi-phase Apollyon resistance centered on defense, truth, recovery, and perseverance
- Sound-led Shadow of Death traversal with false-light, echo, prayer, fire, and balance mechanics
- Faithful memory vignettes, Talkative evidence investigation, Evangelist preparation, and Vanity Fair social/court phases
- Restrained Faithful martyrdom, persistent grief context, and Hopeful’s companion introduction
- Version 5 migration that resumes completed Palace saves at the Valley of Humiliation
- Smooth persistent Hopeful follower with live companion status and recovery positioning
- By-Ends dialogue investigation, Demas mine inspection, and Christian-owned By-Path Meadow failure
- Carefully framed Doubting Castle sequence centered on companionship, prayer, memory, escape, and warning
- Persistent Key of Promise plus version 6 migration that resumes completed Hopeful saves at By-Ends
- Automated public-repository secret and release-artifact audit in CI
- Phase 1 procedural-world audit with reproducible runtime counters and before/after evidence
- Central renderer capability service plus explicit WebGPU/compute/vegetation/weather/terrain flags
- Opt-in lazy-loaded `WebGPURenderer` prototype with verified WebGL 2 default/fallback
- Deterministic Chapter II countryside seed, authored route/landmark masks, generated terrain collider, instanced vegetation/rocks, distant landscape, and atmospheric life
- Automated procedural determinism and path/landmark exclusion tests
- Procedural terrain tests now lock deterministic ring topology, finite collider
  vertices, path flattening, and authored landmark pads.
- Procedural scatter now enforces each biome rule’s `maxSlope` through shared
  central-difference terrain gradients, preventing props from floating on steep
  faces; seed tests cover the slope exclusion.
- Chapter II’s procedural definition now lives in a pure seedable factory that
  derives all six landmark pads from the authored story beats; tests lock the
  route endpoints, marsh clearance radius, stable biome/path contract, and
  alternate-seed behavior. Every vegetation and rock rule is also exercised
  across canonical and alternate seeds for finite placement, path clearance,
  landmark exclusion, slope limits, and deterministic output.
- City environment mounts now sweep and dispose every owned geometry under the
  root on unmount while leaving shared palette materials alive; the lifecycle
  helper deduplicates repeated references across child and root cleanup and has
  direct disposal coverage.
- Exhaustive 30-scene Dream-to-Celestial City real-controls journey passes on
  desktop (1/1, 25.3m), including Gate arrows, puzzles, dialogue, chapter
  transitions, and the Celestial City ending
- City of Destruction v5 environment kit integrated with preserved story
  targets: varied steep/broad facades and roofs, framed window recesses,
  restrained facade/road wear, target-safe planters, instanced market citizens,
  banners/crest, layered threshold masonry, cobbles, market dressing, skyline
  depth, street lamps/signs/debris, and threshold lantern
- City v19 360-degree skyline pass: dusk dome, grounded stepped horizon ring,
  radial windowed skyline towers with connected skirt bases, warm emissive roof
  materials, and mobile 8/10/12 quality counts. City tests 2/2, full unit suite
  68/68, build, bundle, secret audit, and mobile runtime smoke remain green;
  current headless mobile profile is 97 draw calls p95 / 31,608 triangles p95.
- City v20 rear-depth pass: sparse midground block-and-roof pairs bridge the
  playable island to the skyline inside the existing merged horizon geometry;
  no additional draw call, 96 mobile draw-call p95, and 31,932 mobile triangles
  p95. Fresh critics confirm cleaner rear grounding and no black horizon or
  floating-tower artifacts.
- City v21 material/lighting pass: bounded vertical warm-to-cool ramps and subtle
  lateral variation now break up the merged horizon, midground roofs/bodies, and
  shared skyline tower body/roof geometry without adding lights, meshes, draw
  groups, or changing the 96 mobile draw-call profile. City tests, build,
  bundle, secret audit, and front runtime evidence are green.
- City v22 spatial-depth pass: replaced repetitive midground placement with eight
  authored blueprints spanning every heading, varied radius/width/depth/height and
  roof scale, and added connected annex/roof clusters to selected blocks inside
  the same merged horizon draw. Fresh front/rear/mobile evidence is captured;
  City tests/build remain green and the mobile draw profile is unchanged.
- City v23 outer-ring pass: added sparse, grounded distant masses and roofs beyond
  the island ring inside the same merged horizon geometry (six low-tier / eight
  desktop silhouettes). Valid front/rear/mobile captures confirm clear gaps,
  no enclosing-wall occlusion, and no additional draw groups or lights; the
  mobile benchmark remains 97 draw calls p95 / 32,040 triangles p95.
- City v24 terrain/atmosphere pass: added six/eight broken hex berms with inset
  terrace caps and a bounded radial vertex-color haze across the merged horizon,
  plus a subtle lower-band dusk-dome haze. Valid front/rear/mobile evidence and
  the mobile benchmark remain green at 96 draw calls p95 / 32,208 triangles p95.
- City v25 scoped atmosphere pass: added a disposable City-only linear fog
  (`#4d3440`, desktop near/far 19/37; mobile 17.5/35) that restores any prior
  scene fog on cleanup. Foreground path, Christian, gate, and stalls stay crisp
  while distant towers/berms recede; no new meshes/lights/draw groups and the
  mobile benchmark remains 97 draw calls p95 / 32,220 triangles p95.
- City v26 surface-detail pass: generalized the existing material-breakup helper
  to any `BufferGeometry` with a base color, then applied restrained vertex
  variation to the road/cross-street, market stall surfaces, threshold stone,
  and door through a shared vertex-color material. No new meshes/lights/draw
  groups; City tests/build and the 97 draw-call / 32,220-triangle mobile audit
  remain green.
- City v27/v28 grounding and fog-balance passes: baked bounded Gaussian contact
  patches and edge darkening into subdivided road/cross-street geometry (same
  draw groups), then tuned the disposable City fog from `#4d3440` 19/37 to
  `#5b4652` 18/43 desktop and 17/41 mobile. The official mobile benchmark is
  96 draw calls p95 / 32,596 triangles p95; foreground contacts remain readable
  and the distant skyline recovers contrast after the v27 washout.
- City v29 authored landmark/road-detail pass: integrated one asymmetrical
  civic bell tower with inward-facing warm slit windows into the existing
  merged horizon geometry, and added ten low-profile raised paving insets to
  the existing road draw. No new material group, light, route collider, or
  draw call is introduced; the final triangle/performance profile is pending
  the next non-browser benchmark.
- Dream v9 camera-safe horizon pass: expanded authored ground, shallow rear ridge,
  dynamic orbit obstruction avoidance, ground/depth material breakup, and a
  persistent lantern guide light, with fresh desktop/mobile/rear runtime evidence
  and green unit, asset, build, secret, bundle, and first-objective gates
- Dream v10 bounded environment pass: three staggered rear depth bands, brighter
  lantern glass/emissive pool, and mobile/desktop runtime evidence; Dream tests,
  build, and headless draw/triangle budgets remain green
- Dream v12 mobile objective UX pass: compact three-column movement/look/interact
  coach, readable guide action, safe-area-aware card sizing, and fresh desktop/
  mobile runtime evidence; local desktop/mobile first-objective flows remain green
- Dream v13 lighting pass: warm target/lantern falloff, rear haze tint, and
  distance-based ground value separation, with zero runtime console/page errors
  and unchanged Dream draw/triangle budgets
- Dream v14 depth tint pass: stronger rear-band vertex haze, ground distance
  falloff, and brighter warm lantern glass, with Dream tests/build and fresh
  desktop/lit/rear/mobile runtime captures still within the existing budgets
- Dream v15–v31 bounded 360-degree atmosphere pass: feathered stream/path
  terminals remove reverse-orbit shards, rounded rear mounds replace the hard
  blue wall, a grounded waystone/lantern echo and framing trees give the rear
  orbit a readable landmark, and the lantern receives a stronger warm emissive
  pool. Fresh desktop/mobile captures are clean of the former stream/beam
  artifacts; the headless mobile
  sample is 19 draw calls / 29,082 triangles; the rear capture retains a small
  authored path wedge at the lower-left edge, but no stream end-cap shard or
  blue beam.
- Dream v35/v36 atmosphere and rear-density pass: scene-level background/fog
  now owns the actual Three.js `Scene` (removing the transparent-canvas black
  sky), the Dream meadow grows to a 72×72 authored plane, a dusk sky dome
  restores continuous 360-degree gradients, and a deterministic rear meadow
  cluster adds middle-distance shrubs, rocks, and grass through existing
  instanced batches. The lantern chamber is tapered glass instead of a flat
  card. Fresh front/rear captures show clean horizon continuity and no former
  stream/beam artifacts; the mobile headless profile is 20 draw calls / 29,818
  triangles p95 at 15.8 headless FPS.
- Dream v37/v38 lantern-light pass: tapered glass, additive aura, warm meadow
  clearing falloff, and a bounded 10-intensity / 12.5-distance point-light pool
  make the lit shrine illuminate nearby ground instead of reading as a flat
  card. Fresh objective/lit runtime captures show no shard, slab, beam, or black
  wedge artifacts. The mobile headless sample is 21 draw calls / 29,986
  triangles p95 at 12.7 headless FPS; the current Dream environment estimate is
  15 calls / 7,282 triangles against its 15-call / 7,500-triangle medium budget.
- Dream v41 landmark pass: one merged broken waymarker now anchors the rear
  meadow axis without adding a draw call or collision wall. Fresh front/rear
  orbit captures show a grounded, readable sign silhouette with no cropped
  monument, stream end-cap, shard, slab, beam, or black-wedge artifact. The
  marker remains an incremental readability win, not a visual-bar pass: fresh
  critics score 7.4–7.8 front, 6.6–6.8 rear, 6.4–7.0 for Christian, 6.3–7.5
  for composition, and 7.2–8.5 for artifact hygiene.
- Dream v42 ground-relief pass: the existing 72×72 meadow mesh now carries
  subtle authored rolling shelves, an east rise, and a shallow stream dip with
  fresh normals; shader value response follows relief height. No route collider,
  draw-call, or stream-endpoint changes. Fresh critics confirm relief reads as
  deliberate low-poly meadow breakup, the walkable route stays safe, and no new
  shard/slab/beam/wedge artifacts appear. Critics still fail the quality bar at
  7.5–7.8 front, 6.8–6.9 rear, 6.4–7.0 for Christian, 6.4–7.1 for rear
  composition, and 7.0–8.5 for artifact hygiene.
- Dream v43 horizon-continuity pass: distant ridge mounds now share a softened
  meadow/fog twilight value, with delayed rear haze preserving their silhouette
  instead of washing the whole band blue. Fresh front/rear orbit captures show a
  continuous horizon seam, grounded waymarker, safe stream, and no shard/slab/
  beam/wedge artifacts. Critics score 7.5–7.8 front, 6.9–7.0 rear, 6.4–7.0
  for Christian, 6.5–7.2 for composition, and 7.1–8.5 for artifact hygiene;
  this is a continuity fix, not a visual-bar pass.
- Dream v50 rear-space integration pass: two distant faceted outcrops now sit
  behind the existing horizon ridge, so their bases disappear into fog instead
  of reading as detached foreground props. Fresh front/rear captures show a
  grouped massif silhouette, grounded waymarker, clean stream, and no pale
  shards, slabs, beams, black wedges, or horizon seam. Critics score 7.5–7.8
  front, 7.2–7.3 rear, 6.4–7.0 for Christian, 6.9–7.3 for composition, and
  7.3–8.5 for artifact hygiene. The pass improves rear integration but remains
  below the visual bar because distant material depth and meadow variation are
  still shallow.
- Dream v51 distant-material pass: horizon vertex tint and depth-mass shading
  now converge distant stone toward fog/blue twilight at a stronger, bounded
  gradient. Fresh critics confirm no route or artifact regression and a modest
  haze improvement in one blind review; the second sees no meaningful edge gain.
  Scores remain 7.5–7.8 front, 7.2–7.3 rear, 6.4–7.0 for Christian, 6.9–7.5
  for composition, and 7.3–8.4 for artifact hygiene. This is a safe material
  increment, not a visual-bar pass.
- Dream v52 meadow-language pass: the ground shader now uses broad, authored
  lantern, grove, wetland, bank, and hollow zones with low-frequency contour
  response; the plane remains one draw and the route/collision graph is
  unchanged. A centered runtime front/rear pair is clean, with no edge decal,
  stream-endpoint, shard, slab, beam, or wedge artifacts. Fresh critic scores
  are 7.6 front, 7.4 rear, 7.0 for Christian, 7.4 for composition, and 7.5
  for artifact hygiene. It is a measurable tonal improvement but still below
  the Kena/Pathless/RiME bar because the ground remains visibly planar.
- Dream v53 lantern-source pass: the lantern now has a bounded, feathered
  warm-pool shader on the ground, driven by the existing lit/unlit state and
  sharing the single point-light budget. The first wiring attempt was caught by
  a static smoke run (`poolStrength` was read from a mesh ref), fixed before
  checkpointing; the corrected build has zero page errors in a local smoke.
  Lit-state visual review remains pending because browser capture is paused to
  protect workstation performance.
- Dream v54 rear-landmark pass: a broken shrine silhouette with an offset cap,
  uneven pillars, and a narrow inward-facing slit is merged into the existing
  distant-landforms batch behind the rear ridge. It adds authored scale and a
  second orbit landmark without changing the stream route, collision graph,
  material groups, or draw count; fresh visual review remains pending.
- Christian v39 material-response pass: the existing four-draw procedural hero
  now uses bounded `MeshPhysicalMaterial` finishes with subtle skin/cloth sheen,
  burden cloth response, parchment warmth, and restrained equipment clearcoat.
  Geometry, sockets, LODs, and triangle/draw budgets remain unchanged. Runtime
  critic capture is still pending; the production 19–24k GLB remains required
  for final visual sign-off.

## In progress

- Chapter II procedural countryside visual/performance/progression validation
- Dream v53 remains below the visual bar after v52 independent critics scored
  7.6–7.8/10 front, 7.2–7.4/10 rear, 6.4–7.0/10 for Christian, 6.8–7.5/10
  for composition, and 7.5–8.3/10 for artifact hygiene; v42 relief grounds
  local areas, v43 removes the hard horizon
  seam, v50 connects distant outcrops behind the ridge, v51 adds bounded haze,
  and v52 adds authored meadow zones. The current largest gap is still
  genuinely layered terrain/material depth; v53 warm-pool lighting must be
  judged from a real lit-state capture before it can be accepted.
- Dream v54 adds one merged rear shrine landmark to address the sparse rear
  hierarchy. It is not accepted as a visual-bar pass until a fresh front/rear
  static/runtime comparison confirms grounded contact and no orbit artifacts.
- Physical-device WebGPU/WebGL and mid-range mobile benchmarks
- Title entry is now deferred, but hardware scene FPS, cold-start variance,
  and post-start physics/render cost still require device profiling.
- Christian v38/v39 img2threejs procedural anatomy/face, compacted adult head,
  tapered torso, tailored tunic seams, sleeve cuff/wrinkle relief, articulated
  hands with separated fingers, directional toe/sole boots, and compressed
  burden pass with fresh front/profile/rear runtime evidence. V39 upgrades the
  same four shared hero materials to bounded physical finishes without adding
  draws or textures. The prior independent runtime critic scored v37 at 7.4/10;
  v38/v39 critic capture remains paused. A licensed sculpt/GLB remains the
  long-term target.
- City v22 independent runtime critics scored 7.3–7.8 front, 6.3–7.5 rear,
  and 6.0–7.5 mobile; artifact checks pass and the varied block/roof clusters
  materially improve rear layering. City v23 final critic scored 7.4 front,
  6.5 rear, and 6.2 mobile; outer silhouettes partially integrate the dark-red
  field but remain sparse/toy-like. City v24 critics score 7.4–7.9 front,
  6.7–7.6 rear, and 6.2–7.5 mobile; berms/haze improve contact and tonal
  separation without artifacts. City v25 critics score 7.5–8.0 front,
  6.8–7.8 rear, and 6.2–7.5 mobile; scoped fog is a real depth improvement
  with crisp foreground readability. City v26 critics score 7.5–8.0 front,
  6.9–7.8 rear, and 6.3–7.5 mobile; breakup is subtle and safe. City v27
  critics score 7.3–7.7 front, 6.8–7.8 rear, and 6.0–7.1 mobile; contacts
  improve but fog over-washes some views. City v28 critics score 7.5–7.9
  front, 7.0–7.9 rear, and 6.3–7.4 mobile; fog balance recovers skyline
  contrast, but low-poly repetition and sparse outer world still fail the
  Kena/Pathless/RiME bar.
- City v29 is the next visual checkpoint: a single landmark silhouette and
  raised road insets are implemented inside existing merged geometry, but a
  fresh static/runtime critic comparison is still required before claiming a
  visual-bar improvement.

## Blocked

- Studio visual bar is not met yet: current hero/environment geometry remains procedural low-poly, and no licensed 19–24k Christian GLB has passed review
- Physical-device performance sign-off is still outstanding; current headless benchmarks are not hardware claims
- Dedicated finale music beds and physical-device listening QA are still outstanding

## Next

1. Review City v29's landmark and paving pass against front/rear/mobile captures
   without increasing the 96-call mobile p95 profile or reintroducing shell
   artifacts, then re-run blind runtime critique when browser review resumes
2. Validate every Chapter II objective and seed exclusion on desktop/mobile
3. Move terrain/scatter array generation to a worker after profiling proves need
4. Add region lifecycle/disposal and repeated-transition memory test
5. Continue Dream with genuinely layered terrain/material depth and a
   production-quality lantern asset now that the artifact-safe orbit, v42
   relief, v43 horizon continuity, v50 rear outcrop integration, v51 haze
   convergence, v52 meadow zones, and v54 rear shrine are stable; validate the v53 warm pool
   from a real lit-state capture when browser review resumes
6. Resume the paused v38 hero critic loop, then build the licensed GLB pipeline; replace characters scene by scene
7. Produce dedicated finale audio beds and complete physical-device audio/performance QA
