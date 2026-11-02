import Link from "next/link";
import { all } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { decideApplication } from "@/lib/actions/owner";
import { withdrawApplication } from "@/lib/actions/tenant";
import { date, dateTime, inr, whatsappLink } from "@/lib/format";
import { Empty, Notice, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

type App = {
  id: number; room_id: number; room_title: string; rent: number; property_name: string;
  status: string; message: string; move_in_date: string; occupants: number; occupation: string;
  owner_note: string; created_at: string; updated_at: string;
  person_name: string; person_phone: string; person_email: string;
};

const steps = ["Submitted", "Reviewed by owner", "Decision"];

export default async function ApplicationsPage({ searchParams }: PageProps<"/dashboard/applications">) {
  const user = await requireUser();
  const sp = await searchParams;
  const isOwner = user.role === "owner";

  const apps = await all<App>(
    `SELECT a.*, r.title room_title, r.rent, p.name property_name,
       u.name person_name, u.phone person_phone, u.email person_email
     FROM applications a JOIN rooms r ON r.id = a.room_id JOIN properties p ON p.id = r.property_id
     JOIN users u ON u.id = ${isOwner ? "a.tenant_id" : "p.owner_id"}
     WHERE ${isOwner ? "p.owner_id" : "a.tenant_id"} = ?
     ORDER BY CASE a.status WHEN 'pending' THEN 0 ELSE 1 END, a.id DESC`,
    [user.id],
  );

  return (
    <div>
      <PageHeader
        title={isOwner ? "Applications" : "My applications"}
        subtitle={isOwner ? "Approve to create the tenancy, mark the room occupied and notify by SMS." : "Track the status of every room you applied for."}
      />
      <Notice text={sp.msg as string} />
      <Notice text={sp.error as string} tone="error" />

      {apps.length === 0 ? (
        isOwner ? (
          <Empty title="No applications yet" hint="When tenants apply for your vacant rooms they will show up here." />
        ) : (
          <Empty title="You haven't applied for any room" href="/rooms" cta="Browse rooms" />
        )
      ) : (
        <div className="space-y-4">
          {apps.map((a) => {
            const stage = a.status === "pending" ? 1 : 3;
            return (
              <div key={a.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/rooms/${a.room_id}`} className="font-semibold hover:text-brand-600">
                      {a.room_title}
                    </Link>
                    <p className="muted">
                      {a.property_name} · {inr(a.rent)}/mo
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>

                {!isOwner && a.status !== "withdrawn" && (
                  <ol className="mt-4 flex items-center gap-2 text-xs">
                    {steps.map((s, i) => (
                      <li key={s} className="flex flex-1 items-center gap-2">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-bold ${
                            i < stage ? (a.status === "rejected" && i === 2 ? "bg-red-500 text-white" : "bg-brand-600 text-white") : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className={i < stage ? "text-slate-700" : "text-slate-400"}>
                          {i === 2 && a.status !== "pending" ? (a.status === "approved" ? "Approved" : "Declined") : s}
                        </span>
                        {i < steps.length - 1 && <span className="h-px flex-1 bg-slate-200" />}
                      </li>
                    ))}
                  </ol>
                )}

                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-slate-500">{isOwner ? "Applicant" : "Owner"}:</span> {a.person_name}
                    {isOwner && a.person_phone && (
                      <>
                        {" · "}
                        <a href={`tel:${a.person_phone}`} className="text-brand-600 hover:underline">
                          {a.person_phone}
                        </a>
                        {" · "}
                        <a href={whatsappLink(a.person_phone, `Hi ${a.person_name}, about your application for ${a.room_title}…`)} target="_blank" className="text-emerald-600 hover:underline">
                          WhatsApp
                        </a>
                      </>
                    )}
                  </p>
                  <p>
                    <span className="text-slate-500">Move-in:</span> {date(a.move_in_date) || "—"} ·{" "}
                    <span className="text-slate-500">People:</span> {a.occupants}
                    {a.occupation && ` · ${a.occupation}`}
                  </p>
                  {a.message && <p className="sm:col-span-2 rounded-lg bg-slate-50 p-3 text-slate-700">“{a.message}”</p>}
                  {a.owner_note && (
                    <p className="sm:col-span-2">
                      <span className="text-slate-500">Owner note:</span> {a.owner_note}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 sm:col-span-2">
                    Applied {dateTime(a.created_at)}
                    {a.updated_at !== a.created_at && ` · updated ${dateTime(a.updated_at)}`}
                  </p>
                </div>

                {a.status === "pending" &&
                  (isOwner ? (
                    <form action={decideApplication} className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
                      <input type="hidden" name="id" value={a.id} />
                      <input name="note" placeholder="Optional note sent with SMS (e.g. visit timing, documents)" className="input flex-1" />
                      <div className="flex gap-2">
                        <SubmitButton name="decision" value="approve" pendingText="…">
                          Approve
                        </SubmitButton>
                        <SubmitButton name="decision" value="reject" className="btn btn-danger" pendingText="…" confirm="Decline this application?">
                          Decline
                        </SubmitButton>
                      </div>
                    </form>
                  ) : (
                    <form action={withdrawApplication} className="mt-4 border-t border-slate-100 pt-4">
                      <input type="hidden" name="id" value={a.id} />
                      <SubmitButton className="btn btn-secondary btn-sm" confirm="Withdraw this application?">
                        Withdraw
                      </SubmitButton>
                    </form>
                  ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
