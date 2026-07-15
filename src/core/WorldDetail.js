import * as THREE from "three";

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function seededNoise(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function placeInstance(mesh, index, x, z, y, scale, rotation = 0) {
  const transform = new THREE.Object3D();
  transform.position.set(x, y, z);
  transform.rotation.y = rotation;
  transform.scale.setScalar(scale);
  transform.updateMatrix();
  mesh.setMatrixAt(index, transform.matrix);
}

function isCourseClear(x, z) {
  return Math.abs(x) > 7 || Math.abs(z) > 6;
}

export function createWorldDetail() {
  const group = new THREE.Group();
  group.name = "production-world-detail";
  group.userData.metrics = {
    instanceCount: 0,
    instancedMeshes: 0,
    lodCount: 0
  };

  addInstancedGrass(group);
  addInstancedPebbles(group);
  addInstancedFlowers(group);
  addTrackReflectors(group);
  addLodTreeLine(group);
  addAnimatedBanners(group);

  group.traverse((child) => {
    if (child.isInstancedMesh) {
      child.instanceMatrix.needsUpdate = true;
      group.userData.metrics.instancedMeshes += 1;
      group.userData.metrics.instanceCount += child.count;
    }
    if (child.isLOD) group.userData.metrics.lodCount += 1;
  });

  group.userData.update = (elapsedSeconds, weather) => {
    const windStrength = Math.hypot(weather?.wind?.x ?? 0, weather?.wind?.z ?? 0);
    for (const banner of group.userData.banners ?? []) {
      banner.rotation.z = Math.sin(elapsedSeconds * 2.4 + banner.userData.phase) * (0.04 + windStrength * 0.025);
      banner.material.opacity = 0.66 + Math.sin(elapsedSeconds * 1.7 + banner.userData.phase) * 0.08;
    }
  };

  return group;
}

function addInstancedGrass(group) {
  const count = 360;
  const geometry = new THREE.ConeGeometry(0.04, 0.42, 4);
  geometry.translate(0, 0.21, 0);
  const material = new THREE.MeshLambertMaterial({ color: 0x6f8f59, flatShading: true });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = "instanced-grass-blades";
  mesh.castShadow = false;
  mesh.receiveShadow = false;

  let written = 0;
  for (let i = 0; written < count; i += 1) {
    const angle = i * GOLDEN_ANGLE;
    const radius = 9 + seededNoise(i + 3) * 43;
    const x = Math.cos(angle) * radius + (seededNoise(i + 41) - 0.5) * 5;
    const z = Math.sin(angle) * radius + (seededNoise(i + 73) - 0.5) * 5;
    if (!isCourseClear(x, z)) continue;
    const scale = 0.72 + seededNoise(i + 101) * 0.78;
    placeInstance(mesh, written, x, z, 0.03, scale, angle + seededNoise(i + 5));
    written += 1;
  }
  group.add(mesh);
}

function addInstancedPebbles(group) {
  const count = 140;
  const geometry = new THREE.DodecahedronGeometry(0.12, 0);
  const material = new THREE.MeshStandardMaterial({ color: 0x7c766b, roughness: 0.92, metalness: 0.02 });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = "instanced-course-pebbles";
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  for (let i = 0; i < count; i += 1) {
    const angle = i * GOLDEN_ANGLE;
    const radius = 11 + seededNoise(i + 201) * 35;
    const x = Math.cos(angle) * radius + (seededNoise(i + 13) - 0.5) * 4;
    const z = Math.sin(angle) * radius + (seededNoise(i + 17) - 0.5) * 4;
    const scale = 0.45 + seededNoise(i + 211) * 1.35;
    placeInstance(mesh, i, x, z, 0.1, scale, seededNoise(i + 31) * Math.PI);
  }
  group.add(mesh);
}

function addInstancedFlowers(group) {
  const count = 96;
  const geometry = new THREE.OctahedronGeometry(0.07, 0);
  const material = new THREE.MeshBasicMaterial({ vertexColors: true });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = "instanced-wildflower-heads";

  const color = new THREE.Color();
  for (let i = 0; i < count; i += 1) {
    const angle = i * GOLDEN_ANGLE;
    const radius = 14 + seededNoise(i + 301) * 31;
    const x = Math.cos(angle) * radius + (seededNoise(i + 37) - 0.5) * 3;
    const z = Math.sin(angle) * radius + (seededNoise(i + 43) - 0.5) * 3;
    placeInstance(mesh, i, x, z, 0.43, 0.85 + seededNoise(i + 311) * 0.45, angle);
    color.setHSL([0.14, 0.01, 0.96, 0.58][i % 4], 0.78, 0.62);
    mesh.setColorAt(i, color);
  }
  mesh.instanceColor.needsUpdate = true;
  group.add(mesh);
}

function addTrackReflectors(group) {
  const count = 44;
  const postGeometry = new THREE.BoxGeometry(0.08, 0.55, 0.08);
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x37332a, roughness: 0.72 });
  const postMesh = new THREE.InstancedMesh(postGeometry, postMaterial, count);
  postMesh.name = "instanced-reflector-posts";
  const markerGeometry = new THREE.SphereGeometry(0.08, 8, 6);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffd35d });
  const markerMesh = new THREE.InstancedMesh(markerGeometry, markerMaterial, count);
  markerMesh.name = "instanced-reflector-lights";

  for (let i = 0; i < count; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const t = i / (count - 1);
    const x = -31 + t * 63 + Math.sin(t * Math.PI * 5) * 2.1;
    const z = -14 + Math.sin(t * Math.PI * 1.7) * 20 + side * 3.1;
    placeInstance(postMesh, i, x, z, 0.27, 1, t * Math.PI);
    placeInstance(markerMesh, i, x, z, 0.61, 1, 0);
  }
  group.add(postMesh, markerMesh);
}

