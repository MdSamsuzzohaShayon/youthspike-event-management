import React, { useCallback, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setclosePSCAvailable, setDisabledPlayerIds } from '@/redux/slices/matchesSlice';
import { setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import {
  IMatchRelatives,
  INetRelatives,
  IPlayer,
  IRoundRelatives,
} from '@/types';
import { EAssignStrategies } from '@/types/elements';
import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import anchorAssign from '@/utils/assignStrategies/anchorAssign';
import hierarchyAssign from '@/utils/assignStrategies/hierarchyAssign';
import randomAssign from '@/utils/assignStrategies/randomAssign';

// --- Types & Interfaces ---

interface ILineupStrategyProps {
  currMatch: IMatchRelatives;
  myTeamEnum: ETeam;
  currRound: IRoundRelatives | null;
  myPlayers: IPlayer[];
  opPlayers: IPlayer[];
  currRoundNets: INetRelatives[];
  allNets: INetRelatives[];
  roundList: IRoundRelatives[];
}

interface IAssignStrategyMenuProps {
  strategies: EAssignStrategies[];
  onSelect: (event: React.MouseEvent<HTMLLIElement>, strategy: EAssignStrategies) => void;
}


// --- Pure Helper Functions ---

/**
 * Determines if the strategy assignment component should be visible.
 */
const checkAssignAvailability = (
  currRound: IRoundRelatives | null,
  myTeamEnum: ETeam,
  currMatch: IMatchRelatives
): boolean => {
  if (!currRound) return false;

  const { teamAProcess, teamBProcess, teamAScore, teamBScore, firstPlacing } = currRound;

  if (teamAProcess === EActionProcess.LINEUP && teamBProcess === EActionProcess.LINEUP) {
    return false;
  }

  if (myTeamEnum === ETeam.teamA) {
    if (firstPlacing === ETeam.teamA) {
      if (teamAProcess !== EActionProcess.CHECKIN || teamAScore) return false;
    } else if (teamBProcess !== EActionProcess.LINEUP || teamBScore) {
      return false;
    }
  } else if (firstPlacing === ETeam.teamB) {
    if (teamBProcess !== EActionProcess.CHECKIN || teamBScore) return false;
  } else if (teamAProcess !== EActionProcess.LINEUP || teamAScore) {
    if (!currMatch.extendedOvertime) return false;
  }

  return true;
};

/**
 * Filters out moved players from the provided player lists.
 */
const getAvailablePlayers = (
  myPlayers: IPlayer[],
  opPlayers: IPlayer[],
  movedPlayers: IPlayer[]
): {
  availableMyPlayers: IPlayer[];
  availableOpPlayers: IPlayer[];
} => {
  const movedPlayerIds = new Set(movedPlayers.map((player) => player._id));

  return {
    availableMyPlayers: myPlayers.filter((player) => !movedPlayerIds.has(player._id)),
    availableOpPlayers: opPlayers.filter((player) => !movedPlayerIds.has(player._id)),
  };
};

/**
 * Checks if a team's current process is either CHECKIN or LINEUP.
 */
const isProcessCheckInOrLineup = (process: EActionProcess): boolean => {
  return process === EActionProcess.CHECKIN || process === EActionProcess.LINEUP;
};


// --- Subcomponents ---

const AssignStrategyMenu: React.FC<IAssignStrategyMenuProps> = ({ strategies, onSelect }) => {
  return (
    <ul
      className="player-select-strategy bg-gray-800 w-fit absolute bottom-6 inset-x-0 z-20"
      style={{ left: '50%', transform: 'translate(-50%)' }}
    >
      {strategies.map((strategy) => (
        <li
          className="p-2 border-b border-yellow-logo capitalize cursor-pointer hover:bg-gray-700"
          key={strategy}
          role="presentation"
          onClick={(e) => onSelect(e, strategy)}
        >
          {strategy}
        </li>
      ))}
    </ul>
  );
};


// --- Main Component ---

const LineupStrategy: React.FC<ILineupStrategyProps> = ({
  currMatch,
  myTeamEnum,
  currRound,
  myPlayers,
  opPlayers,
  currRoundNets,
  allNets,
  roundList,
}) => {
  const dispatch = useAppDispatch();
  
  // Local State
  const [isStrategyMenuOpen, setIsStrategyMenuOpen] = useState<boolean>(false);

  // Redux State
  const playerAssignStrategies = useAppSelector(
    (state) => state.elements.playerAssignStrategy as EAssignStrategies[]
  );
  const { teamAPlayerRanking, teamBPlayerRanking } = useAppSelector((state) => state.playerRanking);
  const { teamA, teamB } = useAppSelector((state) => state.teams);

  // Memoized Values
  const isAssignAvailable = useMemo(
    () => checkAssignAvailability(currRound, myTeamEnum, currMatch),
    [currRound, myTeamEnum, currMatch]
  );

  const shouldShowStrategyButton = useMemo(() => {
    if (!currRound) return false;
    return (
      isProcessCheckInOrLineup(currRound.teamAProcess) &&
      isProcessCheckInOrLineup(currRound.teamBProcess)
    );
  }, [currRound]);

  // Event Handlers
  const handleStrategySelect = useCallback(
    (event: React.MouseEvent , strategy: EAssignStrategies) => {
      event.preventDefault();
      setIsStrategyMenuOpen((prevState) => !prevState);

      if (!currRound) {
        console.error('Cannot execute strategy assignment: Current round is missing.');
        return;
      }

      const matchUp = currRound.firstPlacing !== myTeamEnum;
      const movedPlayers = [...(teamA?.moved ?? []), ...(teamB?.moved ?? [])];
      
      const { availableMyPlayers, availableOpPlayers } = getAvailablePlayers(
        myPlayers,
        opPlayers,
        movedPlayers
      );

      const sharedAssignProps = {
        currMatch,
        matchUp,
        allNets,
        currRoundNets,
        myPlayers: availableMyPlayers,
        opPlayers: availableOpPlayers,
        roundList,
        currRound,
      };

      // Execute the selected strategy
      switch (strategy) {
        case EAssignStrategies.RANDOM: {
          const { updatedAllNets, updatedCurrRoundNets, selectedPlayerIds } = randomAssign({
            ...sharedAssignProps,
            myTeam: myTeamEnum,
            teamAPlayerRanking,
            teamBPlayerRanking,
          });
          dispatch(setCurrentRoundNets(updatedCurrRoundNets));
          dispatch(setNets(updatedAllNets));
          dispatch(setDisabledPlayerIds(selectedPlayerIds));
          break;
        }

        case EAssignStrategies.ANCHOR: {
          anchorAssign({
            ...sharedAssignProps,
            myTeamE: myTeamEnum,
            dispatch,
            tapr: teamAPlayerRanking,
            tbpr: teamBPlayerRanking,
          });
          break;
        }

        case EAssignStrategies.HIERARCHY: {
          hierarchyAssign({
            ...sharedAssignProps,
            myTeamE: myTeamEnum,
            dispatch,
            tapr: teamAPlayerRanking,
            tbpr: teamBPlayerRanking,
          });
          break;
        }

        default:
          break;
      }

      dispatch(setclosePSCAvailable(true));
    },
    [currMatch, currRound, currRoundNets, allNets, myPlayers, opPlayers, roundList, myTeamEnum, teamA, teamB, teamAPlayerRanking, teamBPlayerRanking, dispatch]
  );

  if (!isAssignAvailable) return null;

  return (
    <div className="w-full flex justify-center items-center relative text-white">
      {shouldShowStrategyButton && (
        <div className="h-6 w-6 border-0 rounded-full bg-yellow-logo text-black flex justify-center items-center">
          <button
            type="button"
            onClick={() => setIsStrategyMenuOpen((prevState) => !prevState)}
            aria-label="Open Player Assignment Strategy Menu"
          >
            A
          </button>
        </div>
      )}
      
      {isStrategyMenuOpen && (
        <AssignStrategyMenu strategies={playerAssignStrategies} onSelect={handleStrategySelect} />
      )}
    </div>
  );
};

export default LineupStrategy;