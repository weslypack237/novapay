import { NextResponse, type NextRequest } from "next/server";
import { demoResponse } from "@/lib/demo";
import { api, demoUser, getToken } from "@/lib/session";

/** Backend-for-frontend: attaches the server-held token and forwards to Laravel. */
async function handle(req: NextRequest, ctx: RouteContext<"/api/bff/[...path]">) {
  const { path } = await ctx.params;
  const joined = path.map(encodeURIComponent).join("/");

  const demo = await demoUser();
  if (demo) {
    if (joined.startsWith("admin/") && !demo.is_staff) {
      return NextResponse.json({ error: { code: "forbidden", message: "You do not have permission to perform this action." } }, { status: 403 });
    }
    if (req.method !== "GET") {
      if (joined === "me/theme") return NextResponse.json({ data: { saved: "device-only" } });
      return NextResponse.json({ error: { code: "demo_read_only", message: "Demo mode is read-only. Run the API to try this action." } }, { status: 409 });
    }
    const body = demoResponse(joined, demo);
    return body
      ? NextResponse.json(body, { headers: { "X-NovaPay-Demo": "true" } })
      : NextResponse.json({ error: { code: "not_found", message: "Not found." } }, { status: 404 });
  }

  const token = await getToken();
  if (!token) return NextResponse.json({ error: { code: "unauthenticated", message: "Sign in to continue." } }, { status: 401 });

  const headers: Record<string, string> = {};
  const idem = req.headers.get("idempotency-key");
  if (idem) headers["Idempotency-Key"] = idem;

  try {
    const res = await api(`${joined}${req.nextUrl.search}`, {
      method: req.method,
      token,
      headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.text(),
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json", "X-Request-Id": res.headers.get("X-Request-Id") ?? "" },
    });
  } catch {
    return NextResponse.json({ error: { code: "api_unavailable", message: "NovaPay can't be reached right now. Try again in a moment." } }, { status: 503 });
  }
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
