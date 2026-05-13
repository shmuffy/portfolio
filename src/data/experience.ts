export interface Role {
  /** module index, e.g. "MOD-01" */
  mod: string;
  org: string;
  /** short org descriptor, e.g. "Liquid Propulsion Rocketry" */
  unit: string;
  role: string;
  location: string;
  /** human date range, e.g. "May 2025 — Present" */
  span: string;
  /** compact date stamp for the log header, e.g. "2025 — NOW" */
  stamp: string;
  /** highlight bullets; **bold** segments are wrapped in <b> */
  points: string[];
  tags: string[];
}

export const experience: Role[] = [
  {
    mod: "MOD-01",
    org: "Highlander Space Program",
    unit: "Liquid Propulsion Rocketry",
    role: "Payload Lead Engineer / PCB Librarian",
    location: "Riverside, CA",
    span: "May 2025 — Present",
    stamp: "2025 — NOW",
    points: [
      "Direct the **C.U.T.I.E. CubeSat** payload — hyperspectral camera integration, power budgeting, and flight-card layout.",
      "Designed the **CubeSat battery card** for a 4S Li-ion pack: BQ77915 protection, BQ34Z100 fuel gauging, BQ25713 buck-boost charging.",
      "Laid out a **100BASE-TX pad-system Ethernet PCB** (DP83848 PHY) with impedance-controlled differential routing.",
      "Maintain the team's **Altium component library** — symbols, footprints, and 3D models held to a single review standard.",
    ],
    tags: ["Altium", "Li-ion BMS", "100BASE-TX", "CubeSat"],
  },
  {
    mod: "MOD-02",
    org: "Aviat'R",
    unit: "Unmanned Autonomous Drone Club",
    role: "Avionics Lead / Co-Founder",
    location: "Riverside, CA",
    span: "Mar 2024 — Oct 2025",
    stamp: "2024 — 2025",
    points: [
      "Co-founded the club and built its **avionics power architecture** — a 12S, 120 A distribution board feeding flight, payload, and comms rails.",
      "Configured and validated **RFD900x-US radios** for >40 km command and telemetry under FCC-compliant operation.",
      "Owned bring-up: harnessing, ground-station integration, and pre-flight electrical checkout.",
    ],
    tags: ["Power Distribution", "RF Telemetry", "FCC Part 15", "Avionics"],
  },
  {
    mod: "MOD-03",
    org: "Trustworthy Autonomous Systems Lab",
    unit: "Undergraduate Research",
    role: "Research Assistant",
    location: "Riverside, CA",
    span: "Oct 2024 — Jan 2025",
    stamp: "2024 — 2025",
    points: [
      "Optimized **Gaussian-Splatting datasets** for GPU pipelines — reached 28 fps on an RTX 4090.",
      "Built and integrated a **ROSmaster R2** robotic platform for sim-to-real transfer experiments.",
    ],
    tags: ["ROS", "Gaussian Splatting", "CUDA", "Sim-to-Real"],
  },
  {
    mod: "MOD-04",
    org: "Highlander Racing",
    unit: "Formula SAE — Electric",
    role: "Electrical Systems Engineer",
    location: "Riverside, CA",
    span: "Aug 2023 — Dec 2024",
    stamp: "2023 — 2024",
    points: [
      "Developed the **400 V pack BMS PCB** — STM32 paired with a BQ76PLQ1 stacked cell monitor.",
      "Designed a **STM32F405 sensor hub**: throttle / brake / steering / shock potentiometers, pressure sensors, and thermistors onto the vehicle CAN bus.",
      "Ran electrical validation — isolation integrity, CAN signal integrity, and EMI susceptibility — and produced **IPC-2221B / FSAE-compliant Gerbers**.",
    ],
    tags: ["STM32", "CAN", "HV Safety", "IPC-2221B"],
  },
];
