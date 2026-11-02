import Link from "next/link";
import { CircleAlert, CircleCheck, Inbox, type LucideIcon } from "lucide-react";
import { LogoMark } from "./Logo";

const tones: Record<string, string> = {
  vacant: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  occupied: "bg-slate-100 text-slate-600 ring-slate-500/15",
  unlisted: "bg-marigold-50 text-marigold-600 ring-marigold-500/20",
  pending: "bg-marigold-50 text-marigold-600 ring-marigold-500/20",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  rejected: "bg-red-50 text-red-700 ring-red-600/15",
  withdrawn: "bg-slate-100 text-slate-500 ring-slate-500/15",
  open: "bg-marigold-50 text-marigold-600 ring-marigold-500/20",
  in_progress: "bg-sky-50 text-sky-700 ring-sky-600/15",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  unpaid: "bg-red-50 text-red-700 ring-red-600/15",
  claimed: "bg-sky-50 text-sky-700 ring-sky-600/15",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  overdue: "bg-red-100 text-red-800 ring-red-600/25",
  simulated: "bg-slate-100 text-slate-600 ring-slate-500/15",
  sent: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  failed: "bg-red-50 text-red-700 ring-red-600/15",
};

const labels: Record<string, string> = {
  in_progress: "In progress",
  claimed: "Payment submitted",
  simulated: "Logged (not sent)",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ring-1 ring-inset ${tones[status] ?? "bg-slate-100 text-slate-600 ring-slate-500/15"}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {labels[status] ?? status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="h1">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({
  title,
  hint,
  href,
  cta,
  icon: Icon = Inbox,
}: {
  title: string;
  hint?: string;
  href?: string;
  cta?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="card flex flex-col items-center gap-2 border-dashed px-6 py-14 text-center">
      <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon size={26} />
      </span>
      <p className="font-display text-lg font-semibold text-slate-800">{title}</p>
      {hint && <p className="muted max-w-md">{hint}</p>}
      {href && cta && (
        <Link href={href} className="btn btn-primary mt-3">
          {cta}
        </Link>
      )}
    </div>
  );
}

export function Stat({
  label,
  value,
  href,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: React.ReactNode;
  href?: string;
  icon?: LucideIcon;
  tone?: "brand" | "marigold" | "red" | "slate";
}) {
  const toneClass = {
    brand: "bg-brand-50 text-brand-700",
    marigold: "bg-marigold-50 text-marigold-600",
    red: "bg-red-50 text-red-600",
    slate: "bg-slate-100 text-slate-600",
  }[tone];
  const inner = (
    <div className={`card h-full p-5 ${href ? "card-hover" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-500">{label}</p>
        {Icon && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClass}`}>
            <Icon size={18} />
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Notice({ text, tone = "ok" }: { text?: string; tone?: "ok" | "error" }) {
  if (!text) return null;
  const Icon = tone === "ok" ? CircleCheck : CircleAlert;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`mb-5 flex animate-fade-up items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${
        tone === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      <Icon size={18} className="mt-px shrink-0" />
      {text}
    </div>
  );
}

export function RoomThumb({ imageId, alt }: { imageId?: number | null; alt: string }) {
  return imageId ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/api/images/${imageId}`} alt={alt} className="h-full w-full object-cover" loading="lazy" />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 via-cream to-marigold-50">
      <LogoMark size={44} className="opacity-60 grayscale-[30%]" />
    </div>
  );
}
