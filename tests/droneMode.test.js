import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { DroneMode, AIR_GATES } from "../src/modes/DroneMode.js";

test("drone mode exposes aircraft status and scene visibility when active", () => {
  const scene = new THREE.Scene();
  const mode = new DroneMode(scene);

  mode.setActive(true);

  assert.equal(mode.drone.visible, true);
  assert.equal(mode.gates[0].gate.visible, true);
  assert.equal(mode.getStatus().objective, "air gate 1/4");
  assert.equal(mode.usesGroundVehicle, false);
  assert.deepEqual(mode.getHudTelemetry(), {
    speed: "0.0 m/s",
    surface: "air",
    vehicle: "Quad Drone"
  });
});

test("drone mode advances through air gates", () => {
  const scene = new THREE.Scene();
  const mode = new DroneMode(scene);

  mode.setActive(true);
  mode.position.copy(AIR_GATES[0]);
  mode.update({}, 0.016, { actions: {}, weather: { wind: 0 } });

  assert.equal(mode.completedGates, 1);
  assert.equal(mode.currentGate, 1);
  assert.equal(mode.getStatus().objective, "air gate 2/4");
});

test("drone mode responds to climb input and weather wind", () => {
  const scene = new THREE.Scene();
  const mode = new DroneMode(scene);
  const start = mode.position.clone();

  mode.setActive(true);
  mode.update({}, 0.25, {
    actions: { throttle: 1, brake: 0, steer: 0, look: { x: 0, y: 0 } },
    weather: { wind: 0.8 }
  });

  assert.ok(mode.position.y > start.y);
  assert.ok(mode.position.x > start.x);
});
