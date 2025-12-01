import {
  IPlayerStats,
  IServerReceiverOnNetMixed,
} from "@/types";
import EmitEvents from "@/utils/socket/EmitEvents";
import SocketEventListener from "@/utils/socket/SocketEventListener";
import { ApolloClient } from "@apollo/client";
import { useEffect } from "react";
import { Socket } from "socket.io-client";

interface IUsePlayerSocketProps {
  socket: Socket | null;
  dispatch: React.Dispatch<React.SetStateAction<any>>;
  playerId: string;
  apolloClient: ApolloClient;
}

const usePlayerSocket = ({
  socket,
  dispatch,
  playerId,
  apolloClient
}: IUsePlayerSocketProps) => {
  useEffect(() => {
    if (!socket || !playerId) {
      console.warn("No socket or player available");
      return;
    }
    console.info("Socket connected");

    const emitEvents = new EmitEvents(socket, dispatch);
    const listener = new SocketEventListener(socket, dispatch);

    // Join room
    // Create a room for a player with player id, all users who see their stats will be connected to the room.
    emitEvents.joinPlayerRoom({ playerId });
    // So all users will get update about that player stats

    // Event handlers
    const handlers = {
      "join-room-from-server": (data: { success: boolean; playerId: string }) =>
        listener.handleJoinPlayerRoom(data),
      "update-player-stats-from-server": (data: Record<string, IPlayerStats>) =>
        listener.handleUpdatePlayerStats({ playerId, data, apolloClient }),
      "error-from-server": (error: string) =>
        listener.handleError(error, dispatch),
      // revert-play-from-server
      "revert-player-notify": ({players}: {players: string}) =>{
        
        window.location.reload();
      },
    };

    // Register event listeners
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // Cleanup function
    return () => {
      emitEvents.leavePlayerRoom({ playerId });

      Object.keys(handlers).forEach((event) => {
        socket.off(event);
      });
    };
  }, [socket]);
};

export default usePlayerSocket;
