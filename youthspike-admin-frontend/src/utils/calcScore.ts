import { IMatchExpRel, IMatchScore, INetRelatives, IPlayer, IPlayerRecord, IRoundRelatives, IRoundScore } from "@/types";
import { ETeam, ITeam } from "@/types/team";

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
        const roundId = net.round?._id || net.round;
        if (!netsByRound.has(roundId)) {
            netsByRound.set(roundId, []);
        }
        netsByRound.get(roundId)!.push(net);
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
 * Calculate match score and plus-minus for a specific team in a round.
 */
const calcScore = (
    nets: INetRelatives[],
    rounds: IRoundRelatives[]
  ): { roundMap: Record<string, IRoundScore>; matchScore: IMatchScore } => {
    // Serialized round scores (no Map)
    const roundMap: Record<string, IRoundScore> = {};
  
    let teamAMScore = 0;
    let teamBMScore = 0;
    let teamAMPlusMinus = 0;
    let teamBMPlusMinus = 0;
  
    // Group nets by round
    const netsByRound: Record<string, INetRelatives[]> = {};
  
    for (const net of nets) {
      const roundId = net.round;
      if (!netsByRound[roundId]) {
        netsByRound[roundId] = [];
      }
      netsByRound[roundId].push(net);
    }
  
    // Calculate scores
    for (const round of rounds) {
      const nets = netsByRound[round._id];
      if (!nets) continue;
  
      let teamARScore = 0;
      let teamBRScore = 0;
  
      let teamATotal = 0;
      let teamBTotal = 0;
  
      for (const net of nets) {
        const a = net.teamAScore ?? 0;
        const b = net.teamBScore ?? 0;
  
        if (a > b) teamARScore += net.points;
        else if (b > a) teamBRScore += net.points;
  
        teamATotal += a;
        teamBTotal += b;
      }
  
      const diff = teamATotal - teamBTotal;
      
  
      const teamARPlusMinus = diff;
      const teamBRPlusMinus = -diff;
  
      roundMap[round._id] = {
        teamARScore,
        teamBRScore,
        teamARPlusMinus,
        teamBRPlusMinus,
      };
  
      teamAMScore += teamARScore;
      teamBMScore += teamBRScore;
      teamAMPlusMinus += diff ;
      teamBMPlusMinus += (-diff);
    }
  
    // Final serialized match score
    const matchScore: {
      roundMap: Record<string, IRoundScore>;
      matchScore: IMatchScore;
    } = {
      roundMap,
      matchScore: {
        teamAMScore,
        teamBMScore,
        teamAMPlusMinus,
        teamBMPlusMinus,
      },
    };
    return matchScore;
  };
  

  /**
 * Utility to calculate player stats.
 */
const calculatePlayerRecords = (
  playerList: IPlayer[],
  matchList: IMatchExpRel[],
  teamMap?: Map<string, ITeam>,
  rankingMap?: Map<string, number>
): IPlayerRecord[] => {
  // Filter out invalid players first
  const validPlayers = playerList.filter(
    (player) =>
      player &&
      player._id &&
      typeof player._id === "string" &&
      player.firstName !== undefined
  );

  if (validPlayers.length === 0) return [];

  // Precompute match lookups to reduce redundant iterations
  const matchLookup = new Map<string, IMatchExpRel[]>();
  matchList.forEach((match) => {
    if (!match) return;

    const teamAId = match?.teamA?._id;
    const teamBId = match?.teamB?._id;

    if (teamAId) {
      if (!matchLookup.has(teamAId)) matchLookup.set(teamAId, []);
      matchLookup.get(teamAId)!.push(match);
    }

    if (teamBId) {
      if (!matchLookup.has(teamBId)) matchLookup.set(teamBId, []);
      matchLookup.get(teamBId)!.push(match);
    }
  });

  return validPlayers.map((player) => {
    let myScore = 0;
    let opScore = 0;
    let numOfGames = 0;
    let wins = 0;
    let losses = 0;
    let running = 0;

    const rank = rankingMap?.get(player._id) ?? null;

    // Safely get team IDs with null checking
    const playerTeamIds: string[] = [];
    if (player.teams && Array.isArray(player.teams)) {
      player.teams.forEach((team) => {
        if (typeof team === "string" && team) {
          playerTeamIds.push(team);
        } else if (team && typeof team === "object" && "_id" in team) {
          const teamObj = team as { _id: string };
          playerTeamIds.push(teamObj._id);
        }
      });
    }

    // Get relevant matches with null checking
    const relevantMatches: IMatchExpRel[] = [];
    playerTeamIds.forEach((teamId) => {
      const matches = matchLookup.get(teamId);
      if (matches && Array.isArray(matches)) {
        const team = teamMap ? teamMap.get(teamId) : null;
        if (!team) {
          relevantMatches.push(
            ...matches.filter((match) => match !== undefined)
          );
        } else {
          if (team?.group) {
            relevantMatches.push(
              ...matches.filter(
                (match) => match !== undefined && match.group === team.group
              )
            );
          }
        }
      }
    });

    relevantMatches.forEach((match) => {
      if (!match) return;

      const isTeamA = playerTeamIds.includes(match?.teamA?._id);
      const isTeamB = playerTeamIds.includes(match?.teamB?._id);

      if (!isTeamA && !isTeamB) return; // Skip if the player is not in the match

      if (!match.completed) {
        running += 1;
        return;
      }

      if (!match.nets || !Array.isArray(match.nets)) return;

      match.nets.forEach((net) => {
        if (!net) return;

        const isPlayerInNet = [
          net.teamAPlayerA,
          net.teamAPlayerB,
          net.teamBPlayerA,
          net.teamBPlayerB,
        ].includes(player._id);

        if (!isPlayerInNet) return;

        const teamAScore = net.teamAScore ?? 0;
        const teamBScore = net.teamBScore ?? 0;

        if (isTeamA) {
          myScore += teamAScore;
          opScore += teamBScore;
          wins += teamAScore > teamBScore ? 1 : 0;
          losses += teamAScore < teamBScore ? 1 : 0;
        } else if (isTeamB) {
          myScore += teamBScore;
          opScore += teamAScore;
          wins += teamBScore > teamAScore ? 1 : 0;
          losses += teamBScore < teamAScore ? 1 : 0;
        }
        numOfGames += 1;
      });
    });

    const averagePointsDiff =
      numOfGames > 0 ? (myScore - opScore) / numOfGames : 0;

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



export { calcMatchScore, calcScore, calculatePlayerRecords };