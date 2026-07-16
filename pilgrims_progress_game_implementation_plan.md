# The Pilgrim’s Progress — 3D Browser Game
## Game Design and Technical Implementation Plan for the Development Agent

**Working title:** *Pilgrim’s Progress: The Narrow Way*  
**Format:** Single-player, story-driven 3D browser game  
**Primary platform:** Desktop and mobile web browsers  
**Source:** *The Pilgrim’s Progress, Part One* by John Bunyan  
**MVP target:** City of Destruction through the Cross  
**Long-term target:** Christian’s complete journey to the Celestial City

---

## 1. Product Vision

Build a beautiful, interactive 3D adaptation of John Bunyan’s *The Pilgrim’s Progress* that lets the player experience Christian’s journey rather than merely read a summary of it.

The game should combine:

- Third-person exploration
- Environmental storytelling
- Dialogue and narrated story excerpts
- Simple physics-driven challenges
- Symbolic puzzles
- Meaningful choices
- Light stealth, traversal, and combat-like encounters
- A story journal explaining characters, places, symbols, and biblical themes
- A visually memorable transition from darkness and oppression toward light and hope

The game is not intended to be a combat-heavy action game. Its primary loop is:

> Explore → observe → interact → make a decision → overcome a symbolic trial → understand its meaning → continue the journey.

Every mechanic must reinforce the story’s allegory.

---

## 2. MVP Scope

The MVP should form a polished 30–45 minute vertical slice containing:

1. Prologue: The Dreamer
2. City of Destruction
3. The Field and Evangelist
4. The Slough of Despond
5. Mr. Worldly Wiseman and Mount Sinai
6. The Wicket Gate
7. The Interpreter’s House
8. The Highway and the Cross
9. MVP ending cinematic and world-map preview

This ending gives the MVP a satisfying transformation:

- Christian begins burdened, fearful, and trapped.
- He leaves home and repeatedly loses his way.
- He learns how to recognize truth and deception.
- He reaches the Cross.
- His burden falls away.
- The player sees the larger journey still ahead.

Do not attempt the complete book until the MVP’s controls, camera, scene-loading, dialogue, saving, performance, and asset pipeline are stable.

---

## 3. Recommended Technology Stack

### Core framework

Use:

- TypeScript
- Vite
- React
- Three.js through React Three Fiber
- `@react-three/drei`
- Zustand for game state
- XState or a typed finite-state-machine layer for scene and quest progression
- Rapier through `@react-three/rapier`
- Howler.js or Web Audio API for music, ambience, and dialogue
- glTF/GLB as the standard 3D asset format
- Blender for authored models and animation
- glTF Transform for optimization
- KTX2/Basis Universal for compressed textures
- Meshopt and/or Draco compression where beneficial
- Vitest for logic tests
- Playwright for browser-level tests

Prefer React Three Fiber over raw Three.js for this project because the experience includes many stateful scenes, UI overlays, transitions, interactable components, and reusable level systems. Keep rendering-specific logic isolated so lower-level Three.js APIs remain available where needed.

### Rendering policy

Begin with WebGL 2 as the supported baseline. Treat WebGPU as a future enhancement, not an MVP requirement.

### Asset policy

Use `.glb` for production models.

Every asset must have:

- A source file
- A production export
- A license record
- A named owner or generation method
- Polygon and texture budgets
- Collision strategy
- LOD strategy where relevant

---

## 4. Visual Direction

### Art style

Use a stylized painterly 3D style rather than photorealism.

Recommended qualities:

- Hand-painted surfaces
- Slightly exaggerated silhouettes
- Storybook proportions
- Soft volumetric light
- Strong color scripting
- Detailed focal areas with simplified distant scenery
- Natural materials: worn cloth, leather, wood, stone, fog, mud, firelight
- Limited but deliberate particle effects
- Cinematic framing without sacrificing browser performance

Reference mood:

- Illustrated classic literature
- Medieval English countryside blended with dream imagery
- Diorama-like environments
- Symbolic scale and impossible architecture
- Environments that visually embody spiritual conditions

Avoid:

- Generic fantasy RPG visuals
- Excessive HUD elements
- Realistic gore
- Constant fighting
- AI-generated-looking asset inconsistency
- Flat scenes made only from primitives
- Overuse of bloom or fog to hide weak art

