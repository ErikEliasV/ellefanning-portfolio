import { Rule } from "@/components/core/Rule";
import { LINKS } from "@/lib/links";

export function SiteFooter() {
  return (
    <footer
      id="footer"
      className="grain relative border-t border-line-rule bg-ink-900 text-paper-100"
    >
      <div className="bleed relative flex flex-col gap-10 py-16">
        <div className="flex flex-col gap-3">
          <span className="font-mono text-label-sm font-bold uppercase tracking-label-wide text-ink-300">
            08 / End credits
          </span>
          <h2 className="font-display text-poster uppercase leading-[0.86] tracking-poster text-paper-100">
            Elle
            <br />
            Fanning
            <span className="text-yellow-400">.</span>
          </h2>
        </div>

        <Rule tone="invert" />

        <div className="grid gap-8 md:grid-cols-[1fr_auto]">
          <ul className="flex flex-col">
            {LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex items-baseline justify-between gap-6 border-b border-line-invert py-3 font-mono text-label font-bold uppercase tracking-label-wide text-paper-100 transition-colors duration-[140ms] ease-[var(--ease-out)] hover:text-yellow-400"
                >
                  <span className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="inline-block size-2 bg-yellow-400"
                    />
                    {link.label}
                  </span>
                  <span className="text-ink-300 transition-colors duration-[140ms] ease-[var(--ease-out)] group-hover:text-yellow-400">
                    {link.value}
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <div className="flex flex-col justify-end gap-2 font-mono text-micro uppercase tracking-label text-ink-300 md:text-right">
            <span>Actress · Producer</span>
            <span>Portfolio · 2026 edition</span>
            <span>Fan project — not affiliated</span>
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-4 font-mono text-micro uppercase tracking-label-wide text-ink-500">
          <a
            href="#hero"
            className="transition-colors duration-[140ms] ease-[var(--ease-out)] hover:text-yellow-400"
          >
            &uarr; Back to top
          </a>
          <span>End</span>
        </div>
      </div>
    </footer>
  );
}
