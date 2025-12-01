'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/utils/keys';

export const ThemeContext = createContext<Socket | null>(null);

// Hook
export function useSocket() {
  return useContext(ThemeContext);
}

// Provider
function SocketProvider({ children }: React.PropsWithChildren<{}>) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    newSocket.on("connect", () => {
      console.info("Socket connected:", newSocket.id);
    });

    newSocket.on("disconnect", (reason) => {
      console.info("Socket disconnected:", reason);
    });

    newSocket.on("reconnect", (attempt) => {
      console.info("Socket reconnected after", attempt, "attempts");
    });

    newSocket.on("reconnect_error", (error) => {
      console.info("Socket reconnection error:", error);
    });

    newSocket.on("reconnect_failed", () => {
      console.info("Socket reconnection failed");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      newSocket.removeAllListeners();
    };
  }, []);

  return <ThemeContext.Provider value={socket}>{children}</ThemeContext.Provider>;
}

export default SocketProvider;