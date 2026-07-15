export const VEHICLE_PROFILES = [
  {
    id: "buggy",
    label: "Buggy",
    summary: "Fast baseline RC racer",
    color: 0xe73d35,
    cabinColor: 0x1c2635,
    scale: { x: 1, y: 1, z: 1 },
    physics: {
      accelerationScale: 1,
      brakeScale: 1,
      maxForwardSpeed: 10.5,
      maxReverseSpeed: -2.8,
      steeringScale: 1,
      dragScale: 1,
      gripBonus: 0
    }
  },
  {
    id: "crawler",
    label: "Crawler",
    summary: "Slow torque, better low-grip control",
    color: 0x4fa36b,
    cabinColor: 0x1f2b24,
    scale: { x: 1.05, y: 1.12, z: 1 },
    physics: {
      accelerationScale: 0.62,
      brakeScale: 1.3,
      maxForwardSpeed: 5.2,
      maxReverseSpeed: -2.2,
      steeringScale: 0.8,
      dragScale: 1.35,
      gripBonus: 0.18
    }
  },
  {
    id: "armor",
    label: "Micro Armor",
    summary: "Heavy combat profile",
    color: 0x586370,
    cabinColor: 0x202833,
    scale: { x: 1.22, y: 1.08, z: 0.92 },
    physics: {
      accelerationScale: 0.7,
      brakeScale: 1.05,
      maxForwardSpeed: 6.8,
      maxReverseSpeed: -2.4,
      steeringScale: 0.7,
      dragScale: 1.25,
      gripBonus: 0.04
    }
  },
  {
    id: "semi",
    label: "Semi Tractor",
    summary: "Heavy trailer-friendly handling",
    color: 0x2f74c8,
    cabinColor: 0x0f1b2b,
    scale: { x: 1.1, y: 1.18, z: 1.35 },
    physics: {
      accelerationScale: 0.56,
      brakeScale: 0.88,
      maxForwardSpeed: 5.8,
      maxReverseSpeed: -1.8,
      steeringScale: 0.56,
      dragScale: 1.55,
      gripBonus: 0.06
    }
  }
];

export class VehicleGarage {
  constructor(vehiclePhysics, vehicleMesh) {
    this.vehiclePhysics = vehiclePhysics;
    this.vehicleMesh = vehicleMesh;
    this.profiles = VEHICLE_PROFILES;
    this.activeId = localStorage.getItem("rcworld.vehicleProfile") || "buggy";
    this.applyProfile(this.activeId);
  }

  get activeProfile() {
    return this.profiles.find((profile) => profile.id === this.activeId) ?? this.profiles[0];
  }

  applyProfile(profileId) {
    const profile = this.profiles.find((candidate) => candidate.id === profileId) ?? this.profiles[0];
    this.activeId = profile.id;
    localStorage.setItem("rcworld.vehicleProfile", profile.id);
    this.vehiclePhysics.setProfile({ id: profile.id, label: profile.label, ...profile.physics });
    this.applyMeshProfile(profile);
    return profile;
  }

  applyMeshProfile(profile) {
    const { body, cabin } = this.vehicleMesh.userData.parts;
    body.material.color.set(profile.color);
    cabin.material.color.set(profile.cabinColor);
    this.vehicleMesh.scale.set(profile.scale.x, profile.scale.y, profile.scale.z);
  }
}
