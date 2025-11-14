import {
  IActionResponse,
  IMatchRelatives,
  INetRelatives,
  IRevertPlayInput,
  IRoomNets,
  IRoundRelatives,
  IServerReceiverOnNetMixed,
  IServerReceiverSinglePlay,
  ITeam,
} from "@/types";
import React, { useEffect, useMemo } from "react";
import EmitEvents from "@/utils/socket/EmitEvents";
import SocketEventListener from "@/utils/socket/SocketEventListener";
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
  currRoundNets: INetRelatives[];
  allNets: INetRelatives[];
  currMatch: IMatchRelatives;
}



export default function useServerReceiverSocket(props: IServerReceiverSocketProps) {
  const {
    socket, dispatch, roundList, teamA, teamB, currRound, matchId,
    currNetNum, netByNum, serverReceiversOnNet, serverReceiverPlays,
    currServerReceiver, setActionPreview,
  } = props;


  useEffect(() => {
    if (!socket || !roundList.length) return;

    const emit = new EmitEvents(socket, dispatch);
    const listener = new SocketEventListener(socket, dispatch);

    // join room only once
    emit.joinRoom({ user: getUserFromCookie(), teamA, teamB, currRound, matchId });

    const handlers = {
      "submit-lineup-response-all": () => window?.location?.reload(),
      "service-fault-from-server": (data: IActionResponse) => listener.handleServiceFaultResponse({ data, dispatch, serverReceiversOnNet, serverReceiverPlays, currServerReceiver }),
      "ace-no-touch-from-server": (data: IActionResponse) => listener.handleAceNoTouchResponse({ data, dispatch, serverReceiversOnNet, serverReceiverPlays, currServerReceiver }),
      "ace-no-third-touch-from-server": (data: IActionResponse) => listener.handleAceNoThirdTouchResponse({ data, dispatch, serverReceiversOnNet, serverReceiverPlays, currServerReceiver }),
      "one-two-three-put-away-from-server": (data: IActionResponse) => listener.handleOneTwoThreePutAwayResponse({ data, dispatch, serverReceiversOnNet, serverReceiverPlays, currServerReceiver }),
      "rally-conversion-from-server": (data: IActionResponse) => listener.handleRalleyConversionResponse({ data, dispatch, serverReceiversOnNet, serverReceiverPlays, currServerReceiver }),
      "defensive-conversion-from-server": (data: IActionResponse) => listener.handleDefensiveConversionResponse({ data, dispatch, serverReceiversOnNet, serverReceiverPlays, currServerReceiver }),
      "receiving-hitting-error-from-server": (data: IActionResponse) => listener.handleHittingErrorResponse({ data, dispatch, serverReceiversOnNet, serverReceiverPlays, currServerReceiver }),
      "server-do-not-know-from-server": (data: IActionResponse) => listener.handleServerDoNotKnowResponse({ data, dispatch, serverReceiversOnNet, serverReceiverPlays, currServerReceiver }),
      "receiver-do-not-know-from-server": (data: IActionResponse) => listener.handleReceiverDoNotKnowResponse({ data, dispatch, serverReceiversOnNet, serverReceiverPlays, currServerReceiver }),
      
      "change-server-receiver-manullay": (data: IServerReceiverOnNetMixed) => listener.handleChangeServerReceiver({ data, dispatch, serverReceiversOnNet, currServerReceiver }),
      

      "reset-score-from-server": (data: { net: string }) =>
        listener.handleResetServerReceiver({ data, dispatch, serverReceiversOnNet, serverReceiverPlays, currServerReceiver, setActionPreview }),

      "set-players-from-server": (data: IServerReceiverOnNetMixed) =>
        listener.handleSetPlayers({ data, dispatch, serverReceiversOnNet, setActionPreview, currNetNum, netByNum, currRound, currServerReceiver }),

      "revert-play-from-server": (data: IServerReceiverOnNetMixed) =>
        listener.handleRevertPlay({ data, dispatch, serverReceiversOnNet, serverReceiverPlays, currServerReceiver, netByNum, currNetNum }),

      "error-from-server": (err: string) => listener.handleError(err, dispatch),
    } as const;

    Object.entries(handlers).forEach(([evt, fn]) => socket.on(evt, fn));
    return () => Object.keys(handlers).forEach((evt) => socket.off(evt));
  }, [
    socket, dispatch, roundList, teamA, teamB, currRound, matchId,
    currNetNum, netByNum, serverReceiversOnNet, serverReceiverPlays,
    currServerReceiver, setActionPreview
  ]);
}
