import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const COOKIE_NAME = "ethan_private_session";

function privateSessionToken() {
  if (process.env.PRIVATE_SESSION_TOKEN) return process.env.PRIVATE_SESSION_TOKEN;
  return process.env.NODE_ENV === "production" ? "" : "local-dev-private-session";
}

export async function GET(request: NextRequest) {
  const expectedToken = privateSessionToken();
  const actualToken = request.cookies.get(COOKIE_NAME)?.value;

  return NextResponse.json({
    authenticated: Boolean(expectedToken && actualToken === expectedToken),
  });
}
