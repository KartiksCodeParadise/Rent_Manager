import Link from "next/link";
import { all } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { date, inr, monthLabel, today } from "@/lib/format";
import { Empty, Notice, PageHeader, StatusBadge } from "@/components/ui";

type Bill = {
  id: number; period: string; due_date: string; total: number; status: string;
  tenant_name: string; room_title: string; property_name: string;
};

const filters = [
  ["", "All"],
  ["unpaid", "Unpaid"],
  ["claimed", "To confirm"],
  ["paid", "Paid"],
];

export default async function BillsPage({ searchParams }: PageProps<"/dashboard/bills">) {
  const user = await requireUser();
  const sp = await searchParams;
  const isOwner = user.role === "owner";
  const status = typeof sp.status === "string" && ["unpaid", "claimed", "paid"].includes(sp.status) ? sp.status : "";

  const bills = await all<Bill>(
    `SELECT b.id, b.period, b.due_date, b.total, b.status, u.name tenant_name, r.title room_title, p.name property_name
     FROM bills b JOIN tenancies t ON t.id = b.tenancy_id JOIN rooms r ON r.id = t.room_id
     JOIN properties p ON p.id = r.property_id JOIN users u ON u.id = t.tenant_id
     WHERE ${isOwner ? "p.owner_id" : "t.tenant_id"} = ? ${status ? "AND b.status = ?" : ""}
     ORDER BY b.period DESC, b.id DESC LIMIT 300`,
    status ? [user.id, status] : [user.id],
  );
  const now = today();
  const due = bills.filter((b) => b.status !== "paid").reduce((s, b) => s + b.total, 0);

  return (
    <div>
      <PageHeader
        title={isOwner ? "Bills" : "Bills & payments"}
        subtitle={isOwner ? "Separate bill for every tenant: rent, electricity, water, maintenance." : `Outstanding: ${inr(due)}`}
        action={
          isOwner && (
            <Link href="/dashboard/bills/generate" className="btn btn-primary">
              Generate monthly bills
            </Link>
          )
        }
      />
      <Notice text={sp.msg as string} />
      <Notice text={sp.error as string} tone="error" />

      <div className="mb-4 flex gap-1">
        {filters.map(([value, label]) => (
          <Link
            key={value}
            href={value ? `/dashboard/bills?status=${value}` : "/dashboard/bills"}
            className={`rounded-full px-3 py-1 text-sm ${status === value ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {bills.length === 0 ? (
        <Empty
          title="No bills here"
          hint={isOwner ? "Generate this month's bills for all tenants in one go." : "Bills from your owner will appear here and by SMS."}
          href={isOwner ? "/dashboard/bills/generate" : undefined}
          cta={isOwner ? "Generate bills" : undefined}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                {isOwner && <th>Tenant</th>}
                <th>Room</th>
                <th>Amount</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td>
                    <Link href={`/dashboard/bills/${b.id}`} className="font-medium text-brand-600 hover:underline">
                      {monthLabel(b.period)}
                    </Link>
                  </td>
                  {isOwner && <td>{b.tenant_name}</td>}
                  <td>
                    {b.room_title}
                    <p className="text-xs text-slate-500">{b.property_name}</p>
                  </td>
                  <td className="font-medium">{inr(b.total)}</td>
                  <td>{date(b.due_date)}</td>
                  <td>
                    <StatusBadge status={b.status === "unpaid" && b.due_date < now ? "overdue" : b.status} />
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
