import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "ethan_private_session";
const PROTECTED_PRIVATE_PATHS = [
  "/private/money",
  "/private/checklist",
  "/private/editor",
  "/api/private/money",
  "/api/private/checklist",
  "/api/private/editor",
];

function privateSessionToken() {
  if (process.env.PRIVATE_SESSION_TOKEN) return process.env.PRIVATE_SESSION_TOKEN;
  return process.env.NODE_ENV === "production" ? "" : "local-dev-private-session";
}

export function proxy(request: NextRequest) {
  const isProtected = PROTECTED_PRIVATE_PATHS.some(path =>
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`),
  );

  if (!isProtected) return NextResponse.next();

  const expectedToken = privateSessionToken();
  const actualToken = request.cookies.get(COOKIE_NAME)?.value;

  if (expectedToken && actualToken === expectedToken) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/private", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/private/:path*", "/api/private/:path*"],
};
