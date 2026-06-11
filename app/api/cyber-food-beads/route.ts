import { NextResponse } from "next/server";
import { defaultCyberFoodBeads } from "@/lib/cyber-food-beads.mjs";
import { getSql } from "@/lib/db.mjs";
import { createPrivateStore } from "@/lib/private-store.mjs";

export const runtime = "nodejs";

export async function GET() {
  try {
    const store = createPrivateStore(getSql());
    await store.ensureSchema();
    return NextResponse.json({ foods: await store.listCyberFoodBeads() });
  } catch {
    return NextResponse.json({ foods: defaultCyberFoodBeads() });
  }
}
