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
- City of Destruction v4 environment kit integrated with preserved story
  targets: varied steep/broad facades and roofs, framed window recesses,
  awnings, door surrounds, layered threshold masonry, cobbles, market dressing,
  skyline depth, street lamps/signs/debris, and threshold lantern

## In progress

- Chapter II procedural countryside visual/performance/progression validation
- Physical-device WebGPU/WebGL and mid-range mobile benchmarks
- Christian v20 img2threejs procedural anatomy/face and compressed burden pass
  with fresh front/profile/rear/96 px critic evidence; 3.4/10 visual critic
  fail, external sculpt/GLB remains the target
- City v4 runtime critic review complete: cohesive chapter and clear v3 gain,
  but 4.6/10 visual-bar fail; authored material breakup, foliage, people,
  atmospheric depth, and stronger threshold storytelling remain

## Blocked

- Studio visual bar is not met yet: current hero/environment geometry remains procedural low-poly, and no licensed 19–24k Christian GLB has passed review
- Physical-device performance sign-off is still outstanding; current headless benchmarks are not hardware claims
- Dedicated finale music beds and physical-device listening QA are still outstanding

## Next

1. Give City v4 a material/foliage/atmosphere pass, then re-run blind runtime critique
2. Validate every Chapter II objective and seed exclusion on desktop/mobile
3. Move terrain/scatter array generation to a worker after profiling proves need
4. Add region lifecycle/disposal and repeated-transition memory test
5. Upgrade Dream, Wicket Gate, and finale landmarks with authored props/material depth
6. Build licensed GLB hero pipeline; replace characters scene by scene
7. Produce dedicated finale audio beds and complete physical-device audio/performance QA
