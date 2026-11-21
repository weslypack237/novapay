"use client";
import type { ApiError, User } from "./types";

export class RequestError extends Error {
  constructor(public status: number, public body: ApiError) {
    super(body?.error?.message ?? "Something went wrong.");
  }
}

/**
 * Static preview (Live Server / plain HTML export): there is no server, so requests are
 * answered in the browser from the same labelled demo fixtures. Never used in a real build.
 */
const STATIC = process.env.NEXT_PUBLIC_STATIC_PREVIEW === "true";
const STATIC_USER_KEY = "np-static-demo-user";

async function staticRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const { DEMO_USERS, DEMO_PASSWORD, demoResponse } = await import("./demo-data");
  const fail = (status: number, code: string, message: string): never => {
    throw new RequestError(status, { error: { code, message } });
  };
  const body = init?.body ? JSON.parse(String(init.body)) : {};
  let email: string | null = null;
  try { email = localStorage.getItem(STATIC_USER_KEY); } catch {}

  if (url === "/api/session/login") {
    const id = String(body.identifier ?? "").trim().toLowerCase();
    if (DEMO_USERS[id] && body.password === DEMO_PASSWORD) {
      try { localStorage.setItem(STATIC_USER_KEY, id); } catch {}
      return { data: { user: DEMO_USERS[id] } } as T;
    }
    return fail(422, "invalid_credentials", "Preview mode: sign in with a demo account (see “Using a local demo?” below).");
  }
  if (url === "/api/session/logout") {
    try { localStorage.removeItem(STATIC_USER_KEY); } catch {}
    return { data: { logged_out: true } } as T;
  }
  if (url === "/api/session/register") {
    return fail(503, "preview_only", "Registration needs the NovaPay server. In this preview, sign in with a demo account.");
  }

  const user: User | undefined = email ? DEMO_USERS[email] : undefined;
  if (!user) {
    window.location.assign(`/login/?next=${encodeURIComponent(window.location.pathname)}`);
    return fail(401, "unauthenticated", "Sign in to continue.");
  }
  const path = url.replace(/^\/api\/bff\//, "").split("?")[0];
  if (path.startsWith("admin/") && !user.is_staff) return fail(403, "forbidden", "You do not have permission to perform this action.");
  if ((init?.method ?? "GET") !== "GET") {
    if (path === "me/theme") return { data: { saved: "device-only" } } as T;
    return fail(409, "demo_read_only", "Preview mode is read-only. Run the full app to try this action.");
  }
  return (demoResponse(path, user) ?? fail(404, "not_found", "Not found.")) as T;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  if (STATIC) return staticRequest<T>(url, init);
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", Accept: "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 401 && typeof window !== "undefined" && !url.startsWith("/api/session")) {
    window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
  }
  if (!res.ok) throw new RequestError(res.status, body);
  return body as T;
}

export const bff = {
  get: <T,>(path: string) => request<T>(`/api/bff/${path}`),
  post: <T,>(path: string, data?: unknown) => request<T>(`/api/bff/${path}`, { method: "POST", body: JSON.stringify(data ?? {}) }),
  patch: <T,>(path: string, data: unknown) => request<T>(`/api/bff/${path}`, { method: "PATCH", body: JSON.stringify(data) }),
  session: <T,>(action: "login" | "register" | "logout", data?: unknown) =>
    request<T>(`/api/session/${action}`, { method: "POST", body: JSON.stringify(data ?? {}) }),
};
