import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { IMatchRelatives, INetRelatives, IPlayer, IRoundRelatives } from '@/types';
import { EAssignStrategies } from '@/types/elements';
import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import anchorAssign from '@/utils/assignStrategies/anchorAssign';
import hierarchyAssign from '@/utils/assignStrategies/hierarchyAssign';
import randomAssign from '@/utils/assignStrategies/randomAssign';
import React, { useState } from 'react';

interface ILineupProps {
  myTeamE: ETeam;
  currRound: IRoundRelatives | null;
  myPlayers: IPlayer[];
  opPlayers: IPlayer[];
  currRoundNets: INetRelatives[];
  allNets: INetRelatives[];
  roundList: IRoundRelatives[];
  currMatch: IMatchRelatives;
}

function LineupStrategy({ currMatch, myTeamE, currRound, myPlayers, opPlayers, currRoundNets, allNets, roundList }: ILineupProps) {
  const dispatch = useAppDispatch();
  // Local State
  const [openPasControl, setOpenPasControl] = useState<boolean>(false); // pas = Player Assign Strategy

  const playerAssignStrategies = useAppSelector((state) => state.elements.playerAssignStrategy);
  const {teamAPlayerRanking, teamBPlayerRanking} = useAppSelector((state) => state.playerRanking);

  const handlePASSelect = (e: React.SyntheticEvent, pas: EAssignStrategies) => {
    // PAS = Player Assign Strategies
    e.preventDefault();
    setOpenPasControl((prevState) => !prevState);

    // Check first assign or match up
    const matchUp = currRound?.firstPlacing !== myTeamE;

    // Make sure selecting all players subbed previously
    switch (pas) {
      case EAssignStrategies.RANDOM:
        randomAssign({ currMatch, matchUp, allNets, currRoundNets, myPlayers, opPlayers, roundList, currRound, myTeamE, dispatch, tapr: teamAPlayerRanking, tbpr: teamBPlayerRanking });
        break;

      case EAssignStrategies.ANCHOR:
        // Ancher: Pair rank 1 player with last rank player, rank 2 player with 2nd last rank player and so on
        anchorAssign({ currMatch, matchUp, allNets, currRoundNets, myPlayers, opPlayers, roundList, currRound, myTeamE, dispatch });
        break;

      case EAssignStrategies.HIERARCHY:
        // Hierarchy: Pair rank 1 player with rank 2 player, rank 3 player with rank 4 player and so on
        hierarchyAssign({ currMatch, matchUp, allNets, currRoundNets, myPlayers, opPlayers, roundList, currRound, myTeamE, dispatch });
        break;

      default:
        break;
    }
  };

  if (myTeamE === ETeam.teamA) {
    if (currRound?.firstPlacing === ETeam.teamA) {
      if (currRound.teamAProcess !== EActionProcess.CHECKIN || currRound.teamAScore) {
        return null;
      }
    } else if (currRound?.teamBProcess !== EActionProcess.LINEUP || currRound.teamBScore) {
      return null;
    }
  } else if (currRound?.firstPlacing === ETeam.teamB) {
    if (currRound.teamBProcess !== EActionProcess.CHECKIN || currRound.teamBScore) {
      return null;
    }
  } else if (currRound?.teamAProcess !== EActionProcess.LINEUP || currRound.teamAScore) {
    return null;
  }

  return (
    <div className="w-full flex justify-center items-center relative text-white">
      <div className="h-6 w-6 border-0 rounded-full bg-yellow-400 flex justify-center items-center">
        <button type="button" onClick={() => setOpenPasControl((prevState) => !prevState)}>
          A
        </button>
      </div>
      {openPasControl && (
        <ul className="player-select-strategy bg-gray-800 w-24 absolute bottom-6 inset-x-0 z-20" style={{ left: '50%', transform: 'translate(-50%)' }}>
          {playerAssignStrategies.map((pas) => (
            <li className="p-2 border-b border-yellow-400 capitalize" key={pas} role="presentation" onClick={(e) => handlePASSelect(e, pas)}>
              {pas}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default LineupStrategy;
