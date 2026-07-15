import * as THREE from "three";
import "./styles.css";
import { InputManager } from "./core/InputManager.js";
import { OperatorCamera } from "./core/OperatorCamera.js";
import { VehiclePhysics } from "./core/VehiclePhysics.js";
import { WeatherSystem } from "./core/WeatherSystem.js";
import { createScene, createVehicleMesh } from "./core/SceneFactory.js";
import { VehicleGarage } from "./core/VehicleGarage.js";
import { Hud } from "./ui/Hud.js";
import { RacingMode } from "./modes/RacingMode.js";
import { RockCrawlingMode } from "./modes/RockCrawlingMode.js";
import { MicroArmorMode } from "./modes/MicroArmorMode.js";
import { SemiTruckMode } from "./modes/SemiTruckMode.js";
import { DroneMode } from "./modes/DroneMode.js";
import { HelicopterMode } from "./modes/HelicopterMode.js";
import { ModeManager } from "./modes/ModeManager.js";
import { WeatherEffects } from "./core/WeatherEffects.js";
import { GraphicsPipeline } from "./core/GraphicsPipeline.js";
import { VehicleVfx } from "./core/VehicleVfx.js";
import { XrRuntime } from "./core/XrRuntime.js";
import { TransmitterManager } from "./core/TransmitterManager.js";

const canvas = document.querySelector("#game");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  stencil: false,
  powerPreference: "high-performance"
});

const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 200);
const { scene, obstacles } = createScene();
const graphics = new GraphicsPipeline(renderer, scene, camera);
const weatherEffects = new WeatherEffects(scene);
const vehicleVfx = new VehicleVfx(scene);
const vehicleMesh = createVehicleMesh();
scene.add(vehicleMesh);

const transmitter = new TransmitterManager();
const input = new InputManager(window, transmitter);
const vehicle = new VehiclePhysics();
const garage = new VehicleGarage(vehicle, vehicleMesh);
const weather = new WeatherSystem();
const cameraRig = new OperatorCamera(camera);
const xrRuntime = new XrRuntime(renderer, cameraRig);
const modeManager = new ModeManager([
  new RacingMode(scene),
  new RockCrawlingMode(scene),
  new MicroArmorMode(scene),
  new SemiTruckMode(scene),
  new DroneMode(scene),
  new HelicopterMode(scene)
]);
const clock = new THREE.Clock();
xrRuntime.attach(document.querySelector("#xrButtonSlot"));

function applyModePresentation() {
  if (modeManager.current.preferredProfileId) garage.applyProfile(modeManager.current.preferredProfileId);
  vehicleMesh.visible = modeManager.current.usesGroundVehicle !== false;
}

function advanceMode() {
  const mode = modeManager.next();
  applyModePresentation();
  return mode;
}

applyModePresentation();
const hud = new Hud(input, cameraRig, weather, modeManager, garage, graphics, xrRuntime, transmitter, advanceMode);

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  graphics.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function updateSceneWeather() {
  const current = weather.current;
  scene.fog.near = 34 * current.visibility;
  scene.fog.far = 118 * current.visibility;
  scene.fog.color.set(current.id === "snow" ? 0xd8dde0 : current.id === "rain" ? 0x7e8f9e : 0xb9d8e6);
  scene.background.set(current.id === "snow" ? 0xd8dde0 : current.id === "rain" ? 0x7e8f9e : 0xb9d8e6);
}

function animate() {
  resize();

  const deltaSeconds = Math.min(clock.getDelta(), 0.033);
  const actions = input.getActions();

  if (input.consume("cameraNext")) cameraRig.nextMode();
  if (input.consume("toggleAutoFollow")) cameraRig.toggleAutoFollow();
  if (input.consume("modeNext")) advanceMode();
  if (input.consume("cycleWeather")) weather.cycle();
  if (actions.reset) vehicle.reset();

  updateSceneWeather();
  for (const updatable of scene.userData.updatables ?? []) {
    updatable.userData.update?.(clock.elapsedTime, weather.current);
  }
  weatherEffects.update(weather.current, deltaSeconds);
  const vehicleActions =
    modeManager.current.usesGroundVehicle === false
      ? { ...actions, throttle: 0, brake: 0, steer: 0 }
      : actions;
  vehicle.update(vehicleActions, weather.current, deltaSeconds);
  modeManager.update(vehicle, deltaSeconds, { actions, weather: weather.current });
  vehicleVfx.update(vehicle, weather.current, deltaSeconds);
  vehicleMesh.visible = modeManager.current.usesGroundVehicle !== false;
  vehicleMesh.position.copy(vehicle.position);
  vehicleMesh.rotation.y = vehicle.heading;
  vehicleMesh.rotation.x = THREE.MathUtils.clamp(-vehicle.speed * 0.018, -0.16, 0.16);
  vehicleMesh.rotation.z = THREE.MathUtils.clamp(vehicle.steerAngle * vehicle.speed * 0.035, -0.18, 0.18);
  vehicleMesh.userData.parts.wheels?.forEach((wheel, index) => {
    wheel.rotation.x += vehicle.speed * deltaSeconds * 4.2;
    if (index < 2) wheel.rotation.y = vehicle.steerAngle * 0.42;
  });
  const cameraTarget = modeManager.current.getCameraTarget?.() ?? vehicle;
  cameraRig.update(cameraTarget, actions, obstacles, deltaSeconds);
  hud.update(vehicle);
  graphics.render();
}

resize();
renderer.setAnimationLoop(animate);
