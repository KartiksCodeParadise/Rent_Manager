import "server-only";
import { run } from "./db";

type Provider = "log" | "textbee" | "fast2sms" | "twilio";

export const smsProvider = (process.env.SMS_PROVIDER || "log") as Provider;

/** Normalises Indian numbers to +91XXXXXXXXXX; leaves other +country numbers alone. */
export function normalizePhone(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  const d = digits.replace(/^0+/, "");
  if (d.length === 10) return `+91${d}`;
  if (d.length === 12 && d.startsWith("91")) return `+${d}`;
  return d ? `+${d}` : "";
}

async function deliver(phone: string, body: string): Promise<void> {
  const signal = AbortSignal.timeout(10_000);
  switch (smsProvider) {
    case "log":
      return;
    case "textbee": {
      // Free: textbee.dev turns your own Android phone into the SMS gateway.
      const res = await fetch(
        `https://api.textbee.dev/api/v1/gateway/devices/${process.env.TEXTBEE_DEVICE_ID}/send-sms`,
        {
          method: "POST",
          headers: { "x-api-key": process.env.TEXTBEE_API_KEY ?? "", "content-type": "application/json" },
          body: JSON.stringify({ recipients: [phone], message: body }),
          signal,
        },
      );
      if (!res.ok) throw new Error(`textbee ${res.status}: ${await res.text()}`);
      return;
    }
    case "fast2sms": {
      const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: { authorization: process.env.FAST2SMS_API_KEY ?? "", "content-type": "application/json" },
        body: JSON.stringify({ route: "q", message: body, numbers: phone.replace(/^\+91/, ""), flash: 0 }),
        signal,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.return === false) throw new Error(`fast2sms: ${JSON.stringify(json)}`);
      return;
    }
    case "twilio": {
      const sid = process.env.TWILIO_ACCOUNT_SID ?? "";
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: {
          authorization: "Basic " + Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phone, From: process.env.TWILIO_FROM ?? "", Body: body }),
        signal,
      });
      if (!res.ok) throw new Error(`twilio ${res.status}: ${await res.text()}`);
      return;
    }
  }
}

/** Sends one SMS and records the attempt in the outbox. Never throws. */
export async function sendSms(opts: { phone: string; body: string; toUserId?: number; triggeredBy?: number }) {
  const phone = normalizePhone(opts.phone);
  if (!phone) return;
  let status = smsProvider === "log" ? "simulated" : "sent";
  let error = "";
  try {
    await deliver(phone, opts.body);
  } catch (e) {
    status = "failed";
    error = e instanceof Error ? e.message : String(e);
  }
  await run(
    "INSERT INTO sms_log (to_user_id, triggered_by, to_phone, body, provider, status, error) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [opts.toUserId ?? null, opts.triggeredBy ?? null, phone, opts.body, smsProvider, status, error.slice(0, 500)],
  );
}
