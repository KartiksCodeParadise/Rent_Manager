"use server";
import { redirect } from "next/navigation";
import { all, get, run } from "../db";
import { requireUser } from "../auth";
import { notify } from "../notify";
import { monthLabel, inr, num, str, today } from "../format";

const go = (path: string, msg?: string, error?: string): never => {
  const sep = path.includes("?") ? "&" : "?";
  if (error) redirect(`${path}${sep}error=${encodeURIComponent(error)}`);
  redirect(msg ? `${path}${sep}msg=${encodeURIComponent(msg)}` : path);
};

async function ownedProperty(ownerId: number, propertyId: number) {
  const p = await get<{ id: number; name: string }>(
    "SELECT id, name FROM properties WHERE id = ? AND owner_id = ?",
    [propertyId, ownerId],
  );
  if (!p) go("/dashboard/properties", undefined, "Property not found.");
  return p!;
}

async function ownedRoom(ownerId: number, roomId: number) {
  const r = await get<{ id: number; property_id: number; title: string; status: string; rent: number }>(
    `SELECT r.id, r.property_id, r.title, r.status, r.rent FROM rooms r
     JOIN properties p ON p.id = r.property_id WHERE r.id = ? AND p.owner_id = ?`,
    [roomId, ownerId],
  );
  if (!r) go("/dashboard/properties", undefined, "Room not found.");
  return r!;
}

/* ---------------- Properties & rooms ---------------- */

function propertyFields(fd: FormData) {
  return [
    str(fd, "name"),
    str(fd, "address"),
    str(fd, "city"),
    str(fd, "description"),
    num(fd, "electricity_rate"),
    num(fd, "water_charge"),
    num(fd, "maintenance_charge"),
  ];
}

