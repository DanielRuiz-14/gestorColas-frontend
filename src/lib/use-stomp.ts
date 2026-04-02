"use client";

import { useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type MessageHandler = (body: unknown) => void;

export function useStomp(
  topics: Record<string, MessageHandler>,
) {
  const { restaurantId, isAuthenticated } = useAuth();
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !restaurantId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_URL}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    client.onConnect = () => {
      for (const [topic, handler] of Object.entries(topics)) {
        const destination = `/topic/restaurant/${restaurantId}/${topic}`;
        client.subscribe(destination, (message) => {
          try {
            handler(JSON.parse(message.body));
          } catch {
            // ignore parse errors
          }
        });
      }
    };

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [isAuthenticated, restaurantId, topics]);
}

export function useQueueUpdates(onUpdate: MessageHandler) {
  const handlers = useStableHandlers({
    "queue.updated": onUpdate,
  });
  useStomp(handlers);
}

export function useTableUpdates(onUpdate: MessageHandler) {
  const handlers = useStableHandlers({
    "table.updated": onUpdate,
  });
  useStomp(handlers);
}

export function useReservationUpdates(onUpdate: MessageHandler) {
  const handlers = useStableHandlers({
    "reservation.updated": onUpdate,
  });
  useStomp(handlers);
}

export function useAllUpdates(handlers: {
  onQueue?: MessageHandler;
  onTable?: MessageHandler;
  onReservation?: MessageHandler;
}) {
  const stableHandlers = useStableHandlers({
    ...(handlers.onQueue && { "queue.updated": handlers.onQueue }),
    ...(handlers.onTable && { "table.updated": handlers.onTable }),
    ...(handlers.onReservation && { "reservation.updated": handlers.onReservation }),
  });
  useStomp(stableHandlers);
}

// Stabilize handler references to prevent reconnection loops
function useStableHandlers(handlers: Record<string, MessageHandler>) {
  const ref = useRef(handlers);
  ref.current = handlers;

  const stable = useRef<Record<string, MessageHandler>>({});

  for (const key of Object.keys(handlers)) {
    if (!stable.current[key]) {
      stable.current[key] = (...args: Parameters<MessageHandler>) =>
        ref.current[key]?.(...args);
    }
  }

  // Clean removed keys
  for (const key of Object.keys(stable.current)) {
    if (!handlers[key]) delete stable.current[key];
  }

  return stable.current;
}
