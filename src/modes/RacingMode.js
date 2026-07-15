import * as THREE from "three";

const CHECKPOINTS = [
  new THREE.Vector3(0, 0.08, -8),
  new THREE.Vector3(10, 0.08, -3),
  new THREE.Vector3(12, 0.08, 9),
  new THREE.Vector3(0, 0.08, 13),
  new THREE.Vector3(-12, 0.08, 6),
  new THREE.Vector3(-9, 0.08, -8)
];

export class RacingMode {
  constructor(scene) {
    this.name = "Time Trial";
    this.preferredProfileId = "buggy";
    this.active = true;
    this.currentCheckpoint = 0;
    this.lapCount = 0;
    this.elapsed = 0;
    this.bestLap = Number(localStorage.getItem("rcworld.bestLap") || 0);
    this.markers = CHECKPOINTS.map((position, index) => this.createMarker(scene, position, index));
    this.updateMarkers();
  }

  createMarker(scene, position, index) {
    const marker = new THREE.Mesh(
      new THREE.TorusGeometry(1.25, 0.06, 8, 28),
      new THREE.MeshStandardMaterial({
        color: index === 0 ? 0xf1d36b : 0x6f7680,
        emissive: index === 0 ? 0x5a4300 : 0x000000,
        roughness: 0.5
      })
    );
    marker.rotation.x = Math.PI / 2;
    marker.position.copy(position);
    scene.add(marker);
    return marker;
  }

  update(vehicle, deltaSeconds) {
    if (!this.active) return;
    this.elapsed += deltaSeconds;
    const target = CHECKPOINTS[this.currentCheckpoint];
    const distance = vehicle.position.distanceTo(target);
    if (distance < 2.2) this.advanceCheckpoint();
  }

  advanceCheckpoint() {
    this.currentCheckpoint += 1;
    if (this.currentCheckpoint >= CHECKPOINTS.length) {
      this.currentCheckpoint = 0;
      this.lapCount += 1;
      if (!this.bestLap || this.elapsed < this.bestLap) {
        this.bestLap = this.elapsed;
        localStorage.setItem("rcworld.bestLap", String(this.bestLap));
      }
      this.elapsed = 0;
    }
    this.updateMarkers();
  }

  updateMarkers() {
    this.markers.forEach((marker, index) => {
      const active = index === this.currentCheckpoint;
      marker.visible = this.active !== false;
      marker.material.color.set(active ? 0xf1d36b : 0x6f7680);
      marker.material.emissive.set(active ? 0x5a4300 : 0x000000);
      marker.scale.setScalar(active ? 1.15 : 1);
    });
  }

  setActive(active) {
    this.active = active;
    this.updateMarkers();
  }

  getStatus() {
    const best = this.bestLap ? ` best ${this.bestLap.toFixed(1)}s` : "";
    return {
      objective: `gate ${this.currentCheckpoint + 1}/${CHECKPOINTS.length}`,
      lap: `${this.elapsed.toFixed(1)}s${best}`
    };
  }
}

export { CHECKPOINTS };
