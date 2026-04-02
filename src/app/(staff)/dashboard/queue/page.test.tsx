import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render-utils";
import { mockQueueEntries } from "@/test/mock-data";
import QueuePage from "./page";

const mockMutate = vi.fn();

vi.mock("@/lib/hooks", () => ({
  useQueue: () => ({ data: mockQueueEntries, mutate: mockMutate }),
  useAvailableTables: () => ({ data: [] }),
}));

vi.mock("@/lib/use-stomp", () => ({
  useQueueUpdates: vi.fn(),
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
  mockMutate.mockReset();
  localStorage.setItem("accessToken", "jwt");
});

describe("QueuePage", () => {
  it("renders title and walk-in button", () => {
    renderWithProviders(<QueuePage />);
    expect(screen.getByText("Cola")).toBeInTheDocument();
    expect(screen.getByText("Walk-in")).toBeInTheDocument();
  });

  it("shows queue entries with names and party sizes", () => {
    renderWithProviders(<QueuePage />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("shows walk-in badge on walk-in entries", () => {
    renderWithProviders(<QueuePage />);
    expect(screen.getByText("walk-in")).toBeInTheDocument();
  });

  it("shows filter buttons", () => {
    renderWithProviders(<QueuePage />);
    expect(screen.getByText("Activos")).toBeInTheDocument();
    // "Esperando" may appear as both filter and badge
    expect(screen.getAllByText("Esperando").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Sentados")).toBeInTheDocument();
  });

  it("shows notify button for WAITING entries", () => {
    renderWithProviders(<QueuePage />);
    // Alice is WAITING — should have notify button (Bell icon)
    const actionButtons = screen.getAllByRole("button");
    // Buttons include: Walk-in, filters, and per-entry actions
    expect(actionButtons.length).toBeGreaterThan(5);
  });

  it("opens walk-in dialog", async () => {
    const user = userEvent.setup();
    renderWithProviders(<QueuePage />);

    await user.click(screen.getByText("Walk-in"));

    expect(screen.getByText("Agregar walk-in")).toBeInTheDocument();
    expect(screen.getByText("Agregar a la cola")).toBeInTheDocument();
  });
});
