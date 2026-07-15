# Staged Implementation Plan

## Stage 1: VR Runtime Foundation

Status: implemented.

- Enable Three.js WebXR rendering.
- Add VR entry/status UI.
- Switch the render loop to `renderer.setAnimationLoop`.
- Keep headset pose authoritative during active XR sessions.
- Disable flat-screen look snap-back while VR is active.
- Bypass postprocessing during active XR presentation.

## Stage 2: Input Device Expansion

Status: next.

- Add WebHID/WebUSB detection shell.
- Add RC transmitter calibration UI.
- Add channel mapping and deadzone/inversion controls.
- Persist per-device input profiles.

## Stage 3: Multiplayer Lobby Foundation

Status: planned.

- Add lobby state model.
- Add local mock lobby adapter first.
- Add network transport boundary.
- Replicate vehicle pose, selected mode, weather, and profile state.
- Add interpolation for remote vehicles.

## Stage 4: Vehicle Physics Depth

Status: planned.

- Add suspension compression visuals.
- Add per-wheel grip/contact signals.
- Improve trailer articulation.
- Add tank tread handling.
- Add aircraft-specific lift/drag model.

## Stage 5: Aircraft Expansion

Status: in progress.

- Expand drone mode scoring and crash/recovery rules.
- Add helicopter mode. Implemented rescue hover/winch foundation.
- Add fixed-wing plane mode.
- Add aircraft camera and assist tuning.

## Stage 6: Mode Progression

Status: planned.

- Add race starts, lap rules, penalties, and ghost laps.
- Add rock crawling score cards.
- Add Micro Armor teams, health, enemy fire, and respawns.
- Add trucking route challenges and cargo scoring.

## Stage 7: Course Builder and Replay

Status: planned.

- Add placeable gates, ramps, obstacles, and targets.
- Save/load custom courses.
- Add replay timeline and telemetry graphs.
- Add lap ghost playback.
