export const WEATHER_PRESETS = [
  {
    id: "clear",
    label: "clear",
    gripScale: 1,
    wind: { x: 0, z: 0 },
    visibility: 1,
    precipitation: 0
  },
  {
    id: "rain",
    label: "rain",
    gripScale: 0.72,
    wind: { x: 0.8, z: -0.4 },
    visibility: 0.78,
    precipitation: 0.7
  },
  {
    id: "snow",
    label: "snow",
    gripScale: 0.55,
    wind: { x: -1.2, z: 0.6 },
    visibility: 0.68,
    precipitation: 0.85
  },
  {
    id: "wind",
    label: "wind",
    gripScale: 0.94,
    wind: { x: 2.5, z: -1.5 },
    visibility: 0.92,
    precipitation: 0
  }
];

export class WeatherSystem {
  constructor() {
    this.index = 0;
  }

  get current() {
    return WEATHER_PRESETS[this.index];
  }

  cycle() {
    this.index = (this.index + 1) % WEATHER_PRESETS.length;
    return this.current;
  }
}
