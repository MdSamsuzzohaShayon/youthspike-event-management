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
import {
  getAssignedPlayerIds,
  getAvailableSubs,
  getMovedPlayerIds,
  isActivePlayer,
} from '@/utils/match/captainViewHelpers';
import SubbedPlayersPanel from '../match/CaptainMatchView/SubbedPlayersPanel';

// --- Types & Interfaces ---

interface IVerifyLineupProps {
  teamA: ITeam | null;
  teamB: ITeam | null;
  myTeamEnum: ETeam;
  myPlayers: IPlayer[];
  match: IMatchRelatives;
  currentRoundNets: INetRelatives[];
  currentRound: IRoundRelatives | null;
  roundList: IRoundRelatives[];
}

interface IAssignedNetsSectionProps {
  currentRoundNets: INetRelatives[];
  myTeamEnum: ETeam;
  currentTeamPlayers: IPlayer[];
  onClose: () => void;
}

interface IActionButtonsProps {
  onSubmit: () => void;
  onCancel: () => void;
}


// --- Subcomponents ---

const AssignedNetsSection: React.FC<IAssignedNetsSectionProps> = ({
  currentRoundNets,
  myTeamEnum,
  currentTeamPlayers,
  onClose,
}) => {
  return (
    <div className="w-full">
      <div className="w-full flex justify-between items-center">
        <h3 className="text-xl font-bold mb-2">Assigned Nets</h3>
        <Image
          src="/icons/close.svg"
          alt="Close lineup modal"
          className="cursor-pointer"
          role="button"
          onClick={onClose}
          width={imgW.logo}
          height={imgW.logo}
        />
      </div>
      <div className="flex flex-col gap-y-2">
        {currentRoundNets.map((net) => (
          <div key={net._id} className='h-12'>
            <NetBox crn={net} myTeamE={myTeamEnum} teamPlayerList={currentTeamPlayers} />
          </div>
        ))}
      </div>
    </div>
  );
};

const ActionButtons: React.FC<IActionButtonsProps> = ({ onSubmit, onCancel }) => (
  <div className="flex justify-center items-center gap-4 mt-6">
    <button type="button" className="btn-success" onClick={onSubmit}>
      Submit
    </button>
    <button type="button" className="btn-danger" onClick={onCancel}>
      Cancel
    </button>
  </div>
);


// --- Main Component ---

const VerifyLineup: React.FC<IVerifyLineupProps> = ({
  teamA,
  teamB,
  myTeamEnum,
  myPlayers,
  match,
  currentRoundNets,
  currentRound,
  roundList,
}) => {
  const socket = useSocket();
  const user = useUser();
  const dispatch = useAppDispatch();

  const currentRoom = useAppSelector((state) => state.rooms.current);
  const { teamAPlayers, teamBPlayers } = useAppSelector((state) => state.players);
  const { current: currentEvent } = useAppSelector((state) => state.events);

  const currentTeamPlayers = useMemo<IPlayer[]>(
    () => (myTeamEnum === ETeam.teamA ? teamAPlayers : teamBPlayers),
    [myTeamEnum, teamAPlayers, teamBPlayers]
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
        myTeamE: myTeamEnum,
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
    socket,
    dispatch,
    myPlayers,
    currentEvent,
    currentRoom,
    currentRound,
    currentRoundNets,
    myTeamEnum,
    roundList,
    user,
    teamA,
    teamB,
    match,
  ]);

  return (
    <div className={`w-full bg-white text-black-logo z-20 shadow-lg ${MAX_MATCH_HEIGHT}`}>
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center gap-y-2">
          {/* Assigned Nets Section */}
          <AssignedNetsSection
            currentRoundNets={currentRoundNets}
            myTeamEnum={myTeamEnum}
            currentTeamPlayers={currentTeamPlayers}
            onClose={handleCloseLineup}
          />

          {/* Subbed Players Section */}
          {!match?.extendedOvertime && (
            <div className="w-full">
              <SubbedPlayersPanel players={subbedPlayers} />
            </div>
          )}

          {/* Buttons Section */}
          <ActionButtons onSubmit={handleSubmitLineup} onCancel={handleCloseLineup} />
        </div>
      </div>
    </div>
  );
};

export default VerifyLineup;