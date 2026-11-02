import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { login } from "@/lib/actions/auth";
import { currentUser } from "@/lib/auth";
import { Field, Notice } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { AuthShell } from "@/components/AuthShell";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await currentUser()) redirect("/dashboard");
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/dashboard";

  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage your rooms, bills and requests.">
      <Notice text={typeof sp.error === "string" ? sp.error : undefined} tone="error" />
      <form action={login} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <Field label="Email">
          <input type="email" name="email" required autoComplete="email" placeholder="you@example.com" className="input" />
        </Field>
        <Field label="Password">
          <input type="password" name="password" required autoComplete="current-password" className="input" />
        </Field>
        <SubmitButton className="btn btn-primary w-full py-3" pendingText="Logging in…">
          Log in <ArrowRight size={16} />
        </SubmitButton>
      </form>
      <p className="muted mt-6 text-center">
        New to Basera?{" "}
        <Link href={`/register?next=${encodeURIComponent(next)}`} className="link">
          Create a free account
        </Link>
      </p>
    </AuthShell>
  );
}
