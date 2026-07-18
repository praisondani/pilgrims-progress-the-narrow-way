# Performance Budgets

## Runtime targets

| Metric | Desktop medium | Mid-range mobile |
| --- | ---: | ---: |
| FPS | 60 at 1080p | 30 at native CSS viewport |
| Visible draw calls | <150, stretch <120 | <100 |
| Frame time p95 | <18 ms | <34 ms |
| Main-thread generation task | <8 ms | <8 ms |
| Scene transition blocking | <1.5 s warm / <3 s cold | <2.5 s warm / <5 s cold |
| Renderer textures | no unbounded growth | no unbounded growth |
| Heap after 10 region cycles | within 10% of settled baseline | within 15% |

## Quality presets

- **Low:** 0.45–0.5 vegetation density, reduced terrain segments, 1× DPR cap, simple particles/weather, 512px shadows.
- **Medium:** 0.7 vegetation density, normal terrain, 1.5× DPR cap, limited weather, 1024px shadows.
- **High:** full density, farther terrain, richer weather, up to 2× DPR after stable-frame test, 2048px shadows.
- **Auto:** capability recommendation at boot, then downshift after sustained p95 miss. Never upshift during a story cinematic.

## Bundle budgets

- Default initial JS: keep <=1.35 MB gzip while Rapier remains bundled.
- Optional WebGPU chunk: lazy only; <=250 KB gzip until enabled by default.
- Per-region new assets: critical <=1.5 MB compressed; nearby/background deferred.
- No full-book PDF or future-region audio/model prefetch during game startup.

## Measurement limits

`tools/benchmark-runtime.mjs` records repeatable scene-ready time, software FPS, draw calls, estimated triangles, resource bytes, JS heap, and live WebGL resource counts. Headless SwiftShader FPS is not a real-device FPS claim. Release sign-off needs Chrome DevTools/WebGPU tooling on physical desktop plus Safari remote profiling on a representative phone.
