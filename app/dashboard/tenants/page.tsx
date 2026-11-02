import Link from "next/link";
import { all } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { endTenancy } from "@/lib/actions/owner";
import { date, inr, today, whatsappLink } from "@/lib/format";
import { Empty, Notice, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

export default async function TenantsPage({ searchParams }: PageProps<"/dashboard/tenants">) {
  const owner = await requireUser("owner");
  const sp = await searchParams;
  const rows = await all<{
    id: number; rent: number; start_date: string; room_id: number; room_title: string; property_name: string;
    name: string; phone: string; email: string; due: number;
  }>(
    `SELECT t.id, t.rent, t.start_date, r.id room_id, r.title room_title, p.name property_name, u.name, u.phone, u.email,
       (SELECT COALESCE(SUM(b.total), 0) FROM bills b WHERE b.tenancy_id = t.id AND b.status != 'paid') due
     FROM tenancies t JOIN rooms r ON r.id = t.room_id JOIN properties p ON p.id = r.property_id JOIN users u ON u.id = t.tenant_id
     WHERE p.owner_id = ? AND t.active = 1 ORDER BY p.name, r.title`,
    [owner.id],
  );

  return (
    <div>
      <PageHeader
        title="Tenants"
        subtitle="Everyone currently renting from you."
        action={
          rows.length > 0 && (
            <Link href="/dashboard/bills/generate" className="btn btn-primary">
              Generate monthly bills
            </Link>
          )
        }
      />
      <Notice text={sp.msg as string} />
      <Notice text={sp.error as string} tone="error" />
      {rows.length === 0 ? (
        <Empty title="No tenants yet" hint="Approve an application and the tenant appears here." href="/dashboard/applications" cta="View applications" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Room</th>
                <th>Rent</th>
                <th>Since</th>
                <th>Dues</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-slate-500">
                      <a href={`tel:${t.phone}`} className="hover:underline">{t.phone}</a> ·{" "}
                      <a href={whatsappLink(t.phone)} target="_blank" className="text-emerald-600 hover:underline">WhatsApp</a>
                    </p>
                  </td>
                  <td>
                    {t.room_title}
                    <p className="text-xs text-slate-500">{t.property_name}</p>
                  </td>
                  <td>{inr(t.rent)}</td>
                  <td>{date(t.start_date)}</td>
                  <td className={t.due > 0 ? "font-medium text-red-600" : "text-slate-500"}>{inr(t.due)}</td>
                  <td>
                    <form action={endTenancy} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={t.id} />
                      <input type="date" name="end_date" defaultValue={today()} className="input w-36 py-1 text-xs" />
                      <SubmitButton className="btn btn-danger btn-sm" confirm={`End ${t.name}'s tenancy? The room becomes vacant again.`}>
                        Move out
                      </SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
