# Procedural Scene Authoring

## Rule

Story data owns landmarks. Procedural data owns only enrichment around them.

## Scene recipe

1. Choose immutable default seed: `<scene>-v<revision>-<story anchor>`.
2. Map every scene step to `StoryLandmark` using its existing position.
3. Author a path spline through intended approach views.
4. Set flatten/exclusion radii around landmarks.
5. Select biome profile and explicit weather sequence.
6. Generate terrain; flatten path and landmark masks.
7. Scatter by biome/slope/moisture/path/landmark rules using `SeededRandom` only.
8. Generate typed geometry/collider data from same seed.
9. Validate route width and every objective on low/high density.
10. Capture seed, counts, draw calls, triangles, screenshot, and test result.

Never call `Math.random()` in `src/game/procedural`.

## Development controls

- Override seed: `?seed=<value>`.
- Disable advanced prototype: `?advanced-terrain=0`.
- Renderer prototype: `?webgpu=1`.
- Planned dev HUD: biome/path/exclusion/scatter/wireframe/LOD overlays, counts, timing, backend, quality, weather.

## Chapter II prototype

- Default seed: `field-v1-1678`.
- Path: fixed five-point route from arrival edge to Evangelist/light direction.
- Landmarks: all six existing Chapter II step positions.
- Terrain collider: triangle mesh built from same height field.
- Instancing: trunks, crowns, shrubs, grass, flowers, rocks, mountains, clouds.
- Atmosphere: one point-particle field plus lightweight birds.
- Mobile: lower terrain segments and ~48% density.

Acceptance: same seed equals same arrays; no instance enters path or landmark exclusion; all six story interactions remain reachable.
