import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { getUserFromCookie } from "@/utils/cookie";
import EmitEvents from "@/utils/socket/EmitEvents";
import SocketEventListener from "@/utils/socket/SocketEventListener";
import {
  ETeam,
  IActionResponse,
  IMatchExpRel,
  IMatchRelatives,
  INetRelatives,
  IOvertimeData,
  IRoom,
  IRoomNets,
  IRoundRelatives,
  IServerReceiverOnNetMixed,
  IServerReceiverSinglePlay,
  ITeam,
  ITeiBreakerAction,
  IUpdateScoreResponse,
} from "@/types";

interface UseMatchSocketProps {
  currNetNum: number;
  netByNum: Map<number, INetRelatives>;
  teamA: ITeam | null;
  teamB: ITeam | null;
  currRound: IRoundRelatives | null;
  roundList: IRoundRelatives[];
  socket: Socket | null;
  match: IMatchRelatives;
  allNets: INetRelatives[];
  currRoundNets: INetRelatives[];
  serverReceiversOnNet: IServerReceiverOnNetMixed[];
  serverReceiverPlays: IServerReceiverSinglePlay[];
  currServerReceiver: IServerReceiverOnNetMixed | null;
}

export default function useMatchSocket({
  currNetNum,
  netByNum,
  teamA,
  teamB,
  currRound,
  roundList,
  socket,
  match,
  allNets,
  currRoundNets,
  serverReceiversOnNet,
  serverReceiverPlays,
  currServerReceiver,
}: UseMatchSocketProps) {
  const dispatch = useAppDispatch();
  const joinRoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handlersRegisteredRef = useRef(false);

  // Function to join room
  const joinRoom = (socketInstance: Socket) => {
    if (!roundList.length) {
      console.warn("No round list available");
      return;
    }

    const userDetail = getUserFromCookie();
    const emitEvents = new EmitEvents(socketInstance, dispatch);

    // Clear any existing timeout
    if (joinRoomTimeoutRef.current) {
      clearTimeout(joinRoomTimeoutRef.current);
      joinRoomTimeoutRef.current = null;
    }

    // Join room with a small delay to ensure socket is properly connected
    joinRoomTimeoutRef.current = setTimeout(() => {
      emitEvents.joinRoom({
        user: userDetail,
        teamA,
        teamB,
        currRound: currRound,
        matchId: match._id,
      });
      console.info("Joined room on socket:", socketInstance.id);
    }, 100);
  };

  // Selectors
  useEffect(() => {
    console.log("Handling socket");
    
    if (!socket) {
      console.warn("No socket available");
      return;
    }

    const listener = new SocketEventListener(socket, dispatch);

    // Event handlers
    const handlers = {
      "extend-overtime-response-all": (data: IOvertimeData) =>
        listener.updateExtendOvertime({
          data,
          dispatch,
          match,
        }),
      "join-room-response-all": (data: IRoom) =>
        listener.handleJoinRoom(data, dispatch),
      "check-in-response-to-all": (data: IRoom) =>
        listener.handleCheckInResponse({
          data,
          dispatch,
          roundList,
          currentRound: currRound,
        }),
      "undo-check-in-response-to-all": (data: IRoom) =>
        listener.handleUndoCheckInResponse({
          data,
          dispatch,
          roundList,
          currentRound: currRound,
        }),

      "submit-lineup-response-all": (data: IRoomNets) =>
        listener.handleLineupResponse({
          data,
          dispatch,
          currRoundNets,
          allNets,
          roundList,
          currentRound: currRound,
          currMatch: match,
        }),
      "update-points-response-all": (data: IUpdateScoreResponse) =>
        listener.handleUpdatePoints({
          data,
          dispatch,
          currRoundNets,
          allNets,
          currentRound: currRound,
          roundList,
          match,
        }),
      "tie-breaker-response-all": (data: ITeiBreakerAction) =>
        listener.handleUpdateNet({
          data,
          dispatch,
          allNets,
          currRoundNets,
          roundList,
          match,
        }),
      "error-from-server": (error: string) =>
        listener.handleError(error, dispatch),

      // Server receiver actions
      "service-fault-from-server": (data: IActionResponse) =>
        listener.handleServiceFaultResponse({
          data,
          dispatch,
          serverReceiversOnNet,
          serverReceiverPlays,
          currServerReceiver,
        }),
      "ace-no-touch-from-server": (data: IActionResponse) =>
        listener.handleAceNoTouchResponse({
          data,
          dispatch,
          serverReceiversOnNet,
          serverReceiverPlays,
          currServerReceiver,
        }),
      "ace-no-third-touch-from-server": (data: IActionResponse) =>
        listener.handleAceNoThirdTouchResponse({
          data,
          dispatch,
          serverReceiversOnNet,
          serverReceiverPlays,
          currServerReceiver,
        }),
      "one-two-three-put-away-from-server": (data: IActionResponse) =>
        listener.handleOneTwoThreePutAwayResponse({
          data,
          dispatch,
          serverReceiversOnNet,
          serverReceiverPlays,
          currServerReceiver,
        }),
      "rally-conversion-from-server": (data: IActionResponse) =>
        listener.handleRalleyConversionResponse({
          data,
          dispatch,
          serverReceiversOnNet,
          serverReceiverPlays,
          currServerReceiver,
        }),
      "defensive-conversion-from-server": (data: IActionResponse) =>
        listener.handleDefensiveConversionResponse({
          data,
          dispatch,
          serverReceiversOnNet,
          serverReceiverPlays,
          currServerReceiver,
        }),
      "receiving-hitting-error-from-server": (data: IActionResponse) =>
        listener.handleHittingErrorResponse({
          data,
          dispatch,
          serverReceiversOnNet,
          serverReceiverPlays,
          currServerReceiver,
        }),
      "server-do-not-know-from-server": (data: IActionResponse) =>
        listener.handleServerDoNotKnowResponse({
          data,
          dispatch,
          serverReceiversOnNet,
          serverReceiverPlays,
          currServerReceiver,
        }),
      "receiver-do-not-know-from-server": (data: IActionResponse) =>
        listener.handleReceiverDoNotKnowResponse({
          data,
          dispatch,
          serverReceiversOnNet,
          serverReceiverPlays,
          currServerReceiver,
        }),

      "reset-score-from-server": (data: { net: string }) =>
        listener.handleResetServerReceiver({
          data,
          dispatch,
          serverReceiversOnNet,
          serverReceiverPlays,
          currServerReceiver,
        }),
      "set-players-from-server": (data: IServerReceiverOnNetMixed) =>
        listener.handleSetPlayers({
          data,
          dispatch,
          serverReceiversOnNet,
          currServerReceiver,
          currNetNum,
          currRound,
          netByNum,
        }),
      "revert-play-from-server": (data: IServerReceiverOnNetMixed) =>
        listener.handleRevertPlay({
          data,
          dispatch,
          serverReceiversOnNet,
          serverReceiverPlays,
          currServerReceiver,
          currNetNum,
          netByNum,
        }),
    };

    // Register event listeners only once
    if (!handlersRegisteredRef.current) {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.on(event, handler);
      });
      handlersRegisteredRef.current = true;
    }

    // Join room initially
    joinRoom(socket);

    // Handle reconnect event
    const handleReconnect = () => {
      console.info("Socket reconnected, rejoining room...");
      joinRoom(socket);
    };

    socket.on("reconnect", handleReconnect);

    // Handle disconnect event
    const handleDisconnect = (reason: string) => {
      console.info("Socket disconnected:", reason);
      handlersRegisteredRef.current = false;
    };

    socket.on("disconnect", handleDisconnect);

    // Cleanup function
    return () => {
      // Clear timeout
      if (joinRoomTimeoutRef.current) {
        clearTimeout(joinRoomTimeoutRef.current);
      }

      // Remove reconnect and disconnect listeners
      socket.off("reconnect", handleReconnect);
      socket.off("disconnect", handleDisconnect);

      // Remove all event handlers if socket is still connected
      if (socket.connected) {
        Object.keys(handlers).forEach((event) => {
          socket.off(event);
        });
      }

      handlersRegisteredRef.current = false;
    };
  }, [
    socket,
    dispatch,
    teamA,
    teamB,
    currRound,
    roundList,
    currRoundNets,
    allNets,
    match,
    match._id,
    currNetNum,
    netByNum,
    serverReceiversOnNet,
    serverReceiverPlays,
    currServerReceiver,
  ]);
}
