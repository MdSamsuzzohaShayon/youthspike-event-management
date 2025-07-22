import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getPlayersMin } from '../_requests/players';
import PlayerTable from '@/components/player/PlayerTable';
import { UNAUTHORIZED } from '@/utils/constant';

async function PlayersPage() {
  let players = null;
  try {
    
    players = await getPlayersMin();
  } catch (err: any) {
    if (err.message === UNAUTHORIZED) {
      redirect('/api/logout');
    }
    throw err;
  }

  if (!players) notFound();
  return (
    <div className="min-h-screen px-6 py-10 md:px-16">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 text-center mb-6">Players</h2>

        <div className="overflow-hidden shadow-lg rounded-lg border border-gray-700">
          <PlayerTable players={players} />
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400">Stay updated with the latest events!</p>
        </div>
      </div>
    </div>
  );
}

export default PlayersPage;