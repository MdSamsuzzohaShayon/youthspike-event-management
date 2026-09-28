/* eslint-disable no-restricted-syntax */
import {
  IMatchExpRel,
  IMatchScore,
  INetRelatives,
  IRoundRelatives,
  IRoundScore,
} from "@/types";

/**
 * Result type for calcScore — explicit instead of inline anonymous object.
 */
interface ICalcScoreResult {
  roundMap: Record<string, IRoundScore>;
  matchScore: IMatchScore;
}

/**
 * Default zero-score result, used as a safe fallback.
 */
const createEmptyScoreResult = (): ICalcScoreResult => ({
  roundMap: {},
  matchScore: {
    teamAScore: 0,
    teamBScore: 0,
    teamAPlusMinus: 0,
    teamBPlusMinus: 0,
  },
});

/**
 * Determines whether the match has pre-finalized scores (e.g. manually set).
 * Uses explicit null-check so a legitimate score of 0 is still considered finalized.
 */
const isMatchFinalized = (match: IMatchExpRel): boolean =>
  match?.teamAFScore != null && match?.teamBFScore != null;

/**
 * Builds a match-score result from finalized (manually entered) scores.
 */
const buildFinalizedScoreResult = (match: IMatchExpRel): ICalcScoreResult => {
  const teamAScore: number = match.teamAFScore ?? 0;
  const teamBScore: number = match.teamBFScore ?? 0;
  const scoreDifference: number = teamAScore - teamBScore;

  return {
    roundMap: {},
    matchScore: {
      teamAScore,
      teamBScore,
      teamAPlusMinus: scoreDifference,
      teamBPlusMinus: -scoreDifference,
    },
  };
};

/**
 * Groups a flat list of nets by their `round` id for O(n) lookup during iteration.
 */
const groupNetsByRoundId = (
  nets: INetRelatives[]
): Record<string, INetRelatives[]> => {
  const netsByRoundId: Record<string, INetRelatives[]> = {};

  for (const net of nets) {
    if (!net || !net.round) continue;

    const roundId: string = net.round;
    if (!netsByRoundId[roundId]) {
      netsByRoundId[roundId] = [];
    }
    netsByRoundId[roundId].push(net);
  }

  return netsByRoundId;
};

/**
 * Pure helper: computes aggregate score and plus-minus for a single round's nets.
 */
const computeRoundScore = (roundNets: INetRelatives[]): IRoundScore => {
  let teamARoundScore = 0;
  let teamBRoundScore = 0;
  let teamATotalPoints = 0;
  let teamBTotalPoints = 0;

  for (const net of roundNets) {
    if (!net) continue;

    const teamAScore: number = net.teamAScore ?? 0;
    const teamBScore: number = net.teamBScore ?? 0;
    const netPoints: number = net.points ?? 0;

    if (teamAScore > teamBScore) {
      teamARoundScore += netPoints;
    } else if (teamBScore > teamAScore) {
      teamBRoundScore += netPoints;
    }

    teamATotalPoints += teamAScore;
    teamBTotalPoints += teamBScore;
  }

  const totalDifference: number = teamATotalPoints - teamBTotalPoints;

  return {
    teamARScore: teamARoundScore,
    teamBRScore: teamBRoundScore,
    teamARPlusMinus: totalDifference,
    teamBRPlusMinus: -totalDifference,
  };
};

/**
 * Aggregates round scores into a full match score, including any match-level
 * bonus points (teamAP / teamBP).
 */
const buildScoreResultFromRounds = (
  match: IMatchExpRel,
  nets: INetRelatives[],
  rounds: IRoundRelatives[]
): ICalcScoreResult => {
  const roundMap: Record<string, IRoundScore> = {};
  const netsByRoundId = groupNetsByRoundId(nets);

  let teamAScoreTotal = 0;
  let teamBScoreTotal = 0;
  let teamAPlusMinusTotal = 0;
  let teamBPlusMinusTotal = 0;

  for (const round of rounds) {
    if (!round || !round._id) continue;

    const roundId: string = round._id;
    const roundNets: INetRelatives[] | undefined = netsByRoundId[roundId];

    if (!roundNets || roundNets.length === 0) continue;

    const roundScore: IRoundScore = computeRoundScore(roundNets);

    roundMap[roundId] = roundScore;

    teamAScoreTotal += roundScore.teamARScore;
    teamBScoreTotal += roundScore.teamBRScore;
    teamAPlusMinusTotal += roundScore.teamARPlusMinus;
    teamBPlusMinusTotal += roundScore.teamBRPlusMinus;
  }

  // Apply match-level bonus points (teamAP / teamBP) — separate concerns clearly.
  const teamABonusPoints: number = match?.teamAP ?? 0;
  const teamBBonusPoints: number = match?.teamBP ?? 0;
  teamAScoreTotal += teamABonusPoints;
  teamBScoreTotal += teamBBonusPoints;

  return {
    roundMap,
    matchScore: {
      teamAScore: teamAScoreTotal,
      teamBScore: teamBScoreTotal,
      teamAPlusMinus: teamAPlusMinusTotal,
      teamBPlusMinus: teamBPlusMinusTotal,
    },
  };
};

/**
 * Calculate match score and plus-minus for a specific team across rounds.
 *
 * Strategy:
 *  - If the match has finalized scores (teamAFScore/teamBFScore), use them directly.
 *  - Otherwise, aggregate per-round scores from individual net results.
 *  - Bonus points (teamAP/teamBP) are only applied in the aggregated path,
 *    matching the original business logic.
 */
const scoreCalc = (
  match: IMatchExpRel,
  nets: INetRelatives[],
  rounds: IRoundRelatives[]
): ICalcScoreResult => {
  // Defensive: guard against a missing match object entirely.
  if (!match) {
    return createEmptyScoreResult();
  }

  // Defensive: ensure arrays exist to avoid runtime errors downstream.
  const safeNets: INetRelatives[] = Array.isArray(nets) ? nets : [];
  const safeRounds: IRoundRelatives[] = Array.isArray(rounds) ? rounds : [];

  if (isMatchFinalized(match)) {
    return buildFinalizedScoreResult(match);
  }

  return buildScoreResultFromRounds(match, safeNets, safeRounds);
};

export default scoreCalc;


