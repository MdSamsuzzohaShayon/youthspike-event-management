import { IMatchExpRel, INetRelatives, IRoundExpRel } from "@/types";
import { ETeam, ITeam } from "@/types/team";
import { calcRoundScore } from "@/utils/scoreCalc";
import Link from "next/link";
import React, { useCallback, useMemo, useRef } from "react";
import { readTime } from "@/utils/datetime";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/lib/UserProvider";
import { useLdoId } from "@/lib/LdoProvider";
import { EActionProcess } from "@/types/room";
import { CldImage } from "next-cloudinary";
import localStorageService from "@/utils/LocalStorageService";
import { ADMIN_FRONTEND_URL } from "@/utils/keys";
import TextImg from "../elements/TextImg";

interface MatchCardProps {
  match: IMatchExpRel;
  roundList: IRoundExpRel[];
  allNets: INetRelatives[];
}

function MatchCard({ match, roundList, allNets }: MatchCardProps) {
  const params = useParams();
  const { ldoIdUrl } = useLdoId();
  const user = useUser();
  const router = useRouter();
  const loginEl = useRef<HTMLDialogElement | null>(null);

  const handleCaptainView = (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (user.token) {
      router.push(`/matches/${match._id}/${ldoIdUrl}`);
      return;
    }
    // Remove all local storage
    localStorageService.clearAll();
    // sessionStorageService.setItem(MATCH, match._id);
    router.push(`${ADMIN_FRONTEND_URL}/login/?matchId=${match._id}`);
  };

  /** ✅ Precompute nets by round */
  const netsByRoundId = useMemo(() => {
    return allNets.reduce((map, net) => {
      if (!map.has(net.round)) map.set(net.round, []);
      map.get(net.round)!.push(net);
      return map;
    }, new Map<string, INetRelatives[]>());
  }, [allNets]);

  /** ✅ Precompute team scores */
  const teamScores = useMemo(() => {
    return roundList.reduce(
      (scores, round) => {
        const roundNets = netsByRoundId.get(round._id) || [];
        // @ts-ignore
        scores.teamA += calcRoundScore(roundNets, round, ETeam.teamA).score;
        // @ts-ignore
        scores.teamB += calcRoundScore(roundNets, round, ETeam.teamB).score;
        return scores;
      },
      { teamA: 0, teamB: 0 }
    );
  }, [roundList, netsByRoundId]);

  /** ✅ Determine match status */
  const statusMessage = useMemo(() => {
    if (match.completed) return "COMPLETED";

    for (const currRound of roundList) {
      const roundNets = netsByRoundId.get(currRound._id) || [];

      if (
        currRound.teamAProcess === EActionProcess.INITIATE ||
        currRound.teamBProcess === EActionProcess.INITIATE
      )
        return "SCHEDULED";

      const hasIncompleteNet = roundNets.some(
        (net) => !net.teamAScore || !net.teamBScore
      );

      if (
        [currRound.teamAProcess, currRound.teamBProcess].includes(
          EActionProcess.CHECKIN
        ) &&
        hasIncompleteNet
      )
        return `R${currRound.num} ASSIGNING`;

      if (
        currRound.teamAProcess === EActionProcess.LINEUP &&
        currRound.teamBProcess === EActionProcess.LINEUP &&
        hasIncompleteNet
      )
        return `R${currRound.num} LIVE`;
    }

    return "UPCOMING";
  }, [roundList, netsByRoundId, match.completed]);

  /** ✅ Map status to color */
  const statusColor = useMemo(() => {
    if (statusMessage.includes("LIVE")) return "bg-red-500";
    if (statusMessage.includes("ASSIGNING")) return "bg-blue-500";
    if (statusMessage === "COMPLETED") return "bg-green-500";
    if (statusMessage === "SCHEDULED") return "bg-yellow-500";
    return "bg-gray-500";
  }, [statusMessage]);

  /** ✅ Team card reusable component */
  const TeamCard = useCallback(
    ({ team, teamType }: { team: ITeam; teamType: ETeam }) => {
      const teamScore =
        teamType === ETeam.teamA ? teamScores.teamA : teamScores.teamB;
      const opponentScore =
        teamType === ETeam.teamA ? teamScores.teamB : teamScores.teamA;
      const won = teamScore > opponentScore && match.completed;

      return (
        <div
          className={`flex items-center gap-1 p-1 rounded-md ${
            won ? "bg-green-600/20 border border-green-500" : ""
          }`}
        >
          <div className="flex-shrink-0 w-6 h-6">
            {team?.logo ? (
              <CldImage
                alt={team.name}
                width={24}
                height={24}
                className="w-6 h-6 object-contain"
                src={team.logo}
              />
            ) : (
              <TextImg
                fullText={team.name}
                className="w-6 h-6 object-contain"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-medium text-white capitalize truncate">
              {team?.name}
            </h5>
          </div>
          <div
            className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full border ${
              won ? "border-green-500 bg-green-600" : "border-gray-400"
            }`}
          >
            <span className="text-xs font-bold">{teamScore}</span>
          </div>
        </div>
      );
    },
    [teamScores, match.completed]
  );

  /** ✅ Reusable Action Buttons */
  const ActionButtons = ({ iconSize = 20 }: { iconSize?: number }) => {
    const iconClass = `w-${iconSize / 4} h-${iconSize / 4}`;

    return (
      <div className="flex justify-between items-center gap-2 mt-2 md:mt-0">
        {/* Spectate */}
        <Link
          href={`/matches/${match._id}/scoreboard/${ldoIdUrl}`}
          className="flex flex-col items-center text-center p-1 md:p-2 rounded hover:bg-gray-700 transition-colors"
        >
          <Image
            width={iconSize}
            height={iconSize}
            src="/icons/spectate.svg"
            alt="Spectate"
            className={iconClass}
          />
          <span className="text-[10px] md:text-xs uppercase mt-1">
            Spectate
          </span>
        </Link>

        {/* Captain */}
        <div
          onClick={handleCaptainView}
          role="presentation"
          className="flex flex-col items-center text-center p-1 md:p-2 rounded hover:bg-gray-700 transition-colors"
        >
          <Image
            width={iconSize}
            height={iconSize}
            src="/icons/captain.png"
            alt="Captain"
            className={iconClass}
          />
          <span className="text-[10px] md:text-xs uppercase mt-1">Captain</span>
        </div>

        {/* Scorekeeper */}
        <Link
          href={`/score-keeping/${match._id}/${ldoIdUrl}`}
          className="flex flex-col items-center text-center p-1 md:p-2 rounded hover:bg-gray-700 transition-colors"
        >
          <Image
            width={iconSize}
            height={iconSize}
            src="/icons/scorekeeper.png"
            alt="Scorekeeper"
            className={iconClass}
          />
          <span className="text-[10px] md:text-xs uppercase mt-1">
            Scorekeeper
          </span>
        </Link>
      </div>
    );
  };

  /** ✅ Reusable Header */
  const MatchHeader = () => (
    <div
      className={`px-2 md:px-3 py-1 md:py-2 ${statusColor} text-white text-xs font-semibold uppercase flex justify-between items-center rounded-t`}
    >
      <span className="truncate">{statusMessage}</span>
      {match.location && (
        <span className="hidden md:inline">{match.location}</span>
      )}
      <span>{readTime(match.date)}</span>
    </div>
  );

  return (
    <>
      {/* Mobile View */}
      <div className="block md:hidden bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-600 p-2">
        <MatchHeader />
        {match.location && (
          <div className="text-xs text-gray-400 text-center py-1 truncate">
            {match.location}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <TeamCard team={match.teamA} teamType={ETeam.teamA} />
          <TeamCard team={match.teamB} teamType={ETeam.teamB} />
        </div>
        <ActionButtons iconSize={20} />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-600 p-3">
        <MatchHeader />
        <div className="flex flex-col items-center justify-between mt-2">
          <div className="grid grid-cols-2 gap-3 flex-1">
            <TeamCard team={match.teamA} teamType={ETeam.teamA} />
            <TeamCard team={match.teamB} teamType={ETeam.teamB} />
          </div>
          <ActionButtons iconSize={24} />
        </div>
      </div>
    </>
  );
}

export default React.memo(MatchCard);