### Color progression

Use color as a narrative system:

| Story phase | Palette |
|---|---|
| City of Destruction | Soot, dim amber, bruised purple, ash gray |
| Open field | Cold blue dawn with distant warm light |
| Slough of Despond | Green-black mud, gray fog, weak reflected sky |
| Worldly Wiseman | Attractive warm village colors hiding harsh stone |
| Mount Sinai | Pale stone, lightning white, deep shadow |
| Wicket Gate | Warm candlelight, aged wood, safe gold |
| Interpreter’s House | Varied symbolic rooms with controlled theatrical lighting |
| Cross | Dawn gold, clean blue sky, green hillside, white light |

---

## 5. Core Player Experience

### Camera

Implement a responsive third-person camera:

- Mouse movement or right-stick-style drag rotates camera
- Scroll wheel adjusts zoom within limits
- Camera automatically avoids walls
- Camera soft-locks during conversations
- Camera shifts to authored cinematic rails during key moments
- Mobile uses touch drag and optional camera recenter button
- Reduce camera shake option
- First-person inspection mode may be added later

### Movement

Desktop:

- WASD or arrow keys
- Shift to jog
- Space to jump or contextual traverse
- E to interact
- Tab or J to open journal
- Esc to pause

Mobile:

- Left virtual joystick
- Right-side camera drag
- Contextual interaction button
- Optional tap-to-move accessibility mode

Movement should feel grounded and deliberate, not arcade-fast.

### Burden mechanic

Christian begins with a visible burden attached to his back.

The burden affects:

- Acceleration
- Maximum slope
- Jump height
- Stamina recovery
- Mud resistance
- Animation posture
- Breathing audio
- Camera framing
- Interaction dialogue

Do not make this frustrating. It is a narrative mechanic, not a punishment.

Display burden state through animation and sound rather than a large numeric meter.

### Interaction system

Create a reusable interaction interface:

```ts
interface Interactable {
  id: string;
  prompt: string;
  range: number;
  canInteract: (state: GameState) => boolean;
  interact: (context: InteractionContext) => void;
}
```

Supported interactions:

- Talk
- Read
- Inspect
- Pick up
- Push or pull
- Climb
- Open
- Knock
- Choose
- Pray or reflect
- Use a story item
- Trigger a memory or vision

Show only one context-sensitive prompt at a time.

### Dialogue

Use a data-driven dialogue system supporting:

- Speaker name
- Portrait or 3D speaker focus
- Voice-over clip
- Subtitle
- Player responses
- Conditional branches
- Story flags
- Journal unlocks
- Camera cues
- Animation cues
- Audio cues
- Optional original Bunyan wording
- Optional simplified explanation

Dialogue choices may change the route, timing, or lesson but should not rewrite the book’s essential destination.

### Story explanation modes

Offer three text modes:

1. **Story mode:** concise modern narration
2. **Classic mode:** selected public-domain Bunyan passages
3. **Study mode:** story plus symbolism and biblical references

Let the player switch modes at any time.

### Journal

Create these sections:

- Journey map
- Current objective
- People
- Places
- Symbols
- Story recap
- Collected passages
- Biblical themes
- Accessibility and controls

Each unlock should be short and readable. Avoid interrupting gameplay with long essays.

---

## 6. Game Architecture

Use a scene-oriented architecture.

```text
src/
  app/
  game/
    core/
      Game.tsx
      GameLoop.ts
      GameState.ts
      EventBus.ts
      SaveSystem.ts
      InputManager.ts
      AudioManager.ts
      AssetManager.ts
      PerformanceManager.ts
    player/
      PlayerController.tsx
      PlayerAnimator.tsx
      BurdenSystem.ts
      CameraRig.tsx
    scenes/
      prologue/
      city-of-destruction/
      evangelist-field/
      slough-of-despond/
      worldly-wiseman/
      wicket-gate/
      interpreters-house/
      cross/
    systems/
      dialogue/
      quests/
      interaction/
      checkpoints/
      narration/
      cutscenes/
      journal/
      objectives/
      hints/
    components/
      interactables/
      environment/
      characters/
      effects/
    content/
      scenes/
      dialogue/
      journal/
      localization/
    ui/
  assets/
    source/
    models/
    textures/
    audio/
    dialogue/
    fonts/
  tools/
  tests/
```

