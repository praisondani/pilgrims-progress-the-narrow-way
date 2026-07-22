# img2threejs asset workflow

This project pins [`hoainho/img2threejs`](https://github.com/hoainho/img2threejs) v1.2.0 at commit `e8ff28a6ae0cb534c7b2ebc15cb3f06709262d5b` as a Git submodule under `tools/img2threejs`.

It is an offline development pipeline—not browser runtime code. Nothing under `tools/` or `.asset-work/` enters the Vite production bundle.

## Setup

```bash
git submodule update --init --recursive
npm run asset:3d:test
```

Requirements: Python 3.10+ standard library. No API key, cloud service, pip package, or environment secret is required.

## Start an asset

Use a clean object image or character turnaround whose reuse rights are known:

```bash
npm run asset:3d -- init christian-turnaround ./references/christian.png complex character
npm run asset:3d -- init wicket-gate ./references/wicket-gate.png moderate object
```

Allowed complexity: `simple`, `moderate`, `complex`, `ultra-complex`. Allowed domain: `object`, `character`, `hybrid`.

Intake files go to ignored `.asset-work/img2threejs/<asset-id>/`:

- technical image probe
- pre-spec assessment and quality contract
- 3×3 detail crops and detail inventory
- anatomy landmarks/overlay for characters
- starter `ObjectSculptSpec`
- provenance manifest with upstream version and unverified-license block

The wrapper never copies the reference image into tracked source. This prevents accidentally publishing an unlicensed image in the public repository.

## Build gates

1. Agent visually inspects reference and crops.
2. Fill assessment, detail inventory, anatomy (characters), component tree, materials, sockets, colliders, and feature targets.
3. Validate:

   ```bash
   npm run asset:3d -- validate christian-turnaround
   ```

4. Generate current unlocked pass:

   ```bash
   npm run asset:3d -- generate christian-turnaround
   ```

5. Render generated factory in game preview.
6. Capture reference/render comparison; review proportions, silhouette, face, attachments, materials, performance, and critical features.
7. Repeat locked passes until review gates pass.
8. Promote approved TypeScript factory into `src/game/assets/generated/`.
9. Add exact reference rights, tool commit, triangle/draw-call/material budgets, review evidence, and production path to `docs/asset-license-registry.md`.

Generated code is a review candidate, not production-approved art. One image cannot reveal hidden geometry. For Christian, front, side, rear, and neutral-pose references are strongly preferred.

## React Three Fiber integration

Generated factory returns a `THREE.Group`. Mount it through a memoized primitive and dispose cloned geometry/material resources on teardown:

```tsx
const model = useMemo(() => createChristianModel(spec, options), [spec, options]);
return <primitive object={model} />;
```

Expose animation sockets, burden attachment, colliders, and named nodes through `model.userData.sculptRuntime`. Christian’s burden socket must remain behind torso until Cross chapter removes it.

## Updating upstream

Review changelog, license, and forge code before changing pin:

```bash
git -C tools/img2threejs fetch origin main
git -C tools/img2threejs checkout <reviewed-commit>
npm run asset:3d:test
git add tools/img2threejs
```

Update pinned commit in this document, wrapper provenance, and license registry in same commit.
