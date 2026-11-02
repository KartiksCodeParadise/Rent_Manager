import { all } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { smsProvider } from "@/lib/sms";
import { dateTime } from "@/lib/format";
import { Empty, PageHeader, StatusBadge } from "@/components/ui";

export default async function SmsOutboxPage() {
  const owner = await requireUser("owner");
  const rows = await all<{ id: number; to_phone: string; body: string; provider: string; status: string; error: string; created_at: string; name: string | null }>(
    `SELECT s.*, u.name FROM sms_log s LEFT JOIN users u ON u.id = s.to_user_id
     WHERE s.triggered_by = ?1 OR s.to_user_id = ?1 ORDER BY s.id DESC LIMIT 200`,
    [owner.id],
  );

  return (
    <div>
      <PageHeader title="SMS outbox" subtitle="Every SMS sent to or caused by you." />
      <div className={`mb-5 rounded-xl p-4 text-sm ${smsProvider === "log" ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-900"}`}>
        {smsProvider === "log" ? (
          <>
            <b>Test mode:</b> SMS are recorded here but not delivered. To send real SMS for free, install the textbee.dev app on a
            spare Android phone and set <code>SMS_PROVIDER=textbee</code> (see README).
          </>
        ) : (
          <>
            Sending through <b>{smsProvider}</b>.
          </>
        )}
      </div>
      {rows.length === 0 ? (
        <Empty title="No SMS yet" hint="SMS are sent when applications, requests, bills or notices change." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>To</th>
                <th>Message</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap text-xs text-slate-500">{dateTime(r.created_at)}</td>
                  <td className="whitespace-nowrap">
                    {r.name ?? "—"}
                    <p className="text-xs text-slate-500">{r.to_phone}</p>
                  </td>
                  <td className="max-w-md text-slate-700">
                    {r.body}
                    {r.error && <p className="mt-1 text-xs text-red-600">{r.error}</p>}
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
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
