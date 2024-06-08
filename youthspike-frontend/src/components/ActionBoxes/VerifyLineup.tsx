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
import { imgW } from '@/utils/constant';
import PlayerScoreCard from '../player/PlayerScoreCard';

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
  const { teamAPlayerRanking, teamBPlayerRanking } = useAppSelector((state) => state.playerRanking);

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
    // eslint-disable-next-line react/destructuring-assignment
    const findPlayer = teamPlayerList.find((p) => p._id === playerId);
    return findPlayer;
  }

  const netBox = (crn: INetRelatives, teamPlayerList: IPlayer[]): React.ReactNode => {
    const playerA = myTeamE === ETeam.teamA ? IdToPlayer(crn.teamAPlayerA, teamPlayerList) : IdToPlayer(crn.teamBPlayerA, teamPlayerList);
    const playerB = myTeamE === ETeam.teamA ? IdToPlayer(crn.teamAPlayerB, teamPlayerList) : IdToPlayer(crn.teamBPlayerB, teamPlayerList);

    const rankings = teamAPlayerRanking && teamBPlayerRanking ? [...teamAPlayerRanking.rankings, ...teamBPlayerRanking.rankings] : [];
    const playerARank = rankings.find((p)=> p.player._id === playerA?._id)?.rank || 0;
    const playerBRank = rankings.find((p)=> p.player._id === playerB?._id)?.rank || 0;

    return (
      <div className="net-box mb-4 flex justify-center items-center" key={crn._id}>
        <div className={`w-full border ${border.light}`}>
          <h4 className="text-center uppercase bg-gray-300 font-bold">Net {crn.num}</h4>
          <div className={`w-full flex justify-between items-center border-t ${border.light}`}>
            <div className="players w-4/6 p-1 text-start flex md:justify-center justify-between items-center">
              <div className="player-wrapper w-3/6 md:w-1/6 px-1">
                <PlayerScoreCard onTop player={playerA || null} screenWidth={screenWidth} myTeamE={myTeamE} />
              </div>
              <div className="player-wrapper w-3/6 md:w-1/6 px-1">
                <PlayerScoreCard onTop player={playerB || null} screenWidth={screenWidth} myTeamE={myTeamE} />
              </div>
            </div>
            <div className={`pair-score w-2/6 h-full p-1 border-l ${border.light}`}>
              <p>Pair Score</p>
              <p>{playerARank + playerBRank}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="w-full bg-white text-black-logo z-20 overflow-y-scroll" style={{ height: `${overflowNetH}rem` }}>
      <div className="container p-4 mx-auto ">
        <Image src="/icons/close.svg" alt="close icon picture" className="svg-black mb-4" role="presentation" onClick={handleCloseLineup} width={imgW.logo} height={imgW.logo} />
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
