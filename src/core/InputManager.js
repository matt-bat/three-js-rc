const DEFAULT_BINDINGS = {
  throttle: "KeyW",
  brake: "KeyS",
  steerLeft: "KeyA",
  steerRight: "KeyD",
  reset: "KeyR",
  cameraNext: "KeyC",
  temporaryLook: "ShiftLeft",
  lookLeft: "ArrowLeft",
  lookRight: "ArrowRight",
  lookUp: "ArrowUp",
  lookDown: "ArrowDown",
  toggleAutoFollow: "KeyF",
  modeNext: "KeyM",
  cycleWeather: "KeyV",
  primaryAction: "Space"
};

const GAMEPAD_AXIS_DEADZONE = 0.12;

export class InputManager {
  constructor(target = window, transmitter = null) {
    this.target = target;
    this.transmitter = transmitter;
    this.bindings = { ...DEFAULT_BINDINGS, ...this.loadBindings() };
    this.keysDown = new Set();
    this.gamepads = new Map();
    this.pointerLook = { x: 0, y: 0 };
    this.touchDrive = { steer: 0, throttle: 0, brake: 0 };
    this.consumeActions = new Set();
    this.attach();
  }

  attach() {
    this.target.addEventListener("keydown", (event) => {
      this.keysDown.add(event.code);
      if (event.code === this.bindings.cameraNext) this.consumeActions.add("cameraNext");
      if (event.code === this.bindings.toggleAutoFollow) this.consumeActions.add("toggleAutoFollow");
      if (event.code === this.bindings.modeNext) this.consumeActions.add("modeNext");
      if (event.code === this.bindings.cycleWeather) this.consumeActions.add("cycleWeather");
      if (event.code === this.bindings.primaryAction) this.consumeActions.add("primaryAction");
    });
    this.target.addEventListener("keyup", (event) => this.keysDown.delete(event.code));
    this.target.addEventListener("pointermove", (event) => {
      if (this.keysDown.has(this.bindings.temporaryLook) || event.buttons === 2) {
        this.pointerLook.x += event.movementX;
        this.pointerLook.y += event.movementY;
      }
    });
    this.target.addEventListener("contextmenu", (event) => event.preventDefault());
    this.attachTouchPad("steerPad", "steerThumb", ({ x }) => {
      this.touchDrive.steer = x;
    });
    this.attachTouchPad("drivePad", "driveThumb", ({ y }) => {
      this.touchDrive.throttle = Math.max(0, -y);
      this.touchDrive.brake = Math.max(0, y);
    });
    document.getElementById("actionButton")?.addEventListener("click", () => {
      this.consumeActions.add("primaryAction");
    });
  }

  loadBindings() {
    try {
      return JSON.parse(localStorage.getItem("rcworld.bindings") || "{}");
    } catch {
      return {};
    }
  }

  saveBindings() {
    localStorage.setItem("rcworld.bindings", JSON.stringify(this.bindings));
  }

  rebind(action, code) {
    const conflict = Object.entries(this.bindings).find(([otherAction, otherCode]) => (
      otherAction !== action && otherCode === code
    ));
    if (conflict) {
      this.bindings[conflict[0]] = "";
    }
    this.bindings[action] = code;
    this.saveBindings();
  }

  consume(action) {
    if (!this.consumeActions.has(action)) return false;
    this.consumeActions.delete(action);
    return true;
  }

  getActions() {
    const gamepad = navigator.getGamepads?.().find(Boolean);
    const leftX = this.axis(gamepad, 0);
    const rightX = this.axis(gamepad, 2);
    const rightY = this.axis(gamepad, 3);
    const triggerR = this.buttonValue(gamepad, 7);
    const triggerL = this.buttonValue(gamepad, 6);
    const transmitterActions = this.transmitter?.getActions() ?? {
      throttle: 0,
      brake: 0,
      steer: 0,
      look: { x: 0, y: 0 }
    };

    const throttle = Math.max(this.isDown("throttle") ? 1 : 0, triggerR, this.touchDrive.throttle, transmitterActions.throttle);
    const brake = Math.max(this.isDown("brake") ? 1 : 0, triggerL, this.touchDrive.brake, transmitterActions.brake);
    const steerKeyboard = (this.isDown("steerRight") ? 1 : 0) - (this.isDown("steerLeft") ? 1 : 0);
    const lookKeyboardX = (this.isDown("lookRight") ? 1 : 0) - (this.isDown("lookLeft") ? 1 : 0);
    const lookKeyboardY = (this.isDown("lookDown") ? 1 : 0) - (this.isDown("lookUp") ? 1 : 0);
    const pointerLook = { ...this.pointerLook };
    this.pointerLook.x = 0;
    this.pointerLook.y = 0;

    return {
      throttle,
      brake,
      steer: steerKeyboard || leftX || this.touchDrive.steer || transmitterActions.steer,
      reset: this.isDown("reset"),
      primaryAction: this.consume("primaryAction"),
      temporaryLookHeld: this.isDown("temporaryLook") || Math.abs(rightX) > 0 || Math.abs(rightY) > 0,
      look: {
        x: lookKeyboardX * 4 + rightX * 5 + transmitterActions.look.x * 5 + pointerLook.x * 0.025,
        y: lookKeyboardY * 3 + rightY * 4 + transmitterActions.look.y * 4 + pointerLook.y * 0.025
      }
    };
  }

  isDown(action) {
    const code = this.bindings[action];
    return code ? this.keysDown.has(code) : false;
  }

  axis(gamepad, axisIndex) {
    const value = gamepad?.axes?.[axisIndex] ?? 0;
    return Math.abs(value) < GAMEPAD_AXIS_DEADZONE ? 0 : value;
  }

  buttonValue(gamepad, buttonIndex) {
    return gamepad?.buttons?.[buttonIndex]?.value ?? 0;
  }

  attachTouchPad(padId, thumbId, onChange) {
    const pad = document.getElementById(padId);
    const thumb = document.getElementById(thumbId);
    if (!pad || !thumb) return;

    const reset = () => {
      thumb.style.transform = "translate(-50%, -50%)";
      onChange({ x: 0, y: 0 });
    };

    const update = (event) => {
      const bounds = pad.getBoundingClientRect();
      const radius = bounds.width / 2;
      const centerX = bounds.left + radius;
      const centerY = bounds.top + radius;
      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
      const distance = Math.min(radius * 0.72, Math.hypot(dx, dy));
      const angle = Math.atan2(dy, dx);
      const thumbX = Math.cos(angle) * distance;
      const thumbY = Math.sin(angle) * distance;
      thumb.style.transform = `translate(calc(-50% + ${thumbX}px), calc(-50% + ${thumbY}px))`;
      onChange({
        x: distance === 0 ? 0 : thumbX / (radius * 0.72),
        y: distance === 0 ? 0 : thumbY / (radius * 0.72)
      });
    };

    pad.addEventListener("pointerdown", (event) => {
      pad.setPointerCapture(event.pointerId);
      update(event);
    });
    pad.addEventListener("pointermove", (event) => {
      if (pad.hasPointerCapture(event.pointerId)) update(event);
    });
    pad.addEventListener("pointerup", (event) => {
      pad.releasePointerCapture(event.pointerId);
      reset();
    });
    pad.addEventListener("pointercancel", reset);
  }

  getBindingEntries() {
    return Object.entries(this.bindings).map(([action, code]) => ({ action, code }));
  }
}

export { DEFAULT_BINDINGS };