export async function createProperty(fd: FormData) {
  const owner = await requireUser("owner");
  if (!str(fd, "name")) go("/dashboard/properties/new", undefined, "Give the property a name.");
  const { id } = await run(
    `INSERT INTO properties (name, address, city, description, electricity_rate, water_charge, maintenance_charge, owner_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [...propertyFields(fd), owner.id],
  );
  // Every property gets a residents group; approved tenants join it automatically.
  await run("INSERT INTO groups (owner_id, property_id, name, description) VALUES (?, ?, ?, ?)", [
    owner.id,
    id,
    `${str(fd, "name")} residents`,
    "Notices and chat for everyone living here.",
  ]);
  go(`/dashboard/properties/${id}`, "Property created. Now add rooms to it.");
}

export async function updateProperty(fd: FormData) {
  const owner = await requireUser("owner");
  const id = num(fd, "id");
  await ownedProperty(owner.id, id);
  await run(
    `UPDATE properties SET name = ?, address = ?, city = ?, description = ?, electricity_rate = ?, water_charge = ?, maintenance_charge = ?
     WHERE id = ?`,
    [...propertyFields(fd), id],
  );
  go(`/dashboard/properties/${id}`, "Property saved.");
}

export async function deleteProperty(fd: FormData) {
  const owner = await requireUser("owner");
  const id = num(fd, "id");
  await ownedProperty(owner.id, id);
  const rooms = await get<{ n: number }>("SELECT COUNT(*) n FROM rooms WHERE property_id = ?", [id]);
  if (rooms!.n > 0) go(`/dashboard/properties/${id}`, undefined, "Delete its rooms first.");
  await run("DELETE FROM groups WHERE property_id = ? AND owner_id = ?", [id, owner.id]);
  await run("DELETE FROM properties WHERE id = ?", [id]);
  go("/dashboard/properties", "Property deleted.");
}

function roomFields(fd: FormData) {
  const status = ["vacant", "occupied", "unlisted"].includes(str(fd, "status")) ? str(fd, "status") : "vacant";
  return [
    str(fd, "title"),
    str(fd, "room_type"),
    num(fd, "rent"),
    num(fd, "deposit"),
    Math.round(num(fd, "area_sqft")),
    str(fd, "furnishing"),
    str(fd, "amenities"),
    str(fd, "description"),
    status,
  ];
}

export async function createRoom(fd: FormData) {
  const owner = await requireUser("owner");
  const propertyId = num(fd, "property_id");
  await ownedProperty(owner.id, propertyId);
  if (!str(fd, "title")) go(`/dashboard/properties/${propertyId}`, undefined, "Give the room a title.");
  const { id } = await run(
    `INSERT INTO rooms (title, room_type, rent, deposit, area_sqft, furnishing, amenities, description, status, property_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [...roomFields(fd), propertyId],
  );
  go(`/dashboard/rooms/${id}`, "Room added. Upload some photos so tenants can see it.");
}

export async function updateRoom(fd: FormData) {
  const owner = await requireUser("owner");
  const id = num(fd, "id");
  await ownedRoom(owner.id, id);
  await run(
    `UPDATE rooms SET title = ?, room_type = ?, rent = ?, deposit = ?, area_sqft = ?, furnishing = ?, amenities = ?, description = ?, status = ?
     WHERE id = ?`,
    [...roomFields(fd), id],
  );
  go(`/dashboard/rooms/${id}`, "Room saved.");
}

export async function deleteRoom(fd: FormData) {
  const owner = await requireUser("owner");
  const room = await ownedRoom(owner.id, num(fd, "id"));
  const t = await get<{ n: number }>("SELECT COUNT(*) n FROM tenancies WHERE room_id = ?", [room.id]);
  if (t!.n > 0) go(`/dashboard/rooms/${room.id}`, undefined, "This room has tenancy history. Mark it as unlisted instead.");
  await run("DELETE FROM room_images WHERE room_id = ?", [room.id]);
  await run("DELETE FROM applications WHERE room_id = ?", [room.id]);
  await run("DELETE FROM rooms WHERE id = ?", [room.id]);
  go(`/dashboard/properties/${room.property_id}`, "Room deleted.");
}

export async function deleteImage(fd: FormData) {
  const owner = await requireUser("owner");
  const room = await ownedRoom(owner.id, num(fd, "room_id"));
  await run("DELETE FROM room_images WHERE id = ? AND room_id = ?", [num(fd, "image_id"), room.id]);
  go(`/dashboard/rooms/${room.id}`);
}

export async function makeCover(fd: FormData) {
  const owner = await requireUser("owner");
  const room = await ownedRoom(owner.id, num(fd, "room_id"));
  await run(
    "UPDATE room_images SET position = (SELECT COALESCE(MIN(position), 0) - 1 FROM room_images WHERE room_id = ?) WHERE id = ? AND room_id = ?",
    [room.id, num(fd, "image_id"), room.id],
  );
  go(`/dashboard/rooms/${room.id}`, "Cover photo updated.");
}

/* ---------------- Applications & tenancies ---------------- */

export async function decideApplication(fd: FormData) {
  const owner = await requireUser("owner");
  const appId = num(fd, "id");
  const decision = str(fd, "decision");
  const note = str(fd, "note");
  const app = await get<{
    id: number; room_id: number; tenant_id: number; status: string; move_in_date: string;
    room_title: string; room_status: string; rent: number; property_id: number;
  }>(
    `SELECT a.id, a.room_id, a.tenant_id, a.status, a.move_in_date, r.title room_title, r.status room_status, r.rent, r.property_id
     FROM applications a JOIN rooms r ON r.id = a.room_id JOIN properties p ON p.id = r.property_id
     WHERE a.id = ? AND p.owner_id = ?`,
    [appId, owner.id],
  );
  if (!app || app.status !== "pending") go("/dashboard/applications", undefined, "This application is no longer pending.");

  if (decision === "reject") {
    await run("UPDATE applications SET status = 'rejected', owner_note = ?, updated_at = datetime('now') WHERE id = ?", [note, appId]);
    await notify(app!.tenant_id, {
      title: `Application for ${app!.room_title} was declined`,
      body: note,
      link: "/dashboard/applications",
      sms: true,
      actorId: owner.id,
    });
    go("/dashboard/applications", "Application declined. The applicant has been notified.");
  }

  if (app!.room_status === "occupied") go("/dashboard/applications", undefined, "This room is already occupied.");

  await run("UPDATE applications SET status = 'approved', owner_note = ?, updated_at = datetime('now') WHERE id = ?", [note, appId]);
  await run("INSERT INTO tenancies (room_id, tenant_id, rent, start_date) VALUES (?, ?, ?, ?)", [
    app!.room_id,
    app!.tenant_id,
    app!.rent,
    app!.move_in_date || today(),
  ]);
  await run("UPDATE rooms SET status = 'occupied' WHERE id = ?", [app!.room_id]);

  // Join the property's groups so the new tenant gets notices.
  const groups = await all<{ id: number }>("SELECT id FROM groups WHERE property_id = ? AND owner_id = ?", [app!.property_id, owner.id]);
  for (const g of groups) {
    await run("INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)", [g.id, app!.tenant_id]);
  }

  await notify(app!.tenant_id, {
    title: `Application approved for ${app!.room_title}`,
    body: note || "Welcome! Your room is confirmed.",
    link: "/dashboard/home",
    sms: true,
    actorId: owner.id,
  });

  // Everyone else waiting on this room is told it is gone.
  const others = await all<{ id: number; tenant_id: number }>(
    "SELECT id, tenant_id FROM applications WHERE room_id = ? AND status = 'pending'",
    [app!.room_id],
  );
  if (others.length) {
    await run(
      "UPDATE applications SET status = 'rejected', owner_note = 'Room has been rented to another applicant', updated_at = datetime('now') WHERE room_id = ? AND status = 'pending'",
      [app!.room_id],
    );
    await notify(others.map((o) => o.tenant_id), {
      title: `${app!.room_title} is no longer available`,
      link: "/dashboard/applications",
      sms: true,
      actorId: owner.id,
    });
  }
  go("/dashboard/applications", "Approved! Tenant added and notified by SMS.");
}

export async function endTenancy(fd: FormData) {
  const owner = await requireUser("owner");
  const t = await get<{ id: number; room_id: number; tenant_id: number; property_id: number; title: string }>(
    `SELECT t.id, t.room_id, t.tenant_id, r.property_id, r.title FROM tenancies t
     JOIN rooms r ON r.id = t.room_id JOIN properties p ON p.id = r.property_id
     WHERE t.id = ? AND p.owner_id = ? AND t.active = 1`,
    [num(fd, "id"), owner.id],
  );
  if (!t) go("/dashboard/tenants", undefined, "Tenancy not found.");
  await run("UPDATE tenancies SET active = 0, end_date = ? WHERE id = ?", [str(fd, "end_date") || today(), t!.id]);
  await run("UPDATE rooms SET status = 'vacant' WHERE id = ?", [t!.room_id]);
  await run(
    "DELETE FROM group_members WHERE user_id = ? AND group_id IN (SELECT id FROM groups WHERE property_id = ? AND owner_id = ?)",
    [t!.tenant_id, t!.property_id, owner.id],
  );
  await notify(t!.tenant_id, { title: `Your tenancy at ${t!.title} has ended`, sms: true, actorId: owner.id });
  go("/dashboard/tenants", "Tenancy ended. The room is listed as vacant again.");
}

/* ---------------- Service requests ---------------- */

export async function updateRequest(fd: FormData) {
  const owner = await requireUser("owner");
  const status = str(fd, "status");
  if (!["open", "in_progress", "resolved"].includes(status)) go("/dashboard/requests");
  const req = await get<{ id: number; tenant_id: number; title: string }>(
    `SELECT s.id, t.tenant_id, s.title FROM service_requests s
     JOIN tenancies t ON t.id = s.tenancy_id JOIN rooms r ON r.id = t.room_id JOIN properties p ON p.id = r.property_id
     WHERE s.id = ? AND p.owner_id = ?`,
    [num(fd, "id"), owner.id],
  );
  if (!req) go("/dashboard/requests", undefined, "Request not found.");
  const note = str(fd, "note");
  await run("UPDATE service_requests SET status = ?, owner_note = ?, updated_at = datetime('now') WHERE id = ?", [status, note, req!.id]);
  await notify(req!.tenant_id, {
    title: `Request "${req!.title}" is now ${status.replace("_", " ")}`,
    body: note,
    link: "/dashboard/requests",
    sms: true,
    actorId: owner.id,
  });
  go("/dashboard/requests", "Request updated and tenant notified.");
}

/* ---------------- Bills ---------------- */

export async function generateBills(fd: FormData) {
  const owner = await requireUser("owner");
  const period = str(fd, "period");
  const due = str(fd, "due_date");
  const ids = fd.getAll("include").map(Number);
  if (!/^\d{4}-\d{2}$/.test(period) || !due) go("/dashboard/bills/generate", undefined, "Choose the billing month and due date.");
  if (!ids.length) go("/dashboard/bills/generate", undefined, "Tick at least one tenant.");

  let created = 0;
  let skipped = 0;
  for (const tid of ids) {
    const t = await get<{ id: number; tenant_id: number; rent: number; electricity_rate: number; title: string }>(
      `SELECT t.id, t.tenant_id, t.rent, p.electricity_rate, r.title FROM tenancies t
       JOIN rooms r ON r.id = t.room_id JOIN properties p ON p.id = r.property_id
       WHERE t.id = ? AND p.owner_id = ? AND t.active = 1`,
      [tid, owner.id],
    );
    if (!t) continue;
    if (await get("SELECT id FROM bills WHERE tenancy_id = ? AND period = ?", [tid, period])) {
      skipped++;
      continue;
    }
    const units = num(fd, `units_${tid}`);
    const rate = num(fd, `rate_${tid}`) || t.electricity_rate;
    const items: [string, number][] = [
      ["Rent", num(fd, `rent_${tid}`) || t.rent],
      [`Electricity (${units} units × ₹${rate})`, Math.round(units * rate * 100) / 100],
      ["Water", num(fd, `water_${tid}`)],
      ["Maintenance", num(fd, `maint_${tid}`)],
      [str(fd, `extra_label_${tid}`) || "Other charges", num(fd, `extra_${tid}`)],
    ];
    const lines = items.filter(([, amount]) => amount > 0);
    const total = lines.reduce((s, [, a]) => s + a, 0);
    const { id: billId } = await run(
      "INSERT INTO bills (tenancy_id, period, due_date, total, notes) VALUES (?, ?, ?, ?, ?)",
      [tid, period, due, total, str(fd, "notes")],
    );
    for (const [label, amount] of lines) {
      await run("INSERT INTO bill_items (bill_id, label, amount) VALUES (?, ?, ?)", [billId, label, amount]);
    }
    await notify(t.tenant_id, {
      title: `${monthLabel(period)} bill: ${inr(total)}`,
      body: `Due ${due}`,
      link: `/dashboard/bills/${billId}`,
      sms: true,
      actorId: owner.id,
    });
    created++;
  }
  go("/dashboard/bills", `${created} bill(s) created and sent.${skipped ? ` ${skipped} skipped (already billed for this month).` : ""}`);
}

async function ownedBill(ownerId: number, billId: number) {
  const b = await get<{ id: number; tenant_id: number; period: string; total: number }>(
    `SELECT b.id, t.tenant_id, b.period, b.total FROM bills b
     JOIN tenancies t ON t.id = b.tenancy_id JOIN rooms r ON r.id = t.room_id JOIN properties p ON p.id = r.property_id
     WHERE b.id = ? AND p.owner_id = ?`,
    [billId, ownerId],
  );
  if (!b) go("/dashboard/bills", undefined, "Bill not found.");
  return b!;
}

export async function setBillStatus(fd: FormData) {
  const owner = await requireUser("owner");
  const bill = await ownedBill(owner.id, num(fd, "id"));
  const paid = str(fd, "status") === "paid";
  await run("UPDATE bills SET status = ?, paid_at = ? WHERE id = ?", [
    paid ? "paid" : "unpaid",
    paid ? new Date().toISOString() : null,
    bill.id,
  ]);
  await notify(bill.tenant_id, {
    title: paid
      ? `Payment received for ${monthLabel(bill.period)} (${inr(bill.total)})`
      : `Payment for ${monthLabel(bill.period)} could not be confirmed`,
    link: `/dashboard/bills/${bill.id}`,
    sms: true,
    actorId: owner.id,
  });
  go(`/dashboard/bills/${bill.id}`, paid ? "Marked as paid." : "Marked as unpaid.");
}

export async function deleteBill(fd: FormData) {
  const owner = await requireUser("owner");
  const bill = await ownedBill(owner.id, num(fd, "id"));
  await run("DELETE FROM bill_items WHERE bill_id = ?", [bill.id]);
  await run("DELETE FROM bills WHERE id = ?", [bill.id]);
  go("/dashboard/bills", "Bill deleted.");
}
