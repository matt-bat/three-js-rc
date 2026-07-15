import * as THREE from "three";
import { clamp, damp, wrapAngle } from "./math.js";

const SURFACES = {
  asphalt: { grip: 1, drag: 0.18 },
  dirt: { grip: 0.78, drag: 0.32 },
  rock: { grip: 0.86, drag: 0.46 },
  grass: { grip: 0.68, drag: 0.52 },
  ice: { grip: 0.22, drag: 0.08 }
};

const DEFAULT_PROFILE = {
  id: "buggy",
  label: "Buggy",
  accelerationScale: 1,
  brakeScale: 1,
  maxForwardSpeed: 10.5,
  maxReverseSpeed: -2.8,
  steeringScale: 1,
  dragScale: 1,
  gripBonus: 0
};

export class VehiclePhysics {
  constructor() {
    this.position = new THREE.Vector3(0, 0.24, 0);
    this.velocity = new THREE.Vector3();
    this.heading = 0;
    this.speed = 0;
    this.steerAngle = 0;
    this.surface = "asphalt";
    this.profile = DEFAULT_PROFILE;
    this.telemetry = {
      speed: 0,
      slip: 0,
      batteryVoltage: 7.4,
      motorHeat: 24
    };
  }

  setProfile(profile) {
    this.profile = { ...DEFAULT_PROFILE, ...profile };
  }

  reset() {
    this.position.set(0, 0.24, 0);
    this.velocity.set(0, 0, 0);
    this.heading = 0;
    this.speed = 0;
    this.steerAngle = 0;
  }

  update(actions, weather, deltaSeconds) {
    const surface = SURFACES[this.surface] ?? SURFACES.asphalt;
    const grip = clamp(surface.grip * weather.gripScale + this.profile.gripBonus, 0.12, 1.25);
    const throttle = clamp(actions.throttle, 0, 1);
    const brake = clamp(actions.brake, 0, 1);
    const steer = clamp(actions.steer, -1, 1);
    const motorForce = 9.5 * this.profile.accelerationScale * throttle;
    const brakingForce = 14 * this.profile.brakeScale * brake * Math.sign(this.speed || 1);
    const rollingDrag = this.speed * (surface.drag + 0.12) * this.profile.dragScale;
    const windDrag = (weather.wind.x * Math.sin(this.heading) + weather.wind.z * Math.cos(this.heading)) * 0.025;
    const acceleration = motorForce - brakingForce - rollingDrag + windDrag;

    this.speed = clamp(this.speed + acceleration * deltaSeconds, this.profile.maxReverseSpeed, this.profile.maxForwardSpeed);
    this.steerAngle = damp(this.steerAngle, steer * 0.72 * this.profile.steeringScale, 10, deltaSeconds);

    const turnRate = this.steerAngle * this.speed * grip * 0.72;
    this.heading = wrapAngle(this.heading - turnRate * deltaSeconds);

    const forward = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    this.velocity.copy(forward.multiplyScalar(this.speed));
    this.position.addScaledVector(this.velocity, deltaSeconds);
    this.position.x = clamp(this.position.x, -34, 34);
    this.position.z = clamp(this.position.z, -34, 34);

    const radius = Math.max(Math.abs(this.position.x), Math.abs(this.position.z));
    if (radius > 24) this.surface = "grass";
    else if (this.position.x > 7 && this.position.z < -5) this.surface = "dirt";
    else if (this.position.x < -8 && this.position.z > 4) this.surface = "rock";
    else if (this.position.x > 12 && this.position.z > 10) this.surface = "ice";
    else this.surface = "asphalt";

    this.telemetry.speed = Math.abs(this.speed);
    this.telemetry.slip = Math.abs(steer) * Math.abs(this.speed) * (1 - grip);
    this.telemetry.batteryVoltage = clamp(7.4 - throttle * 0.35 - this.telemetry.motorHeat * 0.002, 6.4, 8.4);
    this.telemetry.motorHeat = clamp(this.telemetry.motorHeat + throttle * 5 * deltaSeconds - 1.2 * deltaSeconds, 20, 110);
  }
}
