import { IEvent, IPlayer } from '@/types';
import React from 'react';
import Link from 'next/link';
import { CldImage } from 'next-cloudinary';
import TextImg from '../elements/TextImg';

interface PlayerWithRank extends IPlayer {
  rank?: number;
}

interface PlayerListProps {
  players: PlayerWithRank[];
  events: IEvent[];
}

function PlayerList({ players, events }: PlayerListProps) {
  const hasRank = players.length > 0 && players[0].rank != null;

  return (
    <div className="playerList w-full flex flex-col">
      <div className="overflow-x-auto w-full">
        <div className="min-w-[700px] w-full">
          <div className="relative w-full">
            <table className="w-full text-left text-sm text-gray-300 bg-gray-900">
              
              {/* HEADER */}
              <thead>
                <tr className="bg-yellow-logo text-black font-semibold">
                  
                  {hasRank && (
                    <th className="py-3 px-3 sticky left-0 top-0 z-20 bg-yellow-logo min-w-[80px] max-w-[80px] text-center shadow-md">
                      Rank
                    </th>
                  )}

                  <th
                    className={`py-3 px-3 ${
                      !hasRank ? 'sticky left-0 top-0 z-20 bg-yellow-logo shadow-md' : ''
                    } min-w-[220px] max-w-[220px]`}
                  >
                    Player
                  </th>

                  <th className="py-3 px-3 min-w-[220px]">Email</th>
                  <th className="py-3 px-3 min-w-[150px]">Username</th>
                  <th className="py-3 px-3 min-w-[200px]">Events</th>
                </tr>
              </thead>

              {/* BODY */}
              <tbody>
                {players.map((player, index) => (
                  <tr
                    key={player._id}
                    className="odd:bg-gray-800 even:bg-gray-700 hover:bg-gray-600 transition-colors duration-150"
                  >
                    
                    {/* Rank */}
                    {hasRank && (
                      <td className="py-3 px-3 text-center">
                        <span className="text-lg font-semibold text-gray-300">
                          {player.rank ?? index + 1}
                        </span>
                      </td>
                    )}

                    {/* Player */}
                    <td
                      className={`py-2 px-3 ${
                        !hasRank ? 'sticky left-0 bg-inherit z-10' : ''
                      } min-w-[220px] max-w-[220px]`}
                    >
                      <div className="flex items-start">
                        {!hasRank && (
                          <span className="w-5 text-center font-medium text-sm shrink-0 mt-1">
                            {index + 1}
                          </span>
                        )}

                        <div className="ml-2 flex flex-col w-full">
                          <Link
                            href={`/players/${player._id}`}
                            className="flex items-center"
                          >
                            <div className="relative w-8 h-8 flex-shrink-0">
                              {player.profile ? (
                                <CldImage
                                  alt={player.firstName}
                                  width="32"
                                  height="32"
                                  className="w-8 h-8 rounded-lg object-cover"
                                  crop="fit"
                                  src={player.profile}
                                />
                              ) : (
                                <TextImg
                                  fullText={player.firstName + player.lastName}
                                  className="w-8 h-8 rounded-lg"
                                />
                              )}
                            </div>

                            <div className="ml-2 min-w-0">
                              <div className="text-xs font-medium hover:text-yellow-500 transition-colors break-words capitalize">
                                <span className="block sm:inline">
                                  {player.firstName}
                                </span>
                                {player.lastName && (
                                  <span className="block sm:inline">
                                    {" "}
                                    {player.lastName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3 px-3">
                      <a
                        href={`mailto:${player.email}`}
                        className="text-sm text-gray-300 hover:text-yellow-500 transition-colors"
                      >
                        {player.email}
                      </a>
                    </td>

                    {/* Username */}
                    <td className="py-3 px-3">
                      <span className="text-sm text-gray-300 font-mono">
                        @{player.username}
                      </span>
                    </td>

                    {/* Events */}
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1.5">
                        {events.length > 0 ? (
                          events.map((event) => (
                            <span
                              key={event._id}
                              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium
                                       bg-gray-700 text-gray-300 border border-gray-600
                                       hover:bg-yellow-500 hover:text-black hover:border-yellow-500
                                       transition-all duration-200"
                            >
                              {event.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500 italic">
                            No events
                          </span>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerList;