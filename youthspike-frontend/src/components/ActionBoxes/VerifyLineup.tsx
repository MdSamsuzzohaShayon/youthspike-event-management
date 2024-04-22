import { useSocket } from '@/lib/SocketProvider';
import { useUser } from '@/lib/UserProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setVerifyLineup } from '@/redux/slices/matchesSlice';
import { INetRelatives, IPlayer } from '@/types';
import { ETeam } from '@/types/team';
import { checkInToLineup } from '@/utils/match/emitSocketEvents';
import { border, overflowNetH } from '@/utils/styles';
import React from 'react';
import Image from 'next/image';
import PlayerScoreCard from '../match/PlayerScoreCard';

function VerifyLineup() {
  const socket = useSocket();
  const user = useUser();
  const dispatch = useAppDispatch();

  const { teamA, teamB } = useAppSelector((state) => state.teams);
  const { myTeamE, myPlayers } = useAppSelector((state) => state.matches);
  const { currentRoundNets } = useAppSelector((state) => state.nets);
  const { current: currRound, roundList } = useAppSelector((state) => state.rounds);
  const currRoom = useAppSelector((state) => state.rooms.current);
  const { teamAPlayers, teamBPlayers } = useAppSelector((state) => state.players);
  const { screenWidth } = useAppSelector((state) => state.elements);

  const handleCloseLineup = (e: React.SyntheticEvent) => {
    e.preventDefault();
    dispatch(setVerifyLineup(false));
  };

  const handlePlayerSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    checkInToLineup({ socket, user, teamA, teamB, currRoom, currRound, currRoundNets: currentRoundNets, roundList, myPlayerIds: [...myPlayers.map((p) => p._id)], dispatch, myTeamE });
  };

  function IdToPlayer(playerId: string | null | undefined, teamPlayerList: IPlayer[]): IPlayer | null | undefined {
    if (!playerId) return null;
    const findPlayer = teamPlayerList.find((p) => p._id === playerId);
    return findPlayer;
  }

  const netBox = (crn: INetRelatives, teamPlayerList: IPlayer[]): React.ReactNode => {
    const playerA = myTeamE === ETeam.teamA ? IdToPlayer(crn.teamAPlayerA, teamPlayerList) : IdToPlayer(crn.teamBPlayerA, teamPlayerList);
    const playerB = myTeamE === ETeam.teamA ? IdToPlayer(crn.teamAPlayerB, teamPlayerList) : IdToPlayer(crn.teamBPlayerB, teamPlayerList);

    return (
      <div className="net-box mb-4 flex justify-center items-center" key={crn._id}>
        <div className={`w-full border ${border.light}`}>
          <h4>Net {crn.num}</h4>
          <div className={`w-full flex justify-between items-center border-t ${border.light}`}>
            <div className="players w-4/6 p-1 text-start flex justify-between items-center">
              <div className="player-wrapper w-3/6 px-1">
                <PlayerScoreCard player={playerA || null} dark={false} screenWidth={screenWidth} myTeamE={myTeamE} />
              </div>
              <div className="player-wrapper w-3/6 px-1">
                <PlayerScoreCard player={playerB || null} dark={false} screenWidth={screenWidth} myTeamE={myTeamE} />
              </div>
            </div>
            <div className={`pair-score w-2/6 h-full p-1 border-l ${border.light}`}>
              <p>Pair Score</p>
              <p>{playerA && playerB && playerA.rank && playerB.rank && (playerA?.rank || 0) + (playerB?.rank || 0)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="w-full bg-gray-100 text-gray-900 z-20 overflow-y-scroll" style={{ height: `${overflowNetH}rem` }}>
      <div className="container p-4 mx-auto ">
        <Image src="/icons/close.svg" alt="close icon picture" className="svg-black mb-4" role="presentation" onClick={handleCloseLineup} width={8} height={8} />
        <h3 className="mb-4">Assigned Nets</h3>
        {currentRoundNets && currentRoundNets.length > 0 && currentRoundNets.map((crn) => (myTeamE === ETeam.teamA ? netBox(crn, teamAPlayers) : netBox(crn, teamBPlayers)))}

        <button type="button" className="btn-secondary mb-4" onClick={handlePlayerSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
}

export default VerifyLineup;
