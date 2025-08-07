

'use client'

import React, { Suspense, useMemo } from "react";
import { IAccessCode, IMatchExpRel } from "@/types";
import AccessCodeForm from "@/components/ScoreKeeping/AccessCodeForm";
import ServerReceiver from "@/components/ScoreKeeping/ServerReceiver";
import Link from "next/link";
import Loader from "@/components/elements/Loader";
import { QueryRef, useReadQuery } from "@apollo/client";
import { useUser } from "@/lib/UserProvider";

interface IScoreKeepingMainProps {
    accessCode: IAccessCode | null;
    accessCodeList: IAccessCode[];
    queryRef: QueryRef<{getMatch: {data: IMatchExpRel}}>;
}
async function ScoreKeepingMain({queryRef, accessCode, accessCodeList}: IScoreKeepingMainProps) {

    const {data, error} = useReadQuery(queryRef);
    const user = useUser();

    // Memoization
    const match = useMemo(() => data?.getMatch?.data, [data]);


  // Get round list, match, room, nets
  const renderHeadings = () => {
    return (
      <>
        <h1 className="text-4xl font-extrabold text-yellow-400 text-center uppercase tracking-wide mb-6">
          Scorekeeper Settings
        </h1>

        <div className="text-center mb-6">
          <Link
            href={`/matches/${match._id}`}
            className="inline-block text-sm px-4 py-2 rounded-full bg-yellow-400 text-black font-semibold shadow-md hover:bg-yellow-300 transition"
          >
            ← Go back to match
          </Link>
        </div>
      </>
    );
  };

  if (!accessCode) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-xl bg-gray-950/80 rounded-2xl shadow-2xl p-8 backdrop-blur-md border border-gray-800">
          {renderHeadings()}

          <div className="access-code">
            <AccessCodeForm matchId={match._id} accessCodes={accessCodeList} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      <div className="container mx-auto px-4 py-10">
        {renderHeadings()}
        <div className="server-receiver-wrapper">
          {/* or whatever height you need */}
          <Suspense fallback={<Loader />}>
            {match && (
              <ServerReceiver
                matchId={match._id}
                matchData={match}
                accessCode={accessCode}
                token={user?.token || null}
                userInfo={user.info}
              />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default ScoreKeepingMain;