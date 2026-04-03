"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { publicGet, publicPost, publicDelete } from "@/lib/api";
import type { PublicQueueEntryResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Hash, Users, CheckCircle, XCircle, Bell } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }
> = {
  WAITING: { label: "En espera", variant: "secondary", icon: Clock },
  NOTIFIED: { label: "Tu turno", variant: "default", icon: Bell },
  SEATED: { label: "Sentado", variant: "default", icon: CheckCircle },
  CANCELLED: { label: "Cancelado", variant: "destructive", icon: XCircle },
  EXPIRED: { label: "Expirado", variant: "destructive", icon: XCircle },
};

export default function QueueTrackingPage() {
  const params = useParams<{ entryId: string }>();
  const searchParams = useSearchParams();
  const entryId = params.entryId;

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [entry, setEntry] = useState<PublicQueueEntryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Resolve access token
  useEffect(() => {
    const fromUrl = searchParams.get("accessToken");
    const fromStorage = localStorage.getItem(`queue_${entryId}`);
    const token = fromUrl ?? fromStorage;
    if (token) {
      setAccessToken(token);
      localStorage.setItem(`queue_${entryId}`, token);
    } else {
      setError("Token de acceso no encontrado");
      setLoading(false);
    }
  }, [entryId, searchParams]);

  // Load initial state
  useEffect(() => {
    if (!accessToken) return;
    async function load() {
      try {
        const data = await publicGet<PublicQueueEntryResponse>(
          `/queue/${entryId}?accessToken=${accessToken}`,
        );
        setEntry(data);
      } catch {
        setError("Entrada no encontrada");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [entryId, accessToken]);

  // SSE connection
  useEffect(() => {
    if (!accessToken || !entry) return;
    if (entry.status === "SEATED" || entry.status === "CANCELLED" || entry.status === "EXPIRED") return;

    const url = `${API_URL}/public/queue/${entryId}/events?accessToken=${accessToken}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener("queue.status", (event) => {
      try {
        const data = JSON.parse(event.data) as PublicQueueEntryResponse;
        setEntry(data);

        if (data.status === "NOTIFIED") {
          toast.info("Es tu turno — confirma tu asistencia");
        } else if (data.status === "SEATED") {
          toast.success("Mesa asignada");
        }
      } catch {
        // ignore parse errors
      }
    });

    es.onerror = () => {
      es.close();
      // Reconnect after 5s
      setTimeout(() => {
        if (eventSourceRef.current === es) {
          setEntry((prev) => prev); // trigger re-render to reconnect
        }
      }, 5000);
    };

    return () => es.close();
  }, [entryId, accessToken, entry?.status]);

  const handleConfirm = useCallback(async () => {
    if (!accessToken) return;
    setConfirming(true);
    try {
      const data = await publicPost<PublicQueueEntryResponse>(
        `/queue/${entryId}/confirm?accessToken=${accessToken}`,
      );
      setEntry(data);
      toast.success("Asistencia confirmada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al confirmar");
    } finally {
      setConfirming(false);
    }
  }, [entryId, accessToken]);

  const handleCancel = useCallback(async () => {
    if (!accessToken) return;
    setCancelling(true);
    try {
      await publicDelete(`/queue/${entryId}?accessToken=${accessToken}`);
      setEntry((prev) =>
        prev ? { ...prev, status: "CANCELLED" } : prev,
      );
      toast.success("Entrada cancelada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cancelar");
    } finally {
      setCancelling(false);
    }
  }, [entryId, accessToken]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const config = statusConfig[entry.status] ?? statusConfig.WAITING;
  const isActive = entry.status === "WAITING" || entry.status === "NOTIFIED";
  const StatusIcon = config.icon;

  return (
    <div className="flex min-h-screen flex-col items-center bg-muted/40 px-4 py-8">
      <div className="w-full max-w-md space-y-4">
        {/* Status banner */}
        <Card
          className={
            entry.status === "NOTIFIED"
              ? "border-primary bg-primary/5"
              : undefined
          }
        >
          <CardHeader className="text-center">
            <div className="mx-auto mb-2">
              <StatusIcon
                className={`h-12 w-12 ${
                  entry.status === "NOTIFIED"
                    ? "text-primary animate-pulse"
                    : "text-muted-foreground"
                }`}
              />
            </div>
            <Badge variant={config.variant} className="mx-auto">
              {config.label}
            </Badge>
            <CardTitle className="mt-2 text-xl">{entry.customerName}</CardTitle>
            <CardDescription>
              Grupo de {entry.partySize} persona{entry.partySize > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Position & time */}
        {isActive && (
          <Card>
            <CardContent className="flex items-center justify-around py-6">
              <div className="flex flex-col items-center gap-1">
                <Hash className="h-5 w-5 text-muted-foreground" />
                <span className="text-3xl font-bold">{entry.position}</span>
                <span className="text-sm text-muted-foreground">posición</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-3xl font-bold">
                  ~{entry.estimatedWaitMinutes ?? 0}
                </span>
                <span className="text-sm text-muted-foreground">min</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-3xl font-bold">{entry.partySize}</span>
                <span className="text-sm text-muted-foreground">personas</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirm button (when NOTIFIED) */}
        {entry.status === "NOTIFIED" && (
          <Button
            className="w-full py-6 text-lg"
            size="lg"
            onClick={handleConfirm}
            disabled={confirming}
          >
            {confirming ? "Confirmando..." : "Confirmar asistencia"}
          </Button>
        )}

        {/* Cancel button */}
        {isActive && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? "Cancelando..." : "Cancelar mi turno"}
          </Button>
        )}

        {/* Final states */}
        {entry.status === "SEATED" && (
          <Card className="border-green-500 bg-green-50">
            <CardContent className="py-6 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
              <p className="mt-2 text-lg font-medium text-green-800">
                Mesa asignada. Disfruta tu visita.
              </p>
            </CardContent>
          </Card>
        )}

        {(entry.status === "CANCELLED" || entry.status === "EXPIRED") && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="py-6 text-center">
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <p className="mt-2 text-lg font-medium">
                {entry.status === "CANCELLED"
                  ? "Tu entrada ha sido cancelada."
                  : "Tu turno ha expirado."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
