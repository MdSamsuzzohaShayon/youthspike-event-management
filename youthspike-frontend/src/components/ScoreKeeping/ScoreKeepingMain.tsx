"use client";

import React, { Suspense } from "react";
import { IAccessCode, IMatchExpRel } from "@/types";
import AccessCodeForm from "@/components/ScoreKeeping/AccessCodeForm";
import ServerReceiver from "@/components/ScoreKeeping/ServerReceiver";
import Link from "next/link";
import Loader from "@/components/elements/Loader";
import { QueryRef, useReadQuery } from "@apollo/client";
import { useUser } from "@/lib/UserProvider";

interface IScoreKeepingMainProps {
  queryRef: QueryRef<{ getMatch: { data: IMatchExpRel } }>;
  accessCodeList: IAccessCode[];
  accessCode: IAccessCode | null;
}
function ScoreKeepingMain({
  queryRef,
  accessCode,
  accessCodeList,
}: IScoreKeepingMainProps) {
  const { data, error } = useReadQuery(queryRef);

  const user = useUser();

  const { token, info } = user;

  const matchData = data?.getMatch?.data;

  // Get round list, match, room, nets
  const renderHeadings = () => {
    return (
      <>
        <h1 className="text-4xl font-extrabold text-yellow-400 text-center uppercase tracking-wide mb-6">
          Scorekeeper Settings
        </h1>

        <div className="text-center mb-6">
          <Link
            href={`/matches/${matchData._id}`}
            className="inline-block text-sm px-4 py-2 rounded-full bg-yellow-400 text-black font-semibold shadow-md hover:bg-yellow-300 transition"
          >
            ← Go back to match
          </Link>
        </div>
      </>
    );
  };

  if (!accessCode && !token) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-xl bg-gray-950/80 rounded-2xl shadow-2xl p-8 backdrop-blur-md border border-gray-800">
          {renderHeadings()}

          <div className="access-code">
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
    <React.Fragment>
      {renderHeadings()}
      <div className="server-receiver-wrapper">
        {/* Whatever height you need */}
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
    </React.Fragment>
  );
}

export default ScoreKeepingMain;
