import * as THREE from "three";

export class WeatherEffects {
  constructor(scene) {
    this.scene = scene;
    this.particles = this.createParticles();
    this.windArrow = this.createWindArrow();
    this.wetSheen = this.createSurfaceSheen(scene, 0x8fd8ff);
    this.snowSheen = this.createSurfaceSheen(scene, 0xffffff);
    this.puddles = this.createGroundOverlays(scene, "puddle", "#bceeff", [
      [1, 5, 5.8, 2.8, -0.15],
      [-3, 1, 4.6, 2.2, 0.1],
      [-6, -2, 2.8, 1.4, 0.2],
      [7, 8, 3.2, 1.7, -0.5],
      [13, -10, 2.4, 1.1, 0.9],
      [-14, 9, 3.6, 1.5, -0.2]
    ]);
    this.snowPatches = this.createGroundOverlays(scene, "splash", "#f7fbff", [
      [1, 5, 6.8, 4.2, -0.15],
      [-2, 2, 6.2, 3.8, 0.2],
      [-18, -16, 5.5, 3.6, 0.4],
      [19, 13, 4.8, 3.4, -0.8],
      [4, -18, 4.2, 2.8, 0.1],
      [-8, 15, 4.6, 3.2, 0.7]
    ]);
    this.windStreamers = this.createWindStreamers(scene);
    scene.add(this.particles, this.windArrow);
  }

