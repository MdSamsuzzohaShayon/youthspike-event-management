import { IMatchExpRel, INetRelatives, IRoundExpRel } from "@/types";
import { ETeam, ITeam } from "@/types/team";
import { calcRoundScore } from "@/utils/scoreCalc";
import Link from "next/link";
import React, { useCallback, useMemo, useRef } from "react";
import { readDate, readTime } from "@/utils/datetime";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/lib/UserProvider";
import { useLdoId } from "@/lib/LdoProvider";
import { EActionProcess } from "@/types/room";
import { CldImage } from "next-cloudinary";
import localStorageService from "@/utils/LocalStorageService";
import { ADMIN_FRONTEND_URL } from "@/utils/keys";
import TextImg from "../elements/TextImg";
import LocalStorageService from "@/utils/LocalStorageService";

interface MatchCardProps {
  match: IMatchExpRel;
  roundList: IRoundExpRel[];
  allNets: INetRelatives[];
}

function MatchCard({ match, roundList, allNets }: MatchCardProps) {
  const { ldoIdUrl } = useLdoId();
  const user = useUser();
  const router = useRouter();

  const handleCaptainView = (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (user?.token) {
      router.push(`/matches/${match?._id}/${ldoIdUrl}`);
      return;
    }
    // Remove all local storage
    localStorageService.clearAll();
    // sessionStorageService.setItem(MATCH, match._id);
    router.push(`${ADMIN_FRONTEND_URL}/login/?matchId=${match?._id}`);
  };

  const redirectFullScoreboard = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const prevMatch = LocalStorageService.getMatch(match._id);
    if (prevMatch) {
      LocalStorageService.setMatch(match._id, prevMatch.roundId);
    }
    router.push(`/matches/${match?._id}/scoreboard/${ldoIdUrl}`);
  };

  /** ✅ Precompute nets by round */
  const netsByRoundId = useMemo(() => {
    return (allNets || []).reduce((map, net) => {
      if (!net?.round) return map;
      if (!map.has(net.round)) map.set(net.round, []);
      map.get(net.round)!.push(net);
      return map;
    }, new Map<string, INetRelatives[]>());
  }, [allNets]);

  /** ✅ Precompute team scores */
  const teamScores = useMemo(() => {
    return (roundList || []).reduce(
      (scores, round) => {
        if (!round?._id) return scores;
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
    if (match?.completed) return "COMPLETED";

    for (const currRound of roundList) {
      if (!currRound?._id) continue;

      const roundNets = netsByRoundId.get(currRound._id) || [];

      if (
        currRound.teamAProcess === EActionProcess.INITIATE ||
        currRound.teamBProcess === EActionProcess.INITIATE
      )
        return "SCHEDULED";

      const hasIncompleteNet = roundNets.some(
        (net) => !net?.teamAScore || !net?.teamBScore
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
  }, [roundList, netsByRoundId, match?.completed]);

  /** ✅ Map status to color */
  const statusColor = useMemo(() => {
    if (statusMessage.includes("LIVE")) return "bg-red-500 text-white";
    if (statusMessage.includes("ASSIGNING")) return "bg-blue-500 text-white";
    if (statusMessage === "COMPLETED") return "bg-green-500 text-white";
    if (statusMessage === "SCHEDULED") return "bg-yellow-logo text-black";
    return "bg-gray-500";
  }, [statusMessage]);

  /** ✅ Team card reusable component */
  const TeamCard = useCallback(
    ({ team, teamType }: { team?: ITeam | null; teamType: ETeam }) => {
      const teamScore =
        teamType === ETeam.teamA ? teamScores.teamA : teamScores.teamB;
      const opponentScore =
        teamType === ETeam.teamA ? teamScores.teamB : teamScores.teamA;
      const won = teamScore > opponentScore && match?.completed;

      return (
        <div
          className={`flex ${
            teamType === ETeam.teamA ? "flex-row" : "flex-row-reverse"
          } items-center gap-1 p-1 rounded-md ${
            won ? "bg-green-600/20 border border-green-500" : ""
          }`}
        >
          <div className="flex-shrink-0">
            {team?.logo ? (
              <CldImage
                alt={team?.name || "Team logo"}
                width={70}
                height={70}
                className="w-12 h-12 object-center object-cover"
                src={team.logo}
                crop="fit"
              />
            ) : (
              <TextImg
                fullText={team?.name || "Team"}
                className="w-12 h-12 rounded-xl"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-medium text-white capitalize word-breaks text-center">
              {team?.name || "Unknown Team"}
            </h5>
          </div>
          <div
            className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg border ${
              won
                ? "border-green-500 bg-green-600"
                : "border-gray-400 bg-white text-black"
            }`}
          >
            <span className="text-xs font-bold">{teamScore} </span>
          </div>
        </div>
      );
    },
    [teamScores, match?.completed]
  );

  /** ✅ Reusable Action Buttons */
  const ActionButtons = ({ iconSize = 20 }: { iconSize?: number }) => {
    const iconClass = `w-${iconSize / 4} h-${iconSize / 4}`;

    return (
      <div className="flex justify-between items-center gap-2 mt-2">
        {/* Spectate */}
        <div
          role="presentation"
          onClick={redirectFullScoreboard}
          className="flex flex-col items-center text-center rounded hover:bg-gray-700 transition-colors cursor-pointer"
        >
          <Image
            width={iconSize}
            height={iconSize}
            src="/icons/spectate.svg"
            alt="Spectate"
            className={iconClass}
          />
          <span className="text-[10px] md:text-xs uppercase">
            Full Scoreboard
          </span>
        </div>

        {/* Captain */}
        <div
          onClick={handleCaptainView}
          role="presentation"
          className="flex flex-col items-center text-center rounded hover:bg-gray-700 transition-colors cursor-pointer"
        >
          <Image
            width={iconSize}
            height={iconSize}
            src="/icons/captain.png"
            alt="Captain"
            className={iconClass}
          />
          <span className="text-[10px] md:text-xs uppercase">Captain</span>
        </div>

        {/* Scorekeeper */}
        <Link
          href={`/score-keeping/${match?._id}/${ldoIdUrl}`}
          className="flex flex-col items-center text-center rounded hover:bg-gray-700 transition-colors"
        >
          <Image
            width={iconSize}
            height={iconSize}
            src="/icons/scorekeeper.png"
            alt="Scorekeeper"
            className={iconClass}
          />
          <span className="text-[10px] md:text-xs uppercase">Scorekeeper</span>
        </Link>
      </div>
    );
  };

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
    <>
      {/* Mobile View */}
      <div className="block md:hidden bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-600 p-2">
        <MatchHeader />

        <div className="grid grid-cols-2 gap-2 mt-1">
          <TeamCard team={match?.teamA} teamType={ETeam.teamA} />
          <TeamCard team={match?.teamB} teamType={ETeam.teamB} />
        </div>
        <ActionButtons iconSize={20} />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-600 p-3">
        <MatchHeader />
        <div className="flex flex-col items-center justify-between mt-2">
          <div className="grid grid-cols-2 gap-3 flex-1">
            <TeamCard team={match?.teamA} teamType={ETeam.teamA} />
            <TeamCard team={match?.teamB} teamType={ETeam.teamB} />
          </div>
          <ActionButtons iconSize={24} />
        </div>
      </div>
    </>
  );
}

export default React.memo(MatchCard);
