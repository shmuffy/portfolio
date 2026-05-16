import { experience, type Role } from "../data/experience";
import { projects, type Project, type ProjectLink } from "../data/projects";
import { emphasize, esc, gutterRow, stampLine } from "./micro";
import pcbBmsUrl from "../assets/pcb-bms.png";
import pcbEloadUrl from "../assets/pcb-eload.png";
import pcbSensorHubUrl from "../assets/pcb-sensorhub.png";
import pcbCutieUrl from "../assets/pcb-cutie.png";
import seniorDesignPhotoUrl from "../assets/senior-design-group-photo.jpg";
import taslGroupPhotoUrl from "../assets/tasl-group-photo.jpg";
import fsaeTeamPhotoUrl from "../assets/fsae-team-photo.jpg";
import pcbHrBms3dUrl from "../assets/pcb-hr-bms-3d.png";
import pcbHrBmsLayoutUrl from "../assets/pcb-hr-bms-layout.png";
import cutieLemonCardUrl from "../assets/cutie-lemon-card.jpg";
import cutieStackUrl from "../assets/cutie-stack.jpg";
import bmsGlb from "../assets/BMS.glb?url";
import eloadGlb from "../assets/E-Load.glb?url";
import cutieGlb from "../assets/cutie.glb?url";
import sensorhubGlb from "../assets/sensorhub.glb?url";

/* ---- experience: compact role entries ------------------------------------- */

/** the single most important bullet per role, shortened */
const lead: Record<string, string> = {
  "MOD-01":
    "Direct the **C.U.T.I.E. CubeSat** payload — designed its 4S Li-ion battery card and the team's Altium component library.",
  "MOD-02":
    "Co-founded **Aviat'R** to revive UCR's drone program for the **SUAS** competition — built the **avionics power architecture** on a Holybro PM07, 12S / 120 A to flight, payload, and comms.",
  "MOD-03":
    "Optimized **Gaussian-Splatting datasets** for GPU pipelines — 28 fps on an RTX 4090 — and integrated a ROSmaster R2 platform.",
  "MOD-04":
    "Developed the **400 V pack BMS PCB** — STM32 with a BQ76PLQ1 stacked cell monitor — plus an STM32F405 vehicle sensor hub.",
};

function roleHtml(r: Role): string {
  const extraBullets = r.points
    .slice(1)
    .map((p) => `<p>${emphasize(p)}</p>`)
    .join("");
  return `<div class="block">
    ${stampLine(r.org, true)}
    ${stampLine(r.role)}
    ${stampLine(r.unit + " · " + r.location + " · " + r.span)}
    <p>${emphasize(lead[r.mod] ?? r.points[0])}</p>
    ${extraBullets}
    ${stampLine(r.tags.join(" · "))}
  </div>`;
}