### Scene manifest

Each level should expose a typed manifest:

```ts
interface SceneManifest {
  id: string;
  title: string;
  bundle: string[];
  spawnPoint: Transform;
  checkpoints: CheckpointDefinition[];
  objectives: ObjectiveDefinition[];
  dialogueFiles: string[];
  musicCue: string;
  lightingProfile: string;
  nextScene?: string;
}
```

### Scene state machine

Every scene should use clear phases:

```text
unloaded
→ preloading
→ entering
→ playable
→ scripted-event
→ objective-complete
→ exiting
→ unloaded
```

Avoid scattering progression booleans across React components.

### Event system

Use typed domain events:

```ts
type GameEvent =
  | { type: "PLAYER_ENTERED_ZONE"; zoneId: string }
  | { type: "DIALOGUE_COMPLETED"; dialogueId: string }
  | { type: "OBJECTIVE_COMPLETED"; objectiveId: string }
  | { type: "ITEM_COLLECTED"; itemId: string }
  | { type: "CHECKPOINT_REACHED"; checkpointId: string }
  | { type: "SCENE_COMPLETED"; sceneId: string };
```

---

## 7. Scene-by-Scene MVP Implementation

## Scene 0 — The Dreamer

### Goal

Establish that the game is an allegorical dream and teach camera interaction.

### Environment

- Dark wilderness
- Rock or den
- Wind through grass
- Small lantern
- Distant road appearing in mist

### Gameplay

- Player initially controls the Dreamer in a tiny exploration area.
- Inspect the den, book, lantern, and distant path.
- Lie down to sleep.
- Transition into an ink-and-paper cinematic.
- Camera moves through the page into the City of Destruction.

### Assets

- Dreamer character
- Bedroll
- Lantern
- Rock den
- Book
- Grass and trees
- Fog and firefly particles

### Acceptance criteria

- Camera and movement tutorial takes under three minutes.
- Scene transition hides loading.
- The player understands that the following events are a dream.

---

## Scene 1 — City of Destruction

### Goal

Introduce Christian, the burden, interaction, dialogue, and the motivation to leave.

### Environment

- Dense crooked streets
- Christian’s modest home
- Market square
- City walls
- Smoke and distant rumbling
- Subtle environmental instability

### Gameplay

1. Player reads the Book inside Christian’s home.
2. Burden materializes and attaches to his back.
3. Movement becomes heavier.
4. Speak with wife and children.
5. Explore the city and hear dismissive NPC reactions.
6. Follow a distant light or voice toward the edge of the city.
7. Make the irreversible decision to leave.
8. Obstinate and Pliable pursue Christian outside the gate.

### Interactive details

- Household objects reveal Christian’s affection for his family.
- Citizens offer distractions or mockery.
- The city occasionally shakes.
- The player may try to return home, triggering an internal narration line rather than a failure screen.

### Artifacts

- Christian model: burdened and unburdened variants
- Wife and children
- Six reusable town NPCs with palette variants
- Home interior kit
- Street and market modular kit
- City wall and exit
- Book and burden
- Fire, smoke, ash, dust particles

### Acceptance criteria

- Player can complete the scene without reading every optional interaction.
- Emotional motivation is clear.
- Burden has visible gameplay impact.
- NPC dialogue never traps progression.

---

## Scene 2 — The Field and Evangelist

### Goal

Teach navigation, objective markers, and dialogue choices.

### Environment

- Open field outside the city
- Long horizon
- Small distant light
- Narrow path partially hidden in grass

### Gameplay

1. Obstinate argues with Christian.
2. Player chooses responses reflecting conviction, uncertainty, or fear.
3. Obstinate returns.
4. Pliable joins temporarily.
5. Evangelist appears and points toward the Wicket Gate and shining light.
6. Player uses environmental landmarks rather than a floating waypoint.
7. Enter the marshland.

### Design rule

The shining light should be an in-world guide. Avoid a large minimap arrow.

### Assets

