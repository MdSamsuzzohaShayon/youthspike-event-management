import React, { Suspense } from "react";
import {IAccessCode, IMatchExpRel, IUser, TParams } from "@/types";
import Loader from "@/components/elements/Loader";
import { PreloadQuery } from "@/lib/client";
import ScoreKeepingMain from "@/components/ScoreKeeping/ScoreKeepingMain";
import { GET_MATCH_DETAIL } from "@/graphql/matches";
import { QueryRef } from "@apollo/client/react";
import { cookies } from "next/headers";
import { ACCESS_CODE } from "@/utils/constant";

interface IScoreKeepingPageProps {
  params: TParams;
}
async function ScoreKeepingPage({ params }: IScoreKeepingPageProps) {
  const { matchId } = await params;

  const cookieStore = await cookies();
  const accessCodeCookie = cookieStore.get(ACCESS_CODE);
  const accessCodeList = accessCodeCookie
    ? JSON.parse(accessCodeCookie.value)
    : [];
  const accessCode: null | IAccessCode = !accessCodeList
    ? null
    : accessCodeList.find((ac: IAccessCode) => ac.match === matchId) || null;


  return (
    <div className="w-full min-h-screen">
      <div className="container mx-auto px-4 py-10">
        <PreloadQuery
          query={GET_MATCH_DETAIL}
          variables={{
            matchId: matchId,
          }}
        >
          {(queryRef) => (
            <Suspense fallback={<Loader />}>
              <ScoreKeepingMain
                queryRef={
                  queryRef as QueryRef<{ getMatch: { data: IMatchExpRel } }>
                }
                accessCodeList={accessCodeList}
                accessCode={accessCode}
              />
            </Suspense>
          )}
        </PreloadQuery>
      </div>
    </div>
  );
}

export default ScoreKeepingPage;
