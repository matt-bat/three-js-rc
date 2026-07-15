import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createScene } from "../src/core/SceneFactory.js";
import { VehicleVfx } from "../src/core/VehicleVfx.js";
import { WeatherEffects } from "../src/core/WeatherEffects.js";

test("scene uses procedural material variation for high-repeat world detail", () => {
  const { scene } = createScene();
  let vertexColoredSurfaces = 0;
  let textureMappedSurfaces = 0;
  let meshCloudPuffs = 0;

  scene.traverse((object) => {
    if (object.isMesh && object.geometry?.attributes?.color) vertexColoredSurfaces += 1;
    if (object.isMesh && object.material?.map) textureMappedSurfaces += 1;
    if (object.isMesh && object.geometry?.type === "SphereGeometry" && object.material?.transparent) meshCloudPuffs += 1;
  });

  assert.ok(vertexColoredSurfaces >= 4);
  assert.ok(meshCloudPuffs >= 12);
  assert.equal(textureMappedSurfaces, 0);
});

test("weather and tire trail effects avoid texture maps for repeated overlays", () => {
  const scene = new THREE.Scene();
  const weatherEffects = new WeatherEffects(scene);
  const vehicleVfx = new VehicleVfx(scene);

  assert.equal(weatherEffects.puddles.every((puddle) => puddle.material.map === null), true);
  assert.equal(weatherEffects.snowPatches.every((patch) => patch.material.map === null), true);
  assert.equal(weatherEffects.windStreamers.every((streamer) => streamer.isLineSegments), true);
  assert.equal(vehicleVfx.trails.every((trail) => trail.mark.material.map === null), true);
});