- Evangelist
- Obstinate
- Pliable
- Field vegetation
- Distant light VFX
- Path decals
- Wind and bird ambience

---

## Scene 3 — The Slough of Despond

### Goal

Deliver the first physics and traversal challenge.

### Environment

- Wide mud basin
- Broken boards
- Reeds
- Dead branches
- Fog
- Half-submerged discarded objects
- Safe stones and unstable ground

### Mechanics

- Mud depth affects movement.
- Burden increases sinking.
- Some surfaces deform or wobble.
- Player uses branches, stones, and boards to cross.
- Physics objects can be pushed into place.
- Falling too deep triggers a short rescue/reset, not death.
- Pliable abandons Christian after struggling.
- Help pulls Christian out near the far side.

### Puzzle structure

1. Learn shallow mud movement.
2. Push a plank over a narrow gap.
3. Balance across unstable stones.
4. Lose the safe path during a fog surge.
5. Use audio and light to find the exit.
6. Final scripted sink and rescue by Help.

### Physics requirements

- Rapier character controller
- Buoyancy-like resistance approximation
- Moving rigid-body planks
- Trigger volumes for mud depth
- Stable recovery from tunneling or stuck states
- Checkpoint before final section

### Performance rule

Do not simulate the entire mud surface. Use shader displacement and localized physics objects.

### Assets

- Mud shader
- Reeds and dead vegetation
- Boards, barrels, branches, rocks
- Help character
- Fog cards or volumetric approximation
- Splash and mud particles

### Acceptance criteria

- Challenge remains readable on low graphics.
- Mobile controls can complete it.
- No physics object can permanently block the route.
- Reset places objects and player into a valid state.

---

## Scene 4 — Mr. Worldly Wiseman and Mount Sinai

### Goal

Teach that a route can look easier while leading away from the intended path.

### Environment

Two contrasting spaces:

1. Pleasant road toward the Village of Morality
2. Severe mountain path beneath Mount Sinai

### Gameplay

1. Meet Mr. Worldly Wiseman at a crossroads.
2. He offers a comfortable alternative.
3. The game permits the player to follow him.
4. Music becomes reassuring.
5. The burden becomes temporarily less noticeable.
6. The path narrows beneath an enormous mountain.
7. Falling stones and lightning create a traversal sequence.
8. The burden feels heavier again.
9. Evangelist confronts and redirects Christian.

### Interaction design

This is not a “wrong choice = game over” branch. The player experiences the consequence and learns through the scene.

### Physics

- Falling debris is primarily authored animation with limited rigid bodies.
- Use hazard telegraphs.
- No realistic crushing.
- Checkpoint before the mountain sequence.

### Assets

- Mr. Worldly Wiseman
- Roadside signpost
- Village vista
- Mount Sinai cliff kit
- Lightning VFX
- Falling rock variants
- Evangelist confrontation cinematic

---

## Scene 5 — The Wicket Gate

### Goal

Provide relief, safety, and a memorable interactive transition.

### Environment

- Narrow approach
- High walls
- Weathered wooden gate
- Warm light through cracks
- Arrows striking nearby from Beelzebub’s castle
- Safe courtyard beyond

### Gameplay

1. Navigate the exposed approach.
2. Use rocks and ruined walls for cover.
3. Knock on the gate.
4. Goodwill opens it and pulls Christian inside.
5. Short conversation explains why Christian was in danger.
6. Player explores the courtyard and receives directions to the Interpreter.

### Mechanic

The arrow sequence uses readable environmental hazards, not weapon combat.

### Assets

- Wicket Gate
- Goodwill
- Distant fortress silhouette
- Arrow projectiles and impact decals
- Courtyard props
- Warm lanterns

### Acceptance criteria

- Knock interaction is unmistakable.
- Goodwill’s pull-in animation transitions cleanly from player control.
- Scene communicates refuge without losing forward momentum.

---

## Scene 6 — The Interpreter’s House

### Goal

Create the MVP’s centerpiece: a sequence of symbolic interactive rooms.

### Hub

- Candlelit entrance hall
- Doors to lesson rooms
- Interpreter guides the player
- The player may revisit completed rooms before leaving

### Room A: The Portrait

Inspect a portrait of the true guide.

