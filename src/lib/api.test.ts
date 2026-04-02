import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiException, login, register, publicGet, staffGet } from "./api";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.clear();
});

describe("login", () => {
  it("sends credentials and returns auth response", async () => {
    const authRes = {
      accessToken: "jwt-token",
      refreshToken: "refresh-token",
      restaurantId: "rest-123",
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(authRes),
    });

    const result = await login("test@test.com", "password");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/auth/login",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(result).toEqual(authRes);
  });

  it("throws ApiException on 400", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          error: "Invalid credentials",
          code: "BAD_REQUEST",
          status: 400,
        }),
    });

    await expect(login("bad@test.com", "wrong")).rejects.toThrow(
      "Invalid credentials",
    );
  });
});

describe("register", () => {
  it("sends registration data", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () =>
        Promise.resolve({
          accessToken: "jwt",
          refreshToken: "ref",
          restaurantId: "r1",
        }),
    });

    await register({
      restaurantName: "Test",
      restaurantSlug: "test",
      restaurantAddress: "123 St",
      email: "a@b.com",
      password: "12345678",
      staffName: "Admin",
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.restaurantSlug).toBe("test");
    expect(body.staffName).toBe("Admin");
  });
});

describe("publicGet", () => {
  it("fetches without auth header", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ name: "Restaurant" }),
    });

    const result = await publicGet("/restaurants/test-slug");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/public/restaurants/test-slug",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(result).toEqual({ name: "Restaurant" });
    // No Authorization header
    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders).toBeUndefined();
  });
});

describe("staffGet", () => {
  it("includes Authorization header when token exists", async () => {
    localStorage.setItem("accessToken", "my-jwt");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    await staffGet("/restaurants/123/queue");

    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders.Authorization).toBe("Bearer my-jwt");
  });

  it("omits Authorization header when no token", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    await staffGet("/restaurants/123/queue");

    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders.Authorization).toBeUndefined();
  });
});

describe("error handling", () => {
  it("returns undefined for 204 No Content", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const result = await staffGet("/some/path");
    expect(result).toBeUndefined();
  });

  it("handles non-JSON error response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("not json")),
    });

    await expect(staffGet("/fail")).rejects.toThrow("HTTP 500");
  });
});
