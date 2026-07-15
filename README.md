# RC World: Micro Motorsports

> **Public WIP:** RC World is an actively developed playable prototype. Expect rough edges, changing controls, placeholder tuning, and frequent visual updates.

[Play the latest public build](https://matt-bat.github.io/three-js-rc/)

RC World is a web-first Three.js playground for racing, crawling, flying, and completing bite-sized objectives with radio-controlled vehicles. It already supports several playable modes, vehicle profiles, cameras, weather presets, touch input, gamepads, and an experimental RC transmitter path.

## WIP Release Status

- The current release is a single-player sandbox and systems showcase, not a finished game.
- Racing, crawling, arena, delivery, drone, and helicopter modes are playable foundations with lightweight objectives.
- Desktop keyboard is the most complete input path; touch, gamepad, WebXR, and WebHID support remain experimental.
- Physics and vehicle handling are intentionally approachable and will continue to change.
- Multiplayer, progression, persistence, audio, expanded courses, and production content remain roadmap work.
- The public build is deployed automatically from the `main` branch after tests and a production build pass.

## Stack

- Three.js rendering
- Three.js WebXR runtime foundation
- Three.js postprocessing and procedural mesh/material VFX
- Vite local development server
- JavaScript modules
- Node test runner for core logic checks

## Current Playable Foundation

- RC buggy driving sandbox
- Human operator camera
- Vehicle-mounted camera
- Chase camera
- Top-down camera
- Free orbit camera
- Auto-follow operator positioning
- Obstruction-aware line-of-sight candidate selection
- Flat-screen temporary look with smooth return
- WebXR VR entry/status path
- VR headset tracking guard with no snap-back during active sessions
- Weather presets that affect grip and handling
- Visible rain, snow, and wind indicators
- Graphics quality presets: Performance, Balanced, Cinematic
- Procedural terrain color variation, mesh clouds, geometry markings, and HUD icons
- Original scenic low-poly outdoor environment inspired by soft browser driving games, with gradient sky, distant hills, matte terrain, trees, grass, roadside props, segmented road surfaces, and high-density instanced world detail
- Instanced grass, flowers, pebbles, reflectors, and LOD tree lines for richer scenery without one-mesh-per-prop overhead
- Bloom-capable postprocessing, procedural tire trails, dust, spray, and glowing gates
- Adaptive graphics pipeline with quality-scoped shadows, tone mapping, anisotropy tuning, and pixel-ratio backoff during sustained slow frames
- Procedural weather-ground VFX for rain sheen/puddles, snow cover/patches, and wind streamers
- Paintball hit and missed-shot procedural splats in Micro Armor Arena
- Keyboard and gamepad action input
- Mobile touch steering and drive pads
- Rebindable keyboard controls
- Garage with selectable vehicle profiles
- RC racing time-trial checkpoint loop
- Rock crawling gate mode foundation
- Micro Armor Arena combat foundation with paintball firing and targets
- Semi-truck trailer and dock delivery foundation
- Drone flight gate foundation
- Helicopter rescue hover/winch mode foundation
- Mode switching through HUD and `M` key
- Headless screenshot capture for desktop and mobile review

## Platform Direction

The framework is intentionally web-first. Browser support is the lead target, with mobile, VR, controller, and HID-compatible RC transmitter support routed through the same action-binding layer.

VR rule: headset tracking is authoritative. The app must not force head snap-back, auto-return, or camera recentering in VR.

## Setup

```bash
npm ci
```

## Run

```bash
npm run dev
```

Open the local Vite URL shown in the terminal.

## Validate

```bash
npm test
npm run build
npm run test:browser
npm run screenshots:capture
npm run release:check
```

The screenshot capture command starts its own local Vite server when `PLAYWRIGHT_BASE_URL` is not provided. The capture set includes baseline desktop/mobile, rain, snow, wind, cinematic graphics, racing/crawl/combat/truck/drone modes, garage, and controls views.

## Default Controls

| Action | Binding |
|---|---|
| Throttle | `W` |
| Brake or reverse | `S` |
| Steer left | `A` |
| Steer right | `D` |
| Reset vehicle | `R` |
| Change camera | `C` |
| Change mode | `M` |
| Primary action / fire | `Space` |
| Toggle auto-follow | `F` |
| Cycle weather | `V` |
| Temporary look | hold `Shift` plus mouse, arrows, or right stick |

Graphics quality can be changed from the HUD with the `Graphics` button.

Touch viewports also show two virtual pads:

- left pad: steering
- right pad: throttle forward and brake/reverse

## Vehicle Profiles

- Buggy: fast baseline RC racer
- Crawler: slower, grippier technical driving
- Micro Armor: heavier combat handling
- Semi Tractor: heavier trailer-friendly handling

## Repo Structure

```text
src/core
  GraphicsPipeline.js
  InputManager.js
  OperatorCamera.js
  SceneFactory.js
  VehiclePhysics.js
  VehicleVfx.js
  VehicleGarage.js
  WeatherEffects.js
  WeatherSystem.js
  WorldDetail.js
  XrRuntime.js
src/ui
  Hud.js
src/modes
  DroneMode.js
  HelicopterMode.js
  MicroArmorMode.js
  ModeManager.js
  RacingMode.js
  RockCrawlingMode.js
  SemiTruckMode.js
tests
  browser-smoke.spec.js
  droneMode.test.js
  helicopterMode.test.js
  inputManager.test.js
  microArmorMode.test.js
  modeManager.test.js
  operatorCamera.test.js
  racingMode.test.js
  rockCrawlingMode.test.js
  semiTruckMode.test.js
  vehiclePhysics.test.js
docs
  architecture.md
  mvp-roadmap.md
  project-index.md
  staged-implementation-plan.md
  screenshots/
scripts
  backup-project.sh
  capture-screenshots.mjs
.github/workflows
  deploy-pages.yml
vite.config.js
```

## Development Notes

- New vehicles should implement the same action, telemetry, camera mount, tuning, and multiplayer state concepts.
- New platforms should adapt device input into actions instead of changing gameplay code.
- New modes should consume vehicle, weather, camera, and multiplayer systems rather than owning them.
- Graphics additions should prefer procedural Three.js geometry, shaders, vertex colors, particles, and generated buffers over imported or generated image assets.
- Graphics additions should route through reusable rendering/VFX helpers and keep Performance mode viable for mobile and VR.
- Visual reference material may guide mood and composition, but implementation must remain original Three.js/SVG code.
- Browser smoke tests use Playwright and validate that the Three.js canvas renders nonblank pixels.
- Local project-management and agent-governance records are excluded from the public repository.

## Project Safety

Create a source backup before broad changes:

```bash
./scripts/backup-project.sh
```

The restore procedure is documented in [`docs/backup-and-restore.md`](docs/backup-and-restore.md).