Interaction:

- Rotate light or open shutters to reveal details.
- Interpreter explains the qualities represented.

### Room B: The Dusty Parlor

Gameplay:

1. NPC sweeps a dusty room.
2. Dust grows worse and obscures vision.
3. Player opens the door for the maiden who sprinkles water.
4. Dust settles and the room becomes clean.

Purpose:

- A simple cause-and-effect environmental puzzle.

### Room C: Passion and Patience

Gameplay:

- Observe two children.
- Passion receives treasure immediately and wastes it.
- Patience waits.
- Player can inspect objects before and after the transformation.

Purpose:

- Teach delayed reward through visual storytelling.

### Room D: Fire Against the Wall

Gameplay:

- An enemy figure throws water on a fire from one side.
- Player investigates behind the wall.
- A hidden figure continuously feeds oil to the flame.

Purpose:

- Use occlusion and discovery to explain unseen sustaining grace.

### Room E: The Warrior at the Palace

Gameplay:

- A brief nonlethal courage sequence.
- Player picks up symbolic armor and advances through opponents.
- Focus on blocking, timing, and resolve rather than violence.
- Reaching the palace door completes the lesson.

For MVP simplicity, this may be a stylized vision rather than a full combat system.

### Room F: The Iron Cage

Gameplay:

- Dialogue and inspection only.
- Maintain a solemn tone.
- Give the player the option to step away.
- Avoid horror presentation.

### Room G: The Final Dream

Gameplay:

- Short dreamlike sequence showing judgment and urgency.
- Abstract silhouettes, distant trumpet, changing sky.
- Return to the hall.

### Technical design

Each room should be an independently loadable sub-scene sharing the same house shell.

Use portals or controlled door transitions to unload rooms behind the player.

### Assets

- Interpreter
- House modular kit
- Portrait
- Dust room props and dust particles
- Passion and Patience models
- Treasure props
- Fire and wall mechanism
- Palace vision kit
- Symbolic armor
- Cage
- Dream sky and silhouettes

### Acceptance criteria

- Every room has one clear interaction.
- Every interaction has an explanation.
- Player can skip extended commentary.
- Rooms unload without memory leaks.
- A scene-select debug menu can launch each room independently.

---

## Scene 7 — The Highway and the Cross

### Goal

Complete the MVP with a powerful transformation.

### Environment

- Dawn road
- Rising hill
- Cross at the summit
- Open grave below
- Three Shining Ones
- Distant landscape showing future destinations

### Gameplay

1. Walk uphill while burden mechanics intensify.
2. Hear fragments of earlier doubts.
3. Reach the Cross.
4. A cinematic begins without requiring a button press at the exact spot.
5. The burden detaches.
6. It rolls down the hill into the open grave.
7. Character posture, movement, music, lighting, and camera all change.
8. The Shining Ones greet Christian.
9. Christian receives new clothing, a sealed roll, and a mark.
10. Player freely runs and explores a small overlook.
11. Telescope interaction previews future locations.
12. End card: “The journey has only begun.”

### Physics

The burden roll should be authored enough to remain reliable:

- Use a guided spline or constrained rigid body.
- Synchronize sound and camera.
- Ensure it reaches the grave on every device.
- Provide a fallback scripted animation.

### Emotional polish

Before burden removal:

- Narrow field of view
- Heavy breathing
- Darker vignette
- Slower animation
- Low-frequency audio

After burden removal:

- Wider field of view
- Upright animation
- Faster response
- More birds and wind
- Clearer color
- Musical resolution
- Subtle particle lift

### Acceptance criteria

- Transformation is immediately felt in control and presentation.
- Sequence survives reload from checkpoint.
- Credits and next-level preview appear after player-controlled exploration, not immediately after the cinematic.

---

## 8. Full-Game Level Roadmap

After the MVP, implement levels in this order:

1. Hill Difficulty and the Arbor
2. Palace Beautiful
3. Valley of Humiliation and Apollyon
4. Valley of the Shadow of Death
5. Faithful and the road to Vanity
6. Vanity Fair
7. Hopeful and By-Path Meadow
8. Doubting Castle and Giant Despair
9. Delectable Mountains
10. Enchanted Ground
11. Country of Beulah
12. River of Death
13. Celestial City

