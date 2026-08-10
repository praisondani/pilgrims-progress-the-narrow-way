# Asset Generation Pipeline

Current game uses code-authored primitives. Christian v20 is the latest runtime
img2threejs procedural fallback, with burden/face/profile evidence recorded in
`src/game/assets/hero/AUTHORED_ASSET_HANDOFF.md`; no generated hero GLB is
production-approved yet.

## Directory contract

```text
assets/
  source/       original Blender/generator output; never served
  production/   validated GLB
  lod/          LOD0/LOD1/LOD2 or impostors
  textures/     KTX2 production textures plus editable sources outside served tree
  animation/    source clips and retarget maps
  collision/    simplified named collision proxies
  registry/     machine-readable metadata
```

## Promotion checklist

1. Preserve source and prompt/tool/version.
2. Record creator, license, acquisition date, and proof URL/file.
3. Inspect topology; remove hidden/invalid geometry.
4. Correct normals, UVs, pivots, axis, and metric scale.
5. Retopologize; cap materials; atlas where useful.
6. Bake and compress textures to KTX2; keep source masters out of public build.
7. Rig against shared humanoid skeleton; validate burden attachment bone behind Christian.
8. Retarget idle/walk/jog/interact/dialogue animations.
9. Export GLB; test Meshopt. Use Draco only after decode/startup comparison.
10. Produce LODs and collision proxy.
11. Measure triangles, materials, textures, bytes, animation list, and decode time.
12. Add registry entry and automated manifest validation before merge.

## Initial budgets

- Hero LOD0: target 25k–45k triangles, <=4 materials, <=2×2K texture sets.
- Hero LOD1: <=15k triangles; LOD2: <=5k.
- Background NPC: <=10k/4k/1.5k.
- Modular prop: 300–8k depending on screen size.
- Collision: simple primitives first; dedicated low-poly mesh only when required.

Generated output is a source—not a shippable asset—until all checks pass. The
v20 isolated runtime review is intentionally recorded as a 3.4/10 fail: the
procedural hero is 13,732 triangles and still below the 19–24k authored-hero
target, with body and roll below their per-primitive targets. Keep the API,
sockets, colliders, LOD contract, and procedural fallback while a licensed DCC
sculpt/GLB is produced and reviewed from front, profile, rear, and 96 px views.
