# Dream environment kit

Isolated, deterministic R3F environment for Prologue scene, keyed to
`public/studio-evidence/environment-reference/dream-keyframe-v1.png`. Composition stays
authored: ten fixed anchors own explicit dressing slots. Seed changes only
position jitter (maximum 0.18 world units), yaw, scale, and color variant.

## Integration API

```tsx
import {
  DreamAtmosphere,
  DreamEnvironmentKit,
} from "./assets/environment/dream";

<DreamEnvironmentKit
  seed="dream-v2-bunyan-wilderness"
  quality="medium"
  water="ink"
  lanternLit={stepIndex > 0}
  reducedMotion={reducedMotion}
/>
```

`DreamEnvironmentKit` defaults to `atmosphere="none"` so current World fog and
lights remain authoritative. Use `DreamAtmosphere` separately, or pass
`atmosphere="fog"` / `"fog-and-lights"`, when scene ownership moves into this
kit. `includeBackground` is opt-in.

Water styles:

- `dry`: no stream draw or material.
- `ink`: rough, dark stream surface.
- `moonlit`: narrow blue physical surface with restrained emissive lift and
  clearcoat response.

Quality presets preserve all priority-0 silhouette and landmark framing slots.
Medium adds priority-1 support. High adds priority-2 micro-detail. Low always
uses far LOD. Medium/high switch with hysteresis. `World` mounts the
medium-quality terrain collision descriptors alongside the ground body; Dream
guided travel advances through `DREAM_PATH_CONTROL_POINTS` so the navigation
cue uses the visible crossing rather than cutting directly through the set.

## Environment contribution budget

| Preset | LOD checked | Instances max | Draw calls max | Triangles max | Point lights | Textures |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Low | far | 54 | 13 | 2,600 | 1 | 0 |
| Medium | near | 96 | 15 | 7,000 | 1 | 0 |
| High | near | 120 | 15 | 8,500 | 1 | 0 |

Budget covers dressing, lantern, stream, and motes. It is an environment
contribution below global scene limits in `docs/performance-budgets.md`, not a
whole-frame claim. `performance.test.ts` computes triangle counts from actual
Three.js geometries and rejects budget overruns.

Integrated medium runtime uses far LOD at initial camera distance:
61 visible instances, 12 draw calls, 3,234 triangles, one point light, and zero
textures. Near LOD remains the budget worst case at 83 instances, 14 draw calls,
and 6,850 triangles.

Resources are owned by one pool, retained by mounted kit, and explicitly
disposed after final release. Deferred release survives React Strict Mode effect
replay without leaking replaced pools.

## Composition review

`DREAM_KEYFRAME_ANCHORS` exposes arrival, S-curve crossing, lantern shrine,
moss arch, den, book, and threshold positions. `DREAM_COMPOSITION_VIEWS`
defines lantern, den, book, and threshold approach
headings. Each focal clearing has two authored cardinal groves that straddle its
camera axis. Initial profile matches camera `[0, 7.95, 18.5]` and player spawn
`[0, 0, 7]`; blocking props stay outside a three-metre spawn bubble. Tests
verify all five views, all clearances, stable slot identity
across seeds, and deterministic quality reduction.
