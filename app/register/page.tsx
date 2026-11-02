import Link from "next/link";
import { redirect } from "next/navigation";
import { register } from "@/lib/actions/auth";
import { currentUser } from "@/lib/auth";
import { Field, Notice } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  if (await currentUser()) redirect("/dashboard");
  const sp = await searchParams;
  const role = sp.role === "owner" ? "owner" : "tenant";
  const next = typeof sp.next === "string" ? sp.next : "/dashboard";

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="card p-6">
        <h1 className="h1">Create your account</h1>
        <p className="muted mt-1">Free forever. Takes under a minute.</p>
        <div className="mt-5">
          <Notice text={typeof sp.error === "string" ? sp.error : undefined} tone="error" />
        </div>
        <form action={register} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <fieldset>
            <legend className="label">I am a…</legend>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["tenant", "Tenant", "Looking for a room"],
                ["owner", "Owner", "I have rooms to rent"],
              ].map(([value, label, hint]) => (
                <label
                  key={value}
                  className="flex cursor-pointer flex-col rounded-xl border border-slate-300 p-3 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50"
                >
                  <input type="radio" name="role" value={value} defaultChecked={role === value} className="sr-only" />
                  <span className="font-medium">{label}</span>
                  <span className="text-xs text-slate-500">{hint}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Full name">
            <input name="name" required autoComplete="name" className="input" />
          </Field>
          <Field label="Mobile number" hint="Status updates are sent here by SMS.">
            <input name="phone" type="tel" required placeholder="98765 43210" autoComplete="tel" className="input" />
          </Field>
          <Field label="Email">
            <input type="email" name="email" required autoComplete="email" className="input" />
          </Field>
          <Field label="Password">
            <input type="password" name="password" required minLength={6} autoComplete="new-password" className="input" />
          </Field>
          <SubmitButton className="btn btn-primary w-full" pendingText="Creating…">
            Create account
          </SubmitButton>
        </form>
        <p className="muted mt-5 text-center">
          Already registered?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
