"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, Mail, X } from "lucide-react";
import { developer } from "@/lib/developer";

const offerings = [
  ["Websites & web apps", "Fast, responsive and built around what your customers actually need."],
  ["Payments, SMS & notifications", "UPI, SMS gateways, WhatsApp and email integrations, set up properly."],
  ["Dashboards & back-ends", "Run your business yourself, without touching code."],
  ["Hosting, launch & support", "Deployed for you and kept up to date after go-live."],
] as const;

const questions = [
  "Curious how a platform like this gets built?",
  "Want to explore more about Kartik Yamsanwar and his work?",
  "Have an idea that needs a reliable technical partner?",
] as const;

/** Highlighted "Designed & developed by" strip for the footer, with a profile popup. */
export function DeveloperCredit({ siteName }: { siteName: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      trigger?.focus();
    };
  }, [open]);

  const mail = `mailto:${developer.email}?subject=${encodeURIComponent(`Enquiry from the ${siteName} website`)}`;

  return (
    <>
      <div className="relative mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label={`Designed and developed by ${developer.name} — view portfolio and contact`}
          className="group block w-full rounded-2xl border border-marigold-300/40 bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 p-[1px] text-left shadow-[0_0_40px_rgba(246,164,42,0.12)] transition duration-300 hover:-translate-y-0.5 hover:border-marigold-300 hover:shadow-[0_0_50px_rgba(246,164,42,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-marigold-300"
        >
          <span className="flex flex-col items-center gap-4 rounded-2xl bg-brand-950/80 px-5 py-4 text-center sm:flex-row sm:text-left">
            <img
              src={developer.logo}
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 rounded-xl object-cover ring-2 ring-marigold-300/60 transition duration-300 group-hover:scale-105 group-hover:ring-marigold-300"
            />
            <span className="leading-tight">
              <span className="block text-[0.7rem] tracking-[0.25em] text-marigold-300/80 uppercase">Designed &amp; developed by</span>
              <span className="block font-display text-2xl font-semibold text-marigold-200 transition group-hover:text-marigold-300">
                {developer.name}
              </span>
              <span className="block text-xs text-brand-100/60">Listings, applications, billing, SMS & dashboards — built end to end.</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-marigold-300/50 px-4 py-1.5 text-xs font-medium text-marigold-300 transition group-hover:bg-marigold-400 group-hover:text-brand-950 sm:ml-auto">
              Portfolio &amp; contact <ArrowUpRight size={14} />
            </span>
          </span>
        </button>
      </div>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex animate-fade-in items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="developer-title"
              className="relative max-h-[90vh] w-full max-w-lg animate-fade-up overflow-y-auto rounded-3xl border border-marigold-300/40 bg-brand-900 p-6 text-brand-50/85 shadow-2xl"
            >
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute top-4 right-4 rounded-full p-1.5 text-brand-100/70 transition hover:bg-brand-800 hover:text-marigold-300"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-4">
                <img src={developer.logo} alt={`${developer.name} logo`} width={88} height={88} className="h-22 w-22 rounded-2xl ring-2 ring-marigold-300/60" />
                <div>
                  <p className="text-xs tracking-[0.25em] text-marigold-300/80 uppercase">Designed &amp; developed by</p>
                  <h2 id="developer-title" className="font-display text-3xl font-semibold text-marigold-200">
                    {developer.name}
                  </h2>
                </div>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <a href={developer.url} target="_blank" rel="noopener noreferrer" className="btn btn-accent w-full">
                  View portfolio <ArrowUpRight size={16} />
                </a>
                <a href={mail} className="btn w-full border border-marigold-300/40 text-sm break-all text-marigold-100 hover:bg-white/5">
                  <Mail size={15} className="shrink-0" /> {developer.email}
                </a>
              </div>
              <p className="mt-5 font-display text-xl text-marigold-300">Your one-stop solution for technical services — at reasonable rates.</p>
              <p className="mt-3 text-sm leading-relaxed">
                {developer.name} is a developer-led technology studio, run by {developer.owner}, that takes a business idea from first
                sketch to a live, maintained product. This website — its room listings, applications, monthly billing, SMS updates and
                dashboards — was built and delivered end to end.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {offerings.map(([title, text]) => (
                  <li key={title} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-marigold-400" />
                    <span>
                      <strong className="text-white">{title}.</strong> {text}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm">Fair, transparent pricing — quality work without agency-sized bills.</p>
              <div className="mt-4 space-y-1 rounded-xl border border-marigold-300/20 bg-brand-950/60 p-4 text-sm text-brand-100/75 italic">
                {questions.map((q) => (
                  <p key={q}>{q}</p>
                ))}
                <p className="text-marigold-200 not-italic">
                  Write in — no obligation, just a conversation:{" "}
                  <a href={mail} className="underline underline-offset-2 hover:text-marigold-300">
                    {developer.email}
                  </a>
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
