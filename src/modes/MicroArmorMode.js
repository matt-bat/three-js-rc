import * as THREE from "three";

const TARGETS = [
  new THREE.Vector3(9, 0.65, -10),
  new THREE.Vector3(17, 0.65, 3),
  new THREE.Vector3(-14, 0.65, -13),
  new THREE.Vector3(-18, 0.65, 2)
];

export class MicroArmorMode {
  constructor(scene) {
    this.name = "Micro Armor";
    this.actionLabel = "Fire";
    this.preferredProfileId = "armor";
    this.scene = scene;
    this.active = false;
    this.score = 0;
    this.shots = 0;
    this.cooldown = 0;
    this.projectiles = [];
    this.hitSplats = [];
    this.targets = TARGETS.map((position, index) => this.createTarget(scene, position, index));
  }

  createTarget(scene, position, index) {
    const group = new THREE.Group();
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x28313f, roughness: 0.65 });
    const armorMaterial = new THREE.MeshStandardMaterial({
      color: index % 2 ? 0x4e72c9 : 0xc94e5c,
      roughness: 0.45
    });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.36, 1.1), baseMaterial);
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.22, 18), armorMaterial);
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.9), armorMaterial);
    base.position.y = 0.18;
    turret.position.y = 0.52;
    barrel.position.set(0, 0.54, -0.58);
    group.add(base, turret, barrel);
    group.position.copy(position);
    group.rotation.y = index * 0.8;
    group.visible = false;
    scene.add(group);
    return { group, position, radius: 1.05, hit: false };
  }

  update(vehicle, deltaSeconds, context = {}) {
    if (!this.active) return;
    this.cooldown = Math.max(0, this.cooldown - deltaSeconds);
    if (context.actions?.primaryAction) this.fire(vehicle);
    this.updateProjectiles(deltaSeconds, context.weather);
    this.updateSplats(deltaSeconds);
  }

  fire(vehicle) {
    if (this.cooldown > 0) return;
    const forward = new THREE.Vector3(Math.sin(vehicle.heading), 0, Math.cos(vehicle.heading));
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xff5ca8, emissive: 0x5c1438, roughness: 0.35 })
    );
    mesh.position.copy(vehicle.position).add(new THREE.Vector3(0, 0.65, 0)).addScaledVector(forward, 1.15);
    mesh.visible = this.active;
    this.scene.add(mesh);
    this.projectiles.push({
      mesh,
      velocity: forward.multiplyScalar(12),
      age: 0,
      hitTarget: false
    });
    this.shots += 1;
    this.cooldown = 0.55;
  }

  updateProjectiles(deltaSeconds, weather = { wind: { x: 0, z: 0 } }) {
    for (const projectile of this.projectiles) {
      projectile.age += deltaSeconds;
      projectile.velocity.x += weather.wind.x * deltaSeconds * 0.4;
      projectile.velocity.z += weather.wind.z * deltaSeconds * 0.4;
      projectile.velocity.y -= 2.1 * deltaSeconds;
      projectile.mesh.position.addScaledVector(projectile.velocity, deltaSeconds);
      for (const target of this.targets) {
        if (!target.hit && projectile.mesh.position.distanceTo(target.position) < target.radius) {
          target.hit = true;
          target.group.scale.setScalar(0.72);
          this.createPaintSplat(target.position, this.score);
          this.score += 1;
          projectile.age = 99;
          projectile.hitTarget = true;
        }
      }
    }
    this.projectiles = this.projectiles.filter((projectile) => {
      const keep = projectile.age < 4 && projectile.mesh.position.y > 0;
      if (!keep) {
        if (!projectile.hitTarget && projectile.mesh.position.y <= 0) this.createPaintSplat(projectile.mesh.position, this.hitSplats.length);
        projectile.mesh.removeFromParent();
      }
      return keep;
    });
  }

  setActive(active) {
    this.active = active;
    this.targets.forEach((target) => {
      target.group.visible = active;
    });
    this.projectiles.forEach((projectile) => {
      projectile.mesh.visible = active;
    });
    this.hitSplats.forEach((splat) => {
      splat.mesh.visible = active;
    });
  }

  createPaintSplat(position, index) {
    const colors = [0xff5ca8, 0x5cc8ff, 0xf2c14e, 0x8bff78];
    const mesh = new THREE.Mesh(
      createPaintSplatGeometry(index),
      new THREE.MeshBasicMaterial({
        color: colors[index % colors.length],
        transparent: true,
        opacity: 0.94,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = index * 0.7;
    mesh.position.copy(position);
    mesh.position.y = 0.048;
    mesh.visible = this.active;
    this.scene.add(mesh);
    this.hitSplats.push({ mesh, age: 0 });
    return mesh;
  }

  updateSplats(deltaSeconds) {
    for (const splat of this.hitSplats) {
      splat.age += deltaSeconds;
      splat.mesh.scale.setScalar(Math.min(1.35, 1 + splat.age * 1.8));
      splat.mesh.material.opacity = Math.max(0.58, 0.94 - splat.age * 0.04);
    }
  }

  getStatus() {
    return {
      objective: `targets ${this.score}/${this.targets.length}`,
      lap: `shots ${this.shots}`
    };
  }
}

function createPaintSplatGeometry(seed) {
  const shape = new THREE.Shape();
  const segments = 18;
  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    const radius = 0.48 + Math.sin(i * 1.9 + seed) * 0.12 + Math.cos(i * 2.7 + seed * 0.4) * 0.07;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.scale(1.9, 1.9, 1);
  return geometry;
}

export { TARGETS };
