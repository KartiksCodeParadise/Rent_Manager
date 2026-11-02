"use client";
import { useEffect, useState } from "react";

/** Sticky header that gains a shadow and solid background once the page scrolls. */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-slate-200/80 bg-cream/85 shadow-[0_8px_30px_-20px_rgba(29,25,21,0.35)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      {children}
    </header>
  );
}
