import { NextRequest, NextResponse } from "next/server";
import { withPrivateStore } from "../_helpers";

export const runtime = "nodejs";

export async function GET() {
  return withPrivateStore(async store => store.getChecklistState());
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.action !== "string") {
    return NextResponse.json({ error: "Invalid checklist action." }, { status: 400 });
  }

  return withPrivateStore(async store => {
    if (body.action === "toggle") {
      return store.setChecklistTaskDone(body.id, body.done);
    }

    if (body.action === "toggleWeekly") {
      return store.setWeeklyChecklistTaskDone(body.id, body.done);
    }

    if (body.action === "add") {
      return store.addChecklistTask(body.label);
    }

    if (body.action === "remove") {
      return store.removeChecklistTask(body.id);
    }

    throw new Error("Unknown checklist action.");
  });
}
