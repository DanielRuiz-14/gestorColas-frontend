"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useTables } from "@/lib/hooks";
import { useTableUpdates } from "@/lib/use-stomp";
import { staffPatch, staffPost, staffDelete } from "@/lib/api";
import type { TableResponse, TableStatus } from "@/lib/types";
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
import { Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusColors: Record<TableStatus, string> = {
  FREE: "border-green-500 bg-green-50 dark:bg-green-950",
  OCCUPIED: "border-red-500 bg-red-50 dark:bg-red-950",
  CLEANING: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950",
};

const statusLabels: Record<TableStatus, string> = {
  FREE: "Libre",
  OCCUPIED: "Ocupada",
  CLEANING: "Limpieza",
};

const nextStatus: Record<TableStatus, TableStatus> = {
  FREE: "OCCUPIED",
  OCCUPIED: "CLEANING",
  CLEANING: "FREE",
};

export default function TablesPage() {
  const { restaurantId } = useAuth();
  const { data: tables, mutate } = useTables();
  const [createOpen, setCreateOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newCapacity, setNewCapacity] = useState(4);

  useTableUpdates(
    useCallback(() => {
      mutate();
    }, [mutate]),
  );

  async function cycleStatus(table: TableResponse) {
    const next = nextStatus[table.status];
    try {
      await staffPatch(`/tables/${table.id}/status`, { status: next });
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar estado");
    }
  }

  async function deleteTable(id: string) {
    try {
      await staffDelete(`/tables/${id}`);
      mutate();
      toast.success("Mesa eliminada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await staffPost(`/restaurants/${restaurantId}/tables`, {
        label: newLabel,
        capacity: newCapacity,
      });
      mutate();
      setCreateOpen(false);
      setNewLabel("");
      setNewCapacity(4);
      toast.success("Mesa creada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mesas</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva mesa
        </Button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-sm">
        {(["FREE", "OCCUPIED", "CLEANING"] as TableStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={cn("h-3 w-3 rounded-full border-2", statusColors[s])} />
            <span>{statusLabels[s]}</span>
          </div>
        ))}
      </div>

      {/* Table grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tables?.map((table) => (
          <Card
            key={table.id}
            className={cn(
              "cursor-pointer border-2 transition-colors hover:shadow-md",
              statusColors[table.status],
            )}
            onClick={() => cycleStatus(table)}
          >
            <CardContent className="relative p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">{table.label}</span>
                {table.status === "FREE" && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTable(table.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{table.capacity}</span>
                <Badge variant="outline" className="text-xs">
                  {statusLabels[table.status]}
                </Badge>
              </div>
              {table.reservedSoon && (
                <Badge className="absolute right-2 top-2 text-xs" variant="destructive">
                  Reserva pronto
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {tables?.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          No hay mesas configuradas
        </p>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva mesa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre / Etiqueta</Label>
              <Input
                placeholder="Mesa 1"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Capacidad</Label>
              <Input
                type="number"
                min={1}
                value={newCapacity}
                onChange={(e) => setNewCapacity(Number(e.target.value))}
                required
              />
            </div>
            <Button type="submit" className="w-full">Crear mesa</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
