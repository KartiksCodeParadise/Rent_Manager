import "server-only";
import { after } from "next/server";
import { all, run } from "./db";
import { sendSms } from "./sms";

const appUrl = () => (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

type Notice = {
  title: string;
  body?: string;
  /** Path inside the app, e.g. /dashboard/bills/4 */
  link?: string;
  /** Also send an SMS (if the user has a phone number and has not opted out). */
  sms?: boolean;
  /** Who caused this notice; used for the SMS outbox. */
  actorId?: number;
};

/** In-app notification (always) + SMS (optional) for one or more users. */
export async function notify(userIds: number | number[], n: Notice) {
  const ids = [...new Set(Array.isArray(userIds) ? userIds : [userIds])].filter(Boolean);
  if (!ids.length) return;

  for (const id of ids) {
    await run("INSERT INTO notifications (user_id, title, body, link) VALUES (?, ?, ?, ?)", [
      id,
      n.title,
      n.body ?? "",
      n.link ?? "",
    ]);
  }

  if (!n.sms) return;
  const placeholders = ids.map(() => "?").join(",");
  const recipients = await all<{ id: number; phone: string }>(
    `SELECT id, phone FROM users WHERE id IN (${placeholders}) AND phone != '' AND sms_opt_in = 1`,
    ids,
  );
  const text = `Rents Manager: ${n.title}${n.body ? ` - ${n.body}` : ""}${n.link ? ` ${appUrl()}${n.link}` : ""}`.slice(0, 450);

  // SMS gateways can be slow; send after the response so the page stays fast.
  after(async () => {
    for (const r of recipients) {
      await sendSms({ phone: r.phone, body: text, toUserId: r.id, triggeredBy: n.actorId });
    }
  });
}
