import type { ApiError } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiException extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let body: ApiError | null = null;
    try {
      body = await res.json();
    } catch {
      // ignore parse errors
    }
    throw new ApiException(
      res.status,
      body?.code ?? "UNKNOWN",
      body?.error ?? `HTTP ${res.status}`,
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Public (no auth) ─────────────────────────────────────────────────────────

export async function publicGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/public${path}`, {
    cache: "no-store",
  });
  return handleResponse<T>(res);
}

export async function publicPost<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_URL}/public${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function publicDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/public${path}`, {
    method: "DELETE",
  });
  return handleResponse<T>(res);
}

// ── Staff (auth) ─────────────────────────────────────────────────────────────

export async function staffGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  return handleResponse<T>(res);
}

export async function staffPost<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function staffPatch<T>(
  path: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function staffDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse<T>(res);
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string,
): Promise<import("./types").AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function refreshToken(
  token: string,
): Promise<import("./types").AuthResponse> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: token }),
  });
  return handleResponse(res);
}
