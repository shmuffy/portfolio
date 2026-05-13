export const site = {
  name: "Christian Kim",
  first: "Christian",
  last: "Kim",
  role: "Electrical Engineer",
  focus: "Power · Mixed-Signal · High-Speed",
  subjectId: "CK-EE-001",
  institution: "UC Riverside",
  classOf: "2026",
  gradDate: "Jun 15, 2026",
  location: "Indio, California",
  eeGpa: "3.36 / 4.00",
  domain: "PCB · Embedded · RF · Power",
  rev: "REV 2026.1",
  available: true,
  availableLabel: "AVAILABLE — JUN 2026",
  tagline:
    "I design PCBs, embedded systems, and power electronics — for rockets, drones, race cars, and radios.",
  resume: "christian-kim-resume.pdf",
} as const;

export interface SocialLink {
  key: string;
  label: string;
  href: string;
  /** plain-text display value */
  display: string;
  /** marks the résumé so we can append a [PDF] stamp */
  isFile?: boolean;
}

export const links: SocialLink[] = [
  {
    key: "email",
    label: "Email",
    href: "mailto:christiancaseykim@gmail.com",
    display: "christiancaseykim@gmail.com",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/christian-kim1",
    display: "linkedin.com/in/christian-kim1",
  },
  {
    key: "github",
    label: "GitHub",
    href: "https://github.com/shmuffy",
    display: "github.com/shmuffy",
  },
  {
    key: "resume",
    label: "Résumé",
    href: `${import.meta.env.BASE_URL}${site.resume}`,
    display: site.resume,
    isFile: true,
  },
];

export interface NavItem {
  n: string;
  id: string;
  label: string;
}

export const navItems: NavItem[] = [
  { n: "01", id: "about", label: "About" },
  { n: "02", id: "work", label: "Work" },
  { n: "03", id: "projects", label: "Projects" },
  { n: "04", id: "contact", label: "Contact" },
];
