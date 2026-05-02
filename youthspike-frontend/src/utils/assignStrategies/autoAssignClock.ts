import {
  EActionProcess,
  ETeam,
  IAssignClock,
  IMatchRelatives,
  IRoundRelatives,
} from "@/types";
import LocalStorageService from "../LocalStorageService";

/**
 * Safely extract team ID (handles object or string)
 */
const getTeamId = (team: unknown): string | null => {
  if (!team) return null;

  if (typeof team === "string") return team;

  if (typeof team === "object" && "_id" in team) {
    return (team as { _id: string })._id;
  }

  return null;
};

/**
 * Check if current user is allowed to assign clock
 */
const isEligibleForClockAssignment = (
  round: IRoundRelatives,
  myTeam: ETeam
): boolean => {
  if (myTeam === ETeam.teamA) {
    return round.teamAProcess === EActionProcess.CHECKIN;
  }

  if (myTeam === ETeam.teamB) {
    return round.teamBProcess === EActionProcess.CHECKIN;
  }

  return false;
};

/**
 * Determine which team should get the clock
 */
const resolveAssigningTeamId = (
  round: IRoundRelatives,
  match: IMatchRelatives
): string | null => {
  const teamAId = getTeamId(match.teamA);
  const teamBId = getTeamId(match.teamB);

  const { teamAProcess, teamBProcess, firstPlacing } = round;

  // Both teams checked in
  if (
    teamAProcess === EActionProcess.CHECKIN &&
    teamBProcess === EActionProcess.CHECKIN
  ) {
    // return firstPlacing === ETeam.teamA ? teamAId : teamBId;
    if(firstPlacing === ETeam.teamA){
      return teamAId;
    }else{
      return teamBId;
    }
  }

  // Team A already submitted lineup → Team B gets clock
  if (
    teamAProcess === EActionProcess.LINEUP &&
    teamBProcess === EActionProcess.CHECKIN
  ) {
    return teamBId;
  }

  // Team B already submitted lineup → Team A gets clock
  if (
    teamAProcess === EActionProcess.CHECKIN &&
    teamBProcess === EActionProcess.LINEUP
  ) {
    return teamAId;
  }

  // Fallback (default behavior preserved)
  return teamAId;
};

/**
 * Main function
 */
export default function autoAssignClock(
  currentRound: IRoundRelatives,
  match: IMatchRelatives,
  myTeamE: ETeam
): boolean {
  // 1. Feature flag check
  if (!match?.autoAssign) return false;

  // 2. Prevent if already in lineup phase (my team)
  if (
    (myTeamE === ETeam.teamA &&
      currentRound.teamAProcess === EActionProcess.LINEUP) ||
    (myTeamE === ETeam.teamB &&
      currentRound.teamBProcess === EActionProcess.LINEUP)
  ) {
    return false;
  }

  // 3. Prevent if any team is initiating
  if (
    currentRound.teamAProcess === EActionProcess.INITIATE ||
    currentRound.teamBProcess === EActionProcess.INITIATE
  ) {
    return false;
  }

  // 4. Prevent if both teams already submitted lineup
  if (
    currentRound.teamAProcess === EActionProcess.LINEUP &&
    currentRound.teamBProcess === EActionProcess.LINEUP
  ) {
    return false;
  }

  // 5. Ensure it's my turn (CHECKIN phase)
  if (!isEligibleForClockAssignment(currentRound, myTeamE)) {
    return false;
  }

  // 6. Resolve team assignment
  const assignedTeamId = resolveAssigningTeamId(currentRound, match);
  if (!assignedTeamId) return false;

  // Check my team or not
  if(myTeamE === ETeam.teamA && assignedTeamId !== match.teamA){
    return false;
  }else if(myTeamE === ETeam.teamB && assignedTeamId !== match.teamB){
    return false;
  }

  // 7. Prepare payload
  const assignClock: IAssignClock = {
    start: new Date().toISOString(),
    round: currentRound._id,
    team: assignedTeamId,
  };

  // 8. Persist
  LocalStorageService.setAssignedClock(assignClock);

  return true;
}