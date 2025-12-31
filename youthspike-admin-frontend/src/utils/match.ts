import { INetRelatives, IRoundExpRel, IRoundRelatives, IMatch } from "@/types";
import { EMatchStatus, EActionProcess } from "@/types"; // Adjust import path

export function getMatchStatus(
  match: IMatch,
  roundList: (IRoundExpRel | IRoundRelatives)[],
  nets: INetRelatives[]
): EMatchStatus {
  if (match?.completed) return EMatchStatus.COMPLETED;

  for (const currRound of roundList) {
    if (!currRound?._id) continue;

    const roundNets = nets.filter((n) => n.round === currRound._id);

    const hasIncompleteNet = roundNets.some(
      (net) => net.teamAScore == null || net.teamBScore == null
    );

    const teamAProcess = currRound.teamAProcess;
    const teamBProcess = currRound.teamBProcess;

    if (
      teamAProcess === EActionProcess.INITIATE ||
      teamBProcess === EActionProcess.INITIATE
    ) {
      return EMatchStatus.SCHEDULED;
    }

    if (
      [teamAProcess, teamBProcess].includes(EActionProcess.CHECKIN) &&
      hasIncompleteNet
    ) {
      return EMatchStatus.ASSIGNING;
    }

    if (
      teamAProcess === EActionProcess.LINEUP &&
      teamBProcess === EActionProcess.LINEUP &&
      hasIncompleteNet
    ) {
      return EMatchStatus.LIVE;
    }
  }

  return EMatchStatus.SCHEDULED;
}
