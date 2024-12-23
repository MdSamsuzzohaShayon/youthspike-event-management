import { useSocket } from '@/lib/SocketProvider';
import { useUser } from '@/lib/UserProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setVerifyLineup } from '@/redux/slices/matchesSlice';
import { ETeam } from '@/types/team';
import EmitEvents from '@/utils/socket/EmitEvents';
import React, { useMemo, useCallback } from 'react';
import Image from 'next/image';
import { imgW } from '@/utils/constant';
import NetBox from '../net/NetBox';

function VerifyLineup() {
  const socket = useSocket();
  const user = useUser();
  const dispatch = useAppDispatch();

  const { teamA, teamB } = useAppSelector((state) => state.teams);
  const { myTeamE, myPlayers } = useAppSelector((state) => state.matches);
  const { currentRoundNets: currRoundNets } = useAppSelector((state) => state.nets);
  const { current: currRound, roundList } = useAppSelector((state) => state.rounds);
  const currRoom = useAppSelector((state) => state.rooms.current);
  const { teamAPlayers, teamBPlayers } = useAppSelector((state) => state.players);
  const { current: currEvent } = useAppSelector((state) => state.events);

  const handleCloseLineup = (e: React.SyntheticEvent) => {
    e.preventDefault();
    dispatch(setVerifyLineup(false));
  };

  const handlePlayerSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const emitEvents = new EmitEvents(socket, dispatch);
    const myPlayerIds: string[] = myPlayers.map((mp) => mp._id);
    emitEvents.submitLineup({ eventId: currEvent?._id || "", currRoom, currRound, currRoundNets, dispatch, myPlayerIds, myTeamE, roundList, socket, user, teamA, teamB });
  };

  // Precompute assigned players for efficiency
  const assignedPlayers = useMemo(() => {
    const assigned = new Set();
    currRoundNets.forEach((crn) => {
      [crn.teamAPlayerA, crn.teamAPlayerB, crn.teamBPlayerA, crn.teamBPlayerB].forEach((playerId) => {
        if (playerId) assigned.add(playerId);
      });
    });
    return assigned;
  }, [currRoundNets]);

  // Filter subbed players
  const subbedPlayers = useMemo(() => {
    const players = myTeamE === ETeam.teamA ? teamAPlayers : teamBPlayers;
    return players.filter((player) => !assignedPlayers.has(player._id));
  }, [assignedPlayers, myTeamE, teamAPlayers, teamBPlayers]);

  const renderSubbedPlayers = useCallback(
    () => (
      <div className="bg-gray-100 p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Subbed Players</h2>
        {subbedPlayers.length > 0 ? subbedPlayers.map((player) => <div key={player._id} className="capitalize">{`${player.firstName} ${player.lastName}`}</div>) : <p>No subbed players available.</p>}
      </div>
    ),
    [subbedPlayers],
  );

  return (
    <div className="w-full bg-white text-black-logo z-20 shadow-lg">
      <div className="container mx-auto p-6">
        <div className="relative flex justify-end mb-4">
          <Image src="/icons/close.svg" alt="Close lineup modal" className="cursor-pointer" role="button" onClick={handleCloseLineup} width={imgW.logo} height={imgW.logo} />
        </div>

        <div className="flex flex-col items-center gap-y-6">
          {/* Assigned Nets Section */}
          <div className="w-full">
            <h3 className="text-xl font-bold mb-4">Assigned Nets</h3>
            <div className="grid grid-cols-1 gap-4">
              {currRoundNets && currRoundNets.map((crn) => <NetBox key={crn._id} crn={crn} myTeamE={myTeamE} teamPlayerList={myTeamE === ETeam.teamA ? teamAPlayers : teamBPlayers} />)}
            </div>
          </div>

          {/* Subbed Players Section */}
          <div className="w-full">{renderSubbedPlayers()}</div>

          {/* Buttons Section */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              type="button"
              className="btn-secondary bg-gray-800 text-white px-6 py-2 rounded-md shadow-md hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500"
              onClick={handlePlayerSubmit}
            >
              Submit
            </button>
            <button
              type="button"
              className="btn-danger bg-red-600 text-white px-6 py-2 rounded-md shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              onClick={handleCloseLineup}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyLineup;
