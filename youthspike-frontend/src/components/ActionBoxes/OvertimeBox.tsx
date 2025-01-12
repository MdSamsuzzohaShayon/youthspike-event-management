import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { IRoom } from '@/types';
import { ETeam } from '@/types/team';
import submitLineup from '@/utils/match/submitLineup';
import React, { useEffect, useState } from 'react';

interface IOvertimeBoxProps {
  currRoom: IRoom | null;
}
function OvertimeBox({ currRoom }: IOvertimeBoxProps) {
  const dispatch = useAppDispatch();

  const [fillNet, setFillNet] = useState<boolean>(false);

  const { currentRoundNets } = useAppSelector((state) => state.nets);
  const { myTeamE, myPlayers, closePSCAvailable, match: currMatch } = useAppSelector((state) => state.matches);
  const { current: currRound, roundList } = useAppSelector((state) => state.rounds);

  const handleOvertimeNetLineup = (e: React.SyntheticEvent) => {
    e.preventDefault();
    submitLineup({ dispatch, currMatch, currRoom, myTeamE, currentRoundNets, currRound, myPlayers, roundList, closePSCAvailable });
  };

  useEffect(() => {
    let filled = true;
    for (let i = 0; i < currentRoundNets.length; i += 1) {
      if (myTeamE === ETeam.teamA) {
        if (!currentRoundNets[i].teamAPlayerA || !currentRoundNets[i].teamAPlayerB) filled = false;
      } else if (!currentRoundNets[i].teamBPlayerA || !currentRoundNets[i].teamBPlayerB) filled = false;
    }
    setFillNet(filled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoundNets]);

  return (
    <div className="flex flex-col py-2 w-full justify-between items-center gap-1 box-success">
      <h2 className="font-black text-start">PLACING your lineup. Please assign 2 players out of top 3 players and SUBMIT your lineup. </h2>
      <button className={`${fillNet ? 'btn-light-outline' : 'btn-light'}`} type="button" onClick={handleOvertimeNetLineup}>
        Submit Lineup
      </button>
    </div>
  );
}

export default OvertimeBox;
