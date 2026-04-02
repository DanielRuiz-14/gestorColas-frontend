import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /dashboard routes — check for token in cookie or redirect to login
  // Since we use localStorage (client-side), middleware just ensures the route exists
  // Actual auth check happens client-side in the layout
  if (pathname.startsWith("/dashboard")) {
    // Let it through — the client-side AuthGuard will handle the redirect
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
