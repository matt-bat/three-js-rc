import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { GraphicsPipeline } from "../src/core/GraphicsPipeline.js";

function rendererStub() {
  return {
    xr: { isPresenting: false },
    shadowMap: {},
    capabilities: { getMaxAnisotropy: () => 16 },
    outputColorSpace: null,
    toneMapping: null,
    toneMappingExposure: 0,
    pixelRatio: 0,
    getPixelRatio() {
      return this.pixelRatio || 1;
    },
    getSize(target) {
      target.set(800, 600);
      return target;
    },
    setPixelRatio(value) {
      this.pixelRatio = value;
    },
    setSize() {},
    render() {}
  };
}

globalThis.window = { devicePixelRatio: 2 };

test("graphics pipeline applies cinematic renderer defaults and quality shadows", () => {
  const renderer = rendererStub();
  const scene = new THREE.Scene();
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.castShadow = true;
  scene.add(light);
  const camera = new THREE.PerspectiveCamera();

  const pipeline = new GraphicsPipeline(renderer, scene, camera);

  assert.equal(renderer.outputColorSpace, THREE.SRGBColorSpace);
  assert.equal(renderer.toneMapping, THREE.ACESFilmicToneMapping);
  assert.equal(renderer.pixelRatio, 1.35);
  assert.equal(renderer.shadowMap.enabled, true);
  assert.equal(light.shadow.mapSize.width, 1024);

  pipeline.cycle();

  assert.equal(pipeline.current.id, "cinematic");
  assert.equal(renderer.pixelRatio, 1.75);
  assert.equal(light.shadow.mapSize.width, 2048);
});

test("graphics pipeline lowers pixel ratio after sustained slow frames", () => {
  const renderer = rendererStub();
  const pipeline = new GraphicsPipeline(renderer, new THREE.Scene(), new THREE.PerspectiveCamera());
  let time = 0;
  globalThis.performance = { now: () => (time += 33) };

  for (let index = 0; index < 90; index += 1) {
    pipeline.updateFrameBudget();
  }

  assert.ok(pipeline.adaptivePixelRatio < 1);
  assert.ok(renderer.pixelRatio < 1.35);
});
