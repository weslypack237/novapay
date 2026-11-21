import "server-only";
import { cookies } from "next/headers";
import { DEMO_TOKEN, DEMO_USERS } from "./demo";
import type { User } from "./types";

export const SESSION_COOKIE = "np_session";
export const DEMO_USER_COOKIE = "np_demo_user";
const API = process.env.NOVAPAY_API_URL ?? "http://localhost:8000/api/v1";
export const DEMO_MODE = process.env.NOVAPAY_DEMO_MODE === "true";

export async function setSession(token: string, maxAgeSeconds = 60 * 60 * 12) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(DEMO_USER_COOKIE);
}

export async function getToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function demoUser(): Promise<User | null> {
  const jar = await cookies();
  if (jar.get(SESSION_COOKIE)?.value !== DEMO_TOKEN) return null;
  return DEMO_USERS[jar.get(DEMO_USER_COOKIE)?.value ?? ""] ?? null;
}

/** Server-to-server call to Laravel. Secrets and tokens stay on the server. */
export async function api(path: string, init: RequestInit & { token?: string | null } = {}) {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (init.token) headers.set("Authorization", `Bearer ${init.token}`);
  return fetch(`${API}/${path}`, { ...init, headers, cache: "no-store" });
}
