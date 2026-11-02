import "server-only";
import { createClient, type InArgs, type ResultSet } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { schema } from "./schema.mjs";

// Local dev uses a SQLite file; production points at a free Turso database.
const url = process.env.TURSO_DATABASE_URL || "file:data/local.db";
if (url.startsWith("file:")) mkdirSync("data", { recursive: true });

const globalForDb = globalThis as unknown as {
  __db?: ReturnType<typeof createClient>;
  __dbReady?: Promise<void>;
};

const client = (globalForDb.__db ??= createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
}));

function ready() {
  globalForDb.__dbReady ??= (async () => {
    await client.executeMultiple(schema);
    await client.execute("PRAGMA foreign_keys = ON");
  })();
  return globalForDb.__dbReady;
}

function toObjects<T>(rs: ResultSet): T[] {
  return rs.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    rs.columns.forEach((col, i) => {
      const v = row[i];
      obj[col] = typeof v === "bigint" ? Number(v) : v;
    });
    return obj as T;
  });
}

export async function all<T = Record<string, unknown>>(sql: string, args: InArgs = []) {
  await ready();
  return toObjects<T>(await client.execute({ sql, args }));
}

export async function get<T = Record<string, unknown>>(sql: string, args: InArgs = []) {
  return (await all<T>(sql, args))[0] as T | undefined;
}

export async function run(sql: string, args: InArgs = []) {
  await ready();
  const rs = await client.execute({ sql, args });
  return { id: Number(rs.lastInsertRowid ?? 0), changes: rs.rowsAffected };
}
