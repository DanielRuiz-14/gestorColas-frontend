"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRestaurant, useConfig } from "@/lib/hooks";
import { staffPatch, staffGet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, Save } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function SettingsPage() {
  const { restaurantId } = useAuth();
  const { data: restaurant, mutate: mutateRestaurant } = useRestaurant();
  const { data: config, mutate: mutateConfig } = useConfig();

  // Restaurant form
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  // Config form
  const [confirmTimeout, setConfirmTimeout] = useState(5);
  const [noshowGrace, setNoshowGrace] = useState(15);
  const [avgDuration, setAvgDuration] = useState(45);
  const [protectionWindow, setProtectionWindow] = useState(30);
  const [maxQueue, setMaxQueue] = useState<string>("");

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name);
      setAddress(restaurant.address);
      setPhone(restaurant.phone ?? "");
      setDescription(restaurant.description ?? "");
    }
  }, [restaurant]);

  useEffect(() => {
    if (config) {
      setConfirmTimeout(config.confirmationTimeoutMinutes);
      setNoshowGrace(config.noshowGraceMinutes);
      setAvgDuration(config.avgTableDurationMinutes);
      setProtectionWindow(config.reservationProtectionWindowMinutes);
      setMaxQueue(config.maxQueueSize?.toString() ?? "");
    }
  }, [config]);

  async function saveRestaurant(e: React.FormEvent) {
    e.preventDefault();
    try {
      await staffPatch(`/restaurants/${restaurantId}`, {
        name,
        address,
        phone: phone || null,
        description: description || null,
      });
      mutateRestaurant();
      toast.success("Restaurante actualizado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    try {
      await staffPatch(`/restaurants/${restaurantId}/config`, {
        confirmationTimeoutMinutes: confirmTimeout,
        noshowGraceMinutes: noshowGrace,
        avgTableDurationMinutes: avgDuration,
        reservationProtectionWindowMinutes: protectionWindow,
        maxQueueSize: maxQueue ? Number(maxQueue) : null,
      });
      mutateConfig();
      toast.success("Configuración actualizada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  async function downloadQr() {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        `${API_URL}/restaurants/${restaurantId}/qr`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error("Error al descargar QR");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `queuetable-qr-${restaurant?.slug ?? "restaurant"}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al descargar QR");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Configuración</h1>

      {/* Restaurant profile */}
      <Card>
        <CardHeader>
          <CardTitle>Perfil del restaurante</CardTitle>
          <CardDescription>
            Información visible para los clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveRestaurant} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <Button type="submit" size="sm">
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card>
        <CardHeader>
          <CardTitle>Código QR</CardTitle>
          <CardDescription>
            Los clientes escanean este código para unirse a la cola
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            URL pública:{" "}
            <code className="rounded bg-muted px-1 py-0.5">
              /restaurant/{restaurant?.slug}
            </code>
          </div>
          <Button variant="outline" size="sm" onClick={downloadQr}>
            <Download className="mr-2 h-4 w-4" />
            Descargar QR
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Operational config */}
      <Card>
        <CardHeader>
          <CardTitle>Parámetros operativos</CardTitle>
          <CardDescription>
            Tiempos y límites que controlan el comportamiento del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveConfig} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Timeout confirmación (min)</Label>
                <Input
                  type="number"
                  min={1}
                  value={confirmTimeout}
                  onChange={(e) => setConfirmTimeout(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Gracia no-show (min)</Label>
                <Input
                  type="number"
                  min={1}
                  value={noshowGrace}
                  onChange={(e) => setNoshowGrace(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Duración media mesa (min)</Label>
                <Input
                  type="number"
                  min={1}
                  value={avgDuration}
                  onChange={(e) => setAvgDuration(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Ventana protección reservas (min)</Label>
                <Input
                  type="number"
                  min={1}
                  value={protectionWindow}
                  onChange={(e) => setProtectionWindow(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tamaño máximo de cola (vacío = sin límite)</Label>
              <Input
                type="number"
                min={1}
                placeholder="Sin límite"
                value={maxQueue}
                onChange={(e) => setMaxQueue(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm">
              <Save className="mr-2 h-4 w-4" />
              Guardar configuración
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
