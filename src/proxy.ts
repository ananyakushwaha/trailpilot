import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "trailos_session";
// Auth pages: redirect away to /dashboard once logged in.
const AUTH_PATHS = ["/login", "/signup"];
// Customer-facing links (feedback form, etc.) — always public, never
// redirected either way regardless of whether the visitor is logged in.
const ALWAYS_PUBLIC_PATHS = ["/feedback"];

function getSecretKey() {
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

async function isAuthenticated(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, getSecretKey());
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (ALWAYS_PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));
  const authed = await isAuthenticated(request);

  if (!isAuthPath && !authed) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && authed) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
