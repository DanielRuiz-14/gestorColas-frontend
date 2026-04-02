import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/render-utils";
import { mockRestaurant, mockConfig } from "@/test/mock-data";
import SettingsPage from "./page";

vi.mock("@/lib/hooks", () => ({
  useRestaurant: () => ({ data: mockRestaurant, mutate: vi.fn() }),
  useConfig: () => ({ data: mockConfig, mutate: vi.fn() }),
}));

vi.mock("@/lib/auth", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    restaurantId: "rest-001",
    isAuthenticated: true,
    isLoading: false,
    accessToken: "jwt",
    refreshToken: "ref",
    setAuth: vi.fn(),
    logout: vi.fn(),
  }),
}));

beforeEach(() => {
  localStorage.setItem("accessToken", "jwt");
});

describe("SettingsPage", () => {
  it("renders title", () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText("Configuración")).toBeInTheDocument();
  });

  it("shows restaurant profile section", () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText("Perfil del restaurante")).toBeInTheDocument();
  });

  it("populates restaurant name from data", () => {
    renderWithProviders(<SettingsPage />);
    const nameInput = screen.getByDisplayValue("Test Restaurant");
    expect(nameInput).toBeInTheDocument();
  });

  it("shows QR code section", () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText("Código QR")).toBeInTheDocument();
    expect(screen.getByText("Descargar QR")).toBeInTheDocument();
  });

  it("shows operational config with defaults", () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText("Parámetros operativos")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5")).toBeInTheDocument(); // confirmation timeout
    expect(screen.getByDisplayValue("15")).toBeInTheDocument(); // noshow grace
    expect(screen.getByDisplayValue("45")).toBeInTheDocument(); // avg duration
    expect(screen.getByDisplayValue("30")).toBeInTheDocument(); // protection window
  });

  it("shows slug in QR section", () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText("/restaurant/test-restaurant")).toBeInTheDocument();
  });
});
