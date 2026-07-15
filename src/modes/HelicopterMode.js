import * as THREE from "three";

const RESCUE_PADS = [
  new THREE.Vector3(-13, 1.7, -6),
  new THREE.Vector3(6, 2.1, -14),
  new THREE.Vector3(15, 1.9, 4)
];

const HOVER_RADIUS = 1.35;
const HOVER_SECONDS_REQUIRED = 1.15;

export class HelicopterMode {
  constructor(scene) {
    this.name = "Helicopter Rescue";
    this.actionLabel = "Winch";
    this.usesGroundVehicle = false;
    this.active = false;
    this.elapsed = 0;
    this.currentPad = 0;
    this.rescued = 0;
    this.hoverTimer = 0;
    this.winchDeployed = false;
    this.position = new THREE.Vector3(-10, 2.2, 5);
    this.velocity = new THREE.Vector3();
    this.yaw = Math.PI * 0.65;
    this.helicopter = this.createHelicopter(scene);
    this.pads = RESCUE_PADS.map((position, index) => this.createRescuePad(scene, position, index));
    this.cameraTarget = {
      position: this.position,
      get heading() {
        return this.mode.yaw;
      },
      get speed() {
        return this.mode.velocity.length();
      },
      steerAngle: 0,
      mode: this
    };
    this.updateVisibility();
  }

