/* eslint-disable react/require-default-props */
import React, { useEffect } from 'react';
import { useUser } from '@/lib/UserProvider';
import { useAppSelector } from '@/redux/hooks';
import { IPlayer, IPlayerRankingExpRel } from '@/types';
import { ETeamPlayer } from '@/types/net';
import { EActionProcess } from '@/types/room';
import { ETeam } from '@/types/team';
import { screen } from '@/utils/constant';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';

interface IPlayerScoreCard {
  player: IPlayer | null;
  screenWidth: number;
  myTeamE: ETeam;
  subbedRounds?: number[];
  tapr?: IPlayerRankingExpRel | null; // tapr= team A Player Ranking
  tbpr?: IPlayerRankingExpRel | null; // tbpr= team B Player Ranking
  onTop?: boolean;
  playerRankExist?: number | null;
  teamPlayer?: ETeamPlayer;
  // eslint-disable-next-line no-unused-vars
  evacuatePlayer?: (teamPlayer: ETeamPlayer, playerId: string) => void;
  // eslint-disable-next-line no-unused-vars
  dropdownPlayer?: (e: React.SyntheticEvent, teamPlayer: ETeamPlayer) => void;
}

function PlayerScoreCard({
  player,
  onTop = false,
  playerRankExist,
  teamPlayer,
  evacuatePlayer,
  dropdownPlayer,
  screenWidth,
  myTeamE,
  subbedRounds,
  tapr: teamAPlayerRanking,
  tbpr: teamBPlayerRanking,
}: IPlayerScoreCard) {
  const user = useUser();
  const currentRoom = useAppSelector((state) => state.rooms.current);
  const currentRound = useAppSelector((state) => state.rounds.current);
  const currentRoundNets = useAppSelector((state) => state.nets.currentRoundNets);
  const cpsca = useAppSelector((state) => state.matches.closePSCAvailable);

  // const [fillNets, setFillNets] = useState<boolean>(false);

  useEffect(() => {
    // const allNetsFilled = currentRoundNets.every((net) => (myTeamE === ETeam.teamA ? net.teamAPlayerA && net.teamAPlayerB : net.teamBPlayerA && net.teamBPlayerB));
    // setFillNets(allNetsFilled);
  }, [currentRoundNets, myTeamE]);

  const handleDropDown = (e: React.SyntheticEvent) => {
    if (dropdownPlayer && teamPlayer) dropdownPlayer(e, teamPlayer);
  };

  const handleEvacuatePlayer = (e: React.SyntheticEvent, playerId: string) => {
    if (evacuatePlayer && teamPlayer) evacuatePlayer(teamPlayer, playerId);
  };

  const shouldShowEvacuateButton =
    player &&
    user.token &&
    evacuatePlayer &&
    currentRoom &&
    currentRound &&
    (currentRound.teamAProcess === EActionProcess.LINEUP ||
      currentRound.teamBProcess === EActionProcess.LINEUP ||
      currentRound.teamAProcess === EActionProcess.CHECKIN ||
      currentRound.teamBProcess === EActionProcess.CHECKIN);

  const shouldShowAddPlayer =
    !player &&
    user.token &&
    evacuatePlayer &&
    currentRoom &&
    currentRound &&
    ((currentRound.teamAProcess === EActionProcess.CHECKIN && currentRound.teamBProcess === EActionProcess.CHECKIN) ||
      (currentRound.teamAProcess === EActionProcess.CHECKIN && currentRound.teamBProcess === EActionProcess.LINEUP) ||
      (currentRound.teamAProcess === EActionProcess.LINEUP && currentRound.teamBProcess === EActionProcess.CHECKIN));

  const renderPlayerImage = (): React.ReactNode => {
    if (player && player.profile) {
      return <CldImage alt={player.firstName} width="200" height="200" className="w-full h-full object-top object-cover" src={player.profile} onClick={handleDropDown} />
    }
    if (!player && shouldShowAddPlayer) {
      return (
        <div className="w-full h-full flex justify-center items-center">
          <Image
            width={100}
            height={100}
            src="/icons/plus.svg"
            alt="Add player"
            className={`${onTop ? 'svg-white' : 'svg-black'} w-5/6 md:h-full object-top object-cover`}
            role="presentation"
            onClick={handleDropDown}
          />
        </div>
      );
    }
    return <Image width={100} height={100} src="/empty-img.jpg" alt="No player" className="w-full h-full object-center object-cover" role="presentation" onClick={handleDropDown} />;
  };

  const renderRank = () => {
    let playerRank = 0;
    if (playerRankExist) {
      playerRank = playerRankExist;
    } else {
      const rankings = [];
      if (teamAPlayerRanking) rankings.push(...teamAPlayerRanking.rankings);
      if (teamBPlayerRanking) rankings.push(...teamBPlayerRanking.rankings);
      playerRank = rankings.find((p) => p.player._id === player?._id)?.rank || 0;
    }

    return (
      <div className={`bg-yellow-logo text-center text-black ${onTop ? 'rounded-b-lg' : 'rounded-t-lg'}`}>
        <p className="rank"># {playerRank}</p>
        {subbedRounds && (
          <div className="relative">
            <p>{subbedRounds.map((s, i) => `S${s}${i + 1 !== subbedRounds.length ? ', ' : ''}`)}</p>
            {/* <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 shadow-lg">
              This player has been subbed in round 1, round 2 and round 3
            </div> */}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col justify-end">
      {/* Level 1: rank start  */}
      {player && !onTop && renderRank()}
      {/* Level 1: rank end  */}

      {/* Lavel 2: player start  */}
      <div className={`wrapper w-full border border-yellow overflow-hidden flex ${onTop ? 'flex-col rounded-t-lg' : 'flex-col-reverse rounded-b-lg'}`}>
        <div className="p-rank bg-yellow-logo w-full flex flex-wrap items-center justify-center">
          <p className="p-name max-three-line break-all text-c-sm uppercase text-black-logo text-center font-bold leading-3 pt-1">
            {player ? player.firstName : ''}
            {player?.lastName && (
              <>
                <br />
                <small>{player.lastName}</small>
              </>
            )}
          </p>
        </div>
        <div className={`p-img-wrap cursor-pointer relative w-full ${screenWidth > screen.xs ? 'h-20' : 'h-24 '}`}>
          {shouldShowEvacuateButton && (
            <div className="absolute top-1 right-1 w-4 bg-black-logo rounded-full">
              {!onTop && myTeamE === ETeam.teamA && cpsca && !currentRound?.teamAScore && (
                <Image width={12} height={12} src="/icons/close.svg" className="w-full h-full svg-white" alt="Remove player" role="presentation" onClick={(e) => handleEvacuatePlayer(e, player._id)} />
              )}
              {!onTop && myTeamE === ETeam.teamB && cpsca && !currentRound?.teamBScore && (
                <Image width={12} height={12} src="/icons/close.svg" className="w-full h-full svg-white" alt="Remove player" role="presentation" onClick={(e) => handleEvacuatePlayer(e, player._id)} />
              )}
            </div>
          )}
          {renderPlayerImage()}
        </div>
      </div>
      {/* Lavel 2: player end  */}

      {/* Lavel 3: rank start  */}
      {player && onTop && renderRank()}
      {/* Lavel 3: rank end  */}
    </div>
  );
}

export default PlayerScoreCard;
