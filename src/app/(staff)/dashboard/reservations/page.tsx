"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useReservations, useAvailableTables } from "@/lib/hooks";
import { useReservationUpdates } from "@/lib/use-stomp";
import { staffPost, staffPatch } from "@/lib/api";
import type { ReservationResponse, ReservationStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  LogIn,
  Armchair,
  CheckCircle,
  XCircle,
  UserX,
  Users,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<
  ReservationStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  BOOKED: { label: "Reservado", variant: "secondary" },
  ARRIVED: { label: "Llegó", variant: "default" },
  SEATED: { label: "Sentado", variant: "outline" },
  COMPLETED: { label: "Completado", variant: "outline" },
  CANCELLED: { label: "Cancelado", variant: "destructive" },
  NO_SHOW: { label: "No show", variant: "destructive" },
};

export default function ReservationsPage() {
  const { restaurantId } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [seatRes, setSeatRes] = useState<ReservationResponse | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formSize, setFormSize] = useState(2);
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const statusParam =
    filterStatus === "active" ? undefined : filterStatus;
  const { data: reservations, mutate } = useReservations(
    statusParam,
    filterDate || undefined,
  );
  const { data: availableTables } = useAvailableTables(seatRes?.partySize ?? 0);

  useReservationUpdates(
    useCallback(() => {
      mutate();
    }, [mutate]),
  );

  const filtered =
    filterStatus === "active"
      ? reservations?.filter(
          (r) =>
            r.status === "BOOKED" ||
            r.status === "ARRIVED" ||
            r.status === "SEATED",
        )
      : reservations;

  async function action(resId: string, act: string, body?: unknown) {
    try {
      await staffPost(`/reservations/${resId}/${act}`, body);
      mutate();
      toast.success(`Reserva: ${act}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Error: ${act}`);
    }
  }

  async function handleSeat(tableId: string) {
    if (!seatRes) return;
    await action(seatRes.id, "seat", { tableId });
    setSeatRes(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const reservedAt = new Date(`${formDate}T${formTime}`).toISOString();
      await staffPost(`/restaurants/${restaurantId}/reservations`, {
        customerName: formName,
        customerPhone: formPhone || undefined,
        partySize: formSize,
        reservedAt,
        notes: formNotes || undefined,
      });
      mutate();
      setCreateOpen(false);
      resetForm();
      toast.success("Reserva creada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear");
    }
  }

  function resetForm() {
    setFormName("");
    setFormPhone("");
    setFormSize(2);
    setFormDate("");
    setFormTime("");
    setFormNotes("");
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reservas</h1>
        <Button
          size="sm"
          onClick={() => {
            resetForm();
            setCreateOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva reserva
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="date"
          className="w-auto"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        {[
          { value: "active", label: "Activas" },
          { value: "BOOKED", label: "Reservadas" },
          { value: "ARRIVED", label: "Llegaron" },
          { value: "SEATED", label: "Sentados" },
          { value: "NO_SHOW", label: "No show" },
          { value: "CANCELLED", label: "Canceladas" },
        ].map((f) => (
          <Button
            key={f.value}
            variant={filterStatus === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered?.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            No hay reservas
          </p>
        )}
        {filtered?.map((res) => {
          const cfg = statusConfig[res.status];
          return (
            <Card key={res.id}>
              <CardContent className="flex items-center gap-4 py-3">
                {/* Time */}
                <div className="flex flex-col items-center text-center">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-bold">
                    {formatTime(res.reservedAt)}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {res.customerName}
                    </span>
                    <Badge variant={cfg.variant} className="text-xs">
                      {cfg.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {res.partySize}
                    </span>
                    {res.customerPhone && <span>{res.customerPhone}</span>}
                    {res.notes && (
                      <span className="truncate italic">{res.notes}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  {res.status === "BOOKED" && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Llegó"
                        onClick={() => action(res.id, "arrive")}
                      >
                        <LogIn className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="No show"
                        onClick={() => action(res.id, "no-show")}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Cancelar"
                        onClick={() => action(res.id, "cancel")}
                      >
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                  {res.status === "ARRIVED" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Sentar"
                      onClick={() => setSeatRes(res)}
                    >
                      <Armchair className="h-4 w-4" />
                    </Button>
                  )}
                  {res.status === "SEATED" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Completar"
                      onClick={() => action(res.id, "complete")}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Seat dialog */}
      <Dialog open={!!seatRes} onOpenChange={() => setSeatRes(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Sentar a {seatRes?.customerName} (grupo de {seatRes?.partySize})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {availableTables?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay mesas disponibles
              </p>
            )}
            {availableTables?.map((table) => (
              <Button
                key={table.id}
                variant="outline"
                className="w-full justify-between"
                onClick={() => handleSeat(table.id)}
              >
                <span>{table.label}</span>
                <span className="text-muted-foreground">
                  {table.capacity} personas
                </span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva reserva</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                type="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Personas</Label>
              <Input
                type="number"
                min={1}
                value={formSize}
                onChange={(e) => setFormSize(Number(e.target.value))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
              />
            </div>
            <Button type="submit" className="w-full">
              Crear reserva
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
