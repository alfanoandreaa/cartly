import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Without a database Cartly intentionally runs in a read-friendly demo mode.
  if (!process.env.DATABASE_URL) return NextResponse.next();

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET ?? "cartly-local-development-secret" });
  if (token) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const signIn = new URL("/auth/signin", request.url);
  signIn.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: [
    "/app/dashboard/:path*",
    "/app/onboarding",
    "/api/products/:path*",
    "/api/collections/:path*",
    "/api/share/:path*",
    "/api/alerts/:path*",
    "/api/notifications/:path*",
    "/api/user/:path*",
    "/api/scrape/:path*",
    "/api/stripe/checkout/:path*",
    "/api/stripe/portal/:path*"
  ]
};
