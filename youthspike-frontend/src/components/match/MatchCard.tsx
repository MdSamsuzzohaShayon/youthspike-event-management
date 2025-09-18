import { IMatchExpRel, INetRelatives, IRoundExpRel } from "@/types";
import { ETeam, ITeam } from "@/types/team";
import { calcRoundScore } from "@/utils/scoreCalc";
import Link from "next/link";
import React, { useCallback, useMemo } from "react";
import { readDate } from "@/utils/datetime";
import { ADMIN_FRONTEND_URL } from "@/utils/keys";
import Image from "next/image";
import { useParams } from "next/navigation";
import { imgW } from "@/utils/constant";
import { useUser } from "@/lib/UserProvider";
import { UserRole } from "@/types/user";
import { useLdoId } from "@/lib/LdoProvider";
import { EActionProcess } from "@/types/room";
import PointsByRoundPublic from "./PointsByRoundPublic";
import { CldImage } from "next-cloudinary";

interface MatchCardProps {
  match: IMatchExpRel;
  roundList: IRoundExpRel[];
  allNets: INetRelatives[];
}

function MatchCard({ match, roundList, allNets }: MatchCardProps) {
  const params = useParams();
  const { ldoIdUrl } = useLdoId();
  const user = useUser();

  // Precompute nets by round to avoid repeated filtering
  const netsByRoundId = useMemo(() => {
    const map = new Map<string, INetRelatives[]>();
    allNets.forEach((net) => {
      if (!map.has(net.round)) {
        map.set(net.round, []);
      }
      map.get(net.round)!.push(net);
    });
    return map;
  }, [allNets]);

  // Memoize team scores calculation
  const teamScores = useMemo(() => {
    const scores = {
      teamA: 0,
      teamB: 0,
      roundScores: new Map<string, { teamA: number; teamB: number }>(),
    };

    roundList.forEach((round) => {
      const roundNets = netsByRoundId.get(round._id) || [];
      // @ts-ignore
      const teamAScore = calcRoundScore(roundNets, round, ETeam.teamA).score;
      // @ts-ignore
      const teamBScore = calcRoundScore(roundNets, round, ETeam.teamB).score;

      scores.teamA += teamAScore;
      scores.teamB += teamBScore;
      scores.roundScores.set(round._id, {
        teamA: teamAScore,
        teamB: teamBScore,
      });
    });

    return scores;
  }, [roundList, netsByRoundId]);

  const teamCard = useCallback(
    (team: ITeam, teamE: ETeam) => {
      const teamScore =
        teamE === ETeam.teamA ? teamScores.teamA : teamScores.teamB;
      const opponentScore =
        teamE === ETeam.teamA ? teamScores.teamB : teamScores.teamA;
      const won = teamScore > opponentScore && match.completed;

      return (
        <div
          className={`flex items-center gap-2 p-2 rounded-lg ${
            won ? "bg-green-600/20 border border-green-500" : ""
          }`}
        >
          <div className="flex-shrink-0 w-8 h-8">
            {team?.logo ? (
              <CldImage
                alt={team.name}
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
                src={team.logo}
              />
            ) : (
              <Image
                src="/free-logo.png"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
                alt="free-logo"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-xs md:text-sm font-medium text-white capitalize">
              {team?.name}
            </h5>
          </div>
          <div
            className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border-2 ${
              won ? "border-green-500 bg-green-600" : "border-gray-400"
            }`}
          >
            <span className="text-sm font-bold">{teamScore}</span>
          </div>
        </div>
      );
    },
    [teamScores, match.completed]
  );

  // Optimize messageCreate function with early returns and reduced complexity
  const messageCreate = useCallback(() => {
    if (match.completed) {
      return "COMPLETED";
    }
    for (let i = 0; i < roundList.length; i += 1) {
      const currRound = roundList[i];
      const roundNets = netsByRoundId.get(currRound._id) || [];

      // Check for INITIATE status
      if (
        currRound.teamAProcess === EActionProcess.INITIATE ||
        currRound.teamBProcess === EActionProcess.INITIATE
      ) {
        return "SCHEDULED";
      }

      // Check for CHECKIN status with incomplete nets
      if (
        currRound.teamAProcess === EActionProcess.CHECKIN ||
        currRound.teamBProcess === EActionProcess.CHECKIN
      ) {
        const hasIncompleteNet = roundNets.some(
          (net) => !net.teamAScore || !net.teamBScore
        );
        if (hasIncompleteNet) {
          return `ROUND ${currRound.num} - ASSIGNING`;
        }
      }

      // Check for LINEUP status with incomplete nets
      if (
        currRound.teamAProcess === EActionProcess.LINEUP &&
        currRound.teamBProcess === EActionProcess.LINEUP
      ) {
        const hasIncompleteNet = roundNets.some(
          (net) => !net.teamAScore || !net.teamBScore
        );
        if (hasIncompleteNet) {
          return `ROUND ${currRound.num} - LIVE`;
        }
      }
    }

    return match.completed ? "COMPLETED" : "UPCOMING";
  }, [roundList, netsByRoundId, match.completed]);

  const statusMessage = useMemo(() => messageCreate(), [messageCreate]);
  const isAdminOrDirector = useMemo(
    () =>
      user.info?.role === UserRole.admin ||
      user.info?.role === UserRole.director,
    [user.info?.role]
  );

  const getStatusColor = () => {
    if (statusMessage.includes("LIVE")) return "bg-red-500";
    if (statusMessage.includes("ASSIGNING")) return "bg-blue-500";
    if (statusMessage === "COMPLETED") return "bg-green-500";
    if (statusMessage === "SCHEDULED") return "bg-yellow-500";
    return "bg-gray-500";
  };

  return (
    <div className="w-full bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-600">
      {/* Header with status */}
      <div
        className={`px-3 py-2 ${getStatusColor()} text-white text-xs font-semibold uppercase tracking-wide text-center`}
      >
        {statusMessage}
      </div>

      {/* Main content */}
      <div className="p-3 space-y-3">
        {/* Teams and scores */}
        <div className="grid grid-cols-2 gap-3">
          {teamCard(match?.teamA, ETeam.teamA)}
          {teamCard(match?.teamB, ETeam.teamB)}
        </div>

        {/* Rounds and points */}
        <div className="rounded-lg p-2">
          <div className="flex justify-center items-center mb-2">
            <ul className="flex gap-1">
              {roundList.map((round, i) => (
                <li
                  key={round._id}
                  className="text-xs text-gray-300 font-medium px-1"
                >
                  {`R${
                    match.extendedOvertime && i === roundList.length - 1
                      ? "X"
                      : round.num
                  }`}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-1">
            <PointsByRoundPublic
              // @ts-ignore
              roundList={roundList}
              allNets={allNets}
              teamE={ETeam.teamA}
              precomputedScores={teamScores.roundScores}
              compact
            />
            <PointsByRoundPublic
              // @ts-ignore
              roundList={roundList}
              allNets={allNets}
              teamE={ETeam.teamB}
              dark
              precomputedScores={teamScores.roundScores}
              compact
            />
          </div>
        </div>

        {/* Match details */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-300">
          <div className="flex items-center gap-1">
            <Image
              width={12}
              height={12}
              src="/icons/clock.svg"
              className="w-3 h-3 svg-white"
              alt="clock"
            />
            <span>{readDate(match.date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Image
              width={12}
              height={12}
              src="/icons/location.svg"
              className="w-3 h-3 svg-white"
              alt="location"
            />
            <span>{match.location}</span>
          </div>
          {match.description && (
            <div className="flex items-center gap-1">
              <Image
                width={12}
                height={12}
                src="/icons/info.svg"
                className="w-3 h-3 svg-white"
                alt="info"
              />
              <span>{match.description}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-600">
          <div className="flex items-center gap-2">
            {isAdminOrDirector && (
              <Link
                href={`${ADMIN_FRONTEND_URL}/${params.eventId}/matches/${match._id}/${ldoIdUrl}`}
                className="p-1 hover:bg-gray-600 rounded transition-colors"
              >
                <Image
                  height={16}
                  width={16}
                  src="/icons/setting.svg"
                  alt="settings"
                  className="w-4 h-4 svg-white"
                />
              </Link>
            )}
            <button className="p-1 hover:bg-gray-600 rounded transition-colors">
              <Image
                height={16}
                width={16}
                src="/icons/share.svg"
                alt="share"
                className="w-4 h-4 svg-white"
              />
            </button>
          </div>

          <Link
            href={`/matches/${match._id}/${ldoIdUrl}`}
            className="px-3 py-1 bg-yellow-500 text-black text-xs font-semibold rounded hover:bg-yellow-400 transition-colors"
          >
            View Match
          </Link>
        </div>
      </div>
    </div>
  );
}

export default React.memo(MatchCard);
