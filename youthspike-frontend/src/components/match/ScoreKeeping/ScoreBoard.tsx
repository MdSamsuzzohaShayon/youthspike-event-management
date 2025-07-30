import { EServerReceiverAction, ETeam, IPlayer, IServerReceiverOnNetMixed, ITeam } from '@/types';
import { toOrdinal } from '@/utils/helper';
import React, { useCallback } from 'react';


interface IScoreBoardProps{
    currServerReceiver: IServerReceiverOnNetMixed | null;
    teamA: ITeam | null;
    teamB: ITeam | null;
    teamAPlayers: IPlayer[];
    teamBPlayers: IPlayer[];
    selectedServer: string | null;
    selectedReceiver: string | null;
    serverReceiverAction: EServerReceiverAction | null;
}

function ScoreBoard({currServerReceiver, teamA, teamB, teamAPlayers, teamBPlayers, selectedServer, selectedReceiver, serverReceiverAction}: IScoreBoardProps) {

    const point = useCallback(
        (teamE: ETeam) => {
          if (!selectedServer || !selectedReceiver || !serverReceiverAction) return null;
    
          const isTeamA = teamE === ETeam.teamA;
          const teamPlayerIds = isTeamA ? teamAPlayers.map((p) => p._id) : teamBPlayers.map((p) => p._id);
    
          // Define which actions are judged by server and which by receiver
          const serverBasedActions = new Set([
            EServerReceiverAction.SERVER_RECEIVING_HITTING_ERROR,
            EServerReceiverAction.SERVER_ACE_NO_TOUCH,
            EServerReceiverAction.SERVER_DEFENSIVE_CONVERSION,
            EServerReceiverAction.SERVER_ACE_NO_THIRD_TOUCH,
            EServerReceiverAction.SERVER_DO_NOT_KNOW,
          ]);
          
          const receiverBasedActions = new Set([
            EServerReceiverAction.RECEIVER_SERVICE_FAULT,
            EServerReceiverAction.RECEIVER_ONE_TWO_THREE_PUT_AWAY,
            EServerReceiverAction.RECEIVER_RALLEY_CONVERSION,
            EServerReceiverAction.RECEIVER_DO_NOT_KNOW,
          ]);
    
          const targetId = serverBasedActions.has(serverReceiverAction) ? selectedServer : receiverBasedActions.has(serverReceiverAction) ? selectedReceiver : null;
    
          if (targetId && teamPlayerIds.includes(targetId)) {
            return <p>+1</p>;
          }
    
          return null;
        },
        [serverReceiverAction, selectedServer, selectedReceiver, teamAPlayers, teamBPlayers],
      );

  return (
    <div className='flex justify-center items-center flex-col w-full'>
        <div className="w-full text-center mt-6 md:mt-2">{`${toOrdinal(currServerReceiver?.mutate || 0)} play`}</div>
              <div className="w-full md:w-1/6 flex justify-center  md:flex-col flex-row gap-y-2 gap-x-2 items-center">
                {/* Team A Start   */}
                <h2 className="uppercase">{teamA?.name}</h2>
                <div className={`bg-yellow-logo text-black h-24 w-24 rounded-xl flex items-center justify-center relative`}>
                  <h2>{currServerReceiver?.teamAScore || 0}</h2>
                  <div className="absolute bottom-1 right-2">{point(ETeam.teamA)}</div>
                </div>

                {/* Team B Start  */}
                <div className="bg-white text-black h-24 w-24 rounded-xl flex items-center justify-center">
                  <h2>{currServerReceiver?.teamBScore || 0}</h2>
                  {point(ETeam.teamB)}
                </div>
                <h2 className="uppercase">{teamB?.name}</h2>
              </div>
    </div>
  )
}

export default ScoreBoard