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
- GitHub Actions unit/build/bundle/browser quality gates
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
- Dream v9 camera-safe horizon pass: expanded authored ground, shallow rear ridge,
  dynamic orbit obstruction avoidance, ground/depth material breakup, and a
  persistent lantern guide light, with fresh desktop/mobile/rear runtime evidence
  and green unit, asset, build, secret, bundle, and first-objective gates
- Dream v10 bounded environment pass: three staggered rear depth bands, brighter
  lantern glass/emissive pool, and mobile/desktop runtime evidence; Dream tests,
  build, and headless draw/triangle budgets remain green

## In progress

- Chapter II procedural countryside visual/performance/progression validation
- Dream v9 visual iteration remains open after fresh critics scored 5.8/10 and
  6.4/10: camera safety and route readability improved, but 360-degree authored
  material depth, rear-world density, and a luminous shrine still miss the bar
- Dream v10 remains below the visual bar after fresh critics scored 5.6/10 and
  6.7/10: the desktop ridge and shrine improved, but mobile/rear depth parity
  still collapses and the mobile tutorial/objective card hides too much of the world
- Physical-device WebGPU/WebGL and mid-range mobile benchmarks
- Christian v38 img2threejs procedural anatomy/face, compacted adult head,
  tapered torso, tailored tunic seams, sleeve cuff/wrinkle relief, articulated
  hands with separated fingers, directional toe/sole boots, and compressed
  burden pass with fresh front/profile/rear runtime evidence. The prior
  independent runtime critic scored v37 at 7.4/10; v38 is a focused builder
  pass that improves torso/garment construction but is paused before a fresh
  critic loop. A licensed sculpt/GLB remains the long-term target.
- City v7 runtime critic review complete: conservative 6.1/10 (+0.3 versus v6;
  desktop/orbit ~6.5), with the centered road, surrounding authored buildings,
  and ring skyline readable without occluding the gate or path. Instanced
  cardinal/diagonal depth geometry measures 136 desktop / 94 mobile draw-call
  p95. The visual bar still fails on mobile depth parity: the low preset
  collapses to a gate corridor with no readable surrounding skyline.

## Blocked

- Studio visual bar is not met yet: current hero/environment geometry remains procedural low-poly, and no licensed 19–24k Christian GLB has passed review
- Physical-device performance sign-off is still outstanding; current headless benchmarks are not hardware claims
- Dedicated finale music beds and physical-device listening QA are still outstanding

## Next

1. Preserve City v7's ring skyline on the low-quality mobile preset, then re-run blind runtime critique
2. Validate every Chapter II objective and seed exclusion on desktop/mobile
3. Move terrain/scatter array generation to a worker after profiling proves need
4. Add region lifecycle/disposal and repeated-transition memory test
5. Continue Dream with a mobile-safe tutorial/objective layout and authored rear
   depth/material bands before returning to Wicket Gate and finale
6. Resume the paused v38 hero critic loop, then build the licensed GLB pipeline; replace characters scene by scene
7. Produce dedicated finale audio beds and complete physical-device audio/performance QA
