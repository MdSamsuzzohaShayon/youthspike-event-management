"use client";

import React from "react";
import { IAccessCode, IMatchExpRel, UserRole } from "@/types";
import AccessCodeForm from "@/components/ScoreKeeping/AccessCodeForm";
import ServerReceiver from "@/components/ScoreKeeping/ServerReceiver";
import Link from "next/link";
import { QueryRef, useReadQuery } from "@apollo/client/react";
import { useUser } from "@/lib/UserProvider";
import LocalStorageService from "@/utils/LocalStorageService";
import { useRouter } from "next/navigation";
import { containerVariants, itemVariants } from "@/utils/animation";

interface IScoreKeepingContainerProps {
  queryRef: QueryRef<{ getMatch: { data: IMatchExpRel } }>;
  accessCodeList: IAccessCode[];
  accessCode: IAccessCode | null;
}

function ScoreKeepingContainer({
  queryRef,
  accessCode,
  accessCodeList,
}: IScoreKeepingContainerProps) {
  const { data, error } = useReadQuery(queryRef);
  const user = useUser();
  const router = useRouter();
  const { token, info } = user;
  const matchData = data?.getMatch?.data;

  const redirectFullScoreboard = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const prevMatch = LocalStorageService.getMatch(matchData._id);
    if (prevMatch) {
      LocalStorageService.setMatch(matchData._id, prevMatch.roundId);
    }
    router.push(`/matches/${matchData?._id}/scoreboard`);
  };



  const renderHeadings = () => {
    return (
      <div>
        <h1
          className="text-4xl font-extrabold text-yellow-logo text-center uppercase tracking-wide mb-6"
        >
          Scorekeeper Settings
        </h1>

        <div
          className="text-center mb-6 flex flex-wrap justify-center items-center gap-2"
        >
          {info &&
            (info.role === UserRole.admin ||
              info.role === UserRole.director ||
              info.role === UserRole.captain ||
              info.role === UserRole.co_captain) && (
              <Link
                href={`/matches/${matchData._id}`}
                className="btn-info"
              >
                ← Go back to captain
              </Link>
            )}
          <button
            onClick={redirectFullScoreboard}
            className="btn-info"
          >
            ← Go to full scoreboard
          </button>
        </div>
      </div>
    );
  };

  if (!accessCode && !token) {
    return (
      <div
        className="w-full min-h-screen flex items-center justify-center py-12 px-4"
      >
        <div
          className="w-full max-w-xl bg-gray-950/80 rounded-2xl shadow-2xl p-8 backdrop-blur-md border border-gray-800"
        >
          {renderHeadings()}

          <div
            className="access-code"
          >
            <AccessCodeForm
              matchId={matchData._id}
              accessCodes={accessCodeList}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      key="scorekeeping-main"
    >
      {renderHeadings()}
      <div
        className="server-receiver-wrapper"
      >
        {matchData && (
          <ServerReceiver
            matchId={matchData._id}
            matchData={matchData}
            accessCode={accessCode}
            token={token || null}
            userInfo={info}
          />
        )}
      </div>
    </div>
  );
}

export default ScoreKeepingContainer;
