"use client";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-brand-950">We hit a loose floorboard</h1>
      <p className="mt-3 text-slate-600">Please try again. If it keeps happening, wait a minute and reload.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="btn btn-primary">
          <RotateCcw size={16} /> Try again
        </button>
        <Link href="/" className="btn btn-secondary">
          Go home
        </Link>
      </div>
    </main>
  );
}
