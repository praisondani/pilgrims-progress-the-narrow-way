# Asset License Registry

No third-party 3D model or texture is currently shipped.

| Asset ID | Type | Source | License/status | Production path | Notes |
| --- | --- | --- | --- | --- | --- |
| `procedural-primitives-v1` | Geometry/materials | Project source code | Repository license applies | Runtime-generated | Characters, terrain, props, vegetation. |
| `img2threejs-tool-v1.2.0` | Development tooling | [hoainho/img2threejs](https://github.com/hoainho/img2threejs) at `e8ff28a6ae0cb534c7b2ebc15cb3f06709262d5b` | MIT; copyright hoainho, 2026 | `tools/img2threejs` Git submodule; not shipped in `dist/` | Produces procedural TypeScript source from reference-image analysis. Generated assets require their own source/license entry before promotion. |
| `scene-audio-*` | MP3 ambience/SFX | Generated for project using ElevenLabs account | Account usage rights must be archived before commercial release | `public/audio/` | No API key stored. Preserve generation receipts/terms snapshot. |
| `bunyan-pdf` | Historical book PDF | johnbunyan.org | Courtesy link/source; redistribution status needs owner confirmation | `public/downloads/the-pilgrims-progress-john-bunyan.pdf` | Not loaded by game runtime. |

Future GLB/KTX2 entries must include asset ID, creator/source, exact license, proof, generator/tool/version, source file, production file, triangles, materials, texture sizes, animation list, LODs, collision, and acquisition date. Missing proof blocks production promotion.
