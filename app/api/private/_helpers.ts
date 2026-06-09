import { NextResponse } from "next/server";
import { getSql } from "@/lib/db.mjs";
import { createPrivateStore } from "@/lib/private-store.mjs";

export const runtime = "nodejs";

export function privateStore() {
  return createPrivateStore(getSql());
}

export async function withPrivateStore<T>(
  handler: (store: ReturnType<typeof createPrivateStore>) => Promise<T>,
) {
  try {
    const store = privateStore();
    await store.ensureSchema();
    return NextResponse.json(await handler(store));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Private API error.";
    const status = message.includes("DATABASE_URL") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
