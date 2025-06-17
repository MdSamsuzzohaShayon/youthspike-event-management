import { getPlayer } from '@/app/_requests/player';
import cld from '@/config/cloudinary.config';
import { IPlayer } from '@/types';
import { AdvancedImage } from '@cloudinary/react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import React from 'react';

interface IPlayersStatsPageProps {
  matchId: string;
  playerId: string;
}

async function PlayerStatsPage({ params }: { params: Promise<IPlayersStatsPageProps> }) {
  const { playerId, matchId } = await params;
  // Messi ID: 68486d6ba46c501ab11114b3

  const playerData: IPlayer = await getPlayer(playerId);
  if (!playerData) {
    notFound();
  }

  console.log({ playerData });

  return (
    <div className="w-full min-h-screen">
      <div className="container mx-auto px-4 py-10">
        <div className="content">
          <h1 className="uppercase">Filter:</h1>
          <p>
            <span className="uppercase">Date Range: </span> #Games (+) for active game. (seasons)
          </p>
          <p>
            <span className="uppercase">SPECIFIC MATCH </span> #Games (+) for active game
          </p>
          <p>
            <span className="uppercase">SPECIFIC GAME: </span> Date. Oponent team and players. Show partner (+) in the middle of game
          </p>
        </div>

        <div className="player-wrapper w-full flex justify-center items-center">
          {/* Outer box start  */}
          <div className="player mt-6 rounded-lg bg-red-900 w-full md:w-2/6 h-[30rem] p-4">
            {/* Inner box start  */}
            <div className="img-stats relative bg-red-700 w-full pb-8">
              <div className="stats-logo w-full flex justify-between items-start static p-2 gap-x-2 relative z-10">
                {/* Left side start  */}
                <div className="w-2/6 flex flex-col gap-y-2">
                  <h4 className="uppercase text-[0.5rem] flex">
                    <span className="text-yellow-logo">per game</span> <span>/totals</span>
                  </h4>
                  <div className="box w-full">
                    <p className="uppercase title-box w-full bg-black text-white text-center text-xs p-1">Serve % </p>
                    <div className="w-full flex justify-between items-center">
                      <p className="text-xs">67%</p>
                      <p className="text-xs">12/18</p>
                    </div>
                  </div>

                  <div className="box w-full">
                    <p className="uppercase title-box w-full bg-black text-white text-center text-xs p-1">ACE % </p>
                    <div className="w-full flex justify-between items-center">
                      <p className="text-xs">22%</p>
                      <p className="text-xs">18</p>
                    </div>
                  </div>

                  <div className="box w-full">
                    <p className="uppercase title-box w-full bg-black text-white text-center text-xs p-1">ACE NO Touch % </p>
                    <div className="w-full flex justify-between items-center">
                      <p className="text-xs">6%</p>
                      <p className="text-xs">1/18</p>
                    </div>
                  </div>

                  <div className="box w-full">
                    <p className="uppercase title-box w-full bg-black text-white text-center text-xs p-1">Receiving % </p>
                    <div className="w-full flex justify-between items-center">
                      <p className="text-xs">60%</p>
                      <p className="text-xs">9/15</p>
                    </div>
                  </div>

                  <div className="box w-full">
                    <p className="uppercase title-box w-full bg-black text-white text-center text-xs p-1">Touch Receiving % </p>
                    <div className="w-full flex justify-between items-center">
                      <p className="text-xs">77%</p>
                      <p className="text-xs">12/15</p>
                    </div>
                  </div>
                </div>
                {/* Left side end  */}

                {/* Middle side start  */}
                <div className="w-2/6 flex flex-col gap-y-2">
                  <div className="w-full relative flex justify-center items-start">
                    <Image src="/free-logo.png" height={40} width={40} alt="team-logo" className="h-16 w-16 rounded-full bg-red-900 object-center object-cover" />
                    <p className="uppercase title-box text-white text-center text-[0.5rem] px-2 py-[2px] bg-black rounded-md absolute bottom-px">Player Stats</p>
                  </div>

                  <div className="box w-full">
                    <p className="uppercase title-box w-full bg-black text-white text-center text-xs p-1">Pro Score </p>
                    <p className="text-xs text-center">6.7</p>
                  </div>
                </div>
                {/* Middle side end  */}

                {/* Right side start  */}
                <div className="w-2/6 flex flex-col gap-y-2">
                  <h4 className="h-8">
                  </h4>
                  <div className="box w-full">
                    <p className="uppercase title-box w-full bg-black text-white text-center text-xs p-1">Hitting % </p>
                    <div className="w-full flex justify-between items-center">
                      <p className="text-xs">93%</p>
                      <p className="text-xs">14/15</p>
                    </div>
                  </div>

                  <div className="box w-full">
                    <p className="uppercase title-box w-full bg-black text-white text-center text-xs p-1">Clean Hit % </p>
                    <div className="w-full flex justify-between items-center">
                      <p className="text-xs">33%</p>
                      <p className="text-xs">5/15</p>
                    </div>
                  </div>

                  <div className="box w-full">
                    <p className="uppercase title-box w-full bg-black text-white text-center text-xs p-1">Defensive % </p>
                    <div className="w-full flex justify-between items-center">
                      <p className="text-xs">15%</p>
                      <p className="text-xs">3/20</p>
                    </div>
                  </div>

                  <div className="box w-full">
                    <p className="uppercase title-box w-full bg-black text-white text-center text-xs p-1">Break +/- </p>
                    <div className="w-full flex justify-between items-center">
                      <p className="text-xs">+2</p>
                      <p className="text-xs">18/16</p>
                    </div>
                  </div>

                </div>
                {/* Right side end  */}
              </div>
              {playerData?.profile && <img className='h-44 absolute bottom-px left-1/2 -translate-x-1/2 ' src={`https://res.cloudinary.com/djkpxl9pf/image/upload/v1/${playerData.profile}`}/>}
              <h2 className="absolute bottom-px text-center bg-black text-white w-full p-1">#3 {`${playerData.firstName} ${playerData.lastName}`}</h2>
            </div>
            {/* Inner box end  */}
            <div className="squad-stats">Squad Stats {playerData.profile}</div>
          </div>
          {/* Outer box end  */}
        </div>
      </div>
    </div>
  );
}

export default PlayerStatsPage;
