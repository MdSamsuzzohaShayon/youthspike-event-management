/* eslint-disable no-nested-ternary */

'use client';

/* eslint-disable no-unused-vars */
import React, { useEffect, useCallback } from 'react';

// Hooks
import useResizeObserver from '@/hooks/useResizeObserver';

// Components
import RoundRunner from '@/components/match/RoundRunner';
import NetScoreOfRound from '@/components/match/NetScoreOfRound';

// Redux
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setScreenSize } from '@/redux/slices/elementSlice';

// Utils
import { getCookie, getUserFromCookie } from '@/utils/cookie';
// Types
import { useUser } from '@/lib/UserProvider';
import { useSocket } from '@/lib/SocketProvider';
import { UserRole } from '@/types/user';
import LineupStrategy from '@/components/match/LineupStrategy';
import VerifyLineup from '@/components/ActionBoxes/VerifyLineup';
import NotTieBreaker from '@/components/ActionBoxes/NotTieBreaker';

import './Match.css';
import { setCurrentRound, setRoundList } from '@/redux/slices/roundSlice';
import { IRoom, IRoomRoundProcess, IRoundRelatives, IUpdateScoreResponse } from '@/types';
import EmitEvents from '@/utils/socket/EmitEvents';
import { setCurrentRoom } from '@/redux/slices/roomSlice';


export function MatchPage({ params }: { params: { matchId: string } }) {
  // ===== Hooks =====
  const dispatch = useAppDispatch();
  const user = useUser();
  const socket = useSocket();

  // ===== Redux States =====
  const { teamA, teamB } = useAppSelector((state) => state.teams);
  const { current: currentRound, roundList } = useAppSelector((state) => state.rounds);
  const { currentRoundNets: currRoundNets, nets: allNets, notTieBreakerNetId } = useAppSelector((state) => state.nets);
  const { myPlayers, opPlayers, myTeamE, verifyLineup, match: currMatch, teamATotalScore, teamBTotalScore } = useAppSelector((state) => state.matches);
  const { current: currRoom } = useAppSelector((state) => state.rooms);


  // ===== Component resize =====
  const onResize = useCallback((target: HTMLDivElement, entry: ResizeObserverEntry) => {
    dispatch(setScreenSize(entry.contentRect.width));
  }, []);

  const mainEl = useResizeObserver(onResize);

  const handleJoinRoom = (roomData: IRoom) => {
    dispatch(setCurrentRoom(roomData));
  }

  const handleCheckInResponse = (checkInData: IRoom) => {

    // Set current round and round list
    const updatedRoundList: IRoundRelatives[] = [];
    let currRoundObj: null | IRoundRelatives = null;
    const roomRounds: IRoomRoundProcess[] = [...checkInData.rounds];
    if (roomRounds.length > 0) {
      for (let i = 0; i < roomRounds.length; i += 1) {
        if (roomRounds[i].teamAProcess && roomRounds[i].teamBProcess) {
          const teamProcessObj = { teamAProcess: roomRounds[i].teamAProcess, teamBProcess: roomRounds[i].teamBProcess };
          const roundObj = roundList.find((r) => r._id === roomRounds[i]._id);
          if (roundObj) {
            // @ts-ignore
            updatedRoundList.push({ ...roundObj, ...teamProcessObj });
            if (roomRounds[i]._id === currentRound?._id) {
              // @ts-ignore
              currRoundObj = { ...roundObj, ...teamProcessObj };
            }
          }
        }
      }

      // Temp - Creating an issue running this again and again
      dispatch(setRoundList(updatedRoundList));
      if (currRoundObj) dispatch(setCurrentRound(currRoundObj));
    }
  }


  // ===== Web Socket Real Time connection =====
  useEffect(() => {
    const userDetail = getUserFromCookie();

    if (socket && roundList?.length > 0) {
      // Initialize emitEvents with the socket and dispatch props
      const emitEvents = new EmitEvents(socket, dispatch);

      // Emit join room event when the socket is available and round list has data
      emitEvents.joinRoom({
        user: userDetail,
        teamA,
        teamB,
        currRound: currentRound,
        matchId: params.matchId,
      });

      // Listen to socket events for joining the room
      socket.on('join-room-response-all', handleJoinRoom);
      socket.on('check-in-response-to-all', (checkInData: IRoom) => handleCheckInResponse(checkInData, dispatch, roundList, currentRound));
    }

    return () => {
      // Clean up event listeners to avoid memory leaks
      socket?.off('join-room-response-all', handleJoinRoom);
      socket?.off('check-in-response-to-all', handleCheckInResponse);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, user, teamA, teamB, currentRound, roundList, params.matchId]);

  return (
    <div className="h-full relative bg-white text-black-logo" ref={mainEl}>
      {/* Level 6 start: main match  */}
      <div className="main-match-wrapper w-full">
        {notTieBreakerNetId ? (
          <div className="not-tie-breaker w-full bg-white text-black-logo ">
            <NotTieBreaker teamA={teamA} teamB={teamB} ntbnId={notTieBreakerNetId} currRoundNets={currRoundNets} currRound={currentRound} socket={socket} />
          </div>
        ) : (
          <div className="verify-stategy-main-points">
            {verifyLineup ? (
              <VerifyLineup />
            ) : (
              <>
                {currentRound && (
                  <div className="net-score">
                    <NetScoreOfRound currRoundId={currentRound._id} />
                  </div>
                )}
                <div className="w-full line-up-starategy">
                  <LineupStrategy
                    myTeamE={myTeamE}
                    currRound={currentRound}
                    myPlayers={myPlayers}
                    opPlayers={opPlayers}
                    currRoundNets={currRoundNets}
                    allNets={allNets}
                    roundList={roundList}
                    currMatch={currMatch}
                  />
                </div>
                {user &&
                  user.info &&
                  currRoom &&
                  (user.info.role === UserRole.captain || user.info.role === UserRole.co_captain || user.info.role === UserRole.director || user.info.role === UserRole.admin) && (
                    <div className="my-round-runner w-full">
                      <RoundRunner currentRoom={currRoom} currentRound={currentRound} myTeamE={myTeamE} roundList={roundList} teamA={teamA} currRoundNets={currRoundNets} />
                    </div>
                  )}
              </>
            )}
          </div>
        )}
      </div>
      {/* Level 6 end: main match  */}
    </div>
  );
}

export default MatchPage;
