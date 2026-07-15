import test from "node:test";
import assert from "node:assert/strict";
import { TransmitterManager } from "../src/core/TransmitterManager.js";

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
}

test("transmitter manager reports unsupported when WebHID is unavailable", () => {
  const transmitter = new TransmitterManager({ hid: null, storage: createStorage() });

  assert.equal(transmitter.isSupported, false);
  assert.equal(transmitter.label, "HID unavailable");
});

test("transmitter manager maps simulated channels into actions", () => {
  const transmitter = new TransmitterManager({ hid: null, storage: createStorage() });

  transmitter.setMockChannels([0.5, 0.75, 0.25, -0.4, 0.3]);
  const actions = transmitter.getActions();

  assert.equal(actions.steer, 0.5);
  assert.equal(actions.throttle, 0.75);
  assert.equal(actions.brake, 0.25);
  assert.equal(actions.look.x, -0.4);
  assert.equal(actions.look.y, 0.3);
});

test("transmitter center calibration normalizes channel output", () => {
  const transmitter = new TransmitterManager({ hid: null, storage: createStorage() });

  transmitter.setMockChannels([0.2, 0, 0, 0, 0]);
  transmitter.calibrateCenter();
  transmitter.setMockChannels([0.6, 0, 0, 0, 0]);

  assert.ok(transmitter.getActions().steer > 0.35);
  assert.ok(transmitter.getActions().steer < 0.55);
});
