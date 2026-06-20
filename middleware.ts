import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!process.env.ADMIN_PASSWORD) return NextResponse.next();
    const authorization = request.headers.get("authorization");
    if (authorization?.startsWith("Basic ")) {
      const decoded = atob(authorization.slice(6));
      const [, password] = decoded.split(":");
      if (password === process.env.ADMIN_PASSWORD) return NextResponse.next();
    }
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Cartly Admin"' }
    });
  }

  // Without a database Cartly intentionally runs in a read-friendly demo mode.
  if (!process.env.DATABASE_URL) return NextResponse.next();

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
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
    "/admin/:path*",
    "/api/admin/:path*",
    "/app/dashboard/:path*",
    "/app/onboarding",
    "/api/products/:path*",
    "/api/collections/:path*",
    "/api/share/:path*",
    "/api/discover/:path*",
    "/api/alerts/:path*",
    "/api/notifications/:path*",
    "/api/user/:path*",
    "/api/scrape/:path*",
    "/api/stripe/checkout/:path*",
    "/api/stripe/portal/:path*"
  ]
};
