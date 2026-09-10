import React, { useCallback, useMemo } from 'react';
import { CldImage } from 'next-cloudinary';
import { useSocket } from '@/lib/SocketProvider';
import { useUser } from '@/lib/UserProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setVerifyLineup } from '@/redux/slices/matchesSlice';
import { ETeam, ITeam } from '@/types/team';
import EmitEvents from '@/utils/socket/EmitEvents';
import {
  EPlayerStatus,
  IMatchRelatives,
  INetRelatives,
  IPlayer,
  IRoundRelatives,
} from '@/types';
import { ETeamPlayer } from '@/types/net';
import { EActionProcess } from '@/types/room';
import LocalStorageService from '@/utils/LocalStorageService';
import {
  getAssignedPlayerIds,
  getAvailableSubs,
  getMovedPlayerIds,
  isActivePlayer,
} from '@/utils/match/captainViewHelpers';
import SubbedPlayersPanel from '../match/CaptainMatchView/SubbedPlayersPanel';
import { createPlayerMap, createRankingMap } from '@/utils/match/verifyLineupHelper';
import VerifyNetBox from './VerifyNetBox';




// ============================================================================
// Main Component
// ============================================================================

const VerifyLineup = () => {
  const socket = useSocket();
  const user = useUser();
  const dispatch = useAppDispatch();

  const currentRoom = useAppSelector((state) => state.rooms.current);
  const { teamAPlayers, teamBPlayers } = useAppSelector((state) => state.players);
  const { current: currentEvent } = useAppSelector((state) => state.events);
  const { teamAPlayerRanking, teamBPlayerRanking } = useAppSelector((state) => state.playerRanking);
  const { match, myPlayers, myTeamE } = useAppSelector((state) => state.matches);
  const { current: currentRound, roundList } = useAppSelector((state) => state.rounds);
  const { teamA, teamB } = useAppSelector((state) => state.teams);
  const { currentRoundNets } = useAppSelector((state) => state.nets);

  // Memoized Maps for O(1) lookups
  const currentTeamPlayers = useMemo<IPlayer[]>(
    () => (myTeamE === ETeam.teamA ? teamAPlayers : teamBPlayers),
    [myTeamE, teamAPlayers, teamBPlayers]
  );

  const playerMap = useMemo<Map<string, IPlayer>>(
    () => createPlayerMap(currentTeamPlayers),
    [currentTeamPlayers]
  );

  const rankingMap = useMemo<Map<string, number>>(
    () => createRankingMap(teamAPlayerRanking?.rankings, teamBPlayerRanking?.rankings),
    [teamAPlayerRanking, teamBPlayerRanking]
  );

  const assignedPlayerIds = useMemo<Set<string>>(
    () => getAssignedPlayerIds(currentRoundNets),
    [currentRoundNets]
  );

  const movedPlayerIds = useMemo<Set<string>>(
    () => getMovedPlayerIds(teamA, teamB),
    [teamA, teamB]
  );

  const subbedPlayers = useMemo<IPlayer[]>(
    () => getAvailableSubs(currentTeamPlayers, movedPlayerIds, assignedPlayerIds),
    [currentTeamPlayers, movedPlayerIds, assignedPlayerIds]
  );

  // Event Handlers
  const handleCloseLineup = useCallback(() => {
    dispatch(setVerifyLineup(false));
  }, [dispatch]);

  const handleSubmitLineup = useCallback(() => {
    if (!socket) {
      console.error('VerifyLineup: cannot submit lineup — socket is not connected.');
      return;
    }
    if (!currentEvent?._id) {
      console.error('VerifyLineup: cannot submit lineup — no active event.');
      return;
    }
    if (!currentRound?._id) {
      console.error('VerifyLineup: cannot submit lineup — no active round.');
      return;
    }

    try {
      const emitEvents = new EmitEvents(socket, dispatch);
      const activePlayerIds: string[] = myPlayers.filter(isActivePlayer).map((player) => player._id);

      emitEvents.submitLineup({
        eventId: currentEvent._id,
        currRoom: currentRoom,
        currRound: currentRound,
        currRoundNets: currentRoundNets,
        dispatch,
        myPlayerIds: activePlayerIds,
        myTeamE: myTeamE,
        roundList,
        socket,
        user,
        teamA,
        teamB,
        match,
      });

      LocalStorageService.removeAssignClock(currentRound._id);
    } catch (error) {
      console.error('VerifyLineup: failed to submit lineup.', error);
    }
  }, [
    socket, dispatch, myPlayers, currentEvent, currentRoom, currentRound, 
    currentRoundNets, myTeamE, roundList, user, teamA, teamB, match,
  ]);

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col z-20 h-full max-h-[90vh]">
      
      {/* Ultra-compact Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-yellow-400 rounded-full"></div>
          <h3 className="text-base font-bold tracking-tight text-gray-900">Assigned Nets</h3>
        </div>
        <button 
          onClick={handleCloseLineup} 
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors" 
          aria-label="Close lineup modal"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scroll-Free Content Area */}
      <div className="flex-1 p-3 bg-gray-50/50 min-h-0 flex flex-col gap-3">
        
        {/* Highly Responsive Grid (Fits up to 5 columns on XL screens to save vertical space) */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 min-h-0">
          {currentRoundNets.map((net) => (
            <VerifyNetBox
              key={net._id}
              crn={net}
              myTeamE={myTeamE}
              playerMap={playerMap}
              rankingMap={rankingMap}
            />
          ))}
        </div>

        {/* Compact Subbed Players Section */}
        {!match?.extendedOvertime && subbedPlayers.length > 0 && (
          <div className="shrink-0 bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
            <SubbedPlayersPanel players={subbedPlayers} />
          </div>
        )}
      </div>

      {/* Ultra-compact Footer */}
      <div className="border-t border-gray-200 bg-white py-2 px-4 flex justify-end items-center gap-2">
        <button
          type="button"
          className="px-5 py-1.5 rounded-lg bg-white text-gray-700 text-sm font-semibold border border-gray-300 hover:bg-gray-50 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-200"
          onClick={handleCloseLineup}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-6 py-1.5 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 text-black text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-yellow-300"
          onClick={handleSubmitLineup}
        >
          Submit Lineup
        </button>
      </div>
    </div>
  );
};

export default VerifyLineup;