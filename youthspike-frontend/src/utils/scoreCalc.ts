/* eslint-disable no-restricted-syntax */
import { IMatchExpRel, INetRelatives, IPlayer, IPlayerRecord, IRoundRelatives } from '@/types';
import { ETeam } from '@/types/team';

interface IReturnScore {
  score: number;
  plusMinusScore: number;
}

/**
 * Calculate the score and plus-minus for a specific team in a round.
 */
function calcRoundScore(findNets: INetRelatives[], round: IRoundRelatives, teamE: ETeam): IReturnScore {
  let score = 0;
  let plusMinusScore = 0;

  for (const net of findNets) {
    const teamAScore = net.teamAScore || 0;
    const teamBScore = net.teamBScore || 0;

    if (teamE === ETeam.teamA && teamAScore > teamBScore) {
      score += net.points;
    } else if (teamE === ETeam.teamB && teamBScore > teamAScore) {
      score += net.points;
    }
  }

  const teamPoints = teamE === ETeam.teamA ? round.teamAScore || 0 : round.teamBScore || 0;
  const opponentPoints = teamE === ETeam.teamA ? round.teamBScore || 0 : round.teamAScore || 0;

  plusMinusScore = teamPoints - opponentPoints;

  return { score, plusMinusScore };
}

/**
 * Calculate match scores for both teams with optimized filtering.
 */
function calcMatchScore(
  roundList: IRoundRelatives[],
  allNets: INetRelatives[],
  teamE: ETeam,
): {
  teamScore: number;
  oponentScore: number;
  teamPlusMinus: number;
  oponentPlusMinus: number;
} {
  let teamScore = 0;
  let oponentScore = 0;
  let teamPlusMinus = 0;
  let oponentPlusMinus = 0;

  const oponentE = teamE === ETeam.teamA ? ETeam.teamB : ETeam.teamA;

  // Pre-group nets by round ID to reduce filtering overhead
  const netsByRound = new Map<string, INetRelatives[]>();
  for (const net of allNets) {
    // @ts-ignore
    if (!netsByRound.has(net.round._id)) {
      // @ts-ignore
      netsByRound.set(net.round._id, []);
    }
    // @ts-ignore
    netsByRound.get(net.round._id)!.push(net);
  }

  for (const round of roundList) {
    const netsOfRound = netsByRound.get(round._id) || [];

    // Calculate team and opponent scores in one loop
    const teamResult = calcRoundScore(netsOfRound, round, teamE);
    const oponentResult = calcRoundScore(netsOfRound, round, oponentE);

    teamScore += teamResult.score;
    teamPlusMinus += teamResult.plusMinusScore;
    oponentScore += oponentResult.score;
    oponentPlusMinus += oponentResult.plusMinusScore;
  }

  return {
    teamScore,
    oponentScore,
    teamPlusMinus,
    oponentPlusMinus,
  };
}

/**
 * Calculate the combined score of two players.
 */
function calcPairScore(playerA: number | null | undefined, playerB: number | null | undefined): number {
  return (playerA || 0) + (playerB || 0);
}

/**
 * Utility to calculate player stats.
 */
const calculatePlayerRecords = (playerList: IPlayer[], matchList: IMatchExpRel[], rankingMap?: Map<string, number>): IPlayerRecord[] => {
  // Precompute match lookups to reduce redundant iterations
  const matchLookup = new Map<string, IMatchExpRel[]>();
  matchList.forEach((match) => {
    const teamAId = match.teamA._id;
    const teamBId = match.teamB._id;

    if (!matchLookup.has(teamAId)) matchLookup.set(teamAId, []);
    if (!matchLookup.has(teamBId)) matchLookup.set(teamBId, []);

    matchLookup.get(teamAId)!.push(match);
    matchLookup.get(teamBId)!.push(match);
  });

  return playerList.map((player) => {
    let myScore = 0;
    let opScore = 0;
    let numOfGames = 0;
    let wins = 0;
    let losses = 0;
    let running = 0;

    const rank = rankingMap?.get(player._id) ?? null;
    const playerTeamIds = player.teams?.map((team) => team._id) ?? [];
    const relevantMatches = playerTeamIds.flatMap((teamId) => matchLookup.get(teamId) ?? []);

    relevantMatches.forEach((match) => {
      const isTeamA = playerTeamIds.includes(match.teamA._id);
      const isTeamB = playerTeamIds.includes(match.teamB._id);

      if (!isTeamA && !isTeamB) return; // Skip if the player is not in the match

      if (!match.completed) {
        running += 1;
        return;
      }

      match.nets.forEach((net) => {
        const isPlayerInNet = [net.teamAPlayerA, net.teamAPlayerB, net.teamBPlayerA, net.teamBPlayerB].includes(player._id);

        if (!isPlayerInNet) return;

        if (isTeamA) {
          myScore += net.teamAScore ?? 0;
          opScore += net.teamBScore ?? 0;
          wins += (net.teamAScore ?? 0) > (net.teamBScore ?? 0) ? 1 : 0;
          losses += (net.teamAScore ?? 0) < (net.teamBScore ?? 0) ? 1 : 0;
        } else if (isTeamB) {
          myScore += net.teamBScore ?? 0;
          opScore += net.teamAScore ?? 0;
          wins += (net.teamBScore ?? 0) > (net.teamAScore ?? 0) ? 1 : 0;
          losses += (net.teamBScore ?? 0) < (net.teamAScore ?? 0) ? 1 : 0;
        }
        numOfGames += 1;
      });
    });

    const averagePointsDiff = numOfGames > 0 ? (myScore - opScore) / numOfGames : 0;

    return {
      ...player,
      numOfGame: numOfGames,
      running,
      losses,
      wins,
      averagePointsDiff,
      rank,
    };
  });
};

export { calcRoundScore, calcPairScore, calcMatchScore, calculatePlayerRecords };
