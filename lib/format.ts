export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

/** SQLite stores UTC "YYYY-MM-DD HH:MM:SS"; show it in Indian time. */
export function dateTime(s: string | null | undefined) {
  if (!s) return "";
  const d = new Date(s.includes("T") ? s : s.replace(" ", "T") + "Z");
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
}

export function date(s: string | null | undefined) {
  if (!s) return "";
  const d = new Date(s.length === 10 ? s + "T00:00:00" : s.replace(" ", "T") + "Z");
  return d.toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });
}

export function monthLabel(period: string) {
  const [y, m] = period.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
export const num = (fd: FormData, key: string) => {
  const n = Number(fd.get(key));
  return Number.isFinite(n) ? n : 0;
};

export function whatsappLink(phone: string, text = "") {
  const d = phone.replace(/\D/g, "");
  const full = d.length === 10 ? `91${d}` : d;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
