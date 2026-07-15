export class Hud {
  constructor(input, cameraRig, weather, modeManager, garage, graphics, xrRuntime, transmitter, onModeNext = null) {
    this.input = input;
    this.cameraRig = cameraRig;
    this.weather = weather;
    this.modeManager = modeManager;
    this.garage = garage;
    this.graphics = graphics;
    this.xrRuntime = xrRuntime;
    this.transmitter = transmitter;
    this.onModeNext = onModeNext;
    this.modeLabel = document.querySelector("#modeLabel");
    this.speedValue = document.querySelector("#speedValue");
    this.surfaceValue = document.querySelector("#surfaceValue");
    this.weatherValue = document.querySelector("#weatherValue");
    this.vehicleValue = document.querySelector("#vehicleValue");
    this.cameraValue = document.querySelector("#cameraValue");
    this.graphicsValue = document.querySelector("#graphicsValue");
    this.xrValue = document.querySelector("#xrValue");
    this.transmitterValue = document.querySelector("#transmitterValue");
    this.objectiveValue = document.querySelector("#objectiveValue");
    this.lapValue = document.querySelector("#lapValue");
    this.modeButton = document.querySelector("#modeButton");
    this.cameraButton = document.querySelector("#cameraButton");
    this.followButton = document.querySelector("#followButton");
    this.weatherButton = document.querySelector("#weatherButton");
    this.graphicsButton = document.querySelector("#graphicsButton");
    this.actionButton = document.querySelector("#actionButton");
    this.garageButton = document.querySelector("#garageButton");
    this.settingsButton = document.querySelector("#settingsButton");
    this.garageDialog = document.querySelector("#garageDialog");
    this.garageList = document.querySelector("#garageList");
    this.settingsDialog = document.querySelector("#settingsDialog");
    this.bindingsList = document.querySelector("#bindingsList");
    this.transmitterStatus = document.querySelector("#transmitterStatus");
    this.connectTransmitterButton = document.querySelector("#connectTransmitterButton");
    this.centerTransmitterButton = document.querySelector("#centerTransmitterButton");
    this.extentsTransmitterButton = document.querySelector("#extentsTransmitterButton");
    this.simulateTransmitterButton = document.querySelector("#simulateTransmitterButton");
    this.channelList = document.querySelector("#channelList");
    this.bindingsTabButton = document.querySelector("#bindingsTabButton");
    this.transmitterTabButton = document.querySelector("#transmitterTabButton");
    this.attach();
  }

  attach() {
    this.modeButton.addEventListener("click", () => {
      if (this.onModeNext) this.onModeNext();
      else this.modeManager.next();
    });
    this.cameraButton.addEventListener("click", () => this.cameraRig.nextMode());
    this.followButton.addEventListener("click", () => this.cameraRig.toggleAutoFollow());
    this.weatherButton.addEventListener("click", () => this.weather.cycle());
    this.graphicsButton.addEventListener("click", () => this.graphics.cycle());
    this.garageButton.addEventListener("click", () => {
      this.renderGarage();
      this.garageDialog.showModal();
    });
    this.settingsButton.addEventListener("click", () => {
      this.renderBindings();
      this.renderTransmitter();
      this.settingsDialog.showModal();
      this.settingsScroller().scrollTop = 0;
    });
    this.bindingsTabButton.addEventListener("click", () => {
      this.settingsScroller().scrollTo({ top: 0, behavior: "smooth" });
    });
    this.transmitterTabButton.addEventListener("click", () => {
      const top = this.transmitterStatus.offsetTop - 72;
      this.settingsScroller().scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
    this.connectTransmitterButton.addEventListener("click", async () => {
      await this.transmitter.requestDevice();
      this.renderTransmitter();
    });
    this.centerTransmitterButton.addEventListener("click", () => {
      this.transmitter.calibrateCenter();
      this.renderTransmitter();
    });
    this.extentsTransmitterButton.addEventListener("click", () => {
      this.transmitter.calibrateExtents();
      this.renderTransmitter();
    });
    this.simulateTransmitterButton.addEventListener("click", () => {
      this.transmitter.setMockChannels([0.35, 0.8, 0, 0, 0, 0, 0, 0]);
      this.renderTransmitter();
    });
  }

  settingsScroller() {
    return this.settingsDialog.querySelector("form") ?? this.settingsDialog;
  }

  renderGarage() {
    this.garageList.replaceChildren();
    for (const profile of this.garage.profiles) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "garage-card";
      card.setAttribute("aria-pressed", String(profile.id === this.garage.activeId));
      card.innerHTML = `<span class="garage-name">${profile.label}</span><span class="garage-meta">${profile.summary}</span>`;
      card.addEventListener("click", () => {
        this.garage.applyProfile(profile.id);
        this.renderGarage();
      });
      this.garageList.append(card);
    }
  }

  renderBindings() {
    this.bindingsList.replaceChildren();
    for (const { action, code } of this.input.getBindingEntries()) {
      const row = document.createElement("div");
      row.className = "binding-row";
      const label = document.createElement("span");
      label.textContent = action;
      const key = document.createElement("button");
      key.type = "button";
      key.className = "binding-key";
      key.textContent = code || "Unbound";
      key.addEventListener("click", () => {
        key.textContent = "Press key";
        const handler = (event) => {
          event.preventDefault();
          this.input.rebind(action, event.code);
          window.removeEventListener("keydown", handler, true);
          this.renderBindings();
        };
        window.addEventListener("keydown", handler, true);
      });
      row.append(label, key);
      this.bindingsList.append(row);
    }
  }

  renderTransmitter() {
    this.transmitterStatus.textContent = this.transmitter.label;
    this.connectTransmitterButton.disabled = !this.transmitter.isSupported;
    this.channelList.replaceChildren();
    for (const [index, value] of this.transmitter.channels.entries()) {
      const row = document.createElement("div");
      row.className = "channel-row";
      const label = document.createElement("span");
      label.textContent = `CH${index + 1}`;
      const meter = document.createElement("meter");
      meter.min = -1;
      meter.max = 1;
      meter.low = -0.7;
      meter.high = 0.7;
      meter.value = value;
      const numeric = document.createElement("span");
      numeric.textContent = value.toFixed(2);
      row.append(label, meter, numeric);
      this.channelList.append(row);
    }
  }

  update(vehicle) {
    const mode = this.modeManager.current;
    const status = mode.getStatus();
    const telemetry = mode.getHudTelemetry?.(vehicle, this.garage) ?? {
      speed: `${vehicle.telemetry.speed.toFixed(1)} m/s`,
      surface: vehicle.surface,
      vehicle: this.garage.activeProfile.label
    };
    this.modeLabel.textContent = mode.name;
    this.actionButton.hidden = !mode.actionLabel;
    this.actionButton.textContent = mode.actionLabel || "";
    this.speedValue.textContent = telemetry.speed;
    this.surfaceValue.textContent = telemetry.surface;
    this.weatherValue.textContent = this.weather.current.label;
    this.vehicleValue.textContent = telemetry.vehicle;
    this.cameraValue.textContent = `${this.cameraRig.mode}${this.cameraRig.autoFollow ? " + follow" : ""}`;
    this.graphicsValue.textContent = this.graphics.current.label;
    this.xrValue.textContent = this.xrRuntime.label;
    this.transmitterValue.textContent = this.transmitter.label;
    this.objectiveValue.textContent = status.objective;
    this.lapValue.textContent = status.lap;
  }
}