  createParticles() {
    const count = 220;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = Math.random() * 54 - 27;
      positions[i * 3 + 1] = Math.random() * 16 + 2;
      positions[i * 3 + 2] = Math.random() * 54 - 27;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xd8f0ff,
      size: 0.09,
      transparent: true,
      opacity: 0
    });
    return new THREE.Points(geometry, material);
  }

  createWindArrow() {
    const group = new THREE.Group();
    const shaft = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.08, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xdde7ef, roughness: 0.4 })
    );
    const head = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.5, 16),
      new THREE.MeshStandardMaterial({ color: 0xdde7ef, roughness: 0.4 })
    );
    shaft.position.x = -0.25;
    head.position.x = 1.1;
    head.rotation.z = -Math.PI / 2;
    group.add(shaft, head);
    group.position.set(-16, 2.2, -16);
    group.visible = false;
    return group;
  }

  createGroundOverlays(scene, kind, color, specs) {
    return specs.map(([x, z, width, depth, rotation]) => {
      const geometry = kind === "puddle" ? new THREE.CircleGeometry(0.5, 18) : createIrregularPatchGeometry(18);
      const overlay = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          color: kind === "puddle" ? 0xbceeff : 0xffffff,
          transparent: true,
          opacity: 0,
          depthTest: false,
          depthWrite: false,
          blending: kind === "puddle" ? THREE.AdditiveBlending : THREE.NormalBlending
        })
      );
      overlay.rotation.x = -Math.PI / 2;
      overlay.rotation.z = rotation;
      overlay.position.set(x, 0.032, z);
      overlay.scale.set(width, depth, 1);
      overlay.renderOrder = 6;
      overlay.visible = false;
      scene.add(overlay);
      return overlay;
    });
  }

  createSurfaceSheen(scene, color) {
    const sheen = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false
      })
    );
    sheen.rotation.x = -Math.PI / 2;
    sheen.position.set(0, 0.028, 0);
    sheen.renderOrder = 5;
    sheen.visible = false;
    scene.add(sheen);
    return sheen;
  }

  createWindStreamers(scene) {
    return Array.from({ length: 10 }, (_, index) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setFromPoints([
        new THREE.Vector3(-1.2, 0, 0),
        new THREE.Vector3(0.25, 0.08, 0),
        new THREE.Vector3(1.2, -0.04, 0),
        new THREE.Vector3(-0.75, -0.22, 0),
        new THREE.Vector3(0.75, -0.16, 0)
      ]);
      const streamer = new THREE.LineSegments(
        geometry,
        new THREE.LineBasicMaterial({
          color: 0x5f8fa8,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          linewidth: 2
        })
      );
      streamer.position.set(-14 + index * 3.3, 1.15 + (index % 3) * 0.45, -14 + (index % 5) * 5.4);
      streamer.rotation.x = -0.18;
      streamer.visible = false;
      scene.add(streamer);
      return streamer;
    });
  }

  update(weather, deltaSeconds) {
    const precipitation = weather.precipitation ?? 0;
    this.particles.material.opacity = weather.id === "snow" ? precipitation * 0.5 : precipitation * 0.78;
    this.particles.material.color.set(weather.id === "snow" ? 0xffffff : 0xaedcff);
    this.particles.material.size = weather.id === "snow" ? 0.13 : 0.075;
    this.particles.visible = precipitation > 0.05;

    const positions = this.particles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += weather.wind.x * deltaSeconds * 0.4;
      positions[i + 1] -= (weather.id === "snow" ? 1.7 : 6.5) * deltaSeconds;
      positions[i + 2] += weather.wind.z * deltaSeconds * 0.4;
      if (positions[i + 1] < 0.2) positions[i + 1] = 18;
      if (positions[i] > 28) positions[i] = -28;
      if (positions[i] < -28) positions[i] = 28;
      if (positions[i + 2] > 28) positions[i + 2] = -28;
      if (positions[i + 2] < -28) positions[i + 2] = 28;
    }
    this.particles.geometry.attributes.position.needsUpdate = true;

    const windStrength = Math.hypot(weather.wind.x, weather.wind.z);
    this.windArrow.visible = windStrength > 0.2;
    this.windArrow.rotation.y = Math.atan2(weather.wind.x, weather.wind.z) - Math.PI / 2;
    this.windArrow.scale.setScalar(0.75 + Math.min(windStrength, 3) * 0.22);

    this.updateGroundWeather(weather, deltaSeconds, windStrength);
  }

  updateGroundWeather(weather, deltaSeconds, windStrength) {
    const rainBlend = weather.id === "rain" ? weather.precipitation : 0;
    const snowBlend = weather.id === "snow" ? weather.precipitation : 0;
    this.wetSheen.visible = rainBlend > 0.05;
    this.wetSheen.material.opacity = THREE.MathUtils.damp(this.wetSheen.material.opacity, rainBlend * 0.16, 4, deltaSeconds);
    this.snowSheen.visible = snowBlend > 0.05;
    this.snowSheen.material.opacity = THREE.MathUtils.damp(this.snowSheen.material.opacity, snowBlend * 0.08, 3.4, deltaSeconds);

    for (const puddle of this.puddles) {
      puddle.visible = rainBlend > 0.05;
      puddle.material.opacity = THREE.MathUtils.damp(puddle.material.opacity, rainBlend * 0.76, 4, deltaSeconds);
    }
    for (const patch of this.snowPatches) {
      patch.visible = snowBlend > 0.05;
      patch.material.opacity = THREE.MathUtils.damp(patch.material.opacity, snowBlend * 0.52, 3.4, deltaSeconds);
    }

    const streamerOpacity = weather.id === "wind" ? Math.min(0.92, windStrength * 0.28) : 0;
    for (const [index, streamer] of this.windStreamers.entries()) {
      streamer.visible = streamerOpacity > 0.02;
      streamer.material.opacity = THREE.MathUtils.damp(streamer.material.opacity, streamerOpacity, 5, deltaSeconds);
      streamer.rotation.y = Math.atan2(weather.wind.x, weather.wind.z) + Math.PI / 2;
      streamer.position.x += weather.wind.x * deltaSeconds * (0.5 + index * 0.025);
      streamer.position.z += weather.wind.z * deltaSeconds * (0.5 + index * 0.025);
      if (streamer.position.x > 24) streamer.position.x = -24;
      if (streamer.position.x < -24) streamer.position.x = 24;
      if (streamer.position.z > 24) streamer.position.z = -24;
      if (streamer.position.z < -24) streamer.position.z = 24;
    }
  }
}

function createIrregularPatchGeometry(segments) {
  const shape = new THREE.Shape();
  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    const radius = 0.42 + Math.sin(i * 1.7) * 0.05 + Math.cos(i * 0.9) * 0.035;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}
