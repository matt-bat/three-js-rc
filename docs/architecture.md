# Architecture

## Core Principle

Build one web-capable simulation platform, then add vehicles, modes, and platforms as adapters or modules.

## Shared Systems

| System | Responsibility |
|---|---|
| Input | Device-agnostic actions, rebinding, gamepad, touch, VR controllers, HID transmitter path |
| Operator | Human-scale player view, manual movement, auto-follow, line-of-sight positioning |
| Camera | Human, vehicle, chase, top-down, free, picture-in-picture, VR-safe behavior |
| XR Runtime | WebXR session entry, status reporting, headset-authoritative camera guard |
| Physics | Scale-aware vehicle behavior, surfaces, battery, motor, weather hooks |
| Weather | Rain, wind, snow, visibility, grip changes, future aircraft effects |
| Graphics | Renderer quality presets, postprocessing, procedural geometry/material VFX, instanced/LOD scenic environment, vehicle, combat, and weather VFX |
| Garage | Vehicle profile selection, mesh styling, and profile-specific physics modifiers |
| Modes | Racing, crawling, Micro Armor Arena, trucking, drones, helicopters, planes |
| Multiplayer | Lobbies, authority, prediction, interpolation, spectators, reconnect |

## Web Framework Decision

Three.js is the rendering foundation so the project can run on the web. Vite is used only for local development, module loading, and production builds.

## Camera Rules

- Flat-screen temporary look may smoothly return to default vehicle framing.
- VR headset tracking is authoritative.
- VR must not snap back, auto-return, or forcibly recenter the user's head.
- Auto-follow may reposition the operator body/reference point, subject to comfort rules.

## Input Rules

Gameplay consumes normalized actions, not raw device inputs.

Examples:

- `throttle`
- `brake`
- `steer`
- `cameraNext`
- `temporaryLook`
- `toggleAutoFollow`
- `cycleWeather`

Device adapters should map keyboard, mouse, gamepad, touch, VR controller, and HID-compatible RC transmitter input into the same action layer.

## Vehicle Contract

Each vehicle family should expose:

- input actions
- physics parameters
- camera mounts
- tuning slots
- telemetry channels
- reset and marshal rules
- assist options
- multiplayer replication state

## Current Foundation

The current implementation proves the first vertical slice:

- Three.js rendering
- Three.js WebXR runtime foundation
- Three.js postprocessing pipeline with quality presets, quality-scoped shadows, tone mapping, anisotropy tuning, and adaptive pixel-ratio backoff
- procedural terrain color variation, mesh clouds, geometry markings, and HUD icons
- original scenic low-poly outdoor environment with gradient sky, distant hills, matte terrain, instanced grass/flowers/pebbles/reflectors, LOD tree lines, road props, and segmented road surfaces
- bloom, procedural tire trails, dust, spray, paint splats, procedural weather sheen/overlays, and glowing gate VFX

## Graphics Asset Policy

- Prefer procedural Three.js primitives: geometry, vertex colors, shader/material variation, particles, lines, and generated buffers.
- Avoid imported or generated image/model assets unless they are explicitly required for gameplay inspection or branding.
- Build symbolic marks such as arrows, targets, paint splats, glow masks, and signs as geometry or shader/material effects whenever practical.
- Repeated world detail and high-frequency effects should be mesh, line, point, or vertex-color based so mobile, VR, and Performance mode stay viable.
- RC buggy physics
- weather-dependent grip
- human operator camera
- WebXR VR entry/status path
- headset-authoritative VR camera behavior
- camera mode switching
- auto-follow operator
- key rebinding
- basic telemetry
- mobile touch pads
- garage vehicle profile selection
- racing checkpoint mode
- rock crawling gate mode
- Micro Armor target combat mode
- semi-truck trailer and dock delivery mode
- drone flight gate mode
- helicopter rescue hover/winch mode
- HUD/keyboard mode switching
- visible weather effects
- headless screenshot capture

## Bundle Size Note

Three.js is the main bundle driver. The Vite warning threshold is set to 650 kB so expected prototype bundle size does not hide real build failures.

## Validation

- `npm test` checks core logic.
- `npm run build` checks production bundling.
- `npm run test:browser` checks the rendered browser experience and verifies the Three.js canvas screenshot is nonblank.
- `npm run screenshots:capture` starts a local Vite server when needed and writes desktop, mobile, weather, graphics, mode, garage, and controls screenshots to `docs/screenshots/`.
