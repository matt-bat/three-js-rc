import * as THREE from "three";

const DOCKS = [
  new THREE.Vector3(18, 0.04, -14),
  new THREE.Vector3(18, 0.04, -8),
  new THREE.Vector3(18, 0.04, -2)
];

export class SemiTruckMode {
  constructor(scene) {
    this.name = "Semi Truck";
    this.preferredProfileId = "semi";
    this.active = false;
    this.currentDock = 0;
    this.deliveries = 0;
    this.elapsed = 0;
    this.trailerHeading = 0;
    this.trailer = this.createTrailer(scene);
    this.docks = DOCKS.map((position, index) => this.createDock(scene, position, index));
    this.updateVisibility();
  }

  createTrailer(scene) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.45, 0.64, 2.6),
      new THREE.MeshStandardMaterial({ color: 0xe7e2d1, roughness: 0.55, metalness: 0.05 })
    );
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(1.52, 0.12, 2.68),
      new THREE.MeshStandardMaterial({ color: 0x3174c8, roughness: 0.45 })
    );
    body.position.y = 0.58;
    trim.position.y = 0.93;
    group.add(body, trim);
    scene.add(group);
    return group;
  }

  createDock(scene, position, index) {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({
      color: index === 0 ? 0xf1d36b : 0x6d7480,
      emissive: index === 0 ? 0x413000 : 0,
      roughness: 0.5
    });
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 2.7), material);
    const right = left.clone();
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.14), material);
    left.position.set(-1.1, 0.05, 0);
    right.position.set(1.1, 0.05, 0);
    back.position.set(0, 0.05, -1.32);
    group.add(left, right, back);
    group.position.copy(position);
    scene.add(group);
    return { group, material, position };
  }

  update(vehicle, deltaSeconds) {
    if (!this.active) return;
    this.elapsed += deltaSeconds;
    this.updateTrailer(vehicle, deltaSeconds);

    const target = DOCKS[this.currentDock];
    const trailerDistance = this.trailer.position.distanceTo(target);
    if (trailerDistance < 1.35 && vehicle.telemetry.speed < 0.45) this.completeDelivery();
  }

  updateTrailer(vehicle, deltaSeconds) {
    const hitchDirection = new THREE.Vector3(Math.sin(vehicle.heading), 0, Math.cos(vehicle.heading));
    const hitchPoint = vehicle.position.clone().addScaledVector(hitchDirection, -1.0);
    const targetHeading = vehicle.heading;
    const turnBlend = 1 - Math.exp(-3.2 * deltaSeconds);
    this.trailerHeading += (targetHeading - this.trailerHeading) * turnBlend;
    const trailerDirection = new THREE.Vector3(Math.sin(this.trailerHeading), 0, Math.cos(this.trailerHeading));
    this.trailer.position.copy(hitchPoint).addScaledVector(trailerDirection, -1.55);
    this.trailer.position.y = 0;
    this.trailer.rotation.y = this.trailerHeading;
  }

  completeDelivery() {
    this.deliveries += 1;
    this.currentDock = (this.currentDock + 1) % DOCKS.length;
    this.updateDockMaterials();
  }

  updateDockMaterials() {
    this.docks.forEach(({ material, group }, index) => {
      const activeDock = index === this.currentDock;
      material.color.set(activeDock ? 0xf1d36b : 0x6d7480);
      material.emissive.set(activeDock ? 0x413000 : 0x000000);
      group.scale.setScalar(activeDock ? 1.12 : 1);
    });
  }

  updateVisibility() {
    this.trailer.visible = this.active;
    this.docks.forEach(({ group }) => {
      group.visible = this.active;
    });
    this.updateDockMaterials();
  }

  setActive(active) {
    this.active = active;
    this.updateVisibility();
  }

  getStatus() {
    return {
      objective: `dock ${this.currentDock + 1}/${DOCKS.length}`,
      lap: `loads ${this.deliveries} ${this.elapsed.toFixed(1)}s`
    };
  }

  getHudTelemetry(vehicle) {
    return {
      speed: `${vehicle.telemetry.speed.toFixed(1)} m/s`,
      surface: vehicle.surface,
      vehicle: "Semi Tractor"
    };
  }
}

export { DOCKS };
