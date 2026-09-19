import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '@/store/auth';
import type { JobEventMessage } from '@/types/api';

const WS_BASE = import.meta.env.VITE_WS_BASE_URL ?? '';

/**
 * Subscribes to /topic/org/{organizationId}/jobs over STOMP-over-SockJS and keeps a
 * rolling buffer of the most recent live job lifecycle events for the activity feed.
 * Falls back silently (feed just stays empty) if the socket can't connect -- the
 * dashboard's REST-backed data still refreshes independently via polling.
 */
export function useJobEvents(maxEvents = 50) {
  const [events, setEvents] = useState<JobEventMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const organizationId = useAuthStore((s) => s.user?.organizationId);

  useEffect(() => {
    if (!organizationId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE}/ws`),
      reconnectDelay: 4000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/org/${organizationId}/jobs`, (message) => {
          try {
            const parsed: JobEventMessage = JSON.parse(message.body);
            setEvents((prev) => [parsed, ...prev].slice(0, maxEvents));
          } catch {
            // ignore malformed frame
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [organizationId, maxEvents]);

  return { events, connected };
}
