import React, { useEffect } from 'react';
import EmitEvents from '@/utils/socket/EmitEvents';
import SocketEventListener from '@/utils/socket/SocketEventListener';
import { IRoundRelatives, IServerReceiverOnNetMixed, ITeam } from '@/types';
import { getUserFromCookie } from '@/utils/cookie';
import { Socket } from 'socket.io-client';

interface IServerReceiverSocketProps {
  socket: Socket | null;
  dispatch: React.Dispatch<React.ReducerAction<any>>;
  roundList: IRoundRelatives[];
  teamA: ITeam | null | undefined;
  teamB: ITeam | null | undefined;
  currRound: IRoundRelatives | null;
  matchId: string;
  serverReceiversOnNet: IServerReceiverOnNetMixed[];
  setActionPreview: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function useServerReceiverSocket({ socket, dispatch, roundList, teamA, teamB, currRound, matchId, serverReceiversOnNet, setActionPreview }: IServerReceiverSocketProps) {
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
    const handlers = {
      'error-from-server': (err: string) => listener.handleError(err, dispatch),
      'reset-score-from-server': (data: {net: string}) => listener.handleResetServerReceiver({ data, dispatch, serverReceiversOnNet }),
      'set-players-from-server': (data: IServerReceiverOnNetMixed) => listener.handleServerReceiverResponse({ data, dispatch, serverReceiversOnNet, setActionPreview }),
      'service-fault-from-server': (data: IServerReceiverOnNetMixed) => listener.handleServiceFaultResponse({ data, dispatch, serverReceiversOnNet }),
      'ace-no-touch-from-server': (data: IServerReceiverOnNetMixed) => listener.handleAceNoTouchResponse({ data, dispatch, serverReceiversOnNet }),
      'ace-no-third-touch-from-server': (data: IServerReceiverOnNetMixed) => listener.handleAceNoThirdTouchResponse({ data, dispatch, serverReceiversOnNet }),
      'one-two-three-put-away-from-server': (data: IServerReceiverOnNetMixed) => listener.handleOneTwoThreePutAwayResponse({ data, dispatch, serverReceiversOnNet }),
      'rally-conversion-from-server': (data: IServerReceiverOnNetMixed) => listener.handleRalleyConversionResponse({ data, dispatch, serverReceiversOnNet }),
      'defensive-conversion-from-server': (data: IServerReceiverOnNetMixed) => listener.handleDefensiveConversionResponse({ data, dispatch, serverReceiversOnNet }),
      'receiving-hitting-error-from-server': (data: IServerReceiverOnNetMixed) => listener.handleHittingErrorResponse({ data, dispatch, serverReceiversOnNet }),
      // 
    } as const;

    Object.entries(handlers).forEach(([evt, fn]) => socket.on(evt, fn));

    return () => Object.keys(handlers).forEach((evt) => socket.off(evt));
  }, [socket, dispatch, roundList, teamA, teamB, currRound, matchId, serverReceiversOnNet]);
}
