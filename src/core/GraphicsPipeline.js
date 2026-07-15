import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const QUALITY_LEVELS = [
  { id: "performance", label: "Performance", pixelRatio: 1, shadows: false, shadowSize: 512, postprocessing: false, bloom: 0 },
  { id: "balanced", label: "Balanced", pixelRatio: 1.35, shadows: true, shadowSize: 1024, postprocessing: true, bloom: 0.2 },
  { id: "cinematic", label: "Cinematic", pixelRatio: 1.75, shadows: true, shadowSize: 2048, postprocessing: true, bloom: 0.42 }
];

export class GraphicsPipeline {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.index = 1;
    this.composer = new EffectComposer(renderer);
    this.renderPass = new RenderPass(scene, camera);
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.2, 0.42, 0.82);
    this.outputPass = new OutputPass();
    this.maxAnisotropy = renderer.capabilities?.getMaxAnisotropy?.() ?? 1;
    this.adaptivePixelRatio = 1;
    this.frameBudget = { slowFrames: 0, recoveryFrames: 0, lastTime: performance.now() };
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.outputPass);
    this.applyRendererDefaults();
    this.applyQuality();
  }

  get current() {
    return QUALITY_LEVELS[this.index];
  }

  cycle() {
    this.index = (this.index + 1) % QUALITY_LEVELS.length;
    this.applyQuality();
    return this.current;
  }

  applyQuality() {
    const quality = this.current;
    const deviceRatio = typeof window === "undefined" ? 1 : window.devicePixelRatio;
    this.renderer.setPixelRatio(Math.min(deviceRatio, quality.pixelRatio * this.adaptivePixelRatio));
    this.renderer.shadowMap.enabled = quality.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.bloomPass.enabled = quality.postprocessing;
    this.bloomPass.strength = quality.bloom;
    this.tuneSceneTextures(this.scene);
    this.tuneShadowMaps(this.scene, quality.shadowSize);
  }

  setSize(width, height) {
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
  }

  render() {
    this.updateFrameBudget();
    if (this.renderer.xr.isPresenting) {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    if (this.current.postprocessing) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  applyRendererDefaults() {
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.shadowMap.autoUpdate = true;
  }

  tuneSceneTextures(root) {
    root.traverse((object) => {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!material) continue;
        for (const key of ["map", "emissiveMap", "roughnessMap", "normalMap"]) {
          if (material[key]) material[key].anisotropy = Math.min(this.maxAnisotropy, 8);
        }
      }
    });
  }

  tuneShadowMaps(root, size) {
    root.traverse((object) => {
      if (!object.isLight || !object.shadow?.mapSize) return;
      object.shadow.mapSize.set(size, size);
      object.shadow.needsUpdate = true;
    });
  }

  updateFrameBudget() {
    const now = performance.now();
    const frameMs = now - this.frameBudget.lastTime;
    this.frameBudget.lastTime = now;
    if (this.current.id === "performance") return;
    if (frameMs > 28) {
      this.frameBudget.slowFrames += 1;
      this.frameBudget.recoveryFrames = 0;
    } else if (frameMs < 19) {
      this.frameBudget.recoveryFrames += 1;
      this.frameBudget.slowFrames = Math.max(0, this.frameBudget.slowFrames - 1);
    }
    if (this.frameBudget.slowFrames > 80 && this.adaptivePixelRatio > 0.78) {
      this.adaptivePixelRatio = Math.max(0.78, this.adaptivePixelRatio - 0.08);
      this.frameBudget.slowFrames = 0;
      this.applyQuality();
    }
    if (this.frameBudget.recoveryFrames > 360 && this.adaptivePixelRatio < 1) {
      this.adaptivePixelRatio = Math.min(1, this.adaptivePixelRatio + 0.04);
      this.frameBudget.recoveryFrames = 0;
      this.applyQuality();
    }
  }
}

export { QUALITY_LEVELS };
