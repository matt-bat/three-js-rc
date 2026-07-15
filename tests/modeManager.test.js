import test from "node:test";
import assert from "node:assert/strict";
import { ModeManager } from "../src/modes/ModeManager.js";

function mode(name) {
  return {
    name,
    active: false,
    updates: 0,
    setActive(active) {
      this.active = active;
    },
    update() {
      this.updates += 1;
    }
  };
}

test("mode manager activates first mode and switches cleanly", () => {
  const first = mode("first");
  const second = mode("second");
  const manager = new ModeManager([first, second]);

  assert.equal(manager.current.name, "first");
  assert.equal(first.active, true);
  assert.equal(second.active, false);

  manager.next();

  assert.equal(manager.current.name, "second");
  assert.equal(first.active, false);
  assert.equal(second.active, true);
});

test("mode manager updates only the current mode", () => {
  const first = mode("first");
  const second = mode("second");
  const manager = new ModeManager([first, second]);

  manager.next();
  manager.update({}, 0.16);

  assert.equal(first.updates, 0);
  assert.equal(second.updates, 1);
});
