import test from "node:test";
import assert from "node:assert/strict";
import { VehiclePhysics } from "../src/core/VehiclePhysics.js";
import { WEATHER_PRESETS } from "../src/core/WeatherSystem.js";

test("vehicle accelerates under throttle", () => {
  const vehicle = new VehiclePhysics();
  vehicle.update({ throttle: 1, brake: 0, steer: 0 }, WEATHER_PRESETS[0], 0.5);
  assert.ok(vehicle.telemetry.speed > 0);
});

test("rain reduces achievable speed compared with clear weather over same input", () => {
  const clearVehicle = new VehiclePhysics();
  const rainVehicle = new VehiclePhysics();

  for (let i = 0; i < 120; i += 1) {
    clearVehicle.update({ throttle: 1, brake: 0, steer: 0.8 }, WEATHER_PRESETS[0], 1 / 60);
    rainVehicle.update({ throttle: 1, brake: 0, steer: 0.8 }, WEATHER_PRESETS[1], 1 / 60);
  }

  assert.ok(rainVehicle.telemetry.slip > clearVehicle.telemetry.slip);
});
