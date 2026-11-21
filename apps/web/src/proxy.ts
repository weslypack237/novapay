import { NextResponse, type NextRequest } from "next/server";

/** Optimistic gate: no session cookie → sign in. Real authorization happens in the API. */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("np_session")) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/app/:path*", "/admin/:path*", "/verify"] };
