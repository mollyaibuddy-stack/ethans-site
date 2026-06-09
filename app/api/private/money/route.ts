import { NextRequest, NextResponse } from "next/server";
import { withPrivateStore } from "../_helpers";

export const runtime = "nodejs";

export async function GET() {
  return withPrivateStore(async store => ({
    entries: await store.listMoneyEntries(),
  }));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  return withPrivateStore(async store => {
    await store.addMoneyEntry(body);
    return { entries: await store.listMoneyEntries() };
  });
}
