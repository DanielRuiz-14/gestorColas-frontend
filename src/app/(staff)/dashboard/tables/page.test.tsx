import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render-utils";
import { mockTables } from "@/test/mock-data";
import TablesPage from "./page";

vi.mock("@/lib/hooks", () => ({
  useTables: () => ({ data: mockTables, mutate: vi.fn() }),
}));

vi.mock("@/lib/use-stomp", () => ({
  useTableUpdates: vi.fn(),
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

describe("TablesPage", () => {
  it("renders title and new table button", () => {
    renderWithProviders(<TablesPage />);
    expect(screen.getByText("Mesas")).toBeInTheDocument();
    expect(screen.getByText("Nueva mesa")).toBeInTheDocument();
  });

  it("shows all table labels", () => {
    renderWithProviders(<TablesPage />);
    expect(screen.getByText("Mesa 1")).toBeInTheDocument();
    expect(screen.getByText("Mesa 2")).toBeInTheDocument();
    expect(screen.getByText("Mesa 3")).toBeInTheDocument();
  });

  it("shows status legend", () => {
    renderWithProviders(<TablesPage />);
    // "Libre" appears in legend AND as table badge, so use getAllByText
    expect(screen.getAllByText("Libre").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Ocupada").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Limpieza")).toBeInTheDocument();
  });

  it("shows reserved_soon badge on Mesa 3", () => {
    renderWithProviders(<TablesPage />);
    expect(screen.getByText("Reserva pronto")).toBeInTheDocument();
  });

  it("opens create dialog", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TablesPage />);

    await user.click(screen.getByText("Nueva mesa"));

    expect(screen.getByText("Crear mesa")).toBeInTheDocument();
  });
});
