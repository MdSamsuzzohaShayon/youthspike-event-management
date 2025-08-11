import React, { useEffect } from 'react';
import EmitEvents from '@/utils/socket/EmitEvents';
import SocketEventListener from '@/utils/socket/SocketEventListener';
import { IActionResponse, IRevertPlayInput, IRoundRelatives, IServerReceiverOnNetMixed, IServerReceiverSinglePlay, ITeam } from '@/types';
import { getUserFromCookie } from '@/utils/cookie';
import { Socket } from 'socket.io-client';

interface IServerReceiverSocketProps {
  socket: Socket | null;
  dispatch: React.Dispatch<React.SetStateAction<any>>;
  roundList: IRoundRelatives[];
  teamA: ITeam | null | undefined;
  teamB: ITeam | null | undefined;
  currRound: IRoundRelatives | null;
  matchId: string;
  serverReceiversOnNet: IServerReceiverOnNetMixed[];
  serverReceiverPlays: IServerReceiverSinglePlay[];
  setActionPreview: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function useServerReceiverSocket({ socket, dispatch, roundList, teamA, teamB, currRound, matchId, serverReceiversOnNet, serverReceiverPlays, setActionPreview }: IServerReceiverSocketProps) {
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
      'service-fault-from-server': (data: IActionResponse) => listener.handleServiceFaultResponse({ data, dispatch, serverReceiversOnNet, serverReceiverPlays }),
      'ace-no-touch-from-server': (data: IActionResponse) => listener.handleAceNoTouchResponse({ data, dispatch, serverReceiversOnNet, serverReceiverPlays }),
      'ace-no-third-touch-from-server': (data: IActionResponse) => listener.handleAceNoThirdTouchResponse({ data, dispatch, serverReceiversOnNet, serverReceiverPlays }),
      'one-two-three-put-away-from-server': (data: IActionResponse) => listener.handleOneTwoThreePutAwayResponse({ data, dispatch, serverReceiversOnNet, serverReceiverPlays }),
      'rally-conversion-from-server': (data: IActionResponse) => listener.handleRalleyConversionResponse({ data, dispatch, serverReceiversOnNet, serverReceiverPlays }),
      'defensive-conversion-from-server': (data: IActionResponse) => listener.handleDefensiveConversionResponse({ data, dispatch, serverReceiversOnNet, serverReceiverPlays }),
      'receiving-hitting-error-from-server': (data: IActionResponse) => listener.handleHittingErrorResponse({ data, dispatch, serverReceiversOnNet, serverReceiverPlays }),
      'server-do-not-know-from-server': (data: IActionResponse) => listener.handleServerDoNotKnowResponse({ data, dispatch, serverReceiversOnNet, serverReceiverPlays }),
      'receiver-do-not-know-from-server': (data: IActionResponse) => listener.handleReceiverDoNotKnowResponse({ data, dispatch, serverReceiversOnNet, serverReceiverPlays }),
      
      'reset-score-from-server': (data: {net: string}) => listener.handleResetServerReceiver({ data, dispatch, serverReceiversOnNet }),
      'set-players-from-server': (data: IServerReceiverOnNetMixed) => listener.handleSetPlayers({ data, dispatch, serverReceiversOnNet, setActionPreview }),
      'revert-play-from-server': (data: IServerReceiverOnNetMixed) => listener.handleRevertPlay({ data, dispatch, serverReceiversOnNet, serverReceiverPlays }),
      'error-from-server': (err: string) => listener.handleError(err, dispatch),

    } as const;

    Object.entries(handlers).forEach(([evt, fn]) => socket.on(evt, fn));

    return () => Object.keys(handlers).forEach((evt) => socket.off(evt));
  }, [socket, dispatch, roundList, teamA, teamB, currRound, matchId, serverReceiversOnNet, serverReceiverPlays]);
}
