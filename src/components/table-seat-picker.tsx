"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TableResponse } from "@/lib/types";

type TableSeatPickerProps = {
  partySize: number;
  tables: TableResponse[] | undefined;
  onSelect: (tableId: string) => void;
  emptyMessage?: string;
};

function compareByLabel(a: TableResponse, b: TableResponse) {
  return a.label.localeCompare(b.label, "es");
}

function getSeatTableSections(
  tables: TableResponse[] | undefined,
  partySize: number,
) {
  const freeTables = (tables ?? []).filter((table) => table.status === "FREE");

  const usableTables = freeTables.filter((table) => !table.reservedSoon);
  const reservedSoon = freeTables
    .filter((table) => table.reservedSoon)
    .sort((a, b) => {
      const aFits = a.capacity >= partySize ? 0 : 1;
      const bFits = b.capacity >= partySize ? 0 : 1;
      return aFits - bFits || a.capacity - b.capacity || compareByLabel(a, b);
    });

  const recommended = usableTables
    .filter((table) => table.capacity >= partySize)
    .sort((a, b) => a.capacity - b.capacity || compareByLabel(a, b));

  const undersized = usableTables
    .filter((table) => table.capacity < partySize)
    .sort((a, b) => b.capacity - a.capacity || compareByLabel(a, b));

  return { recommended, undersized, reservedSoon };
}

export function TableSeatPicker({
  partySize,
  tables,
  onSelect,
  emptyMessage = "No hay mesas libres para asignar ahora mismo.",
}: TableSeatPickerProps) {
  const { recommended, undersized, reservedSoon } = getSeatTableSections(tables, partySize);

  if (recommended.length === 0 && undersized.length === 0 && reservedSoon.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      {recommended.length > 0 && (
        <div data-testid="recommended-tables" className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              Mesas recomendadas
            </p>
            <Badge variant="secondary">
              {recommended.length}
            </Badge>
          </div>

          {recommended.map((table) => (
            <Button
              key={table.id}
              variant="outline"
              className="w-full justify-between"
              onClick={() => onSelect(table.id)}
            >
              <span>{table.label}</span>
              <span className="text-muted-foreground">
                {table.capacity} personas
              </span>
            </Button>
          ))}
        </div>
      )}

      {undersized.length > 0 && (
        <div data-testid="undersized-tables" className="space-y-2 rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 dark:border-amber-900 dark:bg-amber-950/30">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Mesas más pequeñas
              </p>
              <Badge variant="outline" className="border-amber-300 text-amber-800 dark:border-amber-700 dark:text-amber-200">
                Revisar
              </Badge>
            </div>
            <p className="text-sm text-amber-800/90 dark:text-amber-200/90">
              Estas mesas tienen menor número de comensales que el grupo. Úsalas solo si el restaurante decide forzar esa asignación.
            </p>
          </div>

          {undersized.map((table) => {
            const missingSeats = partySize - table.capacity;

            return (
              <Button
                key={table.id}
                variant="outline"
                className="h-auto w-full justify-between border-amber-300 bg-background py-3 text-left dark:border-amber-800"
                onClick={() => onSelect(table.id)}
              >
                <span className="flex flex-col">
                  <span>{table.label}</span>
                  <span className="text-xs text-amber-700 dark:text-amber-300">
                    Capacidad menor · {missingSeats === 1 ? "falta 1 plaza" : `faltan ${missingSeats} plazas`}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  {table.capacity} personas
                </span>
              </Button>
            );
          })}
        </div>
      )}

      {reservedSoon.length > 0 && (
        <div data-testid="reserved-soon-tables" className="space-y-2 rounded-xl border border-orange-200/70 bg-orange-50/70 p-3 dark:border-orange-900 dark:bg-orange-950/30">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                Mesas con reserva pendiente
              </p>
              <Badge variant="outline" className="border-orange-300 text-orange-800 dark:border-orange-700 dark:text-orange-200">
                Aviso
              </Badge>
            </div>
            <p className="text-sm text-orange-800/90 dark:text-orange-200/90">
              Estas mesas siguen libres, pero tienen una reserva pendiente en 1 hora o menos. Si las usas para cola, hazlo conscientemente.
            </p>
          </div>

          {reservedSoon.map((table) => {
            const missingSeats = partySize - table.capacity;
            const isUndersized = table.capacity < partySize;

            return (
              <Button
                key={table.id}
                variant="outline"
                className="h-auto w-full justify-between border-orange-300 bg-background py-3 text-left dark:border-orange-800"
                onClick={() => onSelect(table.id)}
              >
                <span className="flex flex-col">
                  <span>{table.label}</span>
                  <span className="text-xs text-orange-700 dark:text-orange-300">
                    Tiene una reserva pendiente
                    {isUndersized
                      ? ` · ${missingSeats === 1 ? "falta 1 plaza" : `faltan ${missingSeats} plazas`}`
                      : ""}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  {table.capacity} personas
                </span>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { getSeatTableSections };
