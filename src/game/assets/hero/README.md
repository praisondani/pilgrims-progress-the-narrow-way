# Christian authored hero

Production runtime asset for the playable protagonist. The unified skinned
surface follows
`christian-turnaround-v1`: near-seven-head adult proportions, tousled hair and
beard, linen undershirt, worn rust tunic, dark trousers, calf wraps, boots,
leather harness, and a large rope-bound burden.

## Controller integration contract

- `PilgrimHero` accepts the current `Character` props used by `Player.tsx`:
  `variant="christian"`, `walking`, `burden`, `hasRoll`, `equipped`, and
  `scale`.
- Model origin is foot-ground center. `+Y` is up and `+Z` is forward.
- Keep the current wrapper transform
  `position={[0, -0.58, 0]} rotation={[0, Math.PI, 0]}` during the initial
  integration.
- Existing Rapier `CapsuleCollider args={[0.42, 0.38]}` remains authoritative.
  Runtime metadata mirrors it as collider `controller` at hero-local
  `[0, 0.58, 0]`.
- Parent controller continues to own yaw, impact lean, translation, jumping,
  and physics. Hero runtime owns only local gait, breathing, burden lean,
  accessory visibility, and facial expression.
- Use `ref` or `onReady` to receive `HeroRuntime`. Attach props/effects to
  `runtime.getSocket(...)`; never search visual mesh names.

```tsx
const hero = useRef<HeroRuntime>(null);

<PilgrimHero
  ref={hero}
  variant="christian"
  walking={walking}
  burden={burdenWeight}
  hasRoll={hasRoll}
  equipped={equipment.length > 0}
/>
```

## Runtime guarantees

- Named joint-root pivots for spine, head, jaw, arms, and legs.
- Stable burden, hand, action, belt, head, chest, and foot sockets.
- Explicit attachment and controller-collider descriptors.
- One unified skinned, vertex-colored body surface with embedded facial
  regions and four expression morph targets.
- One burden mesh, one optional sealed-roll mesh, and one optional equipment
  mesh: four render meshes, four materials, and four draw calls at full state.
- One gameplay topology. Runtime visibility changes do not rebuild geometry.
- Facial expression presets plus channel weights for smile, concern, effort,
  squint, and blink.
- Idempotent disposal of owned geometry, materials, and textures.
- JSON-safe `root.userData.sculptRuntime` metadata. Live maps and update
  function are available as non-enumerable properties on that object.

`HeroSculptSpec` remains overrideable. Reviewed dimensions and palette can
change without altering controller code, sockets, colliders, or runtime
identifiers.
