import { FURNISHING, ROOM_TYPES } from "@/lib/constants";
import { Field } from "./ui";

type PropertyDefaults = Partial<{
  name: string; address: string; city: string; description: string;
  electricity_rate: number; water_charge: number; maintenance_charge: number;
}>;

export function PropertyFields({ p = {} }: { p?: PropertyDefaults }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Property name">
        <input name="name" required defaultValue={p.name} placeholder="Sunrise Apartments" className="input" />
      </Field>
      <Field label="City / area">
        <input name="city" defaultValue={p.city} placeholder="Pune, Kothrud" className="input" />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Address">
          <input name="address" defaultValue={p.address} className="input" />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="About the property">
          <textarea name="description" rows={2} defaultValue={p.description} className="input" placeholder="Nearby landmarks, rules, parking…" />
        </Field>
      </div>
      <div className="grid gap-4 sm:col-span-2 sm:grid-cols-3">
        <Field label="Electricity ₹ / unit" hint="Used when generating bills">
          <input name="electricity_rate" type="number" step="0.01" min={0} defaultValue={p.electricity_rate ?? 8} className="input" />
        </Field>
        <Field label="Water ₹ / month">
          <input name="water_charge" type="number" min={0} defaultValue={p.water_charge ?? 0} className="input" />
        </Field>
        <Field label="Maintenance ₹ / month">
          <input name="maintenance_charge" type="number" min={0} defaultValue={p.maintenance_charge ?? 0} className="input" />
        </Field>
      </div>
    </div>
  );
}

type RoomDefaults = Partial<{
  title: string; room_type: string; rent: number; deposit: number; area_sqft: number;
  furnishing: string; amenities: string; description: string; status: string;
}>;

export function RoomFields({ r = {} }: { r?: RoomDefaults }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Room title">
        <input name="title" required defaultValue={r.title} placeholder="Room 101 — sunny corner room" className="input" />
      </Field>
      <Field label="Type">
        <select name="room_type" defaultValue={r.room_type ?? ROOM_TYPES[0]} className="input">
          {ROOM_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>
      <Field label="Rent ₹ / month">
        <input name="rent" type="number" min={0} required defaultValue={r.rent} className="input" />
      </Field>
      <Field label="Security deposit ₹">
        <input name="deposit" type="number" min={0} defaultValue={r.deposit} className="input" />
      </Field>
      <Field label="Area (sq ft)">
        <input name="area_sqft" type="number" min={0} defaultValue={r.area_sqft || ""} className="input" />
      </Field>
      <Field label="Furnishing">
        <select name="furnishing" defaultValue={r.furnishing ?? "Semi-furnished"} className="input">
          {FURNISHING.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Amenities" hint="Comma separated, e.g. Wi-Fi, AC, Attached bathroom, Geyser">
          <input name="amenities" defaultValue={r.amenities} className="input" />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Description">
          <textarea name="description" rows={3} defaultValue={r.description} className="input" />
        </Field>
      </div>
      <Field label="Listing status">
        <select name="status" defaultValue={r.status ?? "vacant"} className="input">
          <option value="vacant">Vacant — show on public listing</option>
          <option value="occupied">Occupied</option>
          <option value="unlisted">Unlisted — hidden</option>
        </select>
      </Field>
    </div>
  );
}
