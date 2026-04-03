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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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

type CreateMode = "single" | "bulk";

function getSuggestedBulkValues(tables: TableResponse[] | undefined) {
  const nextMesaNumber =
    (tables ?? []).reduce((highest, table) => {
      const match = /^Mesa\s+(\d+)$/i.exec(table.label.trim());
      if (!match) return highest;
      return Math.max(highest, Number(match[1]));
    }, 0) + 1;

  return {
    labelPrefix: "Mesa",
    fromNumber: nextMesaNumber,
    toNumber: nextMesaNumber + 9,
    capacity: 4,
  };
}

export default function TablesPage() {
  const { restaurantId } = useAuth();
  const { data: tables, mutate } = useTables();
  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>("single");
  const [newLabel, setNewLabel] = useState("");
  const [newCapacity, setNewCapacity] = useState(4);
  const [bulkLabelPrefix, setBulkLabelPrefix] = useState("Mesa");
  const [bulkFromNumber, setBulkFromNumber] = useState(1);
  const [bulkToNumber, setBulkToNumber] = useState(10);
  const [bulkCapacity, setBulkCapacity] = useState(4);

  useTableUpdates(
    useCallback(() => {
      mutate();
    }, [mutate]),
  );

  function resetCreateForms() {
    const suggestion = getSuggestedBulkValues(tables);
    setCreateMode("single");
    setNewLabel("");
    setNewCapacity(4);
    setBulkLabelPrefix(suggestion.labelPrefix);
    setBulkFromNumber(suggestion.fromNumber);
    setBulkToNumber(suggestion.toNumber);
    setBulkCapacity(suggestion.capacity);
  }

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

  async function handleSingleCreate(e: React.FormEvent) {
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

  async function handleBulkCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const createdTables = await staffPost<TableResponse[]>(`/restaurants/${restaurantId}/tables/bulk`, {
        labelPrefix: bulkLabelPrefix,
        fromNumber: bulkFromNumber,
        toNumber: bulkToNumber,
        capacity: bulkCapacity,
      });
      mutate();
      setCreateOpen(false);
      resetCreateForms();
      toast.success(
        createdTables.length === 1
          ? "1 mesa creada"
          : `${createdTables.length} mesas creadas`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear mesas");
    }
  }

  const projectedBulkCount =
    bulkToNumber >= bulkFromNumber ? bulkToNumber - bulkFromNumber + 1 : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Mesas</h1>
        <Button
          size="sm"
          onClick={() => {
            resetCreateForms();
            setCreateOpen(true);
          }}
          className="w-full justify-center sm:w-auto"
        >
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
                <Badge variant="outline">
                  {statusLabels[table.status]}
                </Badge>
              </div>
              {table.reservedSoon && (
                <Badge className="absolute right-2 top-2" variant="destructive">
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
            <DialogTitle>Añadir mesas</DialogTitle>
          </DialogHeader>
          <Tabs value={createMode} onValueChange={(value) => setCreateMode(value as CreateMode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Una mesa</TabsTrigger>
              <TabsTrigger value="bulk">Varias mesas</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="pt-4">
              <form onSubmit={handleSingleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="single-table-label">Nombre / Etiqueta</Label>
                  <Input
                    id="single-table-label"
                    placeholder="Mesa 1"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="single-table-capacity">Capacidad</Label>
                  <Input
                    id="single-table-capacity"
                    type="number"
                    min={1}
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Number(e.target.value))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Crear mesa</Button>
              </form>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4 pt-4">
              <div className="rounded-xl border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
                Genera un rango consecutivo de mesas en un solo paso. Ideal para montar la sala completa sin repetir el mismo formulario 50 veces.
              </div>

              <form onSubmit={handleBulkCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-prefix">Prefijo</Label>
                  <Input
                    id="bulk-prefix"
                    placeholder="Mesa"
                    value={bulkLabelPrefix}
                    onChange={(e) => setBulkLabelPrefix(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-from">Desde</Label>
                    <Input
                      id="bulk-from"
                      type="number"
                      min={1}
                      value={bulkFromNumber}
                      onChange={(e) => setBulkFromNumber(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulk-to">Hasta</Label>
                    <Input
                      id="bulk-to"
                      type="number"
                      min={1}
                      value={bulkToNumber}
                      onChange={(e) => setBulkToNumber(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulk-capacity">Capacidad</Label>
                    <Input
                      id="bulk-capacity"
                      type="number"
                      min={1}
                      value={bulkCapacity}
                      onChange={(e) => setBulkCapacity(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-dashed border-border/70 px-3 py-2 text-sm text-muted-foreground">
                  {projectedBulkCount > 0 ? (
                    <>
                      Se crearán <span className="font-semibold text-foreground">{projectedBulkCount} mesas</span>: {" "}
                      <span className="font-medium text-foreground">
                        {bulkLabelPrefix || "Mesa"} {bulkFromNumber}
                      </span>
                      {" "}a{" "}
                      <span className="font-medium text-foreground">
                        {bulkLabelPrefix || "Mesa"} {bulkToNumber}
                      </span>
                      .
                    </>
                  ) : (
                    "Define un rango válido para crear las mesas."
                  )}
                </div>

                <Button type="submit" className="w-full">Crear mesas</Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
