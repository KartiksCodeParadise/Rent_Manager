# Basera

*Rooms, rent & residents — sorted.*

A platform for flat / room / PG owners and tenants:

- **Owners** list properties and rooms with photos, set rent, deposit and per-property charges (electricity ₹/unit, water, maintenance), approve applications, generate a separate monthly bill per tenant, track service requests, and run groups that send notices to every tenant.
- **Tenants** browse vacant rooms with photos, apply online, track application status, pay bills by UPI (QR or app link), raise repair requests, and chat in their building group.
- **Every status change** (application approved/declined, request updated, new bill, payment confirmed, group notice) creates an in-app notification **and an SMS**.

Built to run entirely on free tiers: **₹0 hosting**.

| Piece | Free service | Free limit (approx.) |
|---|---|---|
| Website + server | Vercel Hobby | plenty for a small rental business |
| Database + photos | Turso (SQLite) | 5 GB storage, ~30,000 compressed photos |
| Payments | UPI deep link / QR | no fees, money goes straight to the owner |
| SMS | textbee.dev + your Android phone | uses your SIM's SMS pack |
| WhatsApp | `wa.me` links | free |

## Run it on your computer

Requires Node.js 20+.

```bash
npm install
```

```bash
npm run seed
```

```bash
npm run dev
```

Open http://localhost:3000. Demo logins (password `demo1234`):

- Owner: `owner@demo.test`
- Tenant: `tenant@demo.test`

Locally the database is the file `data/local.db`. Delete it to start fresh.

## Put it online for free

1. **Push the code to GitHub** (a private repo is fine).
2. **Create a database on Turso** (https://turso.tech, free plan, sign in with GitHub):
   - Create a database, pick a region close to India (e.g. Mumbai `bom` if listed, otherwise Singapore).
   - Copy the **database URL** (`libsql://…`) and create an **auth token**.
3. **Deploy on Vercel** (https://vercel.com, Hobby plan): *Add New → Project →* pick your repo. Before deploying, add these Environment Variables:

   | Name | Value |
   |---|---|
   | `AUTH_SECRET` | any long random string (e.g. 40 random letters) |
   | `APP_URL` | your site URL, e.g. `https://rents-manager.vercel.app` |
   | `TURSO_DATABASE_URL` | the `libsql://…` URL |
   | `TURSO_AUTH_TOKEN` | the token |
   | `SMS_PROVIDER` | `log` to start, `textbee` once SMS is set up |

4. Deploy. Tables are created automatically on the first visit.
5. Optional: to load the demo data into Turso, run `npm run seed` locally with `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` set in your shell.

## SMS: what's actually free

There is no truly free bulk-SMS API in India: Fast2SMS, MSG91 and Twilio all charge per SMS, and Twilio's trial can only text numbers you verify. The free option this app supports:

**textbee.dev (free, open source)** turns an Android phone into the SMS gateway. SMS go out from that phone's SIM, so they're free if your plan includes SMS (most Indian prepaid plans include 100 SMS/day).

1. Sign up at https://textbee.dev, install its Android app on a spare phone with a SIM, and register the device.
2. Copy the API key and device ID into Vercel:
   `SMS_PROVIDER=textbee`, `TEXTBEE_API_KEY=…`, `TEXTBEE_DEVICE_ID=…`
3. Redeploy. The **SMS outbox** page in the owner dashboard shows every message and whether it was sent or failed.

Until then, `SMS_PROVIDER=log` records every SMS in the outbox without sending, and all updates still appear as in-app notifications. Paid gateways (`fast2sms`, `twilio`) are also supported if you outgrow the phone; see `.env.example`.

## How things work

- **Applications:** a tenant applies → the owner gets an SMS → the owner approves → a tenancy is created, the room is marked occupied, the tenant joins the property's group, and every other pending applicant for that room is told it's gone.
- **Billing:** *Bills → Generate monthly bills* lists every active tenant. Enter electricity units; rent, water and maintenance come from the property defaults (editable per tenant). Each tenant gets their own bill + SMS. A tenant pays by UPI and enters the UTR → the owner confirms → the bill is marked paid. Cash can be marked paid directly.
- **Groups:** each property gets a "residents" group automatically. Owners can create more groups (per floor, etc.). Ticking *Send as notice* also SMSes every member.
- **Photos** are resized in the browser (max 1600px JPEG) before upload and stored in the database, so you need no separate image hosting.

## Project layout

```
app/                 pages (Next.js App Router)
  rooms/             public listing + room detail / apply
  dashboard/         owner & tenant dashboards (role-aware)
  api/               photo upload + photo serving
lib/
  schema.mjs         database tables
  db.ts              database helper (local file or Turso)
  auth.ts            login sessions (signed cookie)
  sms.ts             SMS providers (log / textbee / fast2sms / twilio)
  notify.ts          in-app notification + SMS in one call
  actions/           all form handlers (server actions)
components/          shared UI
scripts/seed.mjs     demo data
```
