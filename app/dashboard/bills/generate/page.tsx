import Link from "next/link";
import { all } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { generateBills } from "@/lib/actions/owner";
import { inr, today } from "@/lib/format";
import { Empty, Field, Notice, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

export default async function GenerateBillsPage({ searchParams }: PageProps<"/dashboard/bills/generate">) {
  const owner = await requireUser("owner");
  const sp = await searchParams;
  const rows = await all<{
    id: number; rent: number; tenant_name: string; room_title: string; property_name: string;
    electricity_rate: number; water_charge: number; maintenance_charge: number;
  }>(
    `SELECT t.id, t.rent, u.name tenant_name, r.title room_title, p.name property_name,
       p.electricity_rate, p.water_charge, p.maintenance_charge
     FROM tenancies t JOIN rooms r ON r.id = t.room_id JOIN properties p ON p.id = r.property_id JOIN users u ON u.id = t.tenant_id
     WHERE p.owner_id = ? AND t.active = 1 ORDER BY p.name, r.title`,
    [owner.id],
  );

  const t = today();
  const period = t.slice(0, 7);
  const due = `${period}-10`;

  return (
    <div>
      <Link href="/dashboard/bills" className="text-sm text-brand-600 hover:underline">
        ← Bills
      </Link>
      <PageHeader
        title="Generate monthly bills"
        subtitle="Enter each tenant's electricity units. Charges come from the property defaults — change any value for a single tenant."
      />
      <Notice text={sp.error as string} tone="error" />
      {rows.length === 0 ? (
        <Empty title="No active tenants" hint="Bills can be created once you have approved tenants." />
      ) : (
        <form action={generateBills} className="space-y-5">
          <div className="card grid gap-4 p-5 sm:grid-cols-3">
            <Field label="Billing month">
              <input type="month" name="period" defaultValue={period} required className="input" />
            </Field>
            <Field label="Due date">
              <input type="date" name="due_date" defaultValue={due < t ? t : due} required className="input" />
            </Field>
            <Field label="Note on all bills (optional)">
              <input name="notes" placeholder="Pay by UPI before due date" className="input" />
            </Field>
          </div>

          <div className="space-y-3">
            {rows.map((r) => (
              <fieldset key={r.id} className="card p-4">
                <label className="flex items-center gap-3">
                  <input type="checkbox" name="include" value={r.id} defaultChecked className="h-4 w-4 accent-brand-600" />
                  <span className="font-medium">{r.tenant_name}</span>
                  <span className="muted">
                    {r.room_title} · {r.property_name}
                  </span>
                </label>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  <Field label="Rent ₹">
                    <input type="number" name={`rent_${r.id}`} defaultValue={r.rent} min={0} className="input" />
                  </Field>
                  <Field label="Units used">
                    <input type="number" name={`units_${r.id}`} defaultValue={0} min={0} step="0.1" className="input" />
                  </Field>
                  <Field label="₹ / unit">
                    <input type="number" name={`rate_${r.id}`} defaultValue={r.electricity_rate} min={0} step="0.01" className="input" />
                  </Field>
                  <Field label="Water ₹">
                    <input type="number" name={`water_${r.id}`} defaultValue={r.water_charge} min={0} className="input" />
                  </Field>
                  <Field label="Maintenance ₹">
                    <input type="number" name={`maint_${r.id}`} defaultValue={r.maintenance_charge} min={0} className="input" />
                  </Field>
                  <Field label="Other (label)">
                    <input name={`extra_label_${r.id}`} placeholder="Wi-Fi, gas…" className="input" />
                  </Field>
                  <Field label="Other ₹">
                    <input type="number" name={`extra_${r.id}`} defaultValue={0} min={0} className="input" />
                  </Field>
                </div>
                <p className="mt-2 text-xs text-slate-500">Base: {inr(r.rent + r.water_charge + r.maintenance_charge)} + electricity</p>
              </fieldset>
            ))}
          </div>
          <SubmitButton pendingText="Creating bills…">Create & send bills by SMS</SubmitButton>
        </form>
      )}
    </div>
  );
}
