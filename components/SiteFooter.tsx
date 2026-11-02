import Link from "next/link";
import { Heart } from "lucide-react";
import { BRAND, Logo } from "./Logo";
import { DeveloperCredits } from "./DeveloperCredits";

const columns: [string, [string, string][]][] = [
  [
    "For tenants",
    [
      ["Find a room", "/rooms"],
      ["Create an account", "/register"],
      ["Pay my bills", "/dashboard/bills"],
      ["Raise a request", "/dashboard/requests"],
    ],
  ],
  [
    "For owners",
    [
      ["List your property", "/register?role=owner"],
      ["Owner dashboard", "/dashboard"],
      ["Monthly billing", "/dashboard/bills"],
      ["Groups & notices", "/dashboard/groups"],
    ],
  ],
];

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-brand-950 text-brand-100">
      <div className="pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full bg-brand-700/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-marigold-500/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-200/80">
            {BRAND.tagline} Find a place to live, or run your rooms, tenants, bills and notices from one simple dashboard.
          </p>
        </div>
        {columns.map(([title, links]) => (
          <div key={title}>
            <h3 className="text-xs font-bold tracking-[0.18em] text-marigold-300 uppercase">{title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-brand-100/80 transition hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <DeveloperCredits />
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-brand-200/70 sm:flex-row sm:px-6">
          <p>
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
          <p className="flex flex-wrap items-center justify-center gap-1.5 text-center">
            Made with <Heart size={13} className="fill-marigold-400 text-marigold-400" /> in India
          </p>
        </div>
      </div>
    </footer>
  );
}
