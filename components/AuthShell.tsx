import { BellRing, QrCode, ShieldCheck } from "lucide-react";
import { BRAND } from "./Logo";

const points = [
  [BellRing, "SMS updates on every application, bill and request"],
  [QrCode, "Pay rent by UPI — straight to the owner, zero fees"],
  [ShieldCheck, "Your number stays private until you connect"],
] as const;

/** Two-column card used by the login and sign-up pages. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="card grid overflow-hidden md:grid-cols-[1fr_1.1fr]">
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-10 text-white md:block">
          <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-marigold-400/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-brand-300/20 blur-3xl" />
          <p className="relative eyebrow text-marigold-300">{BRAND.name}</p>
          <h2 className="relative mt-3 font-display text-3xl leading-tight font-semibold">{BRAND.tagline}</h2>
          <ul className="relative mt-10 space-y-5">
            {points.map(([Icon, text], i) => (
              <li key={text} className="flex animate-fade-up items-start gap-3" style={{ animationDelay: `${150 + i * 100}ms` }}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-marigold-300">
                  <Icon size={18} />
                </span>
                <span className="pt-1.5 text-sm text-brand-100/90">{text}</span>
              </li>
            ))}
          </ul>
        </aside>
        <section className="p-6 sm:p-10">
          <h1 className="h1">{title}</h1>
          <p className="muted mt-1.5">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </section>
      </div>
    </main>
  );
}
