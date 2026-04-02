"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { publicGet, publicPost } from "@/lib/api";
import type {
  PublicRestaurantResponse,
  QueueStatusResponse,
  JoinQueueResponse,
} from "@/lib/types";
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
import { Badge } from "@/components/ui/badge";
import { Users, Clock } from "lucide-react";
import { toast } from "sonner";

export default function RestaurantPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const [restaurant, setRestaurant] = useState<PublicRestaurantResponse | null>(
    null,
  );
  const [queueStatus, setQueueStatus] = useState<QueueStatusResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [rest, status] = await Promise.all([
          publicGet<PublicRestaurantResponse>(`/restaurants/${slug}`),
          publicGet<QueueStatusResponse>(`/restaurants/${slug}/queue/status`),
        ]);
        setRestaurant(rest);
        setQueueStatus(status);
      } catch {
        setError("Restaurante no encontrado");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoining(true);

    try {
      const res = await publicPost<JoinQueueResponse>(
        `/restaurants/${slug}/queue`,
        {
          customerName: name,
          partySize,
          customerPhone: phone || undefined,
        },
      );

      // Store access token for tracking
      localStorage.setItem(`queue_${res.entryId}`, res.accessToken);

      toast.success("Te has unido a la cola");
      router.push(`/queue/${res.entryId}?accessToken=${res.accessToken}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al unirse a la cola",
      );
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>No encontrado</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-muted/40 px-4 py-8">
      <div className="w-full max-w-md space-y-4">
        {/* Restaurant info */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{restaurant.name}</CardTitle>
            {restaurant.description && (
              <CardDescription>{restaurant.description}</CardDescription>
            )}
          </CardHeader>
        </Card>

        {/* Queue status */}
        {queueStatus && (
          <Card>
            <CardContent className="flex items-center justify-around py-6">
              <div className="flex flex-col items-center gap-1">
                <Users className="h-6 w-6 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {queueStatus.waitingCount}
                </span>
                <span className="text-xs text-muted-foreground">
                  en espera
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Clock className="h-6 w-6 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  ~{queueStatus.estimatedWaitMinutes} min
                </span>
                <span className="text-xs text-muted-foreground">
                  tiempo estimado
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Badge
                  variant={queueStatus.queueOpen ? "default" : "destructive"}
                >
                  {queueStatus.queueOpen ? "Abierta" : "Llena"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Join form */}
        {!showForm ? (
          <Button
            className="w-full py-6 text-lg"
            size="lg"
            disabled={!queueStatus?.queueOpen}
            onClick={() => setShowForm(true)}
          >
            {queueStatus?.queueOpen
              ? "Unirme a la cola"
              : "Cola llena"}
          </Button>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Unirse a la cola</CardTitle>
              <CardDescription>
                Introduce tus datos para reservar tu puesto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    placeholder="Tu nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partySize">Personas</Label>
                  <Input
                    id="partySize"
                    type="number"
                    min={1}
                    max={20}
                    value={partySize}
                    onChange={(e) => setPartySize(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono (opcional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+34 600 000 000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={joining}>
                    {joining ? "Entrando..." : "Confirmar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
