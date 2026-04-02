"use client";

import { useAuth } from "@/lib/auth";

export default function DashboardPage() {
  const { restaurantId } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold">Panel de control</h1>
      <p className="mt-2 text-muted-foreground">
        Bienvenido al panel de gestión de tu restaurante.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Restaurant ID: {restaurantId}
      </p>
    </div>
  );
}
