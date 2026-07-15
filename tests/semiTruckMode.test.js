import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { SemiTruckMode, DOCKS } from "../src/modes/SemiTruckMode.js";

test("semi truck mode shows trailer and dock status when active", () => {
  const scene = new THREE.Scene();
  const mode = new SemiTruckMode(scene);

  mode.setActive(true);

  assert.equal(mode.trailer.visible, true);
  assert.equal(mode.getStatus().objective, "dock 1/3");
  assert.equal(mode.preferredProfileId, "semi");
  assert.equal(mode.getHudTelemetry({ telemetry: { speed: 0 }, surface: "asphalt" }).vehicle, "Semi Tractor");
});

test("semi truck mode completes delivery when trailer is parked at active dock", () => {
  const scene = new THREE.Scene();
  const mode = new SemiTruckMode(scene);
  const vehicle = {
    position: DOCKS[0].clone().add(new THREE.Vector3(0, 0, 2.55)),
    heading: 0,
    telemetry: { speed: 0 }
  };

  mode.setActive(true);
  mode.update(vehicle, 0.16);

  assert.equal(mode.deliveries, 1);
  assert.equal(mode.currentDock, 1);
});
