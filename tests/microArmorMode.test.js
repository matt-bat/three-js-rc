import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { MicroArmorMode, TARGETS } from "../src/modes/MicroArmorMode.js";

test("micro armor mode fires a paintball when active action is pressed", () => {
  const scene = new THREE.Scene();
  const mode = new MicroArmorMode(scene);
  const vehicle = {
    position: new THREE.Vector3(),
    heading: 0
  };

  mode.setActive(true);
  mode.update(vehicle, 0.16, {
    actions: { primaryAction: true },
    weather: { wind: { x: 0, z: 0 } }
  });

  assert.equal(mode.shots, 1);
  assert.equal(mode.projectiles.length, 1);
  assert.equal(scene.children.includes(mode.projectiles[0].mesh), true);
});

test("micro armor mode exposes target score status", () => {
  const scene = new THREE.Scene();
  const mode = new MicroArmorMode(scene);

  assert.equal(mode.getStatus().objective, "targets 0/4");
  assert.equal(mode.getStatus().lap, "shots 0");
});

test("micro armor hits leave visible procedural paint splats", () => {
  const scene = new THREE.Scene();
  const mode = new MicroArmorMode(scene);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial());

  mode.setActive(true);
  mesh.position.copy(TARGETS[0]);
  scene.add(mesh);
  mode.projectiles.push({ mesh, velocity: new THREE.Vector3(), age: 0, hitTarget: false });
  mode.updateProjectiles(0.016, { wind: { x: 0, z: 0 } });

  assert.equal(mode.score, 1);
  assert.equal(mode.hitSplats.length, 1);
  assert.equal(mode.hitSplats[0].mesh.visible, true);
  assert.equal(scene.children.includes(mode.hitSplats[0].mesh), true);
});

test("micro armor missed paintballs leave ground impact splats", () => {
  const scene = new THREE.Scene();
  const mode = new MicroArmorMode(scene);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial());

  mode.setActive(true);
  mesh.position.set(3, -0.01, 3);
  scene.add(mesh);
  mode.projectiles.push({ mesh, velocity: new THREE.Vector3(), age: 0.4, hitTarget: false });
  mode.updateProjectiles(0.016, { wind: { x: 0, z: 0 } });

  assert.equal(mode.score, 0);
  assert.equal(mode.hitSplats.length, 1);
  assert.equal(scene.children.includes(mesh), false);
});
