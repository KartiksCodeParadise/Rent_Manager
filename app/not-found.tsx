import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <LogoMark size={64} className="animate-float" />
      <p className="eyebrow mt-8">Error 404</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-brand-950">This door doesn&apos;t lead anywhere</h1>
      <p className="mt-3 text-slate-600">The page may have moved, or the room is no longer listed.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/rooms" className="btn btn-primary">
          Browse rooms <ArrowRight size={16} />
        </Link>
        <Link href="/" className="btn btn-secondary">
          Go home
        </Link>
      </div>
    </main>
  );
}
