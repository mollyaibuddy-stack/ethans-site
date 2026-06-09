import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const COOKIE_NAME = "ethan_private_session";

function privatePin() {
  if (process.env.PRIVATE_AREA_PIN) return process.env.PRIVATE_AREA_PIN;
  return process.env.NODE_ENV === "production" ? "" : "1234";
}

function privateSessionToken() {
  if (process.env.PRIVATE_SESSION_TOKEN) return process.env.PRIVATE_SESSION_TOKEN;
  return process.env.NODE_ENV === "production" ? "" : "local-dev-private-session";
}

export async function POST(request: NextRequest) {
  const configuredPin = privatePin();
  const configuredToken = privateSessionToken();

  if (!configuredPin || !configuredToken) {
    return NextResponse.json(
      { error: "Private area is not configured." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const pin = typeof body?.pin === "string" ? body.pin : "";

  if (pin !== configuredPin) {
    return NextResponse.json({ error: "Wrong PIN." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, configuredToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
