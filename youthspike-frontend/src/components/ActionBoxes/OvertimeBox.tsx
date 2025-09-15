import { useSocket } from '@/lib/SocketProvider';
import { useUser } from '@/lib/UserProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { EPlayerStatus, IRoom } from '@/types';
import { ETeam, ITeam } from '@/types/team';
import submitLineup from '@/utils/match/submitLineup';
import EmitEvents from '@/utils/socket/EmitEvents';
import React, { useEffect, useState } from 'react';

interface IOvertimeBoxProps {
  currRoom: IRoom | null;
  eventId: string | null;
  teamA: ITeam | null;
  teamB: ITeam | null;
}
function OvertimeBox({ currRoom, eventId, teamA, teamB}: IOvertimeBoxProps) {
  const dispatch = useAppDispatch();

  const [fillNet, setFillNet] = useState<boolean>(false);

  const { currentRoundNets: currRoundNets } = useAppSelector((state) => state.nets);
  const { myTeamE, myPlayers, closePSCAvailable, match: currMatch } = useAppSelector((state) => state.matches);
  const { current: currRound, roundList } = useAppSelector((state) => state.rounds);

  const handleOvertimeNetLineup = (e: React.SyntheticEvent) => {
    e.preventDefault();
    // const emitEvents = new EmitEvents(socket, dispatch);
    // const myPlayerIds: string[] = myPlayers.filter((p)=> p.status === EPlayerStatus.ACTIVE).map((mp) => mp._id);
    // emitEvents.submitLineup({ eventId, currRoom, currRound, currRoundNets, dispatch, myPlayerIds, myTeamE, roundList, socket, user, teamA, teamB });
    submitLineup({ dispatch, currMatch, currRoom, myTeamE, currentRoundNets: currRoundNets, currRound, myPlayers, roundList, closePSCAvailable, teamA, teamB });
  };

  useEffect(() => {
    let filled = true;
    for (let i = 0; i < currRoundNets.length; i += 1) {
      if (myTeamE === ETeam.teamA) {
        if (!currRoundNets[i].teamAPlayerA || !currRoundNets[i].teamAPlayerB) filled = false;
      } else if (!currRoundNets[i].teamBPlayerA || !currRoundNets[i].teamBPlayerB) filled = false;
    }
    setFillNet(filled);
  }, [currRoundNets]);

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
