import { NextRequest } from "next/server";
import { withPrivateStore } from "../_helpers";

export const runtime = "nodejs";

export async function GET() {
  return withPrivateStore(async store => ({
    foods: await store.listCyberFoodBeads(),
  }));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  return withPrivateStore(async store => ({
    foods: await store.saveCyberFoodBeads(body?.foods),
  }));
}