const roleBoards: Record<string, string> = {
  "MOD-01":
    `<div class="figure-pair">${photoFigure(
      cutieLemonCardUrl,
      4284,
      5712,
      "Bench photo of the LEMON battery card — STM32F303, BQ76 cell-monitor, gate drivers and tap connectors populated on the green CubeSat-format PCB, resting on a sticker-covered toolbox.",
      "PHOTO — LEMON BATTERY CARD · CUTIE CUBESAT",
    )}${photoFigure(
      cutieStackUrl,
      2252,
      4000,
      "Hand-held stack of CUTIE CubeSat boards — LEMON and CITRUS daughter cards plugged into the GNSS / LoRa main board.",
      "PHOTO — CUTIE BOARD STACK · LEMON · CITRUS · GNSS · LoRa",
    )}</div>` +
    boardFigure(
      pcbCutieUrl,
      1104,
      700,
      "Monochrome line render of the CUTIE CubeSat ejection-module PCB layout — routing, silkscreen, components, pads and board outline as ink linework.",
      "BOARD LAYOUT · CUTIE CUBESAT · EJECTION MODULE · ALTIUM",
      cutieGlb,
    ),
  "MOD-03": photoFigure(
    taslGroupPhotoUrl,
    7616,
    4284,
    "Group photo of the Trustworthy Autonomous Systems Lab outside on UCR campus — roughly two dozen researchers with a PAL Robotics TIAGo mobile manipulator at the right edge of the group.",
    "PHOTO — TRUSTWORTHY AUTONOMOUS SYSTEMS LAB · UCR · FALL 2024",
  ),
  "MOD-04":
    photoFigure(
      fsaeTeamPhotoUrl,
      4032,
      3024,
      "Highlander Racing Formula SAE team gathered outside a UCR engineering building — large group photo of roughly seventy members.",
      "PHOTO — HIGHLANDER RACING · FORMULA SAE · UCR",
    ) +
    `<div class="figure-pair">${photoFigure(
      pcbHrBms3dUrl,
      396,
      1140,
      "Altium 3D render of the Highlander Racing 400 V pack BMS PCB — long narrow board with the BQ76PLQ1 stacked cell monitor, STM32, isolated DC-DC, and thermistor / tap connector banks visible.",
      "RENDER — 400 V FSAE BMS · ALTIUM 3D",
    )}${photoFigure(
      pcbHrBmsLayoutUrl,
      440,
      1154,
      "Altium top-view layout of the Highlander Racing 400 V pack BMS PCB — routing, polygons, and silkscreen across both halves of the daughter-card and main board.",
      "LAYOUT — 400 V FSAE BMS · ALTIUM",
    )}</div>` +
    boardFigure(
      pcbSensorHubUrl,
      1332,
      716,
      "Monochrome line render of the STM32F405 vehicle sensor-hub PCB layout — routing, silkscreen, components, pads and board outline as ink linework.",
      "BOARD LAYOUT · STM32F405 SENSOR HUB · ALTIUM",
      sensorhubGlb,
    ),
};

/* ---- mono-text schematics for the project figures ------------------------- */

interface Fig {
  cap: string;
  parts: string[];
}

const flowDiagrams: Record<Project["schematic"], { figs: Fig[]; out?: string }> = {
  "bms-load": {
    figs: [
      {
        cap: "FIG.1 — 300 W PROGRAMMABLE ELECTRONIC LOAD",
        parts: ["DUT / SOURCE", "IRFP250N LINEAR", "PRECISION SHUNT", "TL431 ERROR AMP", "STM32F3 — ADC·DAC·PWM"],
      },
      {
        cap: "FIG.2 — 10-CELL Li-ion BMS",
        parts: ["10S Li-ion 36–42 V", "BQ76930 AFE + BAL", "PASSIVE CELL BALANCE", "NTC THERMAL CUTOFF", "OC · SC PROT 50–60 A"],
      },
    ],
    out: "→ PROTECTED PACK OUTPUT",
  },
  "fpga-sdr": {
    figs: [
      {
        cap: "FIG.1 — RF + DIGITAL SIGNAL CHAIN",
        parts: ["ANT / SMA", "AD9364 RF XCVR", "ARTIX-7 FPGA", "USB 2.0 BRIDGE", "HOST — PYTHON IQ·DDC"],
      },
      {
        cap: "FIG.2 — POWER TREE + CLOCKING",
        parts: ["5 V INPUT", "BUCK ×2 — 1.0/1.8 V", "LDO ×2 — 1.35/3.3 V", "LOW-JITTER CLOCK FANOUT", "→ FPGA / RF / USB"],
      },
    ],
  },
};

const ARR = `<span class="arr" aria-hidden="true"> → </span>`;

function flowline(parts: string[]): string {
  return `<p class="flowline">${parts.map(esc).join(ARR)}</p>`;
}

function figure(schematic: Project["schematic"]): string {
  const d = flowDiagrams[schematic];
  const figs = d.figs.map((f) => `${stampLine(f.cap)}${flowline(f.parts)}`).join("");
  const out = d.out ? `<p class="stamp">${esc(d.out)}</p>` : "";
  return `<div class="figure">${figs}${out}</div>`;
}

function photoFigure(
  src: string,
  w: number,
  h: number,
  alt: string,
  cap: string,
): string {
  return `<div class="figure figure--photo"><img src="${src}" width="${w}" height="${h}" loading="lazy" decoding="async" alt="${esc(alt)}">${stampLine(cap)}</div>`;
}

