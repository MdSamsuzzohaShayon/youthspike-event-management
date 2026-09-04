import { useSocket } from '@/lib/SocketProvider';
import { useUser } from '@/lib/UserProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setVerifyLineup } from '@/redux/slices/matchesSlice';
import { ETeam, ITeam } from '@/types/team';
import EmitEvents from '@/utils/socket/EmitEvents';
import React, { useCallback, useMemo } from 'react';
import Image from 'next/image';
import { imgW, MAX_MATCH_HEIGHT } from '@/utils/constant';
import NetBox from '../net/NetBox';
import { EPlayerStatus, IMatchRelatives, INetRelatives, IPlayer, IRoundRelatives } from '@/types';
import LocalStorageService from '@/utils/LocalStorageService';
import { getAssignedPlayerIds, getAvailableSubs, getMovedPlayerIds, isActivePlayer } from '@/utils/match/captainViewHelpers';
import SubbedPlayersPanel from '../match/CaptainMatchView/SubbedPlayersPanel';

interface IVerifyLineupProps {
  teamA: ITeam | null;
  teamB: ITeam | null;
  myTeamE: ETeam;
  myPlayers: IPlayer[];
  match: IMatchRelatives;
  currentRoundNets: INetRelatives[];
  currentRound: IRoundRelatives | null;
  roundList: IRoundRelatives[];
}



function VerifyLineup({
  teamA,
  teamB,
  myTeamE,
  myPlayers,
  match,
  currentRoundNets,
  currentRound,
  roundList,
}: IVerifyLineupProps) {
  const socket = useSocket();
  const user = useUser();
  const dispatch = useAppDispatch();

  const currRoom = useAppSelector((state) => state.rooms.current);
  const { teamAPlayers, teamBPlayers } = useAppSelector((state) => state.players);
  const { current: currEvent } = useAppSelector((state) => state.events);

  const currentTeamPlayers = useMemo<IPlayer[]>(
    () => (myTeamE === ETeam.teamA ? teamAPlayers : teamBPlayers),
    [myTeamE, teamAPlayers, teamBPlayers],
  );

  const assignedPlayerIds = useMemo<Set<string>>(() => getAssignedPlayerIds(currentRoundNets), [currentRoundNets]);

  const movedPlayerIds = useMemo<Set<string>>(() => getMovedPlayerIds(teamA, teamB), [teamA, teamB]);

  const subbedPlayers = useMemo<IPlayer[]>(
    () => getAvailableSubs(currentTeamPlayers, movedPlayerIds, assignedPlayerIds),
    [currentTeamPlayers, movedPlayerIds, assignedPlayerIds],
  );

  const handleCloseLineup = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      dispatch(setVerifyLineup(false));
    },
    [dispatch],
  );

  const handlePlayerSubmit = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();

      if (!socket) {
        console.error('VerifyLineup: cannot submit lineup — socket is not connected.');
        return;
      }

      if (!currEvent?._id) {
        console.error('VerifyLineup: cannot submit lineup — no active event.');
        return;
      }

      try {
        const emitEvents = new EmitEvents(socket, dispatch);
        const myPlayerIds: string[] = myPlayers.filter(isActivePlayer).map((player) => player._id);

        emitEvents.submitLineup({
          eventId: currEvent._id,
          currRoom,
          currRound: currentRound,
          currRoundNets: currentRoundNets,
          dispatch,
          myPlayerIds,
          myTeamE,
          roundList,
          socket,
          user,
          teamA,
          teamB,
          match,
        });

        LocalStorageService.removeAssignClock(currentRound?._id ?? '');
      } catch (error) {
        console.error('VerifyLineup: failed to submit lineup.', error);
      }
    },
    [socket, dispatch, myPlayers, currEvent, currRoom, currentRound, currentRoundNets, myTeamE, roundList, user, teamA, teamB, match],
  );

  return (
    <div className={`w-full bg-white text-black-logo z-20 shadow-lg ${MAX_MATCH_HEIGHT}`}>
      <div className="container mx-auto px-6">
        <div className="relative flex justify-end">

        </div>

        <div className="flex flex-col items-center gap-y-2">
          {/* Assigned Nets Section */}
          <div className="w-full">
            <div className="w-full flex justify-between items-center">
            <h3 className="text-xl font-bold mb-2">Assigned Nets</h3> 
            <Image src="/icons/close.svg" alt="Close lineup modal" className="cursor-pointer" role="button" onClick={handleCloseLineup} width={imgW.logo} height={imgW.logo}/>
            </div>
            <div className="flex flex-col gap-y-2">
              {currentRoundNets.map((crn) => (
                <NetBox key={crn._id} crn={crn} myTeamE={myTeamE} teamPlayerList={currentTeamPlayers} />
              ))}
            </div>
          </div>

          {/* Subbed Players Section */}
          {!match?.extendedOvertime && (
            <div className="w-full">
              <SubbedPlayersPanel players={subbedPlayers} />
            </div>
          )}

          {/* Buttons Section */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              type="button"
              className="btn-success"
              onClick={handlePlayerSubmit}
            >
              Submit
            </button>
            <button
              type="button"
              className="btn-danger"
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