import { VRButton } from "three/addons/webxr/VRButton.js";

export class XrRuntime {
  constructor(renderer, cameraRig) {
    this.renderer = renderer;
    this.cameraRig = cameraRig;
    this.supportState = "checking";
    this.sessionActive = false;
    this.button = null;
    this.renderer.xr.enabled = true;
    this.renderer.xr.addEventListener("sessionstart", () => this.setSessionActive(true));
    this.renderer.xr.addEventListener("sessionend", () => this.setSessionActive(false));
  }

  async attach(container = document.body) {
    this.button = VRButton.createButton(this.renderer);
    this.button.classList.add("xr-entry");
    container.append(this.button);
    this.supportState = await this.detectSupport();
    return this.button;
  }

  async detectSupport() {
    if (!navigator.xr) return "unavailable";
    try {
      return (await navigator.xr.isSessionSupported("immersive-vr")) ? "ready" : "unavailable";
    } catch {
      return "unavailable";
    }
  }

  setSessionActive(active) {
    this.sessionActive = active;
    this.cameraRig.setVrHeadsetAuthoritative(active);
  }

  get label() {
    if (this.sessionActive) return "VR active";
    if (this.supportState === "ready") return "VR ready";
    if (this.supportState === "checking") return "VR check";
    return "VR unavailable";
  }
}