function boardFigure(
  src: string,
  w: number,
  h: number,
  alt: string,
  cap: string,
  glb?: string,
): string {
  const media = glb
    ? `<button type="button" class="pcb-morph" style="aspect-ratio:${w}/${h}" data-glb="${glb}" aria-label="${esc("Explore this PCB layout as an interactive 3D model")}"><img class="pcb-morph-flat" src="${src}" width="${w}" height="${h}" loading="lazy" decoding="async" alt="${esc(alt)}"></button>`
    : `<img src="${src}" width="${w}" height="${h}" loading="lazy" decoding="async" alt="${esc(alt)}">`;
  return `<div class="figure figure--board">${media}${stampLine(glb ? `${cap} · CLICK TO EXPLORE IN 3D` : cap)}</div>`;
}

function projectBoards(): string {
  return (
    boardFigure(
      pcbEloadUrl,
      1388,
      628,
      "Monochrome line render of the 300 W programmable electronic-load PCB layout — copper pour, routing, silkscreen, pads and outline as ink linework.",
      "FIG.3 — BOARD LAYOUT · 300 W E-LOAD · ALTIUM",
      eloadGlb,
    ) +
    boardFigure(
      pcbBmsUrl,
      1500,
      678,
      "Monochrome line render of the 10-cell Li-ion BMS PCB layout — copper pours, traces, silkscreen, pads and outlines as ink linework.",
      "FIG.4 — BOARD LAYOUT · 10S Li-ion BMS · ALTIUM",
      bmsGlb,
    )
  );
}

const blurbs: Record<Project["schematic"], string> = {
  "bms-load":
    "Bench-grade MOSFET linear electronic load plus a companion 10-cell Li-ion BMS — design, layout, firmware and validation, end to end.",
  "fpga-sdr":
    "HackRF-class SDR around the AD9364 transceiver and an Artix-7 FPGA — custom power tree, clock fanout, high-speed differential routing, Python IQ model.",
};

const keySpecs: Record<Project["schematic"], number[]> = {
  "bms-load": [1, 2, 4, 6],
  "fpga-sdr": [0, 1, 2, 5],
};

function projectLink(l: ProjectLink): string {
  const glyph = l.glyph ?? "↗";
  if (l.disabled) {
    return `<span class="linkline-x" aria-disabled="true">${esc(l.label)} ${esc(glyph)}</span>`;
  }
  return `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)} ${esc(glyph)}</a>`;
}

function projectHtml(p: Project): string {
  const specRows = keySpecs[p.schematic]
    .map((idx, i) => {
      const s = p.specs[idx];
      return gutterRow(String(i + 1), `${s.k.toUpperCase()} — ${s.v}`, "·");
    })
    .join("");
  const progressBlock = p.progress
    ? `${stampLine(p.progress.stamp)}<p>${esc(p.progress.body)}</p>`
    : "";
  const heroPhoto =
    p.schematic === "bms-load"
      ? photoFigure(
          seniorDesignPhotoUrl,
          1215,
          911,
          "Senior design group of four standing in front of the BMS / 300 W electronic-load poster, with the laptop dashboard, BMS board, electronic-load enclosure, and bench supply on the table in front.",
          "PHOTO — SENIOR DESIGN GROUP · UCR EE 175 · MAR 2026",
        )
      : "";
  return `<div class="block">
    ${stampLine(`[${p.badge}] · ${p.span}`)}
    ${stampLine(p.title, true)}
    <p class="lede">${esc(blurbs[p.schematic])}</p>
    ${progressBlock}
    ${heroPhoto}
    ${figure(p.schematic)}
    ${specRows}
    ${stampLine(p.tags.join(" · "))}
    <p class="linkline">${p.links.map(projectLink).join(" · ")}</p>
  </div>`;
}

/* ---- detail content exported for the desktop modal ----------------------- */

export function roleDetailContent(mod: string): string | null {
  const r = experience.find((x) => x.mod === mod);
  if (!r) return null;
  return roleHtml(r) + (roleBoards[r.mod] ?? "");
}

export function projectDetailContent(proj: string): string | null {
  const p = projects.find((x) => x.proj === proj);
  if (!p) return null;
  return projectHtml(p) + (p.schematic === "bms-load" ? projectBoards() : "");
}
