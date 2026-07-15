export class ModeManager {
  constructor(modes) {
    this.modes = modes;
    this.index = 0;
    this.modes.forEach((mode, modeIndex) => mode.setActive?.(modeIndex === this.index));
  }

  get current() {
    return this.modes[this.index];
  }

  next() {
    this.current.setActive?.(false);
    this.index = (this.index + 1) % this.modes.length;
    this.current.setActive?.(true);
    return this.current;
  }

  update(vehicle, deltaSeconds, context = {}) {
    this.current.update(vehicle, deltaSeconds, context);
  }
}
