import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { DEMO_PASSWORD, DEMO_TOKEN, DEMO_USERS } from "@/lib/demo";
import { DEMO_MODE, DEMO_USER_COOKIE, api, clearSession, getToken, setSession } from "@/lib/session";

const err = (code: string, message: string, status: number) =>
  NextResponse.json({ error: { code, message } }, { status });

async function forward(path: string, body: unknown) {
  try {
    return await api(path, { method: "POST", body: JSON.stringify(body) });
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest, ctx: RouteContext<"/api/session/[action]">) {
  const { action } = await ctx.params;
  const body = action === "logout" ? {} : await req.json().catch(() => ({}));

  if (action === "logout") {
    const token = await getToken();
    if (token && token !== "demo-session") await api("auth/logout", { method: "POST", token }).catch(() => null);
    await clearSession();
    return NextResponse.json({ data: { logged_out: true } });
  }

  if (action !== "login" && action !== "register") return err("not_found", "Unknown action.", 404);

  const res = await forward(`auth/${action}`, body);

  if (!res) {
    // API unreachable. In demo mode only, allow the labelled demo accounts.
    const identifier = String(body.identifier ?? body.email ?? "").toLowerCase();
    if (DEMO_MODE && action === "login" && DEMO_USERS[identifier] && body.password === DEMO_PASSWORD) {
      await setSession(DEMO_TOKEN);
      (await cookies()).set(DEMO_USER_COOKIE, identifier, { httpOnly: true, sameSite: "strict", path: "/" });
      return NextResponse.json({ data: { user: DEMO_USERS[identifier] }, demo: true });
    }
    if (DEMO_MODE && action === "register") {
      return err("api_unavailable", "Registration needs the NovaPay API running. Start it with docker compose up, or sign in with a demo account.", 503);
    }
    return err("api_unavailable", "NovaPay can't be reached right now. Check your connection and try again.", 503);
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json(json, { status: res.status });

  // The token goes into an httpOnly cookie and is stripped from the response.
  await setSession(json.data.token);
  return NextResponse.json({ data: { user: json.data.user }, next_step: json.next_step ?? null }, { status: res.status });
}
