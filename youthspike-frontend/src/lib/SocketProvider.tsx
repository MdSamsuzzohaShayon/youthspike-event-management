'use client'

import { SOCKET_URL } from '@/utils/keys';
import React, { useContext } from 'react';
import { io, Socket } from 'socket.io-client';


export const ThemeContext = React.createContext(null);

// Hook
export function useSocket() {
  return useContext(ThemeContext);
}


// Provider
function SocketProvider({ children }: React.PropsWithChildren) {
  const [socket, setSocket] = React.useState<any | null>(null);

  React.useEffect(() => {    
    setSocket(io(SOCKET_URL));
  }, []);

  return <ThemeContext.Provider value={socket}>{children}</ThemeContext.Provider>;
}

export default SocketProvider;