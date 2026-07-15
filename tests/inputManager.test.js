import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_BINDINGS, InputManager } from "../src/core/InputManager.js";

test("default bindings include vehicle, camera, weather, and operator actions", () => {
  assert.equal(DEFAULT_BINDINGS.throttle, "KeyW");
  assert.equal(DEFAULT_BINDINGS.cameraNext, "KeyC");
  assert.equal(DEFAULT_BINDINGS.modeNext, "KeyM");
  assert.equal(DEFAULT_BINDINGS.toggleAutoFollow, "KeyF");
  assert.equal(DEFAULT_BINDINGS.cycleWeather, "KeyV");
  assert.equal(DEFAULT_BINDINGS.primaryAction, "Space");
  assert.equal(DEFAULT_BINDINGS.temporaryLook, "ShiftLeft");
});

test("input manager merges transmitter channels into gameplay actions", () => {
  const listeners = new Map();
  const target = {
    addEventListener: (type, handler) => listeners.set(type, handler)
  };
  globalThis.document = {
    getElementById: () => null
  };
  Object.defineProperty(globalThis, "navigator", {
    value: { getGamepads: () => [] },
    configurable: true
  });
  globalThis.localStorage = {
    getItem: () => "{}",
    setItem: () => {}
  };
  const transmitter = {
    getActions: () => ({
      throttle: 0.6,
      brake: 0.1,
      steer: -0.4,
      look: { x: 0.2, y: -0.2 }
    })
  };

  const input = new InputManager(target, transmitter);
  const actions = input.getActions();

  assert.equal(actions.throttle, 0.6);
  assert.equal(actions.brake, 0.1);
  assert.equal(actions.steer, -0.4);
  assert.equal(actions.look.x, 1);
  assert.equal(actions.look.y, -0.8);
});
