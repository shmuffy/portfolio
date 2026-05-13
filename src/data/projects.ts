export interface SpecItem {
  k: string;
  v: string;
}

export interface ProjectLink {
  label: string;
  href: string;
  /** trailing glyph, default "↗" */
  glyph?: string;
  /** render disabled when no real URL yet */
  disabled?: boolean;
}

export interface Project {
  /** index stamp, e.g. "PROJ-01" */
  proj: string;
  title: string;
  /** small bracketed tag, e.g. "SENIOR DESIGN" */
  badge: string;
  span: string;
  blurb: string;
  /** id of the mono-text schematic to render (see components/work.ts) */
  schematic: "bms-load" | "fpga-sdr";
  specs: SpecItem[];
  tags: string[];
  links: ProjectLink[];
}

export const projects: Project[] = [
  {
    proj: "PROJ-01",
    title: "Custom BMS + 300 W Programmable Electronic Load",
    badge: "SENIOR DESIGN",
    span: "OCT 2025 — MAR 2026",
    blurb:
      "A bench-grade programmable electronic load built on MOSFET linear power stages, plus a companion 10-cell Li-ion battery management system — design, layout, firmware, and validation end to end.",
    schematic: "bms-load",
    specs: [
      { k: "Load current", v: "0 – 20 A, linear regulation" },
      { k: "Load power", v: "300 W, thermal derating" },
      { k: "Power stage", v: "IRFP250N MOSFETs · TL431 loop" },
      { k: "Control", v: "STM32F3 ADC / DAC · fan-PWM · iso-trigger" },
      { k: "BMS pack", v: "10S Li-ion · 36 – 42 V" },
      { k: "BMS front-end", v: "BQ76930 · passive cell balancing" },
      { k: "Protection", v: "NTC thermal cutoff · 50 – 60 A OC / SC" },
      { k: "Tools", v: "Altium · LTspice · STM32 HAL" },
    ],
    tags: ["STM32F3", "TL431", "IRFP250N", "BQ76930", "Altium"],
    links: [
      { label: "Repo", href: "#", glyph: "↗", disabled: true },
      { label: "Write-up", href: "#", glyph: "↗", disabled: true },
    ],
  },
  {
    proj: "PROJ-02",
    title: "FPGA-Based Software-Defined Radio",
    badge: "RF / DSP",
    span: "MAY 2025 — PRESENT",
    blurb:
      "A HackRF-class SDR designed in Altium around the AD9364 RF transceiver and an Artix-7 FPGA — custom power tree, clock fanout, and high-speed differential routing, with a Python reference model for real-time IQ capture and digital down-conversion.",
    schematic: "fpga-sdr",
    specs: [
      { k: "RF front-end", v: "AD9364 wideband transceiver" },
      { k: "Digital", v: "Xilinx Artix-7 FPGA" },
      { k: "Power tree", v: "+1.0 V / 1.8 V / 1.35 V / 3.3 V rails" },
      { k: "Clocking", v: "low-jitter reference fanout" },
      { k: "Layout", v: "impedance-controlled differential pairs" },
      { k: "Host model", v: "Python — IQ capture + digital DDC" },
      { k: "Toolchain", v: "Altium · Vivado / Vitis · GNU Radio" },
    ],
    tags: ["AD9364", "Artix-7", "Altium", "Python", "GNU Radio"],
    links: [
      { label: "Repo", href: "#", glyph: "↗", disabled: true },
      { label: "Notes", href: "#", glyph: "↗", disabled: true },
    ],
  },
];
