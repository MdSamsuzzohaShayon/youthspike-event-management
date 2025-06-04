import React from 'react';
import { cookies } from 'next/headers';
import { IUser } from '@/types';
import AccessCodeForm from '@/components/match/ScoreKeeping/AccessCodeForm';
import ServerReceiver from '@/components/match/ScoreKeeping/ServerReceiver';
import Link from 'next/link';
import { getMatch } from '@/app/_requests/match';
import { notFound } from 'next/navigation';

interface IScoreKeepingPageProps {
  params: {
    matchId: string;
  };
}
async function ScoreKeepingPage({ params: { matchId } }: IScoreKeepingPageProps) {
  /**
   * Get value of localstorage (match list), check which round they are in
   * Check both team checked in or not, check both team submitted their lineup or not
   * In ther setting of particular match, create 2 buttons. 1) Start New 2) Edit. Those buttons will take us to this page.
   * Check in the cookie if the user is logged in or not
   * Check is access code already exist or not
   * If not show the form to enter the access code
   * Get round number and net number from local storage
   * Get team A and team B
   * Get both players of the team
   */
  const cookieStore = await cookies();
  const user = cookieStore.get('user');
  const token = cookieStore.get('token')?.value;
  const userInfo: IUser | null = user ? JSON.parse(user.value) : null;

  const matchData = await getMatch(matchId);
  if (!matchData) {
    notFound();
  }
  
  // Get round list, match, room, nets

  const checkAccessCode = (): boolean => {
    if (!userInfo || !userInfo.accessCode || userInfo.accessCode.length === 0) return false;
    if (!matchId) return false;

    const findCode = userInfo.accessCode.find((ac) => ac.matchId === matchId);
    // console.log({ accessCode: userInfo?.accessCode, findCode, matchId });

    return !!findCode;
  };

  const hasAccessCode = checkAccessCode();

  return (
    <div className="w-full min-h-screen">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-yellow-400 uppercase text-center mb-8">Scorekeeper Settings</h1>
        <Link href={`/matches/${matchId}`}>Go back to match</Link>

        {!hasAccessCode ? (
          <div className="max-w-md mx-auto p-6 bg-white text-black rounded-xl shadow-lg">
            <AccessCodeForm matchId={matchId} userInfo={userInfo} />
          </div>
        ) : (
          <div className="server-receiver-wrapper">
            <ServerReceiver matchId={matchId} matchData={matchData} token={token || ""} userInfo={userInfo} />
          </div>
        )}
      </div>
    </div>
  );
}

export default ScoreKeepingPage;
