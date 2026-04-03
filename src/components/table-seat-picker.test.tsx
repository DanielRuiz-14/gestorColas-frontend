import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TableResponse } from "@/lib/types";
import { TableSeatPicker } from "./table-seat-picker";

const tables: TableResponse[] = [
  {
    id: "fit-4",
    restaurantId: "rest-001",
    label: "Mesa 4",
    capacity: 4,
    status: "FREE",
    zone: null,
    reservedSoon: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "fit-6",
    restaurantId: "rest-001",
    label: "Mesa 6",
    capacity: 6,
    status: "FREE",
    zone: null,
    reservedSoon: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "small-2",
    restaurantId: "rest-001",
    label: "Mesa 2",
    capacity: 2,
    status: "FREE",
    zone: null,
    reservedSoon: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "reserved-3",
    restaurantId: "rest-001",
    label: "Mesa reservada",
    capacity: 3,
    status: "FREE",
    zone: null,
    reservedSoon: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

describe("TableSeatPicker", () => {
  it("shows fitting tables first and undersized ones in a warning section", () => {
    render(
      <TableSeatPicker
        partySize={4}
        tables={tables}
        onSelect={vi.fn()}
      />,
    );

    const recommended = screen.getByTestId("recommended-tables");
    expect(
      within(recommended)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual([
      expect.stringContaining("Mesa 4"),
      expect.stringContaining("Mesa 6"),
    ]);

    const undersized = screen.getByTestId("undersized-tables");
    expect(
      within(undersized)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual([expect.stringContaining("Mesa 2")]);

    expect(screen.getByText(/capacidad menor/i)).toBeInTheDocument();
    expect(screen.getByText(/faltan 2 plazas/i)).toBeInTheDocument();
    const reservedSoon = screen.getByTestId("reserved-soon-tables");
    expect(within(reservedSoon).getByRole("button", { name: /mesa reservada/i })).toBeInTheDocument();
    expect(screen.getByText(/tiene una reserva pendiente/i)).toBeInTheDocument();
  });

  it("calls onSelect when choosing an undersized table", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <TableSeatPicker
        partySize={4}
        tables={tables}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: /mesa 2/i }));

    expect(onSelect).toHaveBeenCalledWith("small-2");
  });

  it("allows selecting a free table that has a pending reservation warning", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <TableSeatPicker
        partySize={4}
        tables={tables}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: /mesa reservada/i }));

    expect(onSelect).toHaveBeenCalledWith("reserved-3");
  });
});
