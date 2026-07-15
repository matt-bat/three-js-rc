import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { RacingMode, CHECKPOINTS } from "../src/modes/RacingMode.js";

globalThis.localStorage = {
  store: new Map(),
  getItem(key) {
    return this.store.get(key) ?? null;
  },
  setItem(key, value) {
    this.store.set(key, value);
  }
};

test("racing mode advances checkpoints when vehicle reaches target gate", () => {
  const scene = new THREE.Scene();
  const mode = new RacingMode(scene);
  const vehicle = { position: CHECKPOINTS[0].clone() };

  mode.update(vehicle, 0.16);

  assert.equal(mode.currentCheckpoint, 1);
  assert.equal(mode.getStatus().objective, "gate 2/6");
});

test("racing mode records best lap after final checkpoint", () => {
  const scene = new THREE.Scene();
  const mode = new RacingMode(scene);
  const vehicle = { position: new THREE.Vector3() };

  for (const checkpoint of CHECKPOINTS) {
    vehicle.position.copy(checkpoint);
    mode.update(vehicle, 1);
  }

  assert.equal(mode.lapCount, 1);
  assert.equal(mode.currentCheckpoint, 0);
  assert.ok(mode.bestLap > 0);
});
