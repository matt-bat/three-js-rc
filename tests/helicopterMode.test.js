import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { HelicopterMode, HOVER_SECONDS_REQUIRED, RESCUE_PADS } from "../src/modes/HelicopterMode.js";

test("helicopter mode exposes rescue status and camera target", () => {
  const scene = new THREE.Scene();
  const mode = new HelicopterMode(scene);

  mode.setActive(true);

  assert.equal(mode.helicopter.visible, true);
  assert.equal(mode.pads[0].group.visible, true);
  assert.equal(mode.getStatus().objective, "rescue pad 1/3");
  assert.equal(mode.usesGroundVehicle, false);
  assert.equal(mode.getCameraTarget().position, mode.position);
  assert.deepEqual(mode.getHudTelemetry(), {
    speed: "0.0 m/s",
    surface: "air",
    vehicle: "Rescue Helicopter"
  });
});

test("helicopter completes a rescue after stable winch hover", () => {
  const scene = new THREE.Scene();
  const mode = new HelicopterMode(scene);

  mode.setActive(true);
  mode.position.copy(RESCUE_PADS[0]);
  mode.velocity.set(0, 0, 0);
  mode.update({}, HOVER_SECONDS_REQUIRED + 0.05, {
    actions: { primaryAction: true, throttle: 0, brake: 0, steer: 0, look: { x: 0, y: 0 } },
    weather: { wind: { x: 0, z: 0 } }
  });

  assert.equal(mode.rescued, 1);
  assert.equal(mode.currentPad, 1);
  assert.equal(mode.getStatus().objective, "rescue pad 2/3");
});

test("helicopter responds to collective and wind", () => {
  const scene = new THREE.Scene();
  const mode = new HelicopterMode(scene);
  const start = mode.position.clone();

  mode.setActive(true);
  mode.update({}, 0.25, {
    actions: { throttle: 1, brake: 0, steer: 0, look: { x: 0, y: 0 } },
    weather: { wind: { x: 0.8, z: 0 } }
  });

  assert.ok(mode.position.y > start.y);
  assert.ok(mode.position.x > start.x);
});
