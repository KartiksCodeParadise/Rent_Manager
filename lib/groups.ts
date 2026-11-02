import "server-only";
import { get } from "./db";
import type { User } from "./auth";

/** Owners and members can see / post in a group. */
export async function canAccessGroup(user: User, groupId: number) {
  const g = await get<{ owner_id: number }>("SELECT owner_id FROM groups WHERE id = ?", [groupId]);
  if (!g) return false;
  if (g.owner_id === user.id) return true;
  return !!(await get("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?", [groupId, user.id]));
}
