
/* eslint-disable no-nested-ternary */
import { IMatchRelatives, INetRelatives, IPlayer, IPlayerRankingExpRel, IPlayerRankingItemExpRel } from '@/types';
import { ETeamPlayer } from '@/types/net';
import { ETeam } from '@/types/team';

interface IOutRange {
  currMatch: IMatchRelatives;
  net?: INetRelatives | null | undefined;
  myPlayers: IPlayer[];
  opPlayers: IPlayer[];
  myTeamE: ETeam;
  playerSpot: ETeamPlayer;
  teamAPlayerRanking: IPlayerRankingExpRel | null;
  teamBPlayerRanking: IPlayerRankingExpRel | null;
}

const findOutOfRange = ({ currMatch, net, myPlayers, opPlayers, myTeamE, playerSpot, teamAPlayerRanking, teamBPlayerRanking }: IOutRange): string[] => {
  const invalidPlayerIds: string[] = [];
  const netVariance = currMatch.netVariance || 0;

  // Combine and map rankings for quick lookups
  const rankings = [...(teamAPlayerRanking?.rankings || []), ...(teamBPlayerRanking?.rankings || [])];
  const rankingMap = new Map(rankings.map((ranking) => [ranking.player._id, ranking.rank]));

  // Find opponent net players
  const opponentNetPlayers = [myTeamE === ETeam.teamA ? net?.teamBPlayerA : net?.teamAPlayerA, myTeamE === ETeam.teamA ? net?.teamBPlayerB : net?.teamAPlayerB]
    .filter(Boolean)
    .map((id) => opPlayers.find((player) => player._id === id))
    .filter(Boolean) as IPlayer[];

  // Calculate opponent pair score
  const opponentPairScore = opponentNetPlayers.reduce((sum, player) => sum + (rankingMap.get(player._id) || 0), 0);

  // If extended overtime, process based on player ranks
  if (currMatch.extendedOvertime) {
    const rankedPlayers = myPlayers.map((player) => ({ player, rank: rankingMap.get(player._id) || 0 })).sort((a, b) => a.rank - b.rank);

    rankedPlayers.slice(3).forEach(({ player }) => invalidPlayerIds.push(player._id));
    return invalidPlayerIds;
  }

  // Calculate start and end range for valid scores
  const startRange = Math.max(opponentPairScore - netVariance, 0);
  const endRange = opponentPairScore + netVariance;

  // Find partner player and their rank
  const partnerPlayerId =
    myTeamE === ETeam.teamA 
    ? (playerSpot === ETeamPlayer.PLAYER_A ? net?.teamAPlayerB : net?.teamAPlayerA) 
    : (playerSpot === ETeamPlayer.PLAYER_A ? net?.teamBPlayerB : net?.teamBPlayerA);

  const partnerRank = partnerPlayerId ? rankingMap.get(partnerPlayerId) || 0 : 0;

  // Get team rankings to calculate min and max ranks
  const teamRankings = myTeamE === ETeam.teamA ? teamAPlayerRanking?.rankings || [] : teamBPlayerRanking?.rankings || [];
  const myTopRank = Math.max(...teamRankings.map((r) => r.rank), 0);
  const myLowRank = Math.min(...teamRankings.map((r) => r.rank), Infinity);

  // Validate players
  myPlayers.forEach((player) => {
    const playerRank = rankingMap.get(player._id) || 0;
    let combinedRank = playerRank + partnerRank;

    if (!partnerPlayerId) {
      combinedRank += combinedRank > endRange ? myLowRank : myTopRank;
    }

    if (combinedRank < startRange || combinedRank > endRange) {
      invalidPlayerIds.push(player._id);
    }
  });

  return invalidPlayerIds;
};

export default findOutOfRange;

