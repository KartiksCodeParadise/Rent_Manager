/* eslint-disable @next/next/no-img-element */

type Credit = {
  name: string;
  role: string;
  /** Monogram shown until a real logo file is added. */
  initials: string;
  colors: [string, string];
  /** Optional real logo, e.g. "/credits/astorbits.png" placed in /public/credits. */
  logo?: string;
  href?: string;
};

const credits: Credit[] = [
  { name: "Astorbits", role: "Design & development", initials: "A", colors: ["#3f9a8e", "#0c423e"] },
  { name: "Kkrushnal Mehendi Arts", role: "Brand & creative", initials: "KM", colors: ["#f6a42a", "#c96a0c"] },
  {
    name: "Kartik's Code Paradise",
    role: "Engineering",
    initials: "KCP",
    colors: ["#6366f1", "#312e81"],
    href: "https://github.com/KartiksCodeParadise",
  },
];

function CreditLogo({ c }: { c: Credit }) {
  if (c.logo) return <img src={c.logo} alt={`${c.name} logo`} className="h-11 w-11 rounded-xl bg-white object-contain p-1" />;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-label={`${c.name} logo`} role="img" className="shrink-0">
      <defs>
        <linearGradient id={`credit-${c.initials}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c.colors[0]} />
          <stop offset="1" stopColor={c.colors[1]} />
        </linearGradient>
      </defs>
      <rect width="44" height="44" rx="12" fill={`url(#credit-${c.initials})`} />
      <rect x="3" y="3" width="38" height="38" rx="9.5" fill="none" stroke="#fff" strokeOpacity=".25" />
      <text
        x="22"
        y="22"
        dy=".35em"
        textAnchor="middle"
        fill="#fff"
        fontFamily="var(--font-display-face), Georgia, serif"
        fontWeight="600"
        fontSize={c.initials.length > 2 ? 13 : c.initials.length > 1 ? 16 : 20}
      >
        {c.initials}
      </text>
    </svg>
  );
}

export function DeveloperCredits() {
  return (
    <div className="relative border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-center text-xs font-bold tracking-[0.18em] text-marigold-300 uppercase">Crafted by</p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          {credits.map((c) => {
            const body = (
              <>
                <CreditLogo c={c} />
                <span className="min-w-0">
                  <span className="block truncate font-display text-base font-semibold text-white">{c.name}</span>
                  <span className="block text-xs text-brand-200/70">{c.role}</span>
                </span>
              </>
            );
            const cls =
              "flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition duration-300 hover:-translate-y-0.5 hover:border-marigold-300/40 hover:bg-white/[0.08]";
            return (
              <li key={c.name}>
                {c.href ? (
                  <a href={c.href} target="_blank" rel="noopener noreferrer" className={cls}>
                    {body}
                  </a>
                ) : (
                  <div className={cls}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