Use the companion story document as the narrative blueprint.

---

## 9. Character and Animation Plan

### Christian animation set

Required MVP clips:

- Idle burdened
- Walk burdened
- Jog burdened
- Turn burdened
- Climb burdened
- Push
- Pull
- Stumble
- Sink
- Reach for help
- Kneel
- Read book
- Talk variants
- Knock
- Block or defend
- Idle unburdened
- Walk unburdened
- Run unburdened
- Look upward
- Receive item
- Celebrate quietly

Use animation layers for:

- Head look-at
- Facial expression
- Hand IK
- Burden sway
- Breathing

### NPC strategy

Create one high-quality base humanoid rig and produce controlled variants.

Do not reuse identical faces for major named characters.

Named characters need distinct:

- Silhouette
- Color palette
- gait
- idle motion
- voice
- facial profile
- symbolic prop

---

## 10. Asset Creation Instructions

The agent must create and maintain an asset registry:

```json
{
  "id": "char_christian_burdened",
  "type": "character",
  "source": "assets/source/christian.blend",
  "export": "assets/models/christian.glb",
  "license": "original",
  "triangles": 42000,
  "textures": ["2k_basecolor", "2k_normal", "1k_orm"],
  "lods": [0, 1, 2],
  "animations": ["idle_burdened", "walk_burdened"]
}
```

### Creation hierarchy

1. Create primitives and graybox assets first.
2. Validate scale, gameplay, and camera.
3. Replace hero objects with authored Blender assets.
4. Replace repeated environment objects with optimized asset packs or original procedural variants.
5. Optimize before final integration.
6. Never block mechanics work while waiting for polished art.

### Permitted asset sources

Use:

- Original Blender work
- Procedural geometry
- Licensed asset libraries
- CC0 materials and models
- Carefully curated generated concept art as reference
- Generated textures only after visual consistency review

Do not place unverified downloaded assets into the repository.

### Asset generation tools

Recommended:

- Blender
- Geometry Nodes
- Substance 3D Painter or ArmorPaint
- Material Maker
- Krita
- GIMP
- Audacity or Reaper
- Poly Haven for CC0 HDRIs and materials
- Kenney assets for temporary prototypes
- Mixamo only for temporary or appropriately licensed animation prototyping
- glTF Transform CLI
- KTX-Software
- Blender glTF exporter

---

## 11. Physics Plan

Use physics only where it improves interaction.

### Required physics

- Character grounding and slopes
- Mud-zone resistance
- Pushable planks and branches
- Falling small rocks
- Arrow projectile visuals
- Door and gate triggers
- Burden rolling sequence
- Basic collision and overlap queries

### Avoid full simulation for

- Buildings
- Entire forests
- Large mountain collapse
- Clothing
- Hair
- Dense crowds
- Every decorative prop

### Character controller requirements

- Step height
- Slope limit
- Ground snapping
- Coyote time
- Stable moving-platform behavior
- Recovery if stuck
- Teleport to checkpoint if falling out of bounds
- Separate visual mesh from physics capsule
- Fixed timestep simulation with interpolation

---

## 12. Asset Loading and Scene Streaming

### Loading strategy

- Load shell, player, collision, and essential audio first.
- Load decorative assets afterward.
- Preload the next scene during dialogue or a narrow transition.
- Keep only the current scene, nearby transition space, and shared assets in memory.
- Dispose geometries, materials, textures, audio buffers, mixers, and render targets explicitly.
- Use a loading screen with illustrated story fragments, not a generic spinner.

### Bundle structure

```text
shared-player
shared-ui
shared-audio
scene-city
scene-field
scene-slough
scene-worldly
scene-gate
scene-interpreter
scene-cross
```

### Texture rules

- Prefer KTX2 for production.
- Pack roughness, metallic, and ambient occlusion where practical.
- Use 2K textures only for major foreground assets.
- Use 1K or smaller for repeated props.
- Use atlases for environment kits.
- Keep UI textures separate from world textures.

### Model rules

- Use instancing for repeated vegetation and props.
- Use LODs for trees, buildings, and major distant forms.
- Merge static geometry by material where appropriate.
- Use baked lightmaps selectively for interiors.
- Use Meshopt or Draco after measuring decode and size tradeoffs.

