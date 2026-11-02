"use server";
import { redirect } from "next/navigation";
import { get, run } from "../db";
import { requireUser } from "../auth";
import { notify } from "../notify";
import { inr, monthLabel, num, str } from "../format";

export async function applyForRoom(fd: FormData) {
  const tenant = await requireUser("tenant");
  const roomId = num(fd, "room_id");
  const back = `/rooms/${roomId}`;
  const room = await get<{ id: number; title: string; status: string; owner_id: number }>(
    "SELECT r.id, r.title, r.status, p.owner_id FROM rooms r JOIN properties p ON p.id = r.property_id WHERE r.id = ?",
    [roomId],
  );
  if (!room || room.status !== "vacant") redirect(`${back}?error=${encodeURIComponent("This room is not accepting applications.")}`);
  if (await get("SELECT id FROM applications WHERE room_id = ? AND tenant_id = ? AND status = 'pending'", [roomId, tenant.id])) {
    redirect(`/dashboard/applications?msg=${encodeURIComponent("You already applied for this room.")}`);
  }
  await run(
    "INSERT INTO applications (room_id, tenant_id, message, move_in_date, occupants, occupation) VALUES (?, ?, ?, ?, ?, ?)",
    [roomId, tenant.id, str(fd, "message"), str(fd, "move_in_date"), Math.max(1, num(fd, "occupants")), str(fd, "occupation")],
  );
  await notify(room.owner_id, {
    title: `New application for ${room.title}`,
    body: `from ${tenant.name}`,
    link: "/dashboard/applications",
    sms: true,
    actorId: tenant.id,
  });
  redirect(`/dashboard/applications?msg=${encodeURIComponent("Application sent! You will get an SMS when the owner responds.")}`);
}

export async function withdrawApplication(fd: FormData) {
  const tenant = await requireUser("tenant");
  await run(
    "UPDATE applications SET status = 'withdrawn', updated_at = datetime('now') WHERE id = ? AND tenant_id = ? AND status = 'pending'",
    [num(fd, "id"), tenant.id],
  );
  redirect("/dashboard/applications?msg=" + encodeURIComponent("Application withdrawn."));
}

export async function createRequest(fd: FormData) {
  const tenant = await requireUser("tenant");
  const t = await get<{ id: number; owner_id: number; title: string }>(
    `SELECT t.id, p.owner_id, r.title FROM tenancies t JOIN rooms r ON r.id = t.room_id JOIN properties p ON p.id = r.property_id
     WHERE t.id = ? AND t.tenant_id = ? AND t.active = 1`,
    [num(fd, "tenancy_id"), tenant.id],
  );
  const title = str(fd, "title");
  if (!t || !title) redirect("/dashboard/requests?error=" + encodeURIComponent("Describe the problem in the title."));
  await run("INSERT INTO service_requests (tenancy_id, category, title, description) VALUES (?, ?, ?, ?)", [
    t.id,
    str(fd, "category") || "Other",
    title,
    str(fd, "description"),
  ]);
  await notify(t.owner_id, {
    title: `New ${str(fd, "category").toLowerCase() || "service"} request: ${title}`,
    body: `${tenant.name}, ${t.title}`,
    link: "/dashboard/requests",
    sms: true,
    actorId: tenant.id,
  });
  redirect("/dashboard/requests?msg=" + encodeURIComponent("Request sent to your owner. You'll get an SMS on every update."));
}

export async function claimPayment(fd: FormData) {
  const tenant = await requireUser("tenant");
  const bill = await get<{ id: number; owner_id: number; period: string; total: number; title: string }>(
    `SELECT b.id, p.owner_id, b.period, b.total, r.title FROM bills b
     JOIN tenancies t ON t.id = b.tenancy_id JOIN rooms r ON r.id = t.room_id JOIN properties p ON p.id = r.property_id
     WHERE b.id = ? AND t.tenant_id = ? AND b.status = 'unpaid'`,
    [num(fd, "id"), tenant.id],
  );
  if (!bill) redirect("/dashboard/bills");
  const ref = str(fd, "payment_ref");
  await run("UPDATE bills SET status = 'claimed', payment_ref = ? WHERE id = ?", [ref, bill.id]);
  await notify(bill.owner_id, {
    title: `${tenant.name} paid ${inr(bill.total)} for ${monthLabel(bill.period)}`,
    body: ref ? `Ref: ${ref}. Please confirm.` : "Please confirm.",
    link: `/dashboard/bills/${bill.id}`,
    sms: true,
    actorId: tenant.id,
  });
  redirect(`/dashboard/bills/${bill.id}?msg=${encodeURIComponent("Thanks! The owner will confirm your payment.")}`);
}
