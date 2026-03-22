import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getApiBase } from '../config';

export function useWebSocket(
  topics: { destination: string; callback: (data: any) => void }[]
) {
  const clientRef = useRef<Client | null>(null);

  const connect = useCallback(() => {
    try {
      const client = new Client({
        webSocketFactory: () => new SockJS(`${getApiBase()}/ws`),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log('WebSocket connected');
          topics.forEach(({ destination, callback }) => {
            client.subscribe(destination, (message) => {
              try {
                const data = JSON.parse(message.body);
                callback(data);
              } catch (e) {
                console.error('Failed to parse message:', e);
              }
            });
          });
        },
        onStompError: (frame) => {
          console.error('WebSocket STOMP error:', frame);
        },
        onWebSocketError: (event) => {
          console.error('WebSocket connection error:', event);
        },
      });

      client.activate();
      clientRef.current = client;
    } catch (err) {
      console.error('Failed to initialize WebSocket:', err);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [connect]);

  return clientRef;
}
