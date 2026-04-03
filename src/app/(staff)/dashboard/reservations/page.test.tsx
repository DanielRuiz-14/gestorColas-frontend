import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render-utils";
import { mockReservations, mockTables } from "@/test/mock-data";
import ReservationsPage from "./page";

vi.mock("@/lib/hooks", () => ({
  useReservations: () => ({ data: mockReservations, mutate: vi.fn() }),
  useTables: () => ({ data: mockTables, mutate: vi.fn() }),
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

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({}),
  });
  localStorage.setItem("accessToken", "jwt");
});

describe("ReservationsPage", () => {
  it("renders title and new reservation button", () => {
    renderWithProviders(<ReservationsPage />);
    expect(screen.getByText("Reservas")).toBeInTheDocument();
    expect(screen.getByText("Nueva reserva")).toBeInTheDocument();
  });

  it("keeps the add button visible on small screens", () => {
    renderWithProviders(<ReservationsPage />);

    const title = screen.getByRole("heading", { name: "Reservas" });
    const addButton = screen.getByRole("button", { name: /nueva reserva/i });

    expect(title.parentElement).toHaveClass("flex-col", "items-start");
    expect(addButton).toHaveClass("w-full", "sm:w-auto");
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

  it("shows the preassigned table label for booked reservations", () => {
    renderWithProviders(<ReservationsPage />);
    expect(screen.getByText("Mesa 3")).toBeInTheDocument();
  });

  it("shows a mandatory table selector in the create dialog", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReservationsPage />);

    await user.click(screen.getByText("Nueva reserva"));

    expect(screen.getByLabelText("Mesa")).toBeRequired();
    expect(screen.getByText(/solo se muestran mesas libres/i)).toBeInTheDocument();
  });

  it("submits the preassigned table id when creating a reservation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReservationsPage />);

    await user.click(screen.getByText("Nueva reserva"));
    await user.type(screen.getByLabelText("Nombre"), "Laura");
    await user.type(screen.getByLabelText(/tel/i), "+34 600 000 000");
    await user.clear(screen.getByLabelText("Personas"));
    await user.type(screen.getByLabelText("Personas"), "4");
    await user.type(screen.getByLabelText("Fecha"), "2026-04-03");
    await user.type(screen.getByLabelText("Hora"), "20:30");
    await user.selectOptions(screen.getByLabelText("Mesa"), "t-001");
    await user.click(screen.getByRole("button", { name: /crear reserva/i }));

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/restaurants/rest-001/reservations"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"tableId":"t-001"'),
      }),
    );
  });
});
