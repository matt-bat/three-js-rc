# Contributing to RC World

RC World is an active prototype. Contributions that improve controls, vehicle behavior, modes, performance, accessibility, testing, or original procedural presentation are welcome.

## Before opening an issue

1. Search existing issues and reproduce the behavior on the latest `main` branch.
2. Include the browser, device, input method, graphics preset, game mode, and weather preset when relevant.
3. Separate confirmed defects from tuning preferences or roadmap proposals.
4. Report security-sensitive browser, WebHID, WebXR, dependency, or deployment issues privately through [SECURITY.md](SECURITY.md).

## Local setup and validation

```sh
npm ci
npm test
npm run build
npm run test:browser
```

Use `npm run screenshots:capture` for visual changes and compare the affected desktop and mobile states.

## Pull request expectations

- Route input devices through shared actions instead of coupling gameplay to a device API.
- Keep headset tracking authoritative in WebXR; never add forced head snap-back or recentering.
- Build modes on shared vehicle, weather, camera, and graphics systems rather than duplicating them.
- Keep Performance mode viable and avoid one-mesh-per-prop patterns for dense scenery.
- Use original code-native Three.js, shader, procedural geometry, or SVG assets; document any permitted third-party asset and its license.
- Add deterministic unit tests for gameplay logic and a browser check for rendering or interaction changes.
- Update architecture, controls, roadmap, and README documentation when their described behavior changes.
- Do not commit build output, screenshots outside the documented set, credentials, or local controller data.

By contributing, you agree that your contribution is distributed under the repository’s license.
