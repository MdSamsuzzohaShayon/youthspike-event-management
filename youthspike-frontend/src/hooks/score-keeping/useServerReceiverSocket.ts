import React, { useEffect } from "react";
import EmitEvents from "@/utils/socket/EmitEvents";
import SocketEventListener from "@/utils/socket/SocketEventListener";
import {
  IActionResponse,
  INetRelatives,
  IRevertPlayInput,
  IRoundRelatives,
  IServerReceiverOnNetMixed,
  IServerReceiverSinglePlay,
  ITeam,
} from "@/types";
import { getUserFromCookie } from "@/utils/cookie";
import { Socket } from "socket.io-client";

interface IServerReceiverSocketProps {
  socket: Socket | null;
  dispatch: React.Dispatch<React.SetStateAction<any>>;
  roundList: IRoundRelatives[];
  teamA: ITeam | null | undefined;
  teamB: ITeam | null | undefined;
  currRound: IRoundRelatives | null;
  currNetNum: number;
  netByNum: Map<number, INetRelatives>;
  matchId: string;
  serverReceiversOnNet: IServerReceiverOnNetMixed[];
  serverReceiverPlays: IServerReceiverSinglePlay[];
  currServerReceiver: IServerReceiverOnNetMixed | null;
  setActionPreview: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedServer: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedReceiver: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function useServerReceiverSocket({
  socket,
  dispatch,
  roundList,
  teamA,
  teamB,
  currRound,
  matchId,
  currNetNum,
  netByNum,
  serverReceiversOnNet,
  serverReceiverPlays,
  currServerReceiver,
  setSelectedServer,
  setSelectedReceiver,
  setActionPreview,
}: IServerReceiverSocketProps) {
  useEffect(() => {
    if (!socket || !roundList.length) return;

    const emit = new EmitEvents(socket, dispatch);
    emit.joinRoom({
      user: getUserFromCookie(),
      teamA,
      teamB,
      currRound,
      matchId,
    });

    const listener = new SocketEventListener(socket, dispatch);
    // {serverReceiverOnNet: net, singlePlay: currNetObj}
    const handlers = {
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
          setSelectedServer,
          setSelectedReceiver,
        }),
      "set-players-from-server": (data: IServerReceiverOnNetMixed) =>
        listener.handleSetPlayers({
          data,
          dispatch,
          serverReceiversOnNet,
          setActionPreview,
          currNetNum,
          netByNum,
          currRound,
          currServerReceiver,
        }),
      "revert-play-from-server": (data: IServerReceiverOnNetMixed) =>
        listener.handleRevertPlay({
          data,
          dispatch,
          serverReceiversOnNet,
          serverReceiverPlays,
          currServerReceiver,
        }),
      "error-from-server": (err: string) => listener.handleError(err, dispatch),
    } as const;

    Object.entries(handlers).forEach(([evt, fn]) => socket.on(evt, fn));

    return () => Object.keys(handlers).forEach((evt) => socket.off(evt));
  }, [
    socket,
    dispatch,
    roundList,
    teamA,
    teamB,
    currRound,
    matchId,
    currNetNum,
    netByNum,
    serverReceiversOnNet,
    serverReceiverPlays,
    currServerReceiver,
    setSelectedServer,
    setSelectedReceiver,
    setActionPreview,
  ]);
}
