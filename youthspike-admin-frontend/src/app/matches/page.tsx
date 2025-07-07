import React from 'react';
import { notFound } from 'next/navigation';
import TeamTable from '@/components/teams/TeamTable';
import { getMatchesMin } from '../_requests/matches';
import MatchTable from '@/components/match/MatchTable';

async function MatchesPage() {
  const matches = await getMatchesMin();

  if (!matches) notFound();
  return (
    <div className="min-h-screen px-6 py-10 md:px-16">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 text-center mb-6">Matches</h2>

        <div className="overflow-hidden shadow-lg rounded-lg border border-gray-700">
          <MatchTable matches={matches} />
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400">Stay updated with the latest matches!</p>
        </div>
      </div>
    </div>
  );
}

export default MatchesPage;
