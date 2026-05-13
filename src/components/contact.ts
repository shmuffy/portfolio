import { links, type SocialLink } from "../data/site";
import { esc, sectionOpen } from "./micro";

function find(key: string): SocialLink | undefined {
  return links.find((l) => l.key === key);
}

/** uppercase, drop a leading protocol/www for the tiny display lines */
function shortDisplay(s: string): string {
  return s.replace(/^https?:\/\//i, "").replace(/^www\./i, "").toUpperCase();
}

function externalLine(label: string, l: SocialLink | undefined, aria: string): string {
  if (!l) return "";
  const ext = l.isFile || /^https?:/i.test(l.href) ? ` target="_blank" rel="noopener"` : "";
  return `<p><a href="${esc(l.href)}" aria-label="${esc(aria)}"${ext}>${esc(label)} — ${esc(shortDisplay(l.display))}</a></p>`;
}

export function contactSection(): string {
  return `<section class="block-section" id="contact" aria-label="Contact">
    ${sectionOpen("03", "Contact")}
    <div class="block reveal">
      ${externalLine("EMAIL", find("email"), "Email Christian")}
      ${externalLine("LINKEDIN", find("linkedin"), "Christian Kim on LinkedIn")}
      ${externalLine("GITHUB", find("github"), "Christian Kim on GitHub")}
      ${externalLine("CV", find("resume"), "Download Christian Kim's resume PDF")}
    </div>
  </section>`;
}
