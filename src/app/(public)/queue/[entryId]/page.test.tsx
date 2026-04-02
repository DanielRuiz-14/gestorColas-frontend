import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/render-utils";
import QueueTrackingPage from "./page";

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useParams: () => ({ entryId: "entry-001" }),
  useSearchParams: () => new URLSearchParams("accessToken=tok-123"),
  usePathname: () => "/queue/entry-001",
  redirect: vi.fn(),
}));

// Mock EventSource
class MockEventSource {
  onmessage = null;
  onerror = null;
  addEventListener = vi.fn();
  close = vi.fn();
}
// @ts-expect-error mock
global.EventSource = MockEventSource;

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.clear();
});

describe("QueueTrackingPage", () => {
  it("renders WAITING state with position and time", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          id: "entry-001",
          customerName: "Test User",
          partySize: 3,
          position: 2,
          status: "WAITING",
          estimatedWaitMinutes: 45,
          createdAt: "2026-01-01T12:00:00Z",
        }),
    });

    renderWithProviders(<QueueTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument(); // position
      expect(screen.getByText("~45")).toBeInTheDocument(); // wait time
      expect(screen.getByText("En espera")).toBeInTheDocument();
    });
  });

  it("shows confirm button in NOTIFIED state", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          id: "entry-001",
          customerName: "Notified User",
          partySize: 2,
          position: 1,
          status: "NOTIFIED",
          estimatedWaitMinutes: 0,
          createdAt: "2026-01-01T12:00:00Z",
        }),
    });

    renderWithProviders(<QueueTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText("Tu turno")).toBeInTheDocument();
      expect(screen.getByText("Confirmar asistencia")).toBeInTheDocument();
    });
  });

  it("shows seated success message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          id: "entry-001",
          customerName: "Seated User",
          partySize: 2,
          position: 1,
          status: "SEATED",
          estimatedWaitMinutes: null,
          createdAt: "2026-01-01T12:00:00Z",
        }),
    });

    renderWithProviders(<QueueTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText("Sentado")).toBeInTheDocument();
      expect(screen.getByText(/mesa asignada/i)).toBeInTheDocument();
    });
  });

  it("shows cancelled message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          id: "entry-001",
          customerName: "Cancelled User",
          partySize: 2,
          position: 1,
          status: "CANCELLED",
          estimatedWaitMinutes: null,
          createdAt: "2026-01-01T12:00:00Z",
        }),
    });

    renderWithProviders(<QueueTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText("Cancelado")).toBeInTheDocument();
      expect(screen.getByText(/ha sido cancelada/i)).toBeInTheDocument();
    });
  });

  it("shows expired message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          id: "entry-001",
          customerName: "Expired User",
          partySize: 2,
          position: 1,
          status: "EXPIRED",
          estimatedWaitMinutes: null,
          createdAt: "2026-01-01T12:00:00Z",
        }),
    });

    renderWithProviders(<QueueTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText("Expirado")).toBeInTheDocument();
      expect(screen.getByText(/ha expirado/i)).toBeInTheDocument();
    });
  });

  it("shows cancel button for active entries", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          id: "entry-001",
          customerName: "Active",
          partySize: 2,
          position: 3,
          status: "WAITING",
          estimatedWaitMinutes: 30,
          createdAt: "2026-01-01T12:00:00Z",
        }),
    });

    renderWithProviders(<QueueTrackingPage />);

    await waitFor(() => {
      expect(screen.getByText("Cancelar mi turno")).toBeInTheDocument();
    });
  });

  it("stores access token in localStorage", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          id: "entry-001",
          customerName: "User",
          partySize: 2,
          position: 1,
          status: "WAITING",
          estimatedWaitMinutes: 0,
          createdAt: "2026-01-01T12:00:00Z",
        }),
    });

    renderWithProviders(<QueueTrackingPage />);

    await waitFor(() => {
      expect(localStorage.getItem("queue_entry-001")).toBe("tok-123");
    });
  });
});
