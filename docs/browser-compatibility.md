# Browser Compatibility

## Supported baseline

| Browser | Default path | Current automated coverage | Status |
| --- | --- | --- | --- |
| Chrome/Chromium desktop | WebGL 2 | Playwright Chromium | Supported |
| Safari/iOS | WebGL 2 | Playwright mobile WebKit + prior physical feedback | Supported; physical regression pass required per release |
| Edge | WebGL 2 | Chromium engine inference only | Manual smoke required |
| Firefox | WebGL 2 | None yet | Functional target; not release-verified |

## WebGPU prototype

Opt-in only. Capability detection never blocks startup. If unavailable or initialization throws, game constructs verified `WebGLRenderer`. WebGPU/compute decoration is never required for objectives.

Three.js currently labels `WebGPURenderer` experimental; support and parity can change between releases. See [official manual](https://threejs.org/manual/en/webgpurenderer).

## Required release matrix

- New save and migrated save.
- Keyboard-only, mouse orbit, touch controls.
- Audio locked/unlocked/muted.
- Standard/bright/high contrast, all text sizes, reduced motion.
- Chapter II all objectives on low/medium/high.
- WebGPU opt-in plus forced WebGL fallback.
- Context loss/recovery and ten region transitions.
