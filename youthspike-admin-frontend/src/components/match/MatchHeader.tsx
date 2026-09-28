import { EActionProcess, IMatch, IMatchExpRel, INetRelatives } from "@/types";
import { readDate } from "@/utils/datetime";
import { useMemo } from "react";

interface IMatchHeaderProps{
    match: IMatchExpRel; 
    netsByRoundId: Map<string, INetRelatives[]>;
}

/** ✅ Reusable Header - optimized with useCallback */
const MatchHeader = ({ match, netsByRoundId }: IMatchHeaderProps) => {
      // Optimized status message calculation with early returns
  const statusMessage = useMemo(() => {
    if (match.completed) return 'COMPLETED';

    const rounds = match.rounds;
    for (let i = 0; i < rounds.length; i++) {
      const currRound = rounds[i];
      const roundNets = netsByRoundId.get(currRound._id) || [];

      // Check for INITIATE status
      if (currRound.teamAProcess === EActionProcess.INITIATE || currRound.teamBProcess === EActionProcess.INITIATE) {
        return 'SCHEDULED';
      }

      // Check for CHECKIN status with incomplete nets
      if (currRound.teamAProcess === EActionProcess.CHECKIN || currRound.teamBProcess === EActionProcess.CHECKIN) {
        for (let j = 0; j < roundNets.length; j++) {
          const net = roundNets[j];
          if (!net.teamAScore || !net.teamBScore) {
            return `ROUND ${currRound.num} - ASSIGNING`;
          }
        }
      }

      // Check for LINEUP status with incomplete nets
      if (currRound.teamAProcess === EActionProcess.LINEUP && currRound.teamBProcess === EActionProcess.LINEUP) {
        for (let j = 0; j < roundNets.length; j++) {
          const net = roundNets[j];
          if (!net.teamAScore || !net.teamBScore) {
            return `ROUND ${currRound.num} - LIVE`;
          }
        }
      }
    }

    return 'UPCOMING';
  }, [match.rounds, netsByRoundId, match.completed]);

    // Memoize status color to avoid recalculating
    const statusColor = useMemo(() => {
        if (statusMessage.includes('LIVE')) return 'bg-red-500 text-white';
        if (statusMessage.includes('ASSIGNING')) return 'bg-blue-500 text-white ';
        if (statusMessage === 'COMPLETED') return 'bg-green-500 text-white ';
        if (statusMessage === 'SCHEDULED') return 'bg-yellow-logo text-black';
        return 'bg-gray-500';
    }, [statusMessage]);

    return (<div className={`px-2 md:px-3 py-1 md:py-2 ${statusColor} text-xs font-semibold uppercase flex justify-between items-center rounded-t`}>
        <span>{statusMessage}</span>
        {match.description && <span>{match.description}</span>}
        {match.location && <span>{match.location}</span>}
        <span>{readDate(match.date)}</span>
    </div>)
}


export default MatchHeader;