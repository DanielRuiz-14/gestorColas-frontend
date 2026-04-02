import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render-utils";
import { mockReservations } from "@/test/mock-data";
import ReservationsPage from "./page";

vi.mock("@/lib/hooks", () => ({
  useReservations: () => ({ data: mockReservations, mutate: vi.fn() }),
  useAvailableTables: () => ({ data: [] }),
}));

vi.mock("@/lib/use-stomp", () => ({
  useReservationUpdates: vi.fn(),
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

describe("ReservationsPage", () => {
  it("renders title and new reservation button", () => {
    renderWithProviders(<ReservationsPage />);
    expect(screen.getByText("Reservas")).toBeInTheDocument();
    expect(screen.getByText("Nueva reserva")).toBeInTheDocument();
  });

  it("shows reservation customer names", () => {
    renderWithProviders(<ReservationsPage />);
    expect(screen.getByText("Carlos")).toBeInTheDocument();
    expect(screen.getByText("Diana")).toBeInTheDocument();
  });

  it("shows status badges", () => {
    renderWithProviders(<ReservationsPage />);
    expect(screen.getByText("Reservado")).toBeInTheDocument();
    expect(screen.getByText("Sentado")).toBeInTheDocument();
  });

  it("shows filter buttons", () => {
    renderWithProviders(<ReservationsPage />);
    expect(screen.getByText("Activas")).toBeInTheDocument();
    expect(screen.getByText("Reservadas")).toBeInTheDocument();
    expect(screen.getByText("No show")).toBeInTheDocument();
  });

  it("opens create dialog", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReservationsPage />);

    await user.click(screen.getByText("Nueva reserva"));

    expect(screen.getByText("Crear reserva")).toBeInTheDocument();
  });

  it("shows notes for reservations that have them", () => {
    renderWithProviders(<ReservationsPage />);
    expect(screen.getByText("Mesa ventana")).toBeInTheDocument();
  });
});
