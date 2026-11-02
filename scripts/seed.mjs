// Fills the database with demo data: `npm run seed`
// Demo logins (password for both: demo1234)
//   owner@demo.test  ·  tenant@demo.test
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { mkdirSync } from "node:fs";
import { schema } from "../lib/schema.mjs";

const url = process.env.TURSO_DATABASE_URL || "file:data/local.db";
if (url.startsWith("file:")) mkdirSync("data", { recursive: true });
const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined });
await db.executeMultiple(schema);

if ((await db.execute("SELECT id FROM users WHERE email = 'owner@demo.test'")).rows.length) {
  console.log("Demo data already present.");
  process.exit(0);
}

const exec = async (sql, args = []) => Number((await db.execute({ sql, args })).lastInsertRowid);
const hash = await bcrypt.hash("demo1234", 10);

const owner = await exec(
  "INSERT INTO users (name, email, phone, password_hash, role, upi_id) VALUES (?, ?, ?, ?, 'owner', ?)",
  ["Ramesh Sharma", "owner@demo.test", "9876500001", hash, "ramesh@okaxis"],
);
const tenant = await exec(
  "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'tenant')",
  ["Priya Verma", "tenant@demo.test", "9876500002", hash],
);
const seeker = await exec(
  "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'tenant')",
  ["Arjun Mehta", "arjun@demo.test", "9876500003", hash],
);

const prop = await exec(
  `INSERT INTO properties (owner_id, name, address, city, description, electricity_rate, water_charge, maintenance_charge)
   VALUES (?, ?, ?, ?, ?, 9, 200, 500)`,
  [owner, "Sunrise Residency", "Lane 4, Kothrud", "Pune", "Quiet building near the metro station. 24×7 water, lift, CCTV."],
);
const group = await exec("INSERT INTO groups (owner_id, property_id, name, description) VALUES (?, ?, ?, ?)", [
  owner, prop, "Sunrise Residency residents", "Notices and chat for everyone living here.",
]);

// Simple illustrated placeholder photos (SVG) so the demo has images.
const photo = (a, b, label) =>
  new TextEncoder().encode(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
      <rect width="1200" height="800" fill="url(#g)"/>
      <rect x="120" y="420" width="420" height="200" rx="16" fill="#fff" opacity=".85"/>
      <rect x="160" y="380" width="340" height="60" rx="12" fill="#fff" opacity=".6"/>
      <rect x="760" y="140" width="300" height="300" rx="12" fill="#fff" opacity=".35"/>
      <line x1="910" y1="140" x2="910" y2="440" stroke="#fff" stroke-width="10" opacity=".6"/>
      <line x1="760" y1="290" x2="1060" y2="290" stroke="#fff" stroke-width="10" opacity=".6"/>
      <rect y="660" width="1200" height="140" fill="#000" opacity=".08"/>
      <text x="60" y="750" font-family="Arial" font-size="44" fill="#fff" font-weight="bold">${label}</text>
    </svg>`,
  );

const rooms = [
  ["Room 101 — sunny corner room", "Single room", 8500, 17000, 140, "Furnished", "Wi-Fi, Attached bathroom, Geyser, Balcony", "vacant", ["#60a5fa", "#1d4ed8"]],
  ["Room 102 — twin sharing", "Shared room", 5500, 11000, 180, "Furnished", "Wi-Fi, Cupboard, Study table", "vacant", ["#34d399", "#047857"]],
  ["Flat 201 — 1 BHK", "1 BHK", 16000, 50000, 520, "Semi-furnished", "Kitchen, Lift, Parking, Wardrobe", "vacant", ["#fbbf24", "#b45309"]],
  ["Room 103", "Single room", 9000, 18000, 150, "Furnished", "Wi-Fi, AC, Attached bathroom", "occupied", ["#a78bfa", "#6d28d9"]],
];

let occupiedRoom = 0;
let firstRoom = 0;
for (const [title, type, rent, deposit, area, furn, amen, status, [a, b]] of rooms) {
  const id = await exec(
    `INSERT INTO rooms (property_id, title, room_type, rent, deposit, area_sqft, furnishing, amenities, description, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [prop, title, type, rent, deposit, area, furn, amen, "Well-lit room with good ventilation. Cleaning twice a week.", status],
  );
  firstRoom ||= id;
  if (status === "occupied") occupiedRoom = id;
  for (const [i, label] of ["Bedroom", "Window view", "Bathroom"].entries()) {
    await exec("INSERT INTO room_images (room_id, mime, data, position) VALUES (?, 'image/svg+xml', ?, ?)", [
      id, photo(i % 2 ? b : a, i % 2 ? a : b, `${title.split(" —")[0]} · ${label}`), i,
    ]);
  }
}

// Priya already lives in Room 103.
const tenancy = await exec("INSERT INTO tenancies (room_id, tenant_id, rent, start_date) VALUES (?, ?, 9000, date('now', '-3 months'))", [
  occupiedRoom, tenant,
]);
await exec("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)", [group, tenant]);
await exec("INSERT INTO group_messages (group_id, sender_id, body, is_announcement) VALUES (?, ?, ?, 1)", [
  group, owner, "Water tank cleaning on Sunday 10am–1pm. Please store water in advance.",
]);
await exec("INSERT INTO group_messages (group_id, sender_id, body) VALUES (?, ?, ?)", [group, tenant, "Thanks for the heads up!"]);

// One paid bill from last month, one unpaid for this month.
for (const [offset, status] of [["-1 month", "paid"], ["0 days", "unpaid"]]) {
  const period = (await db.execute({ sql: "SELECT strftime('%Y-%m', 'now', ?) p", args: [offset] })).rows[0].p;
  const items = [["Rent", 9000], ["Electricity (62 units × ₹9)", 558], ["Water", 200], ["Maintenance", 500]];
  const total = items.reduce((s, [, x]) => s + x, 0);
  const bill = await exec(
    "INSERT INTO bills (tenancy_id, period, due_date, total, status, paid_at, payment_ref) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [tenancy, period, `${period}-10`, total, status, status === "paid" ? new Date().toISOString() : null, status === "paid" ? "UPI 412398765432" : ""],
  );
  for (const [label, amount] of items) await exec("INSERT INTO bill_items (bill_id, label, amount) VALUES (?, ?, ?)", [bill, label, amount]);
}

await exec("INSERT INTO service_requests (tenancy_id, category, title, description) VALUES (?, 'Plumbing', 'Bathroom tap leaking', 'Drips all night.')", [tenancy]);
await exec("INSERT INTO applications (room_id, tenant_id, message, move_in_date, occupants, occupation) VALUES (?, ?, ?, date('now', '+10 days'), 1, 'Software engineer')", [
  firstRoom, seeker, "Hi, I'm relocating to Pune for work and would love to see the room this weekend.",
]);
await exec("INSERT INTO notifications (user_id, title, body, link) VALUES (?, 'New application for Room 101 — sunny corner room', 'from Arjun Mehta', '/dashboard/applications')", [owner]);

console.log("Demo data ready. Log in with owner@demo.test or tenant@demo.test (password demo1234).");
