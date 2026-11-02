import Link from "next/link";
import { all } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createGroup } from "@/lib/actions/groups";
import { dateTime } from "@/lib/format";
import { Empty, Field, Notice, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

export default async function GroupsPage({ searchParams }: PageProps<"/dashboard/groups">) {
  const user = await requireUser();
  const sp = await searchParams;
  const isOwner = user.role === "owner";

  const groups = await all<{ id: number; name: string; description: string; members: number; last_body: string | null; last_at: string | null }>(
    `SELECT g.id, g.name, g.description,
       (SELECT COUNT(*) FROM group_members m WHERE m.group_id = g.id) members,
       (SELECT body FROM group_messages gm WHERE gm.group_id = g.id ORDER BY gm.id DESC LIMIT 1) last_body,
       (SELECT created_at FROM group_messages gm WHERE gm.group_id = g.id ORDER BY gm.id DESC LIMIT 1) last_at
     FROM groups g
     WHERE ${isOwner ? "g.owner_id = ?" : "g.id IN (SELECT group_id FROM group_members WHERE user_id = ?)"}
     ORDER BY COALESCE(last_at, g.created_at) DESC`,
    [user.id],
  );
  const properties = isOwner ? await all<{ id: number; name: string }>("SELECT id, name FROM properties WHERE owner_id = ?", [user.id]) : [];

  return (
    <div>
      <PageHeader
        title="Groups & notices"
        subtitle={isOwner ? "Chat with tenants and send notices. Notices also go out by SMS." : "Notices and chat from your building."}
      />
      <Notice text={sp.msg as string} />
      <Notice text={sp.error as string} tone="error" />

      {groups.length === 0 ? (
        <Empty
          title="No groups yet"
          hint={isOwner ? "A residents group is created automatically for each property. You can also create your own below." : "You'll be added to your building's group once your application is approved."}
        />
      ) : (
        <div className="card divide-y divide-slate-100">
          {groups.map((g) => (
            <Link key={g.id} href={`/dashboard/groups/${g.id}`} className="block p-4 hover:bg-slate-50">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{g.name}</p>
                <span className="text-xs text-slate-400">{g.members} members</span>
              </div>
              <p className="muted truncate">{g.last_body ?? g.description}</p>
              {g.last_at && <p className="text-xs text-slate-400">{dateTime(g.last_at)}</p>}
            </Link>
          ))}
        </div>
      )}

      {isOwner && (
        <details className="card mt-6 p-5">
          <summary className="cursor-pointer font-semibold">+ Create a group</summary>
          <form action={createGroup} className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Group name">
              <input name="name" required placeholder="Floor 2 residents" className="input" />
            </Field>
            <Field label="Link to property (adds its current tenants)">
              <select name="property_id" className="input">
                <option value="">None — I'll add members myself</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <input name="description" className="input" />
              </Field>
            </div>
            <div>
              <SubmitButton>Create group</SubmitButton>
            </div>
          </form>
        </details>
      )}
    </div>
  );
}
