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
  and interruption-aware AudioContext state reporting
- Forty-seven symbolic trials using ordered-action and focus mechanics
- Persistent sealed-roll loss/recovery and Palace equipment state with visible character gear
- Bright-by-default gameplay with standard/bright/high-contrast visibility presets
- WASD and arrow-key movement documented and browser-tested
- Bounded scene-loader fallback and wall-clock camera-flight settling for slow or
  backgrounded render loops
- Guided travel snaps across low-FPS target crossings instead of oscillating
  outside interaction range
- Split production chunks with enforced bundle budget
- Desktop and mobile Chromium smoke tests plus legacy exhaustive and finale real-control journey coverage
- GitHub Actions unit/build/bundle/asset/secret quality gates; Playwright browser
  suites remain available locally but are intentionally disabled in CI to conserve
  runner credits and avoid long pipelines
- Persistent normal/large/largest text settings
- Reduced-motion and cinematic-camera comfort controls
- Recover-current-checkpoint action and persisted-save index clamping
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

## In progress

- Chapter II procedural countryside visual/performance/progression validation
- Dream v9 visual iteration remains open after fresh critics scored 5.8/10 and
  6.4/10: camera safety and route readability improved, but 360-degree authored
  material depth, rear-world density, and a luminous shrine still miss the bar
- Dream v10 remains below the visual bar after fresh critics scored 5.6/10 and
  6.7/10: the desktop ridge and shrine improved, but mobile/rear depth parity
  still collapses and the mobile tutorial/objective card hides too much of the world
- Dream v12 mobile layout is no longer the primary blocker after fresh critics
  scored 5.8/10 and ~6.8/10: the card now exposes the torso and route while
  retaining all guidance, but the authored 360-degree world still lacks layered
  lighting, material nuance, and atmospheric depth
- Dream v13 remains below the visual bar after fresh critics scored 5.9/10 and
  7.1/10: the warmer lantern/arch is a real focal lift, but rear haze and ground
  shading are subtle at gameplay scale and the lantern still lacks convincing
  emission across the 360-degree low-poly world
- Dream v14 remains below the visual bar after fresh critics scored 6.0/10 and
  7.1/10: horizon tint and ground falloff are visible, but they dress a flat
  low-poly plane; the rear still lacks a landmark/depth story and the lantern
  has no convincing bloom
- Physical-device WebGPU/WebGL and mid-range mobile benchmarks
- Christian v38 img2threejs procedural anatomy/face, compacted adult head,
  tapered torso, tailored tunic seams, sleeve cuff/wrinkle relief, articulated
  hands with separated fingers, directional toe/sole boots, and compressed
  burden pass with fresh front/profile/rear runtime evidence. The prior
  independent runtime critic scored v37 at 7.4/10; v38 is a focused builder
  pass that improves torso/garment construction but is paused before a fresh
  critic loop. A licensed sculpt/GLB remains the long-term target.
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

## Blocked

- Studio visual bar is not met yet: current hero/environment geometry remains procedural low-poly, and no licensed 19–24k Christian GLB has passed review
- Physical-device performance sign-off is still outstanding; current headless benchmarks are not hardware claims
- Dedicated finale music beds and physical-device listening QA are still outstanding

## Next

1. Give City v28 a denser authored foreground and outer world—readable surface
   texture, stronger material richness, and connected silhouette/landmark variety
   beyond the ring—without increasing the 96-call mobile p95 profile or
   reintroducing shell artifacts, then re-run blind runtime critique
2. Validate every Chapter II objective and seed exclusion on desktop/mobile
3. Move terrain/scatter array generation to a worker after profiling proves need
4. Add region lifecycle/disposal and repeated-transition memory test
5. Continue Dream with a visibly emitting lantern asset and authored rear
   landmark/terrain layers now that lighting and mobile UX baselines are stable
6. Resume the paused v38 hero critic loop, then build the licensed GLB pipeline; replace characters scene by scene
7. Produce dedicated finale audio beds and complete physical-device audio/performance QA
