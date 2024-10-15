// socketService.ts

import { IRoom, IRoundRelatives, ITeam, IUserContext } from '@/types';
import EmitEvents from '@/utils/socket/EmitEvents';
import React from 'react';
import { Socket } from 'socket.io-client';

export const initializeSocket = (
  socket: Socket,
  dispatch: React.Dispatch<React.ReducerAction<any>>,
  userDetail: IUserContext,
  teamA: ITeam,
  teamB: ITeam,
  currentRound: IRoundRelatives,
  matchId: string,
  roundList: IRoundRelatives[],
) => {
  if (socket && roundList.length > 0) {
    // Initialize emitEvents with the socket and dispatch props
    const emitEvents = new EmitEvents(socket, dispatch);

    // Emit join room event when the socket is available and round list has data
    emitEvents.joinRoom({
      user: userDetail,
      teamA,
      teamB,
      currRound: currentRound,
      matchId,
    });
  }
};

export const setupSocketListeners = (socket: Socket, dispatch: React.Dispatch<React.ReducerAction<any>>, handleJoinRoom: (roomData: IRoom) => void, handleCheckInResponse: (checkInData: IRoom) => void) => {
  socket.on('join-room-response-all', handleJoinRoom);
  socket.on('check-in-response-to-all', handleCheckInResponse);
};

export const cleanupSocketListeners = (socket: Socket, handleJoinRoom: (roomData: IRoom) => void, handleCheckInResponse: (checkInData: IRoom) => void) => {
  socket.off('join-room-response-all', handleJoinRoom);
  socket.off('check-in-response-to-all', handleCheckInResponse);
};
