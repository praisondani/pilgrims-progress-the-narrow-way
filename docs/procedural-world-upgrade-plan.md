# Procedural World Upgrade Plan

Status: Phase 1 audit complete; Chapter II countryside prototype active behind `advancedTerrain` flag. Broad migration is not approved yet.

## Product invariant

Authored story path and landmarks remain authoritative. Deterministic systems may enrich space around them; they may not relocate, reorder, obstruct, or randomize story events.

## Current architecture audit

| Area | Current implementation | Finding |
| --- | --- | --- |
| Runtime | React 19.2.7, React Three Fiber 9.6.1, Three.js 0.185.1, Rapier 2.2.0 | Healthy modern base; no broad rewrite needed. |
| Renderer | R3F `Canvas` using `WebGLRenderer`, shadows, DPR `[1, 1.5]` | WebGL 2 is verified path. WebGPU was absent before this phase. |
| Story | 25 chapters, 191 ordered beats in `story.ts` | Strong authored data model. Must remain source of landmark coordinates. |
| World | One bounded scene at a time, React conditional environment family per chapter | Already region-like; formal lifecycle/disposal and preloading are missing. |
| Geometry | Procedural Three.js primitives; no GLB or texture assets | Tiny art asset footprint, but hero geometry has many separate meshes. |
| Vegetation | One existing `InstancedMesh` grass system; most trees/props are separate meshes | Reusable proof that instancing fits current architecture. |
| Physics | Fixed base collider plus player capsule and target proximity checks | Reliable story collision. Generated terrain collision requires explicit collider data. |
| State | Zustand persistence with migrations and save clamping | Good. Procedural seed must remain scene-configured, not save-randomized. |
| Accessibility | Keyboard, touch, reduced motion, visibility/text presets, guided first objective | Must survive renderer and world changes. |
| Tests | Vitest story/state/audio/cinematic tests; Playwright desktop and mobile WebKit journeys | Strong progression safety net. Missing deterministic generation, memory-cycle, Firefox, WebGPU parity tests. |

## Baseline measurement

Captured 2026-07-18 from production build on headless Chromium using software WebGL (`WebKit WebGL`). Numbers include player, current NPC, target beacon, shadows, physics, and HUD. Software-rendered FPS is a regression signal only—not a representative hardware-GPU claim.

| Metric | Legacy Chapter II | Prototype Chapter II | Change |
| --- | ---: | ---: | ---: |
| Scene-ready time | 3,021 ms | 3,064 ms | +1.4% |
| Draw calls/frame | 161 | 109 | -32.3% |
| Triangles/frame | 40,544 | 56,944 | +40.4% |
| Live WebGL buffers | 436 | 314 | -28.0% |
| Live WebGL textures | 7 | 7 | unchanged |
| Used JS heap | 27.6 MB | 23.1 MB | -16.3% snapshot |
| Instrumented software FPS | 6.1 | 5.3 | fails target; needs hardware validation |

Mobile-emulated prototype snapshot: 10.4 instrumented software FPS, 115 draw calls, 44,236 triangles, 338 live buffers, 18.2 MB used heap, 3,299 ms scene-ready. Playwright mobile WebKit smoke/audio suite passes. Real mid-range phone profiling remains required; emulation does not satisfy the 30 FPS acceptance target.

Texture audit: no authored texture maps are loaded; texture memory is currently render targets/internal renderer textures only. Exact GPU bytes require browser/GPU tooling unavailable to JavaScript. Seven live texture objects are recorded as proxy.

Default initial code payload after prototype: ~1.216 MB gzip JavaScript + 5.6 KB gzip CSS + 0.48 KB gzip HTML. Optional WebGPU prototype is isolated in a lazy ~189 KB gzip chunk and is not requested on default WebGL startup. Public audio totals ~2.1 MB but scene ambience is fetched per scene; source PDF (~852 KB) loads only when opened.

Evidence:

- [Legacy countryside](./evidence/procedural-world/countryside-before.png)
- [Procedural countryside](./evidence/procedural-world/countryside-after.png)
- [Procedural countryside — mobile layout](./evidence/procedural-world/countryside-mobile.png)
- [Lazyweb visual-direction report](https://www.lazyweb.com/report/lazyweb/179ff1da-99ec-4eea-ae89-9c61ae3c5e15/?source=create)
- Re-run: `npm run benchmark -- http://127.0.0.1:4173 2 5000`

## Reusable systems

- Story scene/step coordinates become authored procedural landmarks.
- Existing per-scene React selection becomes initial region boundary.
- Rapier collider layer remains authoritative for player safety.
- Existing palette, fog, light, ambience, visibility, and reduced-motion state feed biome profiles.
- Existing `InstancedMesh` pattern expands to trees, shrubs, grass, flowers, rocks, and distant forms.
- Existing bundle and secret checks remain release gates.

## Technical debt/risk register

1. Hero characters use many primitive meshes/materials. They dominate draw calls even after environmental instancing.
2. `Environments.tsx`, `Visuals.tsx`, and `story.ts` are large monoliths.
3. No asset manifest, GLB pipeline, license registry history, workers, region lifecycle, GPU timing, or memory-cycle test.
4. Software benchmark is reproducible but cannot establish real-device FPS.
5. WebGPU renderer remains experimental in Three.js and differs from `WebGLRenderer`; shader/material parity must be tested.
6. Rapier is the largest initial code chunk (~844 KB gzip).
7. Current scene-ready marker measures first rendered frame, not complete next-region preload.

## Phase gates

### Phase 1 — audit/prototype (current)

- Capability service and explicit flags.
- Opt-in `WebGPURenderer` prototype; verified WebGL 2 default/fallback.
- Deterministic Chapter II seed, path, exclusions, terrain, collider, scatter, instancing, atmosphere.
- Before/after evidence and automated deterministic tests.
- Gate to Phase 2: story tests pass, mobile remains usable, draw calls improve, no blocked objective.

### Phase 2 — countryside productionization

- Hardware benchmarks on representative desktop and mid-range phone.
- Tune triangle/density budgets and dynamic quality preset.
- Add worker-generated typed arrays and explicit region disposal.
- Verify every Chapter II landmark and all six objectives across multiple dev seeds.
- Do not expand to Slough until these gates pass.

### Later phases

Follow requested order: Slough → City outskirts → Mount Sinai/Wicket Gate → Cross → hero assets → compression/deployment. Each chapter gets its own benchmark and progression gate.