---

## 13. Performance Targets

### Desktop target

- 60 FPS on a recent integrated-GPU laptop at 1080p medium settings
- First meaningful scene under 5 seconds on a normal broadband connection after cache
- Initial compressed transfer target under 12 MB for the first playable scene
- No uncontrolled memory growth between level transitions

### Mobile target

- 30 FPS on a representative mid-range phone
- Dynamic resolution scaling
- Reduced shadow quality
- Reduced vegetation and particles
- Touch controls with safe-area support
- Avoid device overheating during a 20-minute session

### Quality presets

- Low
- Medium
- High
- Auto

Auto preset should use:

- Device memory
- Hardware concurrency
- renderer information when safely available
- measured frame time during an opening calibration window

### Optimization checklist

- Frustum culling
- Occlusion-conscious level design
- InstancedMesh
- Texture compression
- Limited shadow casters
- Cascaded shadows only if required and affordable
- Baked lighting for selected interiors
- Pooled particles
- Pooled interactable indicators
- Avoid per-frame React state updates
- Avoid shader recompilation during gameplay
- No unnecessary post-processing passes
- Pause rendering or lower update rate when tab is hidden

---

## 14. Interaction and Accessibility

Provide:

- Keyboard remapping
- Controller support as a later MVP stretch goal
- Subtitle sizing
- Subtitle background
- Dialogue speed
- Auto-advance toggle
- Reduced motion
- Reduced camera shake
- Colorblind-safe interaction cues
- High-contrast interactable outlines
- Hold/toggle options
- Volume controls by category
- Skip cinematic
- Replay explanation
- Story-only mode with easier traversal
- Hints after repeated failure

Do not require precise platforming.

---

## 15. Audio Direction

Use adaptive music.

Layers:

- Ambient bed
- Regional music
- tension layer
- symbolic motif
- success/resolution layer

Christian’s burden should have its own sound language:

- Leather strain
- Low wooden creak
- Muted heartbeat
- Labored breath
- Subtle low-frequency drone

At the Cross, remove these layers before introducing the resolution theme.

Major characters should eventually have voice acting, but the MVP must function fully with subtitles.

---

## 16. Save and Progression System

For MVP, store locally:

- Current scene
- Checkpoint
- completed objectives
- dialogue flags
- journal unlocks
- settings
- elapsed playtime
- collected passages
- graphics calibration

Use versioned save data:

```ts
interface SaveGameV1 {
  version: 1;
  sceneId: string;
  checkpointId: string;
  flags: Record<string, boolean>;
  journalEntries: string[];
  settings: PlayerSettings;
}
```

Add cloud saves only after authentication is justified.

Provide:

- Continue
- New journey
- Scene replay
- Reset current scene
- Delete save

---

## 17. Browser Deployment

### Build

- Produce a static Vite build.
- Deploy generated `dist` output.
- Use hashed asset filenames.
- Set long-lived cache headers for hashed assets.
- Keep HTML short-cache or no-cache.
- Enable Brotli or gzip.
- Serve `.wasm`, `.glb`, `.ktx2`, and audio with correct MIME types.
- Add content security policy.
- Test with a subpath and root-domain deployment.
- Add an asset base URL configuration for CDN support.

### Hosting options

Preferred:

- Cloudflare Pages
- Vercel static deployment
- Netlify
- S3-compatible object storage plus CDN
- Existing VPS with Nginx

For large assets, use object storage and a CDN rather than bundling all assets into the application server.

### Service worker

Add after the core game is stable.

Potential uses:

- Cache shared player assets
- Cache completed scenes
- Enable replay after first load
- Show update-available notification

Do not silently cache hundreds of megabytes.

---

## 18. Testing Strategy

### Unit tests

- Quest progression
- Dialogue condition evaluation
- save migration
- interaction eligibility
- checkpoint restoration
- graphics preset selection

### Integration tests

- Load each scene
- enter and exit scene
- recover checkpoint
- complete objective chain
- dispose scene resources
- switch text mode
- skip cinematic safely

### Browser tests

Test:

