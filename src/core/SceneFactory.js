import * as THREE from "three";
import { createWorldDetail } from "./WorldDetail.js";

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb9d8e6);
  scene.fog = new THREE.Fog(0xb9d8e6, 34, 118);
  addSkyDome(scene);

  const hemi = new THREE.HemisphereLight(0xfff7df, 0x6d876f, 1.65);
  scene.add(hemi);
  scene.add(new THREE.AmbientLight(0xf2efe4, 0.5));

  const sun = new THREE.DirectionalLight(0xfff0c7, 2.05);
  sun.position.set(12, 20, -10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -34;
  sun.shadow.camera.right = 34;
  sun.shadow.camera.top = 34;
  sun.shadow.camera.bottom = -34;
  scene.add(sun);
  addSoftClouds(scene);
  addHorizonMist(scene);
  addDistantHills(scene);

  const ground = createLowPolyGround();
  scene.add(ground);

  addRoadRibbon(scene);
  addSurfacePatch(scene, "dirt", 15, -13, 16, 13);
  addSurfacePatch(scene, "rock", -16, 12, 15, 14);
  addSurfacePatch(scene, "ice", 20, 18, 10, 10);
  addGroundDecal(scene, "arrow", -5, -9, 2.3, 0.35, 0xf2c14e);
  addGroundDecal(scene, "target", 8, -6, 2.6, -0.25, 0xff5f5f);

  const obstacles = [
    addObstacle(scene, -2, -3, 1.6, 0x71563f),
    addObstacle(scene, 6, 5, 2.2, 0x5c6a72),
    addObstacle(scene, -10, -8, 1.8, 0x7c6a58),
    addObstacle(scene, 12, -2, 1.3, 0x6d7655)
  ];

  const cones = [];
  for (let i = 0; i < 10; i += 1) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.5, 12),
      new THREE.MeshStandardMaterial({ color: 0xff7a1a, roughness: 0.7, emissive: 0x251000 })
    );
    cone.position.set(Math.sin(i * 0.7) * 8, 0.25, -8 + i * 1.5);
    cone.castShadow = true;
    scene.add(cone);
    cones.push(cone);
  }
  addScenicTrees(scene);
  addGrassAndFlowers(scene);
  addRoadsideProps(scene);
  const worldDetail = createWorldDetail();
  scene.add(worldDetail);
  scene.userData.updatables = [worldDetail];

  return { scene, obstacles, cones };
}

export function createVehicleMesh() {
  const group = new THREE.Group();

  group.userData.parts = {};
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.32, 1.8),
    new THREE.MeshStandardMaterial({ color: 0xf24a35, roughness: 0.34, metalness: 0.18 })
  );
  body.position.y = 0.38;
  body.castShadow = true;
  group.add(body);
  group.userData.parts.body = body;

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.28, 0.72),
    new THREE.MeshStandardMaterial({ color: 0x172235, roughness: 0.18, metalness: 0.18 })
  );
  cabin.position.set(0, 0.64, -0.16);
  cabin.castShadow = true;
  group.add(cabin);
  group.userData.parts.cabin = cabin;

  const bumperMaterial = new THREE.MeshStandardMaterial({ color: 0x111820, roughness: 0.5, metalness: 0.2 });
  for (const z of [-1.03, 1.03]) {
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.16, 0.16), bumperMaterial);
    bumper.position.set(0, 0.35, z);
    bumper.castShadow = true;
    group.add(bumper);
  }

  const spoiler = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, 0.08, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x0f1a2a, roughness: 0.28, metalness: 0.28 })
  );
  spoiler.position.set(0, 0.82, -0.86);
  spoiler.castShadow = true;
  group.add(spoiler);

  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.018, 0.7, 6),
    new THREE.MeshBasicMaterial({ color: 0x1b2735 })
  );
  antenna.position.set(-0.32, 1.03, -0.32);
  antenna.rotation.z = -0.32;
  group.add(antenna);

  const stripe = createArrowMesh(0xffffff, 0.78);
  stripe.rotation.x = -Math.PI / 2;
  stripe.position.set(0, 0.547, 0.06);
  stripe.scale.set(0.011, 0.011, 0.011);
  group.add(stripe);
  group.userData.parts.stripe = stripe;

  const headlightMaterial = new THREE.MeshBasicMaterial({
    color: 0xfff3b0,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  for (const x of [-0.34, 0.34]) {
    const headlight = new THREE.Mesh(new THREE.CircleGeometry(0.18, 18), headlightMaterial.clone());
    headlight.position.set(x, 0.48, 0.96);
    group.add(headlight);
  }

  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.76 });
  const hubMaterial = new THREE.MeshStandardMaterial({ color: 0xd6dde3, roughness: 0.42, metalness: 0.36 });
  group.userData.parts.wheels = [];
  const wheelPositions = [
    [-0.72, 0.25, -0.62],
    [0.72, 0.25, -0.62],
    [-0.72, 0.25, 0.62],
    [0.72, 0.25, 0.62]
  ];
  for (const [x, y, z] of wheelPositions) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.24, 18), wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    group.add(wheel);
    group.userData.parts.wheels.push(wheel);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.255, 14), hubMaterial);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(x, y, z);
    hub.castShadow = true;
    group.add(hub);
  }

  const underglow = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffd66b,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  underglow.rotation.x = -Math.PI / 2;
  underglow.position.set(0, 0.1, 0);
  underglow.scale.set(1.9, 1.15, 1);
  group.add(underglow);

  return group;
}

