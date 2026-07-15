const STORAGE_KEY = "rcworld.transmitterProfile";

const DEFAULT_PROFILE = {
  channelMap: {
    steer: 0,
    throttle: 1,
    brake: 2,
    lookX: 3,
    lookY: 4
  },
  invert: {
    steer: false,
    throttle: false,
    brake: false,
    lookX: false,
    lookY: false
  },
  deadzone: 0.08,
  centers: [0, 0, 0, 0, 0, 0, 0, 0],
  mins: [-1, -1, -1, -1, -1, -1, -1, -1],
  maxes: [1, 1, 1, 1, 1, 1, 1, 1]
};

const MOCK_CHANNELS = [0, 0, 0, 0, 0, 0, 0, 0];

export class TransmitterManager {
  constructor({ hid = navigator.hid, storage = localStorage } = {}) {
    this.hid = hid;
    this.storage = storage;
    this.profile = this.loadProfile();
    this.device = null;
    this.channels = [...MOCK_CHANNELS];
    this.status = this.hid ? "ready" : "unsupported";
    this.lastDeviceName = "";
  }

  get isSupported() {
    return Boolean(this.hid);
  }

  get label() {
    if (!this.isSupported) return "HID unavailable";
    if (this.device) return this.lastDeviceName || "Transmitter connected";
    return "HID ready";
  }

  async requestDevice() {
    if (!this.hid?.requestDevice) {
      this.status = "unsupported";
      return null;
    }
    const devices = await this.hid.requestDevice({ filters: [] });
    this.device = devices[0] ?? null;
    if (this.device) {
      this.lastDeviceName = this.device.productName ?? "RC transmitter";
      this.status = "connected";
      await this.device.open?.();
      this.device.addEventListener?.("inputreport", (event) => this.handleInputReport(event));
    }
    return this.device;
  }

  handleInputReport(event) {
    const bytes = event.data ? Array.from(new Uint8Array(event.data.buffer)) : [];
    this.channels = this.decodeChannels(bytes);
  }

  decodeChannels(bytes) {
    if (!bytes.length) return [...this.channels];
    const channels = [...MOCK_CHANNELS];
    for (let index = 0; index < channels.length; index += 1) {
      const byte = bytes[index] ?? 128;
      channels[index] = Math.max(-1, Math.min(1, (byte - 128) / 127));
    }
    return channels;
  }

  setMockChannels(channels) {
    this.channels = channels.map((value) => Math.max(-1, Math.min(1, value))).slice(0, 8);
    while (this.channels.length < 8) this.channels.push(0);
    this.status = "simulated";
  }

  calibrateCenter() {
    this.profile.centers = [...this.channels];
    this.saveProfile();
  }

  calibrateExtents() {
    this.profile.mins = this.profile.mins.map((value, index) => Math.min(value, this.channels[index]));
    this.profile.maxes = this.profile.maxes.map((value, index) => Math.max(value, this.channels[index]));
    this.saveProfile();
  }

  updateProfile(nextProfile) {
    this.profile = {
      ...this.profile,
      ...nextProfile,
      channelMap: { ...this.profile.channelMap, ...nextProfile.channelMap },
      invert: { ...this.profile.invert, ...nextProfile.invert }
    };
    this.saveProfile();
  }

  getActions() {
    return {
      steer: this.readMapped("steer"),
      throttle: Math.max(0, this.readMapped("throttle")),
      brake: Math.max(0, this.readMapped("brake")),
      look: {
        x: this.readMapped("lookX"),
        y: this.readMapped("lookY")
      }
    };
  }

  readMapped(action) {
    const channelIndex = this.profile.channelMap[action] ?? 0;
    const raw = this.channels[channelIndex] ?? 0;
    const centered = raw - (this.profile.centers[channelIndex] ?? 0);
    const min = (this.profile.mins[channelIndex] ?? -1) - (this.profile.centers[channelIndex] ?? 0);
    const max = (this.profile.maxes[channelIndex] ?? 1) - (this.profile.centers[channelIndex] ?? 0);
    const range = centered >= 0 ? Math.max(0.001, max) : Math.max(0.001, Math.abs(min));
    let normalized = Math.max(-1, Math.min(1, centered / range));
    if (Math.abs(normalized) < this.profile.deadzone) normalized = 0;
    if (this.profile.invert[action]) normalized *= -1;
    return normalized;
  }

  loadProfile() {
    try {
      return {
        ...DEFAULT_PROFILE,
        ...JSON.parse(this.storage.getItem(STORAGE_KEY) || "{}")
      };
    } catch {
      return { ...DEFAULT_PROFILE };
    }
  }

  saveProfile() {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
  }
}

export { DEFAULT_PROFILE };
