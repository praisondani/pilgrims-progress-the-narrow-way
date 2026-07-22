# Pilgrim’s Progress: The Narrow Way

Story-driven 3D browser adaptation of John Bunyan’s _The Pilgrim’s Progress_.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Initialize development tools after cloning:

```bash
git submodule update --init --recursive
```

Reference-image-to-procedural-Three.js workflow: [`docs/img2threejs-workflow.md`](docs/img2threejs-workflow.md).

Production deployment and public-repository secret handling: [`DEPLOYMENT.md`](DEPLOYMENT.md).

## Controls

- `WASD` / arrows: walk
- `Shift`: jog
- `Space`: jump
- Click characters and glowing objects: interact
- Story map, Journal, Sound, and Pause: top-right HUD

Current build contains 191 gated story beats across 25 distinct painterly low-poly environments, a 42-variant animated human cast, persistent Hopeful companion, 360-degree third-person camera controls, cinematic conversations, scene-specific recorded ambience and sound cues, journal discoveries, choices, persistent story items, and 47 symbolic puzzle trials. Journey: Dream → City of Destruction → Evangelist’s Field → Slough of Despond → Worldly Wiseman and Mount Sinai → Wicket Gate → Interpreter’s House → Cross → three sleepers → Formalist and Hypocrisy → Hill Difficulty → lost roll → chained lions → Palace Beautiful → Valley of Humiliation and Apollyon → Valley of the Shadow of Death → Faithful → Talkative → Evangelist’s warning → Vanity Fair → Hopeful → By-Ends → Demas → By-Path Meadow → Doubting Castle. See `GAME_STATUS.md` for progress.

## Audio

The game ships 25 local ambience loops and eight shared interaction/foley cues generated for this project with ElevenLabs Sound Effects. No ElevenLabs credential is present in the client, repository, build, or deployment.

Playback uses measured per-asset gain correction, conservative ambience and SFX buses, a comfort low-pass filter, dynamics compression, and scene crossfades. There is no oscillator/noise fallback. Audio can be muted at any time from the top-right HUD.
