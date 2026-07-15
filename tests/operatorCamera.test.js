import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { OperatorCamera } from "../src/core/OperatorCamera.js";

test("operator camera clears flat-screen look offset when VR headset becomes authoritative", () => {
  const camera = new THREE.PerspectiveCamera();
  const rig = new OperatorCamera(camera);

  rig.lookOffset.set(0.7, -0.2);
  rig.setVrHeadsetAuthoritative(true);

  assert.equal(rig.isVrHeadsetAuthoritative, true);
  assert.equal(rig.lookOffset.x, 0);
  assert.equal(rig.lookOffset.y, 0);
});

test("operator camera does not apply flat-screen look snap-back while VR is authoritative", () => {
  const camera = new THREE.PerspectiveCamera();
  const rig = new OperatorCamera(camera);
  const vehicle = {
    position: new THREE.Vector3(),
    heading: 0
  };

  rig.setVrHeadsetAuthoritative(true);
  rig.lookOffset.set(0.5, 0.5);
  rig.update(vehicle, {
    look: { x: 1, y: 1 },
    temporaryLookHeld: false
  }, [], 0.16);

  assert.equal(rig.mode, "human");
  assert.equal(rig.lookOffset.x, 0.5);
  assert.equal(rig.lookOffset.y, 0.5);
});
