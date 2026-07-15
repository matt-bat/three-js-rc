import * as THREE from "three";
import { clamp, damp } from "./math.js";

const CAMERA_MODES = ["human", "vehicle", "chase", "topDown", "free"];

export class OperatorCamera {
  constructor(camera) {
    this.camera = camera;
    this.modeIndex = 0;
    this.autoFollow = true;
    this.operatorPosition = new THREE.Vector3(-9, 3.1, -12);
    this.lookOffset = new THREE.Vector2();
    this.isVrHeadsetAuthoritative = false;
    this.freeOrbit = 0;
    this.anchorOffsets = [
      new THREE.Vector3(-9, 3.1, -12),
      new THREE.Vector3(9, 3.1, -12),
      new THREE.Vector3(-12, 3.1, 7),
      new THREE.Vector3(12, 3.1, 7),
      new THREE.Vector3(0, 3.3, -14),
      new THREE.Vector3(-14, 3.3, 0),
      new THREE.Vector3(14, 3.3, 0)
    ];
  }

  get mode() {
    return CAMERA_MODES[this.modeIndex];
  }

  nextMode() {
    this.modeIndex = (this.modeIndex + 1) % CAMERA_MODES.length;
  }

  toggleAutoFollow() {
    this.autoFollow = !this.autoFollow;
  }

  setVrHeadsetAuthoritative(active) {
    this.isVrHeadsetAuthoritative = active;
    if (active) this.lookOffset.set(0, 0);
  }

  update(vehicle, actions, obstacles, deltaSeconds) {
    if (!this.isVrHeadsetAuthoritative) {
      this.lookOffset.x += actions.look.x * deltaSeconds;
      this.lookOffset.y += actions.look.y * deltaSeconds;
      this.lookOffset.x = clamp(this.lookOffset.x, -1.2, 1.2);
      this.lookOffset.y = clamp(this.lookOffset.y, -0.55, 0.55);
      if (!actions.temporaryLookHeld) {
        this.lookOffset.x = damp(this.lookOffset.x, 0, 5, deltaSeconds);
        this.lookOffset.y = damp(this.lookOffset.y, 0, 5, deltaSeconds);
      }
    }

    if (this.autoFollow) this.updateOperatorPosition(vehicle.position, obstacles, deltaSeconds);

    if (this.isVrHeadsetAuthoritative) {
      if (this.mode !== "human") this.modeIndex = 0;
      this.camera.position.copy(this.operatorPosition);
      return;
    }

    if (this.mode === "vehicle") this.applyVehicleCamera(vehicle);
    else if (this.mode === "chase") this.applyChaseCamera(vehicle);
    else if (this.mode === "topDown") this.applyTopDownCamera(vehicle);
    else if (this.mode === "free") this.applyFreeCamera(vehicle, deltaSeconds);
    else this.applyHumanCamera(vehicle);
  }

  updateOperatorPosition(vehiclePosition, obstacles, deltaSeconds) {
    const preferred = vehiclePosition.clone().add(this.anchorOffsets[0]);
    const candidate = this.findLineOfSightPosition(vehiclePosition, obstacles);
    this.operatorPosition.lerp(candidate, 1 - Math.exp(-2.4 * deltaSeconds));
  }

  findLineOfSightPosition(vehiclePosition, obstacles) {
    const scored = this.anchorOffsets.map((offset, index) => {
      const candidate = vehiclePosition.clone().add(offset);
      const obstructionCount = this.countObstructions(candidate, vehiclePosition, obstacles);
      const clearancePenalty = this.closestObstaclePenalty(candidate, obstacles);
      const foregroundPenalty = this.foregroundClutterPenalty(candidate, vehiclePosition, obstacles);
      const movementPenalty = candidate.distanceTo(this.operatorPosition) * 0.05;
      const preferencePenalty = index * 0.12;
      return {
        candidate,
        score: obstructionCount * 100 + clearancePenalty + foregroundPenalty + movementPenalty + preferencePenalty
      };
    });
    scored.sort((a, b) => a.score - b.score);
    return scored[0].candidate;
  }

  countObstructions(from, to, obstacles) {
    const line = new THREE.Line3(from, to);
    return obstacles.reduce((count, obstacle) => {
      const closest = new THREE.Vector3();
      line.closestPointToPoint(obstacle.position, true, closest);
      return closest.distanceTo(obstacle.position) < obstacle.radius * 1.35 ? count + 1 : count;
    }, 0);
  }

  closestObstaclePenalty(candidate, obstacles) {
    return obstacles.reduce((penalty, obstacle) => {
      const distance = candidate.distanceTo(obstacle.position);
      const clearance = distance - obstacle.radius;
      return penalty + (clearance < 4 ? (4 - clearance) * 12 : 0);
    }, 0);
  }

  foregroundClutterPenalty(candidate, target, obstacles) {
    const forward = target.clone().sub(candidate);
    const viewDistance = forward.length();
    forward.normalize();
    return obstacles.reduce((penalty, obstacle) => {
      const toObstacle = obstacle.position.clone().sub(candidate);
      const alongView = toObstacle.dot(forward);
      if (alongView <= 0 || alongView >= viewDistance + 4) return penalty;
      const nearestViewPoint = candidate.clone().addScaledVector(forward, alongView);
      const lateralDistance = obstacle.position.distanceTo(nearestViewPoint);
      const nearCamera = alongView < 7 && lateralDistance < obstacle.radius + 4;
      const midFrame = alongView < viewDistance * 0.75 && lateralDistance < obstacle.radius + 2;
      return penalty + (nearCamera ? 45 : 0) + (midFrame ? 20 : 0);
    }, 0);
  }

  applyHumanCamera(vehicle) {
    this.camera.position.copy(this.operatorPosition);
    const target = vehicle.position.clone().add(new THREE.Vector3(this.lookOffset.x * 3, this.lookOffset.y * 2 + 0.55, 0));
    this.camera.lookAt(target);
  }

  applyVehicleCamera(vehicle) {
    const forward = new THREE.Vector3(Math.sin(vehicle.heading), 0, Math.cos(vehicle.heading));
    this.camera.position.copy(vehicle.position).add(new THREE.Vector3(0, 0.58, 0)).addScaledVector(forward, 0.45);
    this.camera.lookAt(vehicle.position.clone().addScaledVector(forward, 5).add(new THREE.Vector3(0, 0.45, 0)));
  }

  applyChaseCamera(vehicle) {
    const back = new THREE.Vector3(-Math.sin(vehicle.heading), 0, -Math.cos(vehicle.heading));
    this.camera.position.copy(vehicle.position).addScaledVector(back, 5.5).add(new THREE.Vector3(0, 2.5, 0));
    this.camera.lookAt(vehicle.position.clone().add(new THREE.Vector3(0, 0.5, 0)));
  }

  applyTopDownCamera(vehicle) {
    this.camera.position.copy(vehicle.position).add(new THREE.Vector3(0, 13, 0.01));
    this.camera.lookAt(vehicle.position);
  }

  applyFreeCamera(vehicle, deltaSeconds) {
    this.freeOrbit += deltaSeconds * 0.25;
    this.camera.position.set(
      vehicle.position.x + Math.sin(this.freeOrbit) * 13,
      7,
      vehicle.position.z + Math.cos(this.freeOrbit) * 13
    );
    this.camera.lookAt(vehicle.position);
  }
}

export { CAMERA_MODES };
