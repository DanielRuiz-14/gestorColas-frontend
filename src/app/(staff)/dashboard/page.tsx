"use client";

import { useCallback } from "react";
import { useQueue, useTables, useReservations } from "@/lib/hooks";
import { useAllUpdates } from "@/lib/use-stomp";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, UtensilsCrossed, CalendarDays, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TableStatus } from "@/lib/types";

const statusColors: Record<TableStatus, string> = {
  FREE: "border-green-500 bg-green-50 dark:bg-green-950",
  OCCUPIED: "border-red-500 bg-red-50 dark:bg-red-950",
  CLEANING: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950",
};

export default function DashboardPage() {
  const { data: queue, mutate: mutateQueue } = useQueue();
  const { data: tables, mutate: mutateTables } = useTables();
  const { data: reservations, mutate: mutateReservations } = useReservations();

  useAllUpdates({
    onQueue: useCallback(() => mutateQueue(), [mutateQueue]),
    onTable: useCallback(() => mutateTables(), [mutateTables]),
    onReservation: useCallback(() => mutateReservations(), [mutateReservations]),
  });

  const waitingCount = queue?.filter((e) => e.status === "WAITING").length ?? 0;
  const notifiedCount = queue?.filter((e) => e.status === "NOTIFIED").length ?? 0;
  const freeTables = tables?.filter((t) => t.status === "FREE").length ?? 0;
  const occupiedTables = tables?.filter((t) => t.status === "OCCUPIED").length ?? 0;
  const todayReservations = reservations?.filter((r) =>
    r.status === "BOOKED" || r.status === "ARRIVED",
  ).length ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Panel de control</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{waitingCount}</p>
              <p className="text-xs text-muted-foreground">En espera</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Clock className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{notifiedCount}</p>
              <p className="text-xs text-muted-foreground">Notificados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <UtensilsCrossed className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">
                {freeTables}/{tables?.length ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Mesas libres</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <CalendarDays className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{todayReservations}</p>
              <p className="text-xs text-muted-foreground">Reservas activas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Queue summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Cola actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            {queue?.filter((e) => e.status === "WAITING" || e.status === "NOTIFIED")
              .slice(0, 8)
              .map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between border-b py-2 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-bold">
                      {entry.position}
                    </span>
                    <div>
                      <span className="text-sm font-medium">{entry.customerName}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({entry.partySize}p)
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={entry.status === "NOTIFIED" ? "default" : "secondary"}
                  >
                    {entry.status === "NOTIFIED" ? "Notificado" : "Esperando"}
                  </Badge>
                </div>
              ))}
            {(!queue || queue.filter((e) => e.status === "WAITING" || e.status === "NOTIFIED").length === 0) && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Cola vacía
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tables grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              Mesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {tables?.map((table) => (
                <div
                  key={table.id}
                  className={cn(
                    "relative rounded-lg border-2 p-2 text-center",
                    statusColors[table.status],
                  )}
                >
                  <span className="text-sm font-semibold">{table.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {table.capacity}p
                  </span>
                  {table.reservedSoon && (
                    <Badge
                      variant="destructive"
                      className="absolute -right-1 -top-1 text-[10px] px-1"
                    >
                      R
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            {(!tables || tables.length === 0) && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No hay mesas configuradas
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
