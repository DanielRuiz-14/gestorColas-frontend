import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render-utils";
import RegisterPage from "./page";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.clear();
});

describe("RegisterPage", () => {
  it("renders all form fields", () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByLabelText(/nombre del restaurante/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/slug/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dirección/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tu nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /crear cuenta/i })).toBeInTheDocument();
  });

  it("auto-generates slug from restaurant name", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(
      screen.getByLabelText(/nombre del restaurante/i),
      "La Trattoria Española",
    );

    const slugInput = screen.getByLabelText(/slug/i) as HTMLInputElement;
    expect(slugInput.value).toBe("la-trattoria-espanola");
  });

  it("shows link to login", () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByText(/inicia sesión/i)).toBeInTheDocument();
  });
});
