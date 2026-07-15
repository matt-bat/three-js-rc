import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { RockCrawlingMode, GATES } from "../src/modes/RockCrawlingMode.js";

test("rock crawling mode advances crawl gates when active", () => {
  const scene = new THREE.Scene();
  const mode = new RockCrawlingMode(scene);
  const vehicle = {
    position: GATES[0].clone(),
    telemetry: { speed: 0.4 }
  };

  mode.setActive(true);
  mode.update(vehicle, 0.16);

  assert.equal(mode.currentGate, 1);
  assert.equal(mode.getStatus().objective, "crawl gate 2/4");
});

test("rock crawling mode ignores updates while inactive", () => {
  const scene = new THREE.Scene();
  const mode = new RockCrawlingMode(scene);
  const vehicle = {
    position: GATES[0].clone(),
    telemetry: { speed: 0.4 }
  };

  mode.update(vehicle, 0.16);

  assert.equal(mode.currentGate, 0);
});
