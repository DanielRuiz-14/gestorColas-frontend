"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQueue, useTables } from "@/lib/hooks";
import { useQueueUpdates } from "@/lib/use-stomp";
import { staffPost } from "@/lib/api";
import type { QueueEntryResponse, QueueEntryStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bell,
  SkipForward,
  Armchair,
  XCircle,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { TableSeatPicker } from "@/components/table-seat-picker";

const statusBadge: Record<QueueEntryStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  WAITING: { label: "Esperando", variant: "secondary" },
  NOTIFIED: { label: "Notificado", variant: "default" },
  SEATED: { label: "Sentado", variant: "outline" },
  CANCELLED: { label: "Cancelado", variant: "destructive" },
  EXPIRED: { label: "Expirado", variant: "destructive" },
};

export default function QueuePage() {
  const { restaurantId } = useAuth();
  const { data: queue, mutate } = useQueue();
  const [filter, setFilter] = useState<string>("active");
  const [seatEntry, setSeatEntry] = useState<QueueEntryResponse | null>(null);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [walkInSize, setWalkInSize] = useState(2);

  const { data: tables, mutate: mutateTables } = useTables();

  // Real-time updates
  useQueueUpdates(
    useCallback(() => {
      mutate();
    }, [mutate]),
  );

  const filteredQueue = queue?.filter((e) => {
    if (filter === "active") return e.status === "WAITING" || e.status === "NOTIFIED";
    return e.status === filter;
  });

  async function action(entryId: string, act: string, body?: unknown) {
    try {
      await staffPost(`/restaurants/${restaurantId}/queue/${entryId}/${act}`, body);
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Error: ${act}`);
    }
  }

  async function handleSeat(tableId: string) {
    if (!seatEntry) return;
    await action(seatEntry.id, "seat", { tableId });
    mutateTables();
    setSeatEntry(null);
    toast.success("Cliente sentado");
  }

  async function handleWalkIn(e: React.FormEvent) {
    e.preventDefault();
    try {
      await staffPost(`/restaurants/${restaurantId}/queue`, {
        customerName: walkInName,
        partySize: walkInSize,
      });
      mutate();
      setWalkInOpen(false);
      setWalkInName("");
      setWalkInSize(2);
      toast.success("Walk-in agregado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Cola</h1>
        <Button onClick={() => setWalkInOpen(true)} size="sm" className="w-full justify-center sm:w-auto">
          <UserPlus className="mr-2 h-4 w-4" />
          Walk-in
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { value: "active", label: "Activos" },
          { value: "WAITING", label: "Esperando" },
          { value: "NOTIFIED", label: "Notificados" },
          { value: "SEATED", label: "Sentados" },
          { value: "CANCELLED", label: "Cancelados" },
        ].map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Queue list */}
      <div className="space-y-2">
        {filteredQueue?.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            No hay entradas en la cola
          </p>
        )}
        {filteredQueue?.map((entry) => {
          const badge = statusBadge[entry.status];
          const isActive = entry.status === "WAITING" || entry.status === "NOTIFIED";

          return (
            <Card key={entry.id}>
              <CardContent className="flex items-center gap-4 py-3">
                {/* Position */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted font-bold">
                  {entry.position}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{entry.customerName}</span>
                    {entry.walkIn && (
                      <Badge variant="outline">walk-in</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {entry.partySize}
                    </span>
                    {entry.estimatedWaitMinutes != null && (
                      <span>~{entry.estimatedWaitMinutes} min</span>
                    )}
                    <Badge variant={badge.variant}>
                      {badge.label}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                {isActive && (
                  <div className="flex gap-1">
                    {entry.status === "WAITING" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Notificar"
                        onClick={() => action(entry.id, "notify")}
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Sentar"
                      onClick={() => setSeatEntry(entry)}
                    >
                      <Armchair className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Saltar"
                      onClick={() => action(entry.id, "skip")}
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Cancelar"
                      onClick={() => action(entry.id, "cancel")}
                    >
                      <XCircle className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Seat dialog */}
      <Dialog open={!!seatEntry} onOpenChange={() => setSeatEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Sentar a {seatEntry?.customerName} (grupo de {seatEntry?.partySize})
            </DialogTitle>
          </DialogHeader>
          <TableSeatPicker
            partySize={seatEntry?.partySize ?? 0}
            tables={tables}
            onSelect={handleSeat}
            emptyMessage="No hay mesas libres disponibles para sentar a este grupo."
          />
        </DialogContent>
      </Dialog>

      {/* Walk-in dialog */}
      <Dialog open={walkInOpen} onOpenChange={setWalkInOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar walk-in</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleWalkIn} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={walkInName}
                onChange={(e) => setWalkInName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Personas</Label>
              <Input
                type="number"
                min={1}
                value={walkInSize}
                onChange={(e) => setWalkInSize(Number(e.target.value))}
                required
              />
            </div>
            <Button type="submit" className="w-full">Agregar a la cola</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
