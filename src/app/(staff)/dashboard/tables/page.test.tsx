import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render-utils";
import { mockTables } from "@/test/mock-data";
import TablesPage from "./page";

const mutateMock = vi.fn();
const staffPostMock = vi.fn();

vi.mock("@/lib/hooks", () => ({
  useTables: () => ({ data: mockTables, mutate: mutateMock }),
}));

vi.mock("@/lib/use-stomp", () => ({
  useTableUpdates: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  staffDelete: vi.fn(),
  staffPatch: vi.fn(),
  staffPost: (...args: unknown[]) => staffPostMock(...args),
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
  mutateMock.mockReset();
  staffPostMock.mockReset();
  staffPostMock.mockResolvedValue({ id: "created-table" });
});

describe("TablesPage", () => {
  it("renders title and new table button", () => {
    renderWithProviders(<TablesPage />);
    expect(screen.getByText("Mesas")).toBeInTheDocument();
    expect(screen.getByText("Nueva mesa")).toBeInTheDocument();
  });

  it("keeps the add button visible on small screens", () => {
    renderWithProviders(<TablesPage />);

    const title = screen.getByRole("heading", { name: "Mesas" });
    const addButton = screen.getByRole("button", { name: /nueva mesa/i });

    expect(title.parentElement).toHaveClass("flex-col", "items-start");
    expect(addButton).toHaveClass("w-full", "sm:w-auto");
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

  it("allows switching to bulk creation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TablesPage />);

    await user.click(screen.getByText("Nueva mesa"));
    await user.click(screen.getByRole("tab", { name: /varias mesas/i }));

    expect(screen.getByRole("button", { name: /crear mesas/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/prefijo/i)).toHaveValue("Mesa");
  });

  it("submits bulk creation to the batch endpoint", async () => {
    const user = userEvent.setup();
    staffPostMock.mockResolvedValue([
      { id: "table-11" },
      { id: "table-12" },
      { id: "table-13" },
      { id: "table-14" },
      { id: "table-15" },
    ]);
    renderWithProviders(<TablesPage />);

    await user.click(screen.getByText("Nueva mesa"));
    await user.click(screen.getByRole("tab", { name: /varias mesas/i }));

    await user.clear(screen.getByLabelText(/prefijo/i));
    await user.type(screen.getByLabelText(/prefijo/i), "Terraza");
    await user.clear(screen.getByLabelText(/desde/i));
    await user.type(screen.getByLabelText(/desde/i), "11");
    await user.clear(screen.getByLabelText(/hasta/i));
    await user.type(screen.getByLabelText(/hasta/i), "15");
    await user.clear(screen.getByLabelText(/^capacidad$/i));
    await user.type(screen.getByLabelText(/^capacidad$/i), "6");

    await user.click(screen.getByRole("button", { name: /crear mesas/i }));

    await waitFor(() => {
      expect(staffPostMock).toHaveBeenCalledWith("/restaurants/rest-001/tables/bulk", {
        labelPrefix: "Terraza",
        fromNumber: 11,
        toNumber: 15,
        capacity: 6,
      });
    });

    expect(mutateMock).toHaveBeenCalled();
  });
});
