import test from "node:test";
import assert from "node:assert/strict";
import { createWorldDetail } from "../src/core/WorldDetail.js";
import { createScene } from "../src/core/SceneFactory.js";

test("world detail uses instancing and LOD for high-density scenery", () => {
  const detail = createWorldDetail();

  assert.ok(detail.userData.metrics.instanceCount >= 600);
  assert.ok(detail.userData.metrics.instancedMeshes >= 5);
  assert.ok(detail.userData.metrics.lodCount >= 12);
  assert.equal(typeof detail.userData.update, "function");
});

test("scene exposes world detail as an animation updatable", () => {
  const { scene } = createScene();

  assert.ok(scene.userData.updatables.length >= 1);
  assert.ok(scene.userData.updatables.some((item) => item.name === "production-world-detail"));
});
