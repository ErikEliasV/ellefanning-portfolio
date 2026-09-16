import { SECTIONS } from "@/lib/sections";
import "@/styles/header.css";

export function SiteHeader() {
  return (
    <header className="hdr">
      <div aria-hidden className="hdr-tint" />
      <div aria-hidden className="hdr-edge" />

      <nav className="hdr-nav" aria-label="Sections">
        {SECTIONS.map((section) => (
          <a key={section.id} href={`#${section.id}`} className="hdr-link">
            {section.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
