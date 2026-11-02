import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { all, get } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deleteBill, setBillStatus } from "@/lib/actions/owner";
import { claimPayment } from "@/lib/actions/tenant";
import { date, dateTime, inr, monthLabel, today, whatsappLink } from "@/lib/format";
import { Field, Notice, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

export default async function BillPage({ params, searchParams }: PageProps<"/dashboard/bills/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  const isOwner = user.role === "owner";

  const bill = await get<{
    id: number; period: string; due_date: string; total: number; status: string; payment_ref: string; notes: string;
    paid_at: string | null; created_at: string; room_title: string; property_name: string; address: string;
    tenant_name: string; tenant_phone: string; owner_name: string; owner_upi: string;
  }>(
    `SELECT b.*, r.title room_title, p.name property_name, p.address, u.name tenant_name, u.phone tenant_phone,
       o.name owner_name, o.upi_id owner_upi
     FROM bills b JOIN tenancies t ON t.id = b.tenancy_id JOIN rooms r ON r.id = t.room_id
     JOIN properties p ON p.id = r.property_id JOIN users u ON u.id = t.tenant_id JOIN users o ON o.id = p.owner_id
     WHERE b.id = ? AND ${isOwner ? "p.owner_id" : "t.tenant_id"} = ?`,
    [Number(id), user.id],
  );
  if (!bill) notFound();
  const items = await all<{ id: number; label: string; amount: number }>("SELECT * FROM bill_items WHERE bill_id = ? ORDER BY id", [bill.id]);

  // UPI deep link works with every Indian UPI app (GPay, PhonePe, Paytm, BHIM) at zero cost.
  const upiLink = bill.owner_upi
    ? `upi://pay?${new URLSearchParams({
        pa: bill.owner_upi,
        pn: bill.owner_name,
        am: bill.total.toFixed(2),
        cu: "INR",
        tn: `Rent ${bill.period} ${bill.room_title}`.slice(0, 50),
      })}`
    : "";
  const qr = upiLink && !isOwner && bill.status === "unpaid" ? await QRCode.toDataURL(upiLink, { margin: 1, width: 220 }) : "";
  const shownStatus = bill.status === "unpaid" && bill.due_date < today() ? "overdue" : bill.status;
  const reminder = `Hi ${bill.tenant_name}, your ${monthLabel(bill.period)} bill of ${inr(bill.total)} for ${bill.room_title} is due on ${date(bill.due_date)}.`;

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/bills" className="text-sm text-brand-600 hover:underline">
        ← Bills
      </Link>
      <div className="mt-3">
        <Notice text={sp.msg as string} />
      </div>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Bill #{bill.id}</p>
            <h1 className="h1">{monthLabel(bill.period)}</h1>
            <p className="muted mt-1">
              {bill.room_title} · {bill.property_name}
              {bill.address && `, ${bill.address}`}
            </p>
          </div>
          <StatusBadge status={shownStatus} />
        </div>

        <div className="mt-5 grid gap-1 text-sm sm:grid-cols-2">
          <p><span className="text-slate-500">Tenant:</span> {bill.tenant_name}</p>
          <p><span className="text-slate-500">Owner:</span> {bill.owner_name}</p>
          <p><span className="text-slate-500">Issued:</span> {dateTime(bill.created_at)}</p>
          <p><span className="text-slate-500">Due:</span> {date(bill.due_date)}</p>
        </div>

        <table className="table mt-5">
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>{i.label}</td>
                <td className="text-right">{inr(i.amount)}</td>
              </tr>
            ))}
            <tr>
              <td className="font-semibold">Total</td>
              <td className="text-right text-lg font-bold">{inr(bill.total)}</td>
            </tr>
          </tbody>
        </table>
        {bill.notes && <p className="mt-3 text-sm text-slate-600">{bill.notes}</p>}
        {bill.payment_ref && (
          <p className="mt-3 text-sm"><span className="text-slate-500">Payment reference (UTR):</span> {bill.payment_ref}</p>
        )}
        {bill.paid_at && <p className="mt-1 text-sm text-emerald-700">Paid on {dateTime(bill.paid_at)}</p>}
      </div>

      {!isOwner && bill.status === "unpaid" && (
        <div className="card mt-5 p-6">
          <h2 className="font-semibold">Pay {inr(bill.total)}</h2>
          {upiLink ? (
            <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="UPI QR code" className="h-44 w-44 rounded-xl border border-slate-200" />
              <div className="space-y-2 text-sm">
                <p>Scan with any UPI app, or on your phone tap:</p>
                <a href={upiLink} className="btn btn-primary">Pay with UPI app</a>
                <p className="text-slate-500">UPI ID: {bill.owner_upi}</p>
              </div>
            </div>
          ) : (
            <p className="muted mt-2">Your owner has not added a UPI ID yet. Pay them directly, then confirm below.</p>
          )}
          <form action={claimPayment} className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-end">
            <input type="hidden" name="id" value={bill.id} />
            <div className="flex-1">
              <Field label="After paying, enter the UPI reference / UTR (or 'cash')">
                <input name="payment_ref" required placeholder="e.g. 412345678901" className="input" />
              </Field>
            </div>
            <SubmitButton pendingText="Sending…">I have paid</SubmitButton>
          </form>
        </div>
      )}

      {isOwner && (
        <div className="card mt-5 flex flex-wrap items-center gap-2 p-5">
          {bill.status !== "paid" ? (
            <form action={setBillStatus}>
              <input type="hidden" name="id" value={bill.id} />
              <input type="hidden" name="status" value="paid" />
              <SubmitButton>{bill.status === "claimed" ? "Confirm payment received" : "Mark as paid (cash / other)"}</SubmitButton>
            </form>
          ) : (
            <form action={setBillStatus}>
              <input type="hidden" name="id" value={bill.id} />
              <input type="hidden" name="status" value="unpaid" />
              <SubmitButton className="btn btn-secondary">Mark as unpaid</SubmitButton>
            </form>
          )}
          {bill.status === "claimed" && (
            <form action={setBillStatus}>
              <input type="hidden" name="id" value={bill.id} />
              <input type="hidden" name="status" value="unpaid" />
              <SubmitButton className="btn btn-secondary" confirm="Reject this payment claim? The tenant will be told by SMS.">
                Not received
              </SubmitButton>
            </form>
          )}
          {bill.status !== "paid" && bill.tenant_phone && (
            <a href={whatsappLink(bill.tenant_phone, reminder)} target="_blank" className="btn btn-secondary">
              Send WhatsApp reminder
            </a>
          )}
          <form action={deleteBill} className="ml-auto">
            <input type="hidden" name="id" value={bill.id} />
            <SubmitButton className="btn btn-danger btn-sm" confirm="Delete this bill?">Delete</SubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}
