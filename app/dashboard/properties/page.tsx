import Link from "next/link";
import { all } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createProperty } from "@/lib/actions/owner";
import { Notice, PageHeader } from "@/components/ui";
import { PropertyFields } from "@/components/forms";
import { SubmitButton } from "@/components/SubmitButton";

export default async function PropertiesPage({ searchParams }: PageProps<"/dashboard/properties">) {
  const owner = await requireUser("owner");
  const sp = await searchParams;
  const props = await all<{ id: number; name: string; city: string; address: string; rooms: number; vacant: number }>(
    `SELECT p.id, p.name, p.city, p.address,
       (SELECT COUNT(*) FROM rooms r WHERE r.property_id = p.id) rooms,
       (SELECT COUNT(*) FROM rooms r WHERE r.property_id = p.id AND r.status = 'vacant') vacant
     FROM properties p WHERE p.owner_id = ? ORDER BY p.id DESC`,
    [owner.id],
  );

  return (
    <div>
      <PageHeader title="Properties & rooms" subtitle="A property is a building, flat or PG. Rooms live inside it." />
      <Notice text={sp.msg as string} />
      <Notice text={sp.error as string} tone="error" />

      {props.length > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {props.map((p) => (
            <Link key={p.id} href={`/dashboard/properties/${p.id}`} className="card p-5 transition hover:border-brand-500">
              <h2 className="font-semibold">{p.name}</h2>
              <p className="muted">{[p.address, p.city].filter(Boolean).join(", ") || "No address"}</p>
              <p className="mt-3 text-sm">
                <span className="font-medium">{p.rooms}</span> rooms ·{" "}
                <span className="font-medium text-emerald-700">{p.vacant}</span> vacant
              </p>
            </Link>
          ))}
        </div>
      )}

      <details className="card p-5" open={props.length === 0}>
        <summary className="cursor-pointer font-semibold">+ Add a property</summary>
        <form action={createProperty} className="mt-4 space-y-4">
          <PropertyFields />
          <SubmitButton>Create property</SubmitButton>
        </form>
      </details>
    </div>
  );
}