function addLodTreeLine(group) {
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x76583f, roughness: 0.9 });
  const crownMaterial = new THREE.MeshStandardMaterial({ color: 0x5f8566, roughness: 0.94, flatShading: true });
  const lowCrownGeometry = new THREE.ConeGeometry(0.78, 1.7, 5);
  const lowCrownMaterial = new THREE.MeshBasicMaterial({ color: 0x6f9568 });

  for (let i = 0; i < 18; i += 1) {
    const lod = new THREE.LOD();
    lod.name = "tree-lod";
    const high = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.25, 6), trunkMaterial);
    trunk.position.y = 0.62;
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.15, 7), crownMaterial);
    crown.position.y = 1.95;
    trunk.castShadow = true;
    crown.castShadow = true;
    high.add(trunk, crown);

    const impostor = new THREE.Mesh(lowCrownGeometry, lowCrownMaterial);
    impostor.position.y = 1.45;
    impostor.scale.set(1.15, 1, 1.15);
    lod.addLevel(high, 0);
    lod.addLevel(impostor, 28);
    lod.position.set(-45 + i * 5.2, 0, i % 2 === 0 ? -35 - seededNoise(i) * 10 : 32 + seededNoise(i) * 10);
    lod.rotation.y = seededNoise(i + 19) * Math.PI;
    group.add(lod);
  }
}

function addAnimatedBanners(group) {
  const material = new THREE.MeshBasicMaterial({
    color: 0xf1d36b,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  group.userData.banners = [];
  const specs = [
    [-17, -12, 0.5],
    [11, 7, -0.35],
    [24, 9, -0.12],
    [-28, 3, 0.3]
  ];
  for (const [x, z, rotation] of specs) {
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.45), material.clone());
    banner.position.set(x, 1.45, z);
    banner.rotation.y = rotation;
    banner.userData.phase = seededNoise(x * 11 + z * 7) * Math.PI * 2;
    group.userData.banners.push(banner);
    group.add(banner);
  }
}
