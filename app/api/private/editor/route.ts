import { NextRequest, NextResponse } from "next/server";
import { withPrivateStore } from "../_helpers";

export const runtime = "nodejs";

export async function GET() {
  return withPrivateStore(async store => ({
    drafts: await store.getPageDrafts(),
  }));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.page !== "string") {
    return NextResponse.json({ error: "Invalid editor request." }, { status: 400 });
  }

  return withPrivateStore(async store => ({
    drafts: await store.savePageDraft(body.page, body.content),
  }));
}