function addSkyDome(scene) {
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(160, 24, 12),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x8fc5dd) },
        horizonColor: { value: new THREE.Color(0xdce8df) },
        lowerColor: { value: new THREE.Color(0xb8c9b6) }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPosition;
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        uniform vec3 lowerColor;
        void main() {
          float h = normalize(vWorldPosition).y;
          vec3 sky = mix(horizonColor, topColor, smoothstep(0.02, 0.85, h));
          sky = mix(lowerColor, sky, smoothstep(-0.15, 0.14, h));
          gl_FragColor = vec4(sky, 1.0);
        }
      `
    })
  );
  sky.renderOrder = -10;
  scene.add(sky);

  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(1, 40),
    new THREE.MeshBasicMaterial({
      color: 0xfff0b0,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  sun.position.set(38, 42, -66);
  sun.scale.set(20, 20, 1);
  scene.add(sun);
}

function createLowPolyGround() {
  const geometry = new THREE.PlaneGeometry(140, 140, 34, 34);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  const colors = [];
  const color = new THREE.Color();

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const distanceFromPlayArea = Math.max(0, Math.sqrt(x * x + z * z) - 16) / 48;
    const terrainStrength = THREE.MathUtils.clamp(distanceFromPlayArea, 0.12, 1);
    const ridge = Math.sin(x * 0.08) * 0.38 + Math.cos(z * 0.11) * 0.28 + Math.sin((x + z) * 0.045) * 0.62;
    const edgeLift = Math.max(0, (Math.abs(x) - 32) / 38) * 1.2 + Math.max(0, (Math.abs(z) - 28) / 42) * 1.0;
    position.setY(i, ridge * 0.28 * terrainStrength + edgeLift);
    color.setHSL(0.23 + ridge * 0.012, 0.26, 0.5 + ridge * 0.035 + edgeLift * 0.035);
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const ground = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.DoubleSide
    })
  );
  ground.receiveShadow = false;
  return ground;
}

function addSurfacePatch(scene, kind, x, z, width, depth) {
  const geometry = new THREE.PlaneGeometry(width, depth, 10, 10);
  const palette = {
    dirt: [0x7b5437, 0x9b6a43, 0x5f402c],
    rock: [0x6f6b63, 0x858077, 0x55514d],
    ice: [0x92c7d9, 0xd7f6ff, 0x6daac0]
  }[kind] ?? [0x789265, 0x90a678, 0x5e744f];
  applyPatchVertexColors(geometry, palette);
  const patch = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.DoubleSide
    })
  );
  patch.rotation.x = -Math.PI / 2;
  patch.position.set(x, 0.11, z);
  patch.receiveShadow = false;
  scene.add(patch);
  return patch;
}

function applyPatchVertexColors(geometry, palette) {
  const position = geometry.attributes.position;
  const colors = [];
  const color = new THREE.Color();
  const base = palette.map((hex) => new THREE.Color(hex));
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const wave = Math.sin(x * 1.8 + y * 0.7) + Math.cos(y * 1.4 - x * 0.5);
    color.copy(base[Math.abs(Math.floor(wave * 2.3 + i)) % base.length]);
    color.offsetHSL(0, 0, THREE.MathUtils.clamp(wave * 0.035, -0.08, 0.08));
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
}

function addGroundDecal(scene, kind, x, z, size, rotation, color) {
  const decal = kind === "target" ? createTargetMesh(color, 0.68) : createArrowMesh(color, 0.68);
  decal.rotation.x = -Math.PI / 2;
  decal.rotation.z = rotation;
  decal.position.set(x, 0.16, z);
  decal.scale.setScalar(size / 128);
  scene.add(decal);
  return decal;
}

function createArrowMesh(color, opacity = 1) {
  const shape = new THREE.Shape();
  shape.moveTo(64, 8);
  shape.lineTo(112, 62);
  shape.lineTo(84, 62);
  shape.lineTo(84, 120);
  shape.lineTo(44, 120);
  shape.lineTo(44, 62);
  shape.lineTo(16, 62);
  shape.closePath();
  const mesh = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  mesh.geometry.center();
  return mesh;
}

function createTargetMesh(color, opacity = 1) {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const ringGeometry = new THREE.TorusGeometry(38, 4, 6, 42);
  const innerRingGeometry = new THREE.TorusGeometry(20, 3, 6, 36);
  const dotGeometry = new THREE.CircleGeometry(8, 20);
  group.add(new THREE.Mesh(ringGeometry, material));
  group.add(new THREE.Mesh(innerRingGeometry, material.clone()));
  group.add(new THREE.Mesh(dotGeometry, material.clone()));
  return group;
}

function addRoadRibbon(scene) {
  const path = [
    new THREE.Vector3(-32, 0.13, -18),
    new THREE.Vector3(-21, 0.13, -11),
    new THREE.Vector3(-11, 0.13, -6),
    new THREE.Vector3(1, 0.13, -2),
    new THREE.Vector3(13, 0.13, 5),
    new THREE.Vector3(26, 0.13, 9),
    new THREE.Vector3(38, 0.13, 5)
  ];
  addRoadSegments(scene, path);
  addRoadCenterDashes(scene, path);
}

function addRoadSegments(scene, path) {
  const material = new THREE.MeshBasicMaterial({
    color: 0xb7b9ae,
    side: THREE.DoubleSide
  });
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
    const midpoint = start.clone().lerp(end, 0.5);
    const segment = end.clone().sub(start);
    const length = Math.max(1, segment.length() - 0.12);
    const angle = Math.atan2(segment.x, segment.z);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(5.6, length), material);
    road.rotation.x = -Math.PI / 2;
    road.rotation.z = -angle;
    road.position.set(midpoint.x, 0.128, midpoint.z);
    road.renderOrder = 0;
    scene.add(road);
  }
}

function addRoadCenterDashes(scene, path) {
  const material = new THREE.MeshBasicMaterial({
    color: 0xfff4c8,
    transparent: true,
    opacity: 0.72,
    depthWrite: false
  });

  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
    const segment = end.clone().sub(start);
    const length = segment.length();
    const direction = segment.clone().normalize();
    const angle = Math.atan2(direction.x, direction.z);
    const dashCount = Math.floor(length / 3.2);

    for (let dash = 1; dash <= dashCount; dash += 1) {
      const center = start.clone().lerp(end, dash / (dashCount + 1));
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 1.05), material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = -angle;
      mesh.position.set(center.x, 0.19, center.z);
      mesh.renderOrder = 3;
      scene.add(mesh);
    }
  }
}

function createRibbonGeometry(path, width, lateralOffset) {
  const vertices = [];
  const uvs = [];
  const indices = [];

  for (let index = 0; index < path.length; index += 1) {
    const previous = path[Math.max(0, index - 1)];
    const next = path[Math.min(path.length - 1, index + 1)];
    const tangent = next.clone().sub(previous).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
    const center = path[index].clone().addScaledVector(normal, lateralOffset);
    vertices.push(
      ...center.clone().addScaledVector(normal, -width / 2).toArray(),
      ...center.clone().addScaledVector(normal, width / 2).toArray()
    );
    uvs.push(0, index / (path.length - 1), 1, index / (path.length - 1));
    if (index < path.length - 1) {
      const base = index * 2;
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addDistantHills(scene) {
  const layers = [
    { z: -48, y: -1.2, color: 0x8da88f, opacity: 0.82, height: 14 },
    { z: -62, y: 0.2, color: 0x6f8fa1, opacity: 0.5, height: 18 },
    { z: 45, y: -1.8, color: 0x789174, opacity: 0.62, height: 13 }
  ];

  for (const layer of layers) {
    const shape = new THREE.Shape();
    shape.moveTo(-70, 0);
    for (let i = 0; i <= 12; i += 1) {
      const x = -70 + i * (140 / 12);
      const crest = Math.sin(i * 0.85) * 3.2 + Math.cos(i * 0.37) * 2.4 + layer.height;
      shape.lineTo(x, crest);
    }
    shape.lineTo(70, 0);
    shape.closePath();
    const hills = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({
        color: layer.color,
        transparent: true,
        opacity: layer.opacity,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    hills.position.set(0, layer.y, layer.z);
    hills.renderOrder = -2;
    scene.add(hills);
  }
}

function addHorizonMist(scene) {
  const material = new THREE.MeshBasicMaterial({
    color: 0xc7d8dc,
    transparent: true,
    opacity: 0.58,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  for (const z of [-46, 42]) {
    const mist = new THREE.Mesh(new THREE.PlaneGeometry(150, 10), material.clone());
    mist.position.set(0, 2.4, z);
    mist.renderOrder = -1;
    scene.add(mist);
  }
}

function addSoftClouds(scene) {
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const puffGeometry = new THREE.SphereGeometry(1, 12, 6);
  const clouds = [
    [-27, 18, -43, 14, 5],
    [16, 20, -52, 18, 6],
    [39, 17, -35, 12, 4.2],
    [-42, 15, 28, 16, 5.2]
  ];

  for (const [x, y, z, width, height] of clouds) {
    const cloud = new THREE.Group();
    const puffs = [
      [-0.32, 0, 0.48, 0.92],
      [0, 0.14, 0.62, 1.08],
      [0.34, -0.03, 0.42, 0.84],
      [0.08, -0.16, 0.8, 0.7]
    ];
    for (const [offsetX, offsetY, scaleX, scaleY] of puffs) {
      const puff = new THREE.Mesh(puffGeometry, material.clone());
      puff.scale.set(width * scaleX * 0.26, height * scaleY * 0.3, 0.35);
      puff.position.set(offsetX * width, offsetY * height, 0);
      puff.renderOrder = -3;
      cloud.add(puff);
    }
    cloud.position.set(x, y, z);
    cloud.rotation.y = 0.12;
    scene.add(cloud);
  }
}

function addScenicTrees(scene) {
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x7b6049, roughness: 0.9 });
  const leafMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x6f9a68, roughness: 0.95 }),
    new THREE.MeshStandardMaterial({ color: 0x85a86c, roughness: 0.95 }),
    new THREE.MeshStandardMaterial({ color: 0x5f8566, roughness: 0.95 })
  ];
  const positions = [
    [-24, -20], [-18, 13], [-10, -24], [4, 18], [13, -19], [21, 15], [29, -8], [-31, 3]
  ];

  positions.forEach(([x, z], index) => {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.1, 6), trunkMaterial);
    trunk.position.y = 0.55;
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.82, 1.9, 7), leafMaterials[index % leafMaterials.length]);
    crown.position.y = 1.8;
    crown.castShadow = true;
    trunk.castShadow = true;
    group.add(trunk, crown);
    group.position.set(x, 0, z);
    group.rotation.y = index * 0.63;
    scene.add(group);
  });
}

function addGrassAndFlowers(scene) {
  const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x6f8f59, flatShading: true });
  const flowerMaterials = [
    new THREE.MeshBasicMaterial({ color: 0xffd65a }),
    new THREE.MeshBasicMaterial({ color: 0xf4776d }),
    new THREE.MeshBasicMaterial({ color: 0xdadf7f })
  ];
  const tuftGeometry = new THREE.ConeGeometry(0.055, 0.36, 4);
  const flowerGeometry = new THREE.SphereGeometry(0.05, 6, 4);

  for (let i = 0; i < 90; i += 1) {
    const angle = i * 2.399;
    const radius = 8 + (i % 17) * 2.4;
    const x = Math.cos(angle) * radius + Math.sin(i * 0.7) * 2;
    const z = Math.sin(angle) * radius + Math.cos(i * 0.43) * 2;
    if (Math.abs(x) < 12 && Math.abs(z) < 10) continue;

    const tuft = new THREE.Mesh(tuftGeometry, grassMaterial);
    tuft.position.set(x, 0.18, z);
    tuft.rotation.y = angle;
    tuft.scale.setScalar(0.75 + (i % 5) * 0.12);
    scene.add(tuft);

    if (i % 4 === 0) {
      const flower = new THREE.Mesh(flowerGeometry, flowerMaterials[i % flowerMaterials.length]);
      flower.position.set(x + 0.08, 0.42, z - 0.04);
      scene.add(flower);
    }
  }
}

function addRoadsideProps(scene) {
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x7c6749, roughness: 0.78 });
  const railMaterial = new THREE.MeshStandardMaterial({ color: 0xd8d0b5, roughness: 0.46, metalness: 0.08 });
  const signMaterial = new THREE.MeshBasicMaterial({ color: 0xffdf6f, side: THREE.DoubleSide });

  const posts = [
    [-18, -14], [-12, -10], [-6, -7], [4, -4], [16, 2], [28, 5],
    [-23, -6], [-14, -2], [-3, 2], [9, 8], [22, 12]
  ];
  for (const [x, z] of posts) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.8, 6), postMaterial);
    post.position.set(x, 0.4, z);
    post.castShadow = true;
    scene.add(post);
  }

  const railSegments = [
    [-24, -15, 5.5, 0.08, 0.09, 0.54],
    [18, 12, 6.5, 0.08, 0.09, 0.24],
    [31, 9, 5.2, 0.08, 0.09, 0.02]
  ];
  for (const [x, z, width, height, depth, rotation] of railSegments) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), railMaterial);
    rail.position.set(x, 0.74, z);
    rail.rotation.y = rotation;
    rail.castShadow = true;
    scene.add(rail);
  }

  const sign = new THREE.Group();
  const signFace = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), signMaterial);
  const arrow = createArrowMesh(0x5b431d, 0.82);
  arrow.scale.set(0.0052, 0.0052, 0.0052);
  arrow.position.z = 0.01;
  sign.add(signFace, arrow);
  sign.position.set(-8.2, 1.1, -11.8);
  sign.rotation.y = 0.55;
  scene.add(sign);
}

function addObstacle(scene, x, z, radius, color) {
  const mesh = new THREE.Mesh(
    new THREE.DodecahedronGeometry(radius, 0),
    new THREE.MeshStandardMaterial({ color, roughness: 0.85 })
  );
  mesh.position.set(x, radius * 0.45, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return { mesh, position: mesh.position, radius };
}
