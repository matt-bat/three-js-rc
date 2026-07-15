import * as THREE from "three";

const GATES = [
  new THREE.Vector3(-15, 0.1, 9),
  new THREE.Vector3(-12, 0.1, 13),
  new THREE.Vector3(-8, 0.1, 10),
  new THREE.Vector3(-5, 0.1, 14)
];

export class RockCrawlingMode {
  constructor(scene) {
    this.name = "Rock Crawl";
    this.preferredProfileId = "crawler";
    this.active = false;
    this.currentGate = 0;
    this.penalties = 0;
    this.elapsed = 0;
    this.markers = GATES.map((position, index) => this.createGate(scene, position, index));
    this.updateMarkers();
  }

  createGate(scene, position, index) {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({
      color: index === 0 ? 0x8ff0a4 : 0x59636e,
      emissive: index === 0 ? 0x063a12 : 0x000000,
      roughness: 0.5
    });
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 10), material);
      post.position.set(side * 0.8, 0.45, 0);
      group.add(post);
    }
    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.08), material);
    crossbar.position.set(0, 0.9, 0);
    group.add(crossbar);
    group.position.copy(position);
    group.rotation.y = index % 2 ? 0.7 : -0.45;
    scene.add(group);
    return { group, material };
  }

  update(vehicle, deltaSeconds) {
    if (!this.active) return;
    this.elapsed += deltaSeconds;
    if (vehicle.telemetry.speed > 4.2) this.penalties += deltaSeconds * 0.5;
    const target = GATES[this.currentGate];
    if (vehicle.position.distanceTo(target) < 1.9) this.advanceGate();
  }

  advanceGate() {
    this.currentGate += 1;
    if (this.currentGate >= GATES.length) this.currentGate = 0;
    this.updateMarkers();
  }

  updateMarkers() {
    this.markers.forEach(({ group, material }, index) => {
      const activeGate = index === this.currentGate;
      group.visible = this.active;
      material.color.set(activeGate ? 0x8ff0a4 : 0x59636e);
      material.emissive.set(activeGate ? 0x063a12 : 0x000000);
      group.scale.setScalar(activeGate ? 1.12 : 1);
    });
  }

  setActive(active) {
    this.active = active;
    this.updateMarkers();
  }

  getStatus() {
    return {
      objective: `crawl gate ${this.currentGate + 1}/${GATES.length}`,
      lap: `${this.elapsed.toFixed(1)}s p ${Math.floor(this.penalties)}`
    };
  }
}

export { GATES };
