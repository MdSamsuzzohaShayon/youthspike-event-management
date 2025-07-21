'use client';

import { IPlayer, IPlayerTotalStats } from '@/types';
import { CldImage } from 'next-cloudinary';
import React from 'react';
import TextImg from '../elements/TextImg';
import Image from 'next/image';
import StatSingle from './StatsSingle';
import StatBox from './StatBox';

interface IPlayerStatsMainProps {
  player: IPlayer;
  playerTotalStats: IPlayerTotalStats;
  totalGames: number;
}

function PlayerStatsMain({ player, playerTotalStats, totalGames }: IPlayerStatsMainProps) {
  return (
    <div className="w-full min-h-screen bg-black text-white px-4 py-10">
      {/* Filter Info */}
      <div className="max-w-6xl mx-auto mb-10">
        <h1 className="text-yellow-400 text-xl uppercase font-bold mb-2">Filter:</h1>
        <ul className="space-y-1 text-sm text-gray-200">
          <li>
            <span className="font-bold uppercase">Date Range:</span> #Games (+) for active game. (seasons)
          </li>
          <li>
            <span className="font-bold uppercase">Specific Match:</span> #Games (+) for active game
          </li>
          <li>
            <span className="font-bold uppercase">Specific Game:</span> Date, Opponent team & players. Show partner (+) mid-game
          </li>
        </ul>
      </div>

      {/* Player Info */}
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-3 mb-8">
        <h2 className="text-2xl font-semibold tracking-wide">
          {player.firstName} {player.lastName}
        </h2>
        {player.profile ? (
          <CldImage alt={player.profile} width="100" height="100" className="w-24 h-24 rounded-full object-cover" src={player.profile} />
        ) : (
          <TextImg className="w-24 h-24 rounded-full" fullText={`${player.firstName} ${player.lastName}`} />
        )}
      </div>

      {/* Stats Card */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="bg-gray-900 p-4 rounded-xl space-y-4 shadow-md">
          <h4 className="text-yellow-400 text-xs uppercase">Per Game / Totals</h4>
          <StatBox label="Serve %" value={playerTotalStats.serveCompletionCount} total={playerTotalStats.serveOpportunity} />
          <StatBox label="Ace %" value={playerTotalStats.serveAce} total={playerTotalStats.serveOpportunity} />
          <StatBox label="Ace No Touch %" value={playerTotalStats.servingAceNoTouch} total={playerTotalStats.serveOpportunity} />
          <StatBox label="Receiving %" value={playerTotalStats.receivedCount} total={playerTotalStats.receiverOpportunity} />
          <StatBox label="Touch Receiving %" value={playerTotalStats.receiverOpportunity - playerTotalStats.noTouchAcedCount} total={playerTotalStats.receiverOpportunity} />
        </div>

        {/* Middle Column */}
        <div className="bg-gray-900 p-4 rounded-xl shadow-md flex flex-col items-center space-y-4 relative">
          <Image src="/free-logo.png" height={64} width={64} alt="team-logo" className="h-16 w-16 rounded-full bg-yellow-400 object-cover" />
          <p className="text-[0.6rem] uppercase bg-yellow-400 text-black px-2 py-1 rounded">Player Stats</p>
          <StatSingle label="Pro Score" value="6.7" />
        </div>

        {/* Right Column */}
        <div className="bg-gray-900 p-4 rounded-xl space-y-4 shadow-md">
          <div className="h-8"></div> {/* spacing match left column */}
          <StatBox label="Hitting %" value={playerTotalStats.hittingCompletion} total={playerTotalStats.hittingOpportunity} />
          <StatBox label="Clean Hit %" value={playerTotalStats.cleanHits} total={playerTotalStats.hittingOpportunity} />
          <StatBox label="Defensive %" value={playerTotalStats.defensiveConversion} total={playerTotalStats.defensiveOpportunity} />
          <StatBox label="Break +/-" value={playerTotalStats.break} total={playerTotalStats.break} />
        </div>
      </div>

      {/* Player Image + Footer */}
      <div className="max-w-6xl mx-auto mt-10 relative text-center">
        {player?.profile && (
          <img className="h-48 mx-auto object-contain opacity-70" src={`https://res.cloudinary.com/djkpxl9pf/image/upload/v1/${player.profile}`} alt={`${player.firstName} ${player.lastName}`} />
        )}
        <h2 className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 text-sm rounded">
          #5 {player.firstName} {player.lastName}
        </h2>
      </div>

      {/* Squad Stats */}
      <div className="max-w-6xl mx-auto mt-6 text-center text-white text-sm">
        Squad Stats: <span className="text-yellow-400 font-medium">{player.profile}</span>
      </div>
    </div>
  );
}

export default PlayerStatsMain;
