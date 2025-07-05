import React, { useEffect } from 'react';
import EmitEvents from '@/utils/socket/EmitEvents';
import SocketEventListener from '@/utils/socket/SocketEventListener';
import { IRoundRelatives, IServerReceiverOnNet, ITeam } from '@/types';
import { getUserFromCookie } from '@/utils/cookie';
import { Socket } from 'socket.io-client';

interface IServerReceiverSocketProps{
    socket: Socket | null;
    dispatch: React.Dispatch<React.ReducerAction<any>>;
    roundList: IRoundRelatives[];
    teamA: ITeam | null | undefined;
    teamB: ITeam | null | undefined;
    currRound: IRoundRelatives | null;
    matchId: string;
    serverReceiversOnNet: IServerReceiverOnNet[];
}

export default function useServerReceiverSocket({
  socket,
  dispatch,
  roundList,
  teamA,
  teamB,
  currRound,
  matchId,
  serverReceiversOnNet,
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
    const handlers = {
      'error-from-server': (err: string) => listener.handleError(err, dispatch),
      'set-players-from-server': (data: IServerReceiverOnNet) =>
        listener.handleServerReceiverResponse({ data, dispatch, serverReceiversOnNet }),
      'service-fault-from-server': (data: IServerReceiverOnNet)=> listener.handleServiceFaultResponse({ data, dispatch, serverReceiversOnNet }),
    } as const;

    Object.entries(handlers).forEach(([evt, fn]) => socket.on(evt, fn));

    return () => Object.keys(handlers).forEach((evt) => socket.off(evt));

  }, [socket, dispatch, roundList, teamA, teamB, currRound, matchId, serverReceiversOnNet]);
}
