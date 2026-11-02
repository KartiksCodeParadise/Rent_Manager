import Link from "next/link";

const tones: Record<string, string> = {
  vacant: "bg-emerald-50 text-emerald-700",
  occupied: "bg-slate-100 text-slate-600",
  unlisted: "bg-amber-50 text-amber-700",
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  withdrawn: "bg-slate-100 text-slate-500",
  open: "bg-amber-50 text-amber-700",
  in_progress: "bg-blue-50 text-blue-700",
  resolved: "bg-emerald-50 text-emerald-700",
  unpaid: "bg-red-50 text-red-700",
  claimed: "bg-blue-50 text-blue-700",
  paid: "bg-emerald-50 text-emerald-700",
  overdue: "bg-red-100 text-red-800",
  simulated: "bg-slate-100 text-slate-600",
  sent: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
};

const labels: Record<string, string> = {
  in_progress: "In progress",
  claimed: "Payment submitted",
  simulated: "Logged (not sent)",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${tones[status] ?? "bg-slate-100 text-slate-600"}`}>
      {labels[status] ?? status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="h1">{title}</h1>
        {subtitle && <p className="muted mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ title, hint, href, cta }: { title: string; hint?: string; href?: string; cta?: string }) {
  return (
    <div className="card flex flex-col items-center gap-2 p-10 text-center">
      <p className="font-medium text-slate-700">{title}</p>
      {hint && <p className="muted max-w-md">{hint}</p>}
      {href && cta && (
        <Link href={href} className="btn btn-primary mt-2">
          {cta}
        </Link>
      )}
    </div>
  );
}

export function Stat({ label, value, href }: { label: string; value: React.ReactNode; href?: string }) {
  const inner = (
    <div className="card p-5 transition hover:border-brand-500">
      <p className="muted">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Notice({ text, tone = "ok" }: { text?: string; tone?: "ok" | "error" }) {
  if (!text) return null;
  return (
    <div
      className={`mb-4 rounded-xl px-4 py-3 text-sm ${
        tone === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
      }`}
    >
      {text}
    </div>
  );
}

export function RoomThumb({ imageId, alt }: { imageId?: number | null; alt: string }) {
  return imageId ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/api/images/${imageId}`} alt={alt} className="h-full w-full object-cover" loading="lazy" />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 10.5 12 3l9 7.5V21H3z" />
        <path d="M9 21v-6h6v6" />
      </svg>
    </div>
  );
}
