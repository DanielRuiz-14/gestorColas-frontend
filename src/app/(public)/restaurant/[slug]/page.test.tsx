import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render-utils";
import RestaurantPage from "./page";

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useParams: () => ({ slug: "test-restaurant" }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/restaurant/test-restaurant",
  redirect: vi.fn(),
}));

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.clear();
});

function mockRestaurantAndQueue() {
  // First call: GET /public/restaurants/test-restaurant
  // Second call: GET /public/restaurants/test-restaurant/queue/status
  mockFetch
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          name: "La Trattoria",
          slug: "test-restaurant",
          description: "Italian food",
          openingHours: {},
          active: true,
        }),
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          waitingCount: 3,
          estimatedWaitMinutes: 15,
          queueOpen: true,
        }),
    });
}

describe("RestaurantPage", () => {
  it("renders restaurant name and description", async () => {
    mockRestaurantAndQueue();
    renderWithProviders(<RestaurantPage />);

    await waitFor(() => {
      expect(screen.getByText("La Trattoria")).toBeInTheDocument();
      expect(screen.getByText("Italian food")).toBeInTheDocument();
    });
  });

  it("shows queue status numbers", async () => {
    mockRestaurantAndQueue();
    renderWithProviders(<RestaurantPage />);

    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("~15 min")).toBeInTheDocument();
      expect(screen.getByText("Abierta")).toBeInTheDocument();
    });
  });

  it("shows join button", async () => {
    mockRestaurantAndQueue();
    renderWithProviders(<RestaurantPage />);

    await waitFor(() => {
      expect(screen.getByText("Unirme a la cola")).toBeInTheDocument();
    });
  });

  it("opens join form when clicking button", async () => {
    mockRestaurantAndQueue();
    const user = userEvent.setup();
    renderWithProviders(<RestaurantPage />);

    await waitFor(() => {
      expect(screen.getByText("Unirme a la cola")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Unirme a la cola"));

    expect(screen.getByText("Unirse a la cola")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
    // partySize selector lives in the status card now; it stays mounted
    // alongside the join form.
    expect(screen.getByLabelText("Personas en tu grupo")).toBeInTheDocument();
  });

  it("shows '—' when estimatedWaitMinutes is null", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            name: "Mixed",
            slug: "mixed",
            description: null,
            openingHours: {},
            active: true,
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            waitingCount: 1,
            estimatedWaitMinutes: null,
            queueOpen: true,
          }),
      });

    renderWithProviders(<RestaurantPage />);

    await waitFor(() => {
      expect(screen.getByText("—")).toBeInTheDocument();
      expect(
        screen.getByText(/No hay mesa compatible/i),
      ).toBeInTheDocument();
    });
  });

  it("shows queue full state", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            name: "Full Place",
            slug: "full",
            description: null,
            openingHours: {},
            active: true,
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            waitingCount: 50,
            estimatedWaitMinutes: 120,
            queueOpen: false,
          }),
      });

    renderWithProviders(<RestaurantPage />);

    await waitFor(() => {
      expect(screen.getByText("Llena")).toBeInTheDocument();
      expect(screen.getByText("Cola llena")).toBeInTheDocument();
    });
  });

  it("shows not found on invalid slug", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () =>
        Promise.resolve({
          error: "Not found",
          code: "NOT_FOUND",
          status: 404,
        }),
    });

    renderWithProviders(<RestaurantPage />);

    await waitFor(() => {
      expect(screen.getByText("No encontrado")).toBeInTheDocument();
    });
  });
});
