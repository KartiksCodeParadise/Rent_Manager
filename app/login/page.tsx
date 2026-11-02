import Link from "next/link";
import { redirect } from "next/navigation";
import { login } from "@/lib/actions/auth";
import { currentUser } from "@/lib/auth";
import { Field, Notice } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await currentUser()) redirect("/dashboard");
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/dashboard";

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="card p-6">
        <h1 className="h1">Welcome back</h1>
        <p className="muted mt-1">Log in to manage your rooms, bills and requests.</p>
        <div className="mt-5">
          <Notice text={typeof sp.error === "string" ? sp.error : undefined} tone="error" />
        </div>
        <form action={login} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <Field label="Email">
            <input type="email" name="email" required autoComplete="email" className="input" />
          </Field>
          <Field label="Password">
            <input type="password" name="password" required autoComplete="current-password" className="input" />
          </Field>
          <SubmitButton className="btn btn-primary w-full" pendingText="Logging in…">
            Log in
          </SubmitButton>
        </form>
        <p className="muted mt-5 text-center">
          New here?{" "}
          <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-medium text-brand-600 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
