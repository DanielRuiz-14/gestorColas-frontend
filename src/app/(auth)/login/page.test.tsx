import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render-utils";
import LoginPage from "./page";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.clear();
});

describe("LoginPage", () => {
  it("renders email and password fields", () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it("shows link to register", () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByText(/registra tu restaurante/i)).toBeInTheDocument();
  });

  it("shows error on failed login", async () => {
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

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "bad@test.com");
    await user.type(screen.getByLabelText(/contraseña/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it("stores tokens on successful login", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          accessToken: "jwt-123",
          refreshToken: "ref-456",
          restaurantId: "rest-789",
        }),
    });

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "ok@test.com");
    await user.type(screen.getByLabelText(/contraseña/i), "password123");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(localStorage.getItem("accessToken")).toBe("jwt-123");
      expect(localStorage.getItem("restaurantId")).toBe("rest-789");
    });
  });
});
