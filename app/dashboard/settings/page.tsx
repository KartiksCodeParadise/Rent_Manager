import { requireUser } from "@/lib/auth";
import { updateProfile } from "@/lib/actions/auth";
import { Field, Notice, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

export default async function SettingsPage({ searchParams }: PageProps<"/dashboard/settings">) {
  const user = await requireUser();
  const sp = await searchParams;
  return (
    <div className="max-w-xl">
      <PageHeader title="Settings" subtitle={user.email} />
      <Notice text={sp.msg as string} />
      <Notice text={sp.error as string} tone="error" />
      <form action={updateProfile} className="card space-y-4 p-5">
        <Field label="Name">
          <input name="name" defaultValue={user.name} className="input" />
        </Field>
        <Field label="Mobile number" hint="All SMS updates go to this number.">
          <input name="phone" type="tel" defaultValue={user.phone} className="input" />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="sms_opt_in" defaultChecked={!!user.sms_opt_in} className="accent-brand-600" />
          Send me SMS updates
        </label>
        {user.role === "owner" && (
          <Field label="Your UPI ID" hint="Tenants see a UPI QR code and pay button on every bill (e.g. yourname@okaxis).">
            <input name="upi_id" defaultValue={user.upi_id} placeholder="name@bank" className="input" />
          </Field>
        )}
        <Field label="New password" hint="Leave blank to keep your current password.">
          <input name="new_password" type="password" minLength={6} autoComplete="new-password" className="input" />
        </Field>
        <SubmitButton>Save</SubmitButton>
      </form>
    </div>
  );
}