- Chrome
- Edge
- Firefox
- Safari on macOS
- iOS Safari
- Android Chrome

### Performance tests

Automate or record:

- Initial transfer size
- Scene load time
- average frame time
- 1% low frame rate
- peak GPU texture memory estimate
- JavaScript heap before and after scene transitions
- number of draw calls
- triangles in camera
- shader program count

### Debug tools

Create development-only tools:

- Scene selector
- Teleport menu
- Objective flag editor
- Collider viewer
- Physics debug renderer
- Animation picker
- Dialogue previewer
- Performance HUD
- Graphics preset override
- Save inspector
- Lighting profile switcher

---

## 19. Build Phases

## Phase 1 — Foundation

Deliver:

- Vite/React/TypeScript project
- React Three Fiber scene
- Rapier initialization
- Input manager
- third-person controller
- camera rig
- asset manager
- game state machine
- debug scene
- local save skeleton
- CI checks

Exit criteria:

- Character can traverse a test level on desktop and mobile.
- Physics remains stable.
- Project deploys from CI.

## Phase 2 — Graybox Vertical Slice

Build every MVP scene using primitives and placeholder assets.

Exit criteria:

- Complete journey from prologue to Cross is playable.
- Every scene transition works.
- All objectives and checkpoints work.
- No final art required.

## Phase 3 — Narrative Systems

Deliver:

- Dialogue
- narration
- journal
- study mode
- subtitles
- cutscene controller
- story flags
- scene recaps

Exit criteria:

- A new player understands the story without prior knowledge.

## Phase 4 — Art Production

Replace graybox scene by scene:

1. Christian and burden
2. City
3. Slough
4. Wicket Gate
5. Interpreter’s House
6. Cross
7. Supporting characters
8. Effects and atmosphere

Exit criteria:

- All hero scenes match the visual target.
- Assets meet budgets.

## Phase 5 — Audio and Polish

Deliver:

- music
- ambience
- sound effects
- final animation passes
- lighting
- camera cinematics
- haptics where supported
- accessibility

## Phase 6 — Optimization and Release

Deliver:

- Quality presets
- mobile tuning
- texture compression
- scene streaming
- CDN deployment
- telemetry
- error reporting
- browser QA
- launch build

---

## 20. Agent Execution Rules

The implementation agent must:

1. Work scene by scene, but maintain shared reusable systems.
2. Keep the game playable after every milestone.
3. Build graybox mechanics before final assets.
4. Add acceptance criteria and tests with every scene.
5. Record all assets and licenses.
6. Profile before optimizing.
7. Avoid introducing a large dependency without documenting why.
8. Never place story progression inside visual components alone.
9. Ensure every scene can be launched directly in development.
10. Preserve save compatibility through migrations.
11. Keep a `GAME_STATUS.md` file with completed, in-progress, blocked, and next tasks.
12. Capture screenshots or short recordings for each completed scene.
13. Verify mobile input before declaring a scene complete.
14. Treat warnings, missing textures, WebGL errors, and leaked resources as release blockers.
15. Use the companion story document as the narrative source of truth.

---

## 21. Definition of MVP Done

The MVP is complete only when:

- A first-time player can finish the journey from the Dreamer to the Cross.
- Total playtime is approximately 30–45 minutes.
- The game deploys and runs from a normal website URL.
- Desktop and mobile controls work.
- Progress can be saved and resumed.
- Story mode and study mode work.
- The player can understand the main meaning of every scene.
- The burden visibly and mechanically changes the experience.
- The Cross sequence reliably removes the burden.
- No scene requires developer intervention.
- Low graphics mode remains attractive and readable.
- Browser refresh does not destroy valid progress.
- Automated tests cover progression and save restoration.
- Performance budgets are met or exceptions are documented.
- Asset licenses are documented.
- The codebase is ready to add Hill Difficulty as the next level.

---

## 22. Source and Technical Notes

The original 1678 work is public domain. Use a verified public-domain edition as the textual source, while writing original modern summaries, game dialogue, and visual interpretations.

Technical references:

- Project Gutenberg, *The Pilgrim’s Progress*, Part One
- Three.js and GLTFLoader documentation
- Rapier JavaScript documentation
- Vite static deployment documentation
