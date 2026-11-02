import Link from "next/link";
import { notFound } from "next/navigation";
import { all, get } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canAccessGroup } from "@/lib/groups";
import { addMember, deleteGroup, postMessage, removeMember } from "@/lib/actions/groups";
import { Megaphone } from "lucide-react";
import { dateTime } from "@/lib/format";
import { AutoRefresh } from "@/components/AutoRefresh";
import { SubmitButton } from "@/components/SubmitButton";

export default async function GroupPage({ params }: PageProps<"/dashboard/groups/[id]">) {
  const user = await requireUser();
  const groupId = Number((await params).id);
  if (!(await canAccessGroup(user, groupId))) notFound();

  const group = (await get<{ id: number; name: string; description: string; owner_id: number; owner_name: string }>(
    "SELECT g.id, g.name, g.description, g.owner_id, u.name owner_name FROM groups g JOIN users u ON u.id = g.owner_id WHERE g.id = ?",
    [groupId],
  ))!;
  const isOwner = group.owner_id === user.id;

  const messages = await all<{ id: number; body: string; is_announcement: number; created_at: string; sender_id: number; sender_name: string; sender_role: string }>(
    `SELECT * FROM (
       SELECT m.id, m.body, m.is_announcement, m.created_at, m.sender_id, u.name sender_name, u.role sender_role
       FROM group_messages m JOIN users u ON u.id = m.sender_id WHERE m.group_id = ? ORDER BY m.id DESC LIMIT 100
     ) ORDER BY id`,
    [groupId],
  );
  const members = await all<{ id: number; name: string; phone: string }>(
    "SELECT u.id, u.name, u.phone FROM group_members m JOIN users u ON u.id = m.user_id WHERE m.group_id = ? ORDER BY u.name",
    [groupId],
  );
  const candidates = isOwner
    ? await all<{ id: number; name: string }>(
        `SELECT DISTINCT u.id, u.name FROM tenancies t JOIN rooms r ON r.id = t.room_id JOIN properties p ON p.id = r.property_id
         JOIN users u ON u.id = t.tenant_id
         WHERE p.owner_id = ? AND t.active = 1 AND u.id NOT IN (SELECT user_id FROM group_members WHERE group_id = ?) ORDER BY u.name`,
        [user.id, groupId],
      )
    : [];

  return (
    <div>
      <AutoRefresh seconds={8} />
      <Link href="/dashboard/groups" className="text-sm text-brand-600 hover:underline">
        ← Groups
      </Link>
      <div className="mt-2 grid gap-6 lg:grid-cols-[1fr_260px]">
        <section className="card flex h-[70vh] flex-col">
          <header className="border-b border-slate-100 p-4">
            <h1 className="font-semibold">{group.name}</h1>
            <p className="muted">{group.description || `${members.length} members`}</p>
          </header>
          <div className="flex flex-1 flex-col-reverse overflow-y-auto p-4">
            <div className="space-y-3">
              {messages.length === 0 && <p className="muted text-center">No messages yet. Say hello!</p>}
              {messages.map((m) => {
                const mine = m.sender_id === user.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] animate-fade-up rounded-2xl px-4 py-2 text-sm ${
                        m.is_announcement
                          ? "border border-marigold-200 bg-marigold-50 text-slate-900"
                          : mine
                            ? "rounded-br-md bg-brand-700 text-white"
                            : "rounded-bl-md bg-slate-100 text-slate-800"
                      }`}
                    >
                      {m.is_announcement ? <p className="mb-1 flex items-center gap-1 text-xs font-bold tracking-wide uppercase"><Megaphone size={13} /> Notice</p> : null}
                      {!mine && (
                        <p className="text-xs font-semibold opacity-70">
                          {m.sender_name}
                          {m.sender_role === "owner" && " (owner)"}
                        </p>
                      )}
                      <p className="whitespace-pre-line">{m.body}</p>
                      <p className={`mt-1 text-[10px] ${mine && !m.is_announcement ? "text-white/70" : "text-slate-400"}`}>{dateTime(m.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <form action={postMessage} className="border-t border-slate-100 p-3">
            <input type="hidden" name="group_id" value={groupId} />
            <div className="flex gap-2">
              <textarea name="body" required rows={1} placeholder="Write a message…" className="input flex-1 resize-none" />
              <SubmitButton pendingText="…">Send</SubmitButton>
            </div>
            {isOwner && (
              <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" name="announce" className="accent-brand-600" />
                Send as notice — every member also gets an SMS
              </label>
            )}
          </form>
        </section>

        <aside className="card h-fit p-4">
          <h2 className="font-semibold">Members ({members.length})</h2>
          <p className="muted">Owner: {group.owner_name}</p>
          <ul className="mt-3 space-y-2 text-sm">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2">
                <span>{m.name}</span>
                {isOwner && (
                  <form action={removeMember}>
                    <input type="hidden" name="group_id" value={groupId} />
                    <input type="hidden" name="user_id" value={m.id} />
                    <button className="text-xs text-red-500 hover:underline">Remove</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
          {isOwner && candidates.length > 0 && (
            <form action={addMember} className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
              <input type="hidden" name="group_id" value={groupId} />
              <select name="user_id" className="input py-1 text-xs">
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button className="btn btn-secondary btn-sm">Add</button>
            </form>
          )}
          {isOwner && (
            <form action={deleteGroup} className="mt-4 border-t border-slate-100 pt-4">
              <input type="hidden" name="id" value={groupId} />
              <SubmitButton className="btn btn-danger btn-sm" confirm="Delete this group and all its messages?">
                Delete group
              </SubmitButton>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
