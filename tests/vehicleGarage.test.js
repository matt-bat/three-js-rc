import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { VehicleGarage } from "../src/core/VehicleGarage.js";

globalThis.localStorage = {
  store: new Map(),
  getItem(key) {
    return this.store.get(key) ?? null;
  },
  setItem(key, value) {
    this.store.set(key, value);
  }
};

function vehicleMesh() {
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  const group = new THREE.Group();
  group.userData.parts = { body, cabin };
  group.add(body, cabin);
  return group;
}

test("garage applies profile physics and mesh styling", () => {
  const physics = {
    profile: null,
    setProfile(profile) {
      this.profile = profile;
    }
  };
  const mesh = vehicleMesh();
  const garage = new VehicleGarage(physics, mesh);

  const profile = garage.applyProfile("semi");

  assert.equal(profile.label, "Semi Tractor");
  assert.equal(physics.profile.id, "semi");
  assert.equal(physics.profile.maxForwardSpeed, 5.8);
  assert.equal(mesh.scale.z, 1.35);
});
