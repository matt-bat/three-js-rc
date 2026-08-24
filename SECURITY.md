# Security Policy

Security updates apply to the latest code on `main`. Report vulnerabilities through GitHub private vulnerability reporting instead of a public issue, especially issues involving WebHID devices, WebXR, browser input, dependency compromise, cross-site scripting, or deployment configuration.

Include the affected revision, browser and device, reproduction steps, impact, and suggested mitigation if available. Do not include credentials or private device identifiers.

RC World is a static browser application with no account service, game server, telemetry backend, AI model, or required runtime secret. Browser device APIs must remain permission-gated and degrade safely when unavailable. GitHub Pages deployment credentials must remain in GitHub’s protected secret store and must never be committed.
