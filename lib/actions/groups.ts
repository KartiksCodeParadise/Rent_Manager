"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { all, get, run } from "../db";
import { requireUser } from "../auth";
import { canAccessGroup } from "../groups";
import { notify } from "../notify";
import { num, str } from "../format";

async function ownedGroup(ownerId: number, groupId: number) {
  const g = await get<{ id: number; name: string }>("SELECT id, name FROM groups WHERE id = ? AND owner_id = ?", [groupId, ownerId]);
  if (!g) redirect("/dashboard/groups?error=" + encodeURIComponent("Group not found."));
  return g;
}

export async function createGroup(fd: FormData) {
  const owner = await requireUser("owner");
  const name = str(fd, "name");
  if (!name) redirect("/dashboard/groups?error=" + encodeURIComponent("Give the group a name."));
  const propertyId = num(fd, "property_id");
  if (propertyId && !(await get("SELECT id FROM properties WHERE id = ? AND owner_id = ?", [propertyId, owner.id]))) {
    redirect("/dashboard/groups");
  }
  const { id } = await run("INSERT INTO groups (owner_id, property_id, name, description) VALUES (?, ?, ?, ?)", [
    owner.id,
    propertyId || null,
    name,
    str(fd, "description"),
  ]);
  if (propertyId) {
    // Pre-fill with everyone currently living in that property.
    await run(
      `INSERT OR IGNORE INTO group_members (group_id, user_id)
       SELECT ?, t.tenant_id FROM tenancies t JOIN rooms r ON r.id = t.room_id WHERE r.property_id = ? AND t.active = 1`,
      [id, propertyId],
    );
  }
  redirect(`/dashboard/groups/${id}`);
}

export async function deleteGroup(fd: FormData) {
  const owner = await requireUser("owner");
  const g = await ownedGroup(owner.id, num(fd, "id"));
  await run("DELETE FROM group_messages WHERE group_id = ?", [g.id]);
  await run("DELETE FROM group_members WHERE group_id = ?", [g.id]);
  await run("DELETE FROM groups WHERE id = ?", [g.id]);
  redirect("/dashboard/groups?msg=" + encodeURIComponent("Group deleted."));
}

export async function addMember(fd: FormData) {
  const owner = await requireUser("owner");
  const g = await ownedGroup(owner.id, num(fd, "group_id"));
  const userId = num(fd, "user_id");
  // Only people who rent (or rented) from this owner can be added.
  const ok = await get(
    `SELECT 1 FROM tenancies t JOIN rooms r ON r.id = t.room_id JOIN properties p ON p.id = r.property_id
     WHERE t.tenant_id = ? AND p.owner_id = ?`,
    [userId, owner.id],
  );
  if (ok) await run("INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)", [g.id, userId]);
  redirect(`/dashboard/groups/${g.id}`);
}

export async function removeMember(fd: FormData) {
  const owner = await requireUser("owner");
  const g = await ownedGroup(owner.id, num(fd, "group_id"));
  await run("DELETE FROM group_members WHERE group_id = ? AND user_id = ?", [g.id, num(fd, "user_id")]);
  redirect(`/dashboard/groups/${g.id}`);
}

export async function postMessage(fd: FormData) {
  const user = await requireUser();
  const groupId = num(fd, "group_id");
  const body = str(fd, "body");
  if (!body || !(await canAccessGroup(user, groupId))) return;
  const g = await get<{ owner_id: number; name: string }>("SELECT owner_id, name FROM groups WHERE id = ?", [groupId]);
  const announce = user.role === "owner" && g!.owner_id === user.id && !!fd.get("announce");

  await run("INSERT INTO group_messages (group_id, sender_id, body, is_announcement) VALUES (?, ?, ?, ?)", [
    groupId,
    user.id,
    body.slice(0, 2000),
    announce ? 1 : 0,
  ]);

  if (announce) {
    const members = await all<{ user_id: number }>("SELECT user_id FROM group_members WHERE group_id = ?", [groupId]);
    await notify(
      members.map((m) => m.user_id),
      { title: `Notice (${g!.name})`, body: body.slice(0, 300), link: `/dashboard/groups/${groupId}`, sms: true, actorId: user.id },
    );
  }
  revalidatePath(`/dashboard/groups/${groupId}`);
}
