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

  const renderHeadings = () => {
    return (
      <>
        <h1 className="text-4xl font-extrabold text-yellow-400 text-center uppercase tracking-wide mb-6">Scorekeeper Settings</h1>

        <div className="text-center mb-6">
          <Link href={`/matches/${matchId}`} className="inline-block text-sm px-4 py-2 rounded-full bg-yellow-400 text-black font-semibold shadow-md hover:bg-yellow-300 transition">
            ← Go back to match
          </Link>
        </div>
      </>
    );
  };

  if (!hasAccessCode) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-xl bg-gray-950/80 rounded-2xl shadow-2xl p-8 backdrop-blur-md border border-gray-800">
          {renderHeadings()}

          <div className="access-code">
            <AccessCodeForm matchId={matchId} userInfo={userInfo} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      <div className="container mx-auto px-4 py-10">
        {renderHeadings()}
        <div className="server-receiver-wrapper">{matchData && <ServerReceiver matchId={matchId} matchData={matchData} token={token || ''} userInfo={userInfo} />}</div>
      </div>
    </div>
  );
}

export default ScoreKeepingPage;


/**
 * Database fields   for each player in a match
 * 1. Serve Opportunity (number) -> this will change for "Double Fault"
 * 2. Serve Ace (number) -> This will increase for "Ace No Touch" button
 * 3. Serve Completion Count (number) -> This will increase for "Ace No Touch" button
 * 4. Serving Ace No Touch 
 * 5. Receiver Opporitunity
 * 6. Received count
 * 7. No touch Aced Count
 * 8. Hitting opporitunity
 * 9. Hitting Completion
 * 10. Cleans hit
 * 11. Defensive opporitunity
 * 12. Defensive conversion
 * 13. Break
 * 14. Broken
 * 15. Match played
 * -----> Related fields
 * 16. match
 * 17. player
 * 
 * */

