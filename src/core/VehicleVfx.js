import * as THREE from "three";

const TRAIL_COUNT = 44;
const DUST_COUNT = 80;

export class VehicleVfx {
  constructor(scene) {
    this.scene = scene;
    this.trails = this.createTireTrails(scene);
    this.dust = this.createDust();
    this.trailCursor = 0;
    this.trailTimer = 0;
    scene.add(this.dust);
  }

  createTireTrails(scene) {
    const material = new THREE.MeshBasicMaterial({
      color: 0x20242a,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    return Array.from({ length: TRAIL_COUNT }, () => {
      const mark = new THREE.Mesh(createTireMarkGeometry(), material.clone());
      mark.rotation.x = -Math.PI / 2;
      mark.position.y = 0.024;
      mark.visible = false;
      scene.add(mark);
      return { mark, age: 1 };
    });
  }

  createDust() {
    const positions = new Float32Array(DUST_COUNT * 3);
    const colors = new Float32Array(DUST_COUNT * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    const points = new THREE.Points(geometry, material);
    points.userData.velocities = Array.from({ length: DUST_COUNT }, () => new THREE.Vector3());
    points.userData.life = new Float32Array(DUST_COUNT);
    points.userData.cursor = 0;
    return points;
  }

  update(vehicle, weather, deltaSeconds) {
    this.updateTrails(vehicle, deltaSeconds);
    this.emitDust(vehicle, weather);
    this.updateDust(weather, deltaSeconds);
  }

  updateTrails(vehicle, deltaSeconds) {
    this.trailTimer += deltaSeconds;
    const shouldStamp = vehicle.telemetry.speed > 1.6 && (vehicle.telemetry.slip > 0.08 || vehicle.surface !== "asphalt");
    if (shouldStamp && this.trailTimer > 0.075) {
      this.trailTimer = 0;
      for (const side of [-0.42, 0.42]) {
        const mark = this.trails[this.trailCursor];
        this.trailCursor = (this.trailCursor + 1) % this.trails.length;
        const right = new THREE.Vector3(Math.cos(vehicle.heading), 0, -Math.sin(vehicle.heading));
        mark.mark.position.copy(vehicle.position).addScaledVector(right, side);
        mark.mark.position.y = 0.026;
        mark.mark.rotation.z = -vehicle.heading;
        mark.mark.scale.set(0.8, 0.9 + Math.min(vehicle.telemetry.speed, 8) * 0.08, 1);
        mark.mark.material.opacity = vehicle.surface === "ice" ? 0.12 : 0.28;
        mark.mark.visible = true;
        mark.age = 0;
      }
    }

    for (const trail of this.trails) {
      if (!trail.mark.visible) continue;
      trail.age += deltaSeconds * 0.09;
      trail.mark.material.opacity = Math.max(0, trail.mark.material.opacity - deltaSeconds * 0.018);
      if (trail.age > 1 || trail.mark.material.opacity <= 0.01) trail.mark.visible = false;
    }
  }

  emitDust(vehicle, weather) {
    const emission = vehicle.telemetry.speed * (vehicle.surface === "asphalt" ? 0.12 : 0.42) + weather.precipitation * 0.55;
    if (emission < 0.7) return;

    const burst = Math.min(5, Math.ceil(emission));
    const positions = this.dust.geometry.attributes.position.array;
    const colors = this.dust.geometry.attributes.color.array;
    const life = this.dust.userData.life;
    const velocities = this.dust.userData.velocities;
    const backward = new THREE.Vector3(-Math.sin(vehicle.heading), 0, -Math.cos(vehicle.heading));
    const color = new THREE.Color(weather.id === "snow" ? 0xf8fbff : weather.id === "rain" ? 0xbfd7e8 : 0xa78962);

    for (let i = 0; i < burst; i += 1) {
      const cursor = this.dust.userData.cursor;
      this.dust.userData.cursor = (cursor + 1) % DUST_COUNT;
      positions[cursor * 3] = vehicle.position.x + (Math.random() - 0.5) * 0.9;
      positions[cursor * 3 + 1] = 0.18;
      positions[cursor * 3 + 2] = vehicle.position.z + (Math.random() - 0.5) * 0.9;
      colors[cursor * 3] = color.r;
      colors[cursor * 3 + 1] = color.g;
      colors[cursor * 3 + 2] = color.b;
      velocities[cursor].copy(backward).multiplyScalar(0.6 + Math.random() * 1.4);
      velocities[cursor].y = 0.6 + Math.random() * 0.8;
      life[cursor] = 0.55 + Math.random() * 0.45;
    }
    this.dust.geometry.attributes.color.needsUpdate = true;
  }

  updateDust(weather, deltaSeconds) {
    const positions = this.dust.geometry.attributes.position.array;
    const life = this.dust.userData.life;
    const velocities = this.dust.userData.velocities;
    let visibleParticles = 0;

    for (let i = 0; i < DUST_COUNT; i += 1) {
      if (life[i] <= 0) continue;
      life[i] -= deltaSeconds;
      velocities[i].x += weather.wind.x * deltaSeconds * 0.28;
      velocities[i].z += weather.wind.z * deltaSeconds * 0.28;
      velocities[i].y -= deltaSeconds * 1.3;
      positions[i * 3] += velocities[i].x * deltaSeconds;
      positions[i * 3 + 1] = Math.max(0.04, positions[i * 3 + 1] + velocities[i].y * deltaSeconds);
      positions[i * 3 + 2] += velocities[i].z * deltaSeconds;
      visibleParticles += 1;
    }

    this.dust.material.opacity = Math.min(0.72, visibleParticles / 26);
    this.dust.geometry.attributes.position.needsUpdate = true;
  }
}

function createTireMarkGeometry() {
  const geometry = new THREE.PlaneGeometry(0.42, 0.9, 1, 5);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i);
    const edge = Math.abs(position.getX(i)) / 0.21;
    position.setX(i, position.getX(i) * (0.78 + Math.sin(y * 12) * 0.08 + edge * 0.1));
  }
  geometry.computeVertexNormals();
  return geometry;
}
