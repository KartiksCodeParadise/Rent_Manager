import Link from "next/link";

export const BRAND = {
  name: "Basera",
  tagline: "Rooms, rent & residents — sorted.",
};

/** Roof + arched doorway with a lit diya: "basera" means a home, a place to stay. */
export function LogoMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="basera-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1f7d72" />
          <stop offset="1" stopColor="#0a3533" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#basera-tile)" />
      <path d="M8.5 19.5 20 10l11.5 9.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 31v-8a6 6 0 0 1 12 0v8" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <path d="M20 23.2c1.3 1.4 1.9 2.5 1.9 3.4a1.9 1.9 0 0 1-3.8 0c0-.9.6-2 1.9-3.4Z" fill="#f6a42a" />
    </svg>
  );
}

export function Logo({ light = false, href = "/" }: { light?: boolean; href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5" aria-label={`${BRAND.name} home`}>
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105" />
      <span className={`font-display text-2xl font-semibold tracking-tight ${light ? "text-white" : "text-brand-900"}`}>
        {BRAND.name}
      </span>
    </Link>
  );
}
