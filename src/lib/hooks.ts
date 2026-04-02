"use client";

import useSWR from "swr";
import { staffGet } from "./api";
import { useAuth } from "./auth";
import type {
  QueueEntryResponse,
  TableResponse,
  ReservationResponse,
  RestaurantResponse,
  RestaurantConfigResponse,
} from "./types";

function useStaffSWR<T>(path: string | null) {
  return useSWR<T>(path, staffGet, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });
}

export function useRestaurant() {
  const { restaurantId } = useAuth();
  return useStaffSWR<RestaurantResponse>(
    restaurantId ? `/restaurants/${restaurantId}` : null,
  );
}

export function useConfig() {
  const { restaurantId } = useAuth();
  return useStaffSWR<RestaurantConfigResponse>(
    restaurantId ? `/restaurants/${restaurantId}/config` : null,
  );
}

export function useQueue(status?: string) {
  const { restaurantId } = useAuth();
  const params = status ? `?status=${status}` : "";
  return useStaffSWR<QueueEntryResponse[]>(
    restaurantId ? `/restaurants/${restaurantId}/queue${params}` : null,
  );
}

export function useTables() {
  const { restaurantId } = useAuth();
  return useStaffSWR<TableResponse[]>(
    restaurantId ? `/restaurants/${restaurantId}/tables` : null,
  );
}

export function useAvailableTables(groupSize: number) {
  const { restaurantId } = useAuth();
  return useStaffSWR<TableResponse[]>(
    restaurantId && groupSize > 0
      ? `/restaurants/${restaurantId}/tables/available?groupSize=${groupSize}`
      : null,
  );
}

export function useReservations(status?: string, date?: string) {
  const { restaurantId } = useAuth();
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (date) params.set("date", date);
  const qs = params.toString();
  return useStaffSWR<ReservationResponse[]>(
    restaurantId
      ? `/restaurants/${restaurantId}/reservations${qs ? `?${qs}` : ""}`
      : null,
  );
}
