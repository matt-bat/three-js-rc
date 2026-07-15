import * as THREE from "three";

const AIR_GATES = [
  new THREE.Vector3(-4, 2.7, -7),
  new THREE.Vector3(2, 3.5, -12),
  new THREE.Vector3(8, 2.4, -7),
  new THREE.Vector3(4, 4.2, 1)
];

export class DroneMode {
  constructor(scene) {
    this.name = "Drone Flight";
    this.usesGroundVehicle = false;
    this.active = false;
    this.elapsed = 0;
    this.currentGate = 0;
    this.completedGates = 0;
    this.position = new THREE.Vector3(-8, 2.3, -2);
    this.velocity = new THREE.Vector3();
    this.yaw = Math.PI * 0.22;
    this.drone = this.createDrone(scene);
    this.gates = AIR_GATES.map((position, index) => this.createGate(scene, position, index));
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

  createDrone(scene) {
    const group = new THREE.Group();
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x233449, roughness: 0.38, metalness: 0.25 });
    const accentMaterial = new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: 0.42 });
    const rotorMaterial = new THREE.MeshStandardMaterial({ color: 0x111820, roughness: 0.2, transparent: true, opacity: 0.72 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.22, 0.52), bodyMaterial);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.28), accentMaterial);
    nose.position.z = 0.42;
    group.add(body, nose);

    const armGeometry = new THREE.BoxGeometry(1.55, 0.07, 0.07);
    const armA = new THREE.Mesh(armGeometry, bodyMaterial);
    const armB = armA.clone();
    armB.rotation.y = Math.PI / 2;
    group.add(armA, armB);

    for (const [x, z] of [
      [-0.78, -0.78],
      [0.78, -0.78],
      [-0.78, 0.78],
      [0.78, 0.78]
    ]) {
      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.025, 28), rotorMaterial);
      rotor.position.set(x, 0.1, z);
      group.add(rotor);
    }

    scene.add(group);
    return group;
  }

  createGate(scene, position, index) {
    const material = new THREE.MeshStandardMaterial({
      color: index === 0 ? 0xf2c14e : 0x4f6f87,
      emissive: index === 0 ? 0x4c3200 : 0x000000,
      roughness: 0.34,
      metalness: 0.08
    });
    const gate = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.045, 8, 38), material);
    gate.position.copy(position);
    gate.rotation.y = Math.PI / 2;
    scene.add(gate);
    return { gate, material, position };
  }

  update(vehicle, deltaSeconds, context = {}) {
    if (!this.active) return;

    this.elapsed += deltaSeconds;
    this.updateFlight(deltaSeconds, context.actions ?? {}, context.weather);
    this.updateDroneMesh(deltaSeconds);

    if (this.position.distanceTo(AIR_GATES[this.currentGate]) < 1.2) this.completeGate();
  }

  updateFlight(deltaSeconds, actions, weather = {}) {
    const forwardInput = actions.look?.y ?? 0;
    const strafeInput = actions.steer ?? 0;
    const climbInput = (actions.throttle ?? 0) - (actions.brake ?? 0);
    const wind = weather.wind ?? { x: 0, z: 0 };

    this.yaw -= strafeInput * 1.65 * deltaSeconds;
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    const acceleration = new THREE.Vector3()
      .addScaledVector(forward, 2.4 + forwardInput * 2.2)
      .addScaledVector(right, strafeInput * 1.8)
      .addScaledVector(new THREE.Vector3(wind.x, 0, wind.z), 0.65)
      .addScaledVector(new THREE.Vector3(0, 1, 0), climbInput * 3.0);

    this.velocity.addScaledVector(acceleration, deltaSeconds);
    this.velocity.multiplyScalar(Math.max(0.72, 1 - 1.85 * deltaSeconds));
    this.position.addScaledVector(this.velocity, deltaSeconds);
    this.position.x = THREE.MathUtils.clamp(this.position.x, -20, 22);
    this.position.y = THREE.MathUtils.clamp(this.position.y, 1.1, 7.5);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -20, 10);
  }

  updateDroneMesh(deltaSeconds) {
    this.drone.position.copy(this.position);
    this.drone.rotation.set(
      THREE.MathUtils.clamp(this.velocity.z * 0.08, -0.28, 0.28),
      this.yaw,
      THREE.MathUtils.clamp(-this.velocity.x * 0.08, -0.34, 0.34)
    );

    const rotorSpin = this.elapsed * 28;
    this.drone.children.forEach((child, index) => {
      if (index >= 4) child.rotation.y = rotorSpin * (index % 2 === 0 ? 1 : -1);
    });

    const pulse = 1 + Math.sin(this.elapsed * 5) * 0.04;
    this.gates.forEach(({ gate }, index) => {
      gate.scale.setScalar(index === this.currentGate ? pulse : 1);
    });
  }

  completeGate() {
    this.completedGates += 1;
    this.currentGate = (this.currentGate + 1) % AIR_GATES.length;
    this.updateGateMaterials();
  }

  updateGateMaterials() {
    this.gates.forEach(({ material }, index) => {
      const activeGate = index === this.currentGate;
      material.color.set(activeGate ? 0xf2c14e : 0x4f6f87);
      material.emissive.set(activeGate ? 0x4c3200 : 0x000000);
    });
  }

  updateVisibility() {
    this.drone.visible = this.active;
    this.gates.forEach(({ gate }) => {
      gate.visible = this.active;
    });
    this.updateGateMaterials();
  }

  setActive(active) {
    this.active = active;
    this.updateVisibility();
  }

  getCameraTarget() {
    return this.cameraTarget;
  }

  getStatus() {
    return {
      objective: `air gate ${this.currentGate + 1}/${AIR_GATES.length}`,
      lap: `alt ${this.position.y.toFixed(1)}m gates ${this.completedGates}`
    };
  }

  getHudTelemetry() {
    return {
      speed: `${this.velocity.length().toFixed(1)} m/s`,
      surface: "air",
      vehicle: "Quad Drone"
    };
  }
}

export { AIR_GATES };