  createHelicopter(scene) {
    const group = new THREE.Group();
    group.userData.parts = {};
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xd8533f, roughness: 0.42, metalness: 0.12 });
    const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x20344a, roughness: 0.18, metalness: 0.2 });
    const rotorMaterial = new THREE.MeshBasicMaterial({ color: 0x111820, transparent: true, opacity: 0.62, side: THREE.DoubleSide });
    const skidMaterial = new THREE.MeshStandardMaterial({ color: 0x252a30, roughness: 0.58 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.72, 6, 12), bodyMaterial);
    body.rotation.z = Math.PI / 2;
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8), glassMaterial);
    cockpit.scale.set(0.9, 0.62, 0.78);
    cockpit.position.set(0, 0.1, 0.34);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 1.45), bodyMaterial);
    tail.position.z = -0.95;
    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 0.28), bodyMaterial);
    tailFin.position.set(0, 0.25, -1.65);
    const mainRotor = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.025, 0.12), rotorMaterial);
    mainRotor.position.y = 0.55;
    const crossRotor = mainRotor.clone();
    crossRotor.rotation.y = Math.PI / 2;
    const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.035, 0.08), rotorMaterial.clone());
    tailRotor.position.set(0.14, 0.18, -1.78);
    tailRotor.rotation.z = Math.PI / 2;

    for (const x of [-0.28, 0.28]) {
      const skid = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.12), skidMaterial);
      skid.position.set(x, -0.42, 0);
      const strutA = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.55, 0.045), skidMaterial);
      strutA.position.set(x, -0.18, -0.32);
      const strutB = strutA.clone();
      strutB.position.z = 0.32;
      group.add(skid, strutA, strutB);
    }

    const winch = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.2, 6), new THREE.MeshBasicMaterial({ color: 0x1a1d22 }));
    winch.position.y = -0.95;
    winch.visible = false;

    group.add(body, cockpit, tail, tailFin, mainRotor, crossRotor, tailRotor, winch);
    group.userData.parts.mainRotor = mainRotor;
    group.userData.parts.crossRotor = crossRotor;
    group.userData.parts.tailRotor = tailRotor;
    group.userData.parts.winch = winch;
    scene.add(group);
    return group;
  }

  createRescuePad(scene, position, index) {
    const group = new THREE.Group();
    const padMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3d46, roughness: 0.58 });
    const ringMaterial = new THREE.MeshBasicMaterial({ color: index === 0 ? 0xf2c14e : 0x7ba6b3 });
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.08, 28), padMaterial);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.035, 6, 30), ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.065;
    const crossA = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.035, 0.1), ringMaterial);
    const crossB = crossA.clone();
    crossA.position.y = 0.095;
    crossB.position.y = 0.096;
    crossB.rotation.y = Math.PI / 2;
    group.add(pad, ring, crossA, crossB);
    group.position.set(position.x, 0.08, position.z);
    group.visible = false;
    scene.add(group);
    return { group, ringMaterial, position, rescued: false };
  }

  update(vehicle, deltaSeconds, context = {}) {
    if (!this.active) return;
    this.elapsed += deltaSeconds;
    this.winchDeployed = Boolean(context.actions?.primaryAction) || this.winchDeployed;
    this.updateFlight(deltaSeconds, context.actions ?? {}, context.weather);
    this.updateHover(deltaSeconds);
    this.updateMesh();
  }

  updateFlight(deltaSeconds, actions, weather = {}) {
    const forwardInput = THREE.MathUtils.clamp(actions.look?.y ?? 0, -1, 1);
    const yawInput = actions.steer ?? 0;
    const collective = (actions.throttle ?? 0) - (actions.brake ?? 0);
    const wind = typeof weather.wind === "object" ? weather.wind : { x: weather.wind ?? 0, z: 0 };

    this.yaw -= yawInput * 1.25 * deltaSeconds;
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const acceleration = new THREE.Vector3()
      .addScaledVector(forward, forwardInput * 2.8)
      .addScaledVector(new THREE.Vector3(wind.x ?? 0, 0, wind.z ?? 0), 0.52)
      .addScaledVector(new THREE.Vector3(0, 1, 0), collective * 3.2 - 0.28);

    this.velocity.addScaledVector(acceleration, deltaSeconds);
    this.velocity.multiplyScalar(Math.max(0.68, 1 - 1.55 * deltaSeconds));
    this.position.addScaledVector(this.velocity, deltaSeconds);
    this.position.x = THREE.MathUtils.clamp(this.position.x, -22, 22);
    this.position.y = THREE.MathUtils.clamp(this.position.y, 1.05, 7.2);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -22, 12);
  }

  updateHover(deltaSeconds) {
    const pad = RESCUE_PADS[this.currentPad];
    const horizontalDistance = Math.hypot(this.position.x - pad.x, this.position.z - pad.z);
    const altitudeError = Math.abs(this.position.y - pad.y);
    const stable = horizontalDistance < HOVER_RADIUS && altitudeError < 0.85 && this.velocity.length() < 2.15;
    this.hoverTimer = stable ? Math.min(HOVER_SECONDS_REQUIRED, this.hoverTimer + deltaSeconds) : Math.max(0, this.hoverTimer - deltaSeconds * 0.75);
    if (stable && this.winchDeployed && this.hoverTimer >= HOVER_SECONDS_REQUIRED) this.completeRescue();
  }

  completeRescue() {
    this.pads[this.currentPad].rescued = true;
    this.rescued += 1;
    this.currentPad = (this.currentPad + 1) % RESCUE_PADS.length;
    this.hoverTimer = 0;
    this.winchDeployed = false;
    this.updatePadMaterials();
  }

  updatePadMaterials() {
    this.pads.forEach((pad, index) => {
      pad.ringMaterial.color.set(pad.rescued ? 0x78d889 : index === this.currentPad ? 0xf2c14e : 0x7ba6b3);
    });
  }

  updateMesh() {
    this.helicopter.position.copy(this.position);
    this.helicopter.rotation.set(
      THREE.MathUtils.clamp(this.velocity.z * 0.06, -0.22, 0.22),
      this.yaw,
      THREE.MathUtils.clamp(-this.velocity.x * 0.06, -0.28, 0.28)
    );
    const parts = this.helicopter.userData.parts;
    parts.mainRotor.rotation.y = this.elapsed * 34;
    parts.crossRotor.rotation.y = this.elapsed * 34 + Math.PI / 2;
    parts.tailRotor.rotation.x = this.elapsed * 42;
    parts.winch.visible = this.winchDeployed;
  }

  updateVisibility() {
    this.helicopter.visible = this.active;
    this.pads.forEach(({ group }) => {
      group.visible = this.active;
    });
    this.updatePadMaterials();
  }

  setActive(active) {
    this.active = active;
    if (!active) this.winchDeployed = false;
    this.updateVisibility();
  }

  getCameraTarget() {
    return this.cameraTarget;
  }

  getStatus() {
    return {
      objective: `rescue pad ${this.currentPad + 1}/${RESCUE_PADS.length}`,
      lap: `rescued ${this.rescued} hover ${this.hoverTimer.toFixed(1)}s`
    };
  }

  getHudTelemetry() {
    return {
      speed: `${this.velocity.length().toFixed(1)} m/s`,
      surface: "air",
      vehicle: "Rescue Helicopter"
    };
  }
}

export { HOVER_SECONDS_REQUIRED, RESCUE_PADS };
