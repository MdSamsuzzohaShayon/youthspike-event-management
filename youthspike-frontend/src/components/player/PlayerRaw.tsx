import Link from 'next/link'
import React from 'react'
import TextImg from '../elements/TextImg';
import { CldImage } from 'next-cloudinary';
import { IBadge, IPlayer, IPlayerRank } from '@/types';
import LogoWithBadge from '../badge/LogoWithBadge';

interface IPlayerRawProps {
    player: IPlayer | IPlayerRank;
    hasRank: boolean;
    index: number;
    badge?: IBadge | null;
}
function PlayerRaw({ player, hasRank, index, badge }: IPlayerRawProps) {
    const rank = "rank" in player ? player.rank : undefined;

    return (
        <tr
            key={player._id}
            className="border-b border-gray-800 transition-colors hover:bg-gray-800/70"
        >
            {/* Rank */}
            {hasRank && (
                <td className="px-4 py-3 text-center align-middle">
                    <span className="font-semibold text-gray-300">
                        {rank ?? index + 1}
                    </span>
                </td>
            )}

            {/* Player */}
            <td
                className={`px-4 py-3 ${!hasRank
                    ? "sticky left-0 bg-gray-900 lg:static"
                    : ""
                    }`}
            >
                <div className="flex items-center gap-3 min-w-0">
                    {!hasRank && (
                        <span className="w-5 flex-shrink-0 text-center text-xs font-medium text-gray-400">
                            {index + 1}
                        </span>
                    )}

                    <Link
                        href={`/players/${player._id}`}
                        className="flex items-center gap-3 min-w-0 group w-full"
                    >
                        <div className="flex-shrink-0">
                            <LogoWithBadge
                                teamName={`${player.firstName} ${player.lastName ?? ""}`}
                                badge={badge}
                                logo={player.profile}
                                size='h-12 w-12 rounded-lg object-cover sm:h-14 sm:w-14'
                                badgeSize='w-4 h-4'
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium capitalize transition-colors group-hover:text-yellow-400">
                                {player.firstName}{" "}
                                {player.lastName && player.lastName}
                            </p>
                        </div>
                    </Link>
                </div>
            </td>

            {/* Username */}
            <td className="px-4 py-3">
                <span className="block truncate font-mono text-xs text-gray-400 sm:text-sm">
                    @{player.username}
                </span>
            </td>
        </tr>
    )
}

export default PlayerRaw;