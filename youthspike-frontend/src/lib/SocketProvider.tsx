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
    const newSocket = io(SOCKET_URL);
    console.log('Socket connected:', newSocket);
    setSocket(newSocket);

    return () => {
      // Cleanup on component unmount
      newSocket.disconnect();
    };
  }, []);

  return <ThemeContext.Provider value={socket}>{children}</ThemeContext.Provider>;
}

export default SocketProvider;
