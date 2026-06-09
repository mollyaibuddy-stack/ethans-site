import { NextResponse } from "next/server";
import { fetchF1WidgetData } from "@/lib/f1-data.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await fetchF1WidgetData());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load F1 data.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
