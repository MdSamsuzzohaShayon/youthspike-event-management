import { IMatch, IMatchExpRel, INetRelatives, IRoundRelatives } from "@/types";
import { ETeam } from "@/types/team";
import React, { useMemo } from "react";
import { readDate } from "@/utils/datetime";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/UserProvider";
import { useLdoId } from "@/lib/LdoProvider";
import { getMatchStatus } from "@/utils/match/getMatchStatus";
import TeamCard from "./TeamCard";
import ActionButtons from "./ActionButtons";

interface MatchCardProps {
  match: IMatchExpRel;
  roundList: IRoundRelatives[];
  allNets: INetRelatives[];
}

function MatchCard({ match, roundList, allNets }: MatchCardProps) {
  const { ldoIdUrl } = useLdoId();
  const user = useUser();
  const router = useRouter();





  /** ✅ Precompute nets by round */
  const netsByRoundId = useMemo(() => {
    return (allNets || []).reduce((map, net) => {
      if (!net?.round) return map;
      if (!map.has(net.round)) map.set(net.round, []);
      map.get(net.round)!.push(net);
      return map;
    }, new Map<string, INetRelatives[]>());
  }, [allNets]);

  /** ✅ Determine match status */
  const statusMessage = useMemo(() => {
    return getMatchStatus(match as IMatch, roundList, allNets);
  }, [roundList, netsByRoundId, match?.completed, allNets]);

  // LIVE, ASSIGNING, SCHEDULED, UPCOMING, COMPLETED

  /** ✅ Map status to color */
  const statusColor = useMemo(() => {
    if (statusMessage.includes("LIVE")) return "bg-red-500 text-white";
    if (statusMessage.includes("ASSIGNING")) return "bg-blue-500 text-white";
    if (statusMessage === "COMPLETED") return "bg-green-500 text-white";
    if (statusMessage === "SCHEDULED") return "bg-yellow-logo text-black";
    return "bg-gray-500";
  }, [statusMessage]);






  /** ✅ Reusable Header */
  const MatchHeader = () => (
    <div
      className={`px-2 md:px-3 py-1 md:py-2 ${statusColor} text-xs font-semibold uppercase rounded-t flex flex-wrap justify-between items-center`}
    >
      <span>{statusMessage}</span>
      {match?.description && <span>{match.description}</span>}
      {match?.location && <span>{match.location}</span>}
      <span>{readDate(match?.date)}</span>
    </div>
  );

  if (!match) return null;

  return (
    <div>
      {/* Mobile View */}
      <div className="block md:hidden bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-600 p-2">
        <MatchHeader />

        <div className="grid grid-cols-2 gap-2 mt-1">
          <TeamCard allNets={allNets} match={match} roundList={roundList} team={match?.teamA} teamType={ETeam.teamA} />
          <TeamCard allNets={allNets} match={match} roundList={roundList} team={match?.teamB} teamType={ETeam.teamB} />
        </div>
        <ActionButtons iconSize={20} match={match}  />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-600 p-3">
        <MatchHeader />
        <div className="flex flex-col items-center justify-between mt-2">
          <div className="grid grid-cols-2 gap-3 flex-1">
            <TeamCard allNets={allNets} match={match} roundList={roundList} team={match?.teamA} teamType={ETeam.teamA} />
            <TeamCard allNets={allNets} match={match} roundList={roundList} team={match?.teamB} teamType={ETeam.teamB} />
          </div>
          <ActionButtons iconSize={24} match={match} />
        </div>
      </div>
    </div>
  );
}

export default React.memo(MatchCard);
