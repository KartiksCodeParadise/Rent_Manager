import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Building2, Search } from "lucide-react";
import { register } from "@/lib/actions/auth";
import { currentUser } from "@/lib/auth";
import { Field, Notice } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { AuthShell } from "@/components/AuthShell";

export const metadata: Metadata = { title: "Create account" };

const roles = [
  ["tenant", "I'm a tenant", "Looking for a room", Search],
  ["owner", "I'm an owner", "I have rooms to rent", Building2],
] as const;

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  if (await currentUser()) redirect("/dashboard");
  const sp = await searchParams;
  const role = sp.role === "owner" ? "owner" : "tenant";
  const next = typeof sp.next === "string" ? sp.next : "/dashboard";

  return (
    <AuthShell title="Create your account" subtitle="Free forever. Takes under a minute.">
      <Notice text={typeof sp.error === "string" ? sp.error : undefined} tone="error" />
      <form action={register} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <fieldset className="grid grid-cols-2 gap-3">
          <legend className="sr-only">Account type</legend>
          {roles.map(([value, label, hint, Icon]) => (
            <label
              key={value}
              className="group flex cursor-pointer flex-col gap-1 rounded-2xl border border-slate-300 p-4 transition hover:border-brand-300 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:checked]:shadow-[0_0_0_3px_var(--color-brand-100)]"
            >
              <input type="radio" name="role" value={value} defaultChecked={role === value} className="sr-only" />
              <Icon size={20} className="text-slate-400 transition group-has-[:checked]:text-brand-700" />
              <span className="mt-1 text-sm font-semibold">{label}</span>
              <span className="text-xs text-slate-500">{hint}</span>
            </label>
          ))}
        </fieldset>
        <Field label="Full name">
          <input name="name" required autoComplete="name" className="input" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mobile number" hint="SMS updates are sent here.">
            <input name="phone" type="tel" required placeholder="98765 43210" autoComplete="tel" className="input" />
          </Field>
          <Field label="Email">
            <input type="email" name="email" required autoComplete="email" className="input" />
          </Field>
        </div>
        <Field label="Password" hint="At least 6 characters.">
          <input type="password" name="password" required minLength={6} autoComplete="new-password" className="input" />
        </Field>
        <SubmitButton className="btn btn-primary w-full py-3" pendingText="Creating…">
          Create account <ArrowRight size={16} />
        </SubmitButton>
      </form>
      <p className="muted mt-6 text-center">
        Already registered?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="link">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
