import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/render-utils";
import { mockQueueEntries, mockTables, mockReservations } from "@/test/mock-data";
import DashboardPage from "./page";

// Mock SWR hooks
vi.mock("@/lib/hooks", () => ({
  useQueue: () => ({ data: mockQueueEntries, mutate: vi.fn() }),
  useTables: () => ({ data: mockTables, mutate: vi.fn() }),
  useReservations: () => ({ data: mockReservations, mutate: vi.fn() }),
}));

// Mock WebSocket
vi.mock("@/lib/use-stomp", () => ({
  useAllUpdates: vi.fn(),
}));

// Mock auth
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

const mockQueueEntries2 = mockQueueEntries;
const mockTables2 = mockTables;
const mockReservations2 = mockReservations;

beforeEach(() => {
  localStorage.setItem("accessToken", "jwt");
  localStorage.setItem("restaurantId", "rest-001");
});

describe("DashboardPage", () => {
  it("renders title", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("Panel de control")).toBeInTheDocument();
  });

  it("shows waiting count stat", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("En espera")).toBeInTheDocument();
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
  });

  it("shows notified count stat", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("Notificados")).toBeInTheDocument();
  });

  it("shows free tables count", () => {
    renderWithProviders(<DashboardPage />);
    // 2 FREE out of 3 total
    expect(screen.getByText("2/3")).toBeInTheDocument();
    expect(screen.getByText("Mesas libres")).toBeInTheDocument();
  });

  it("shows queue entries in summary", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("shows table labels in grid", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("Mesa 1")).toBeInTheDocument();
    expect(screen.getByText("Mesa 2")).toBeInTheDocument();
    expect(screen.getByText("Mesa 3")).toBeInTheDocument();
  });
});
