import { EGroupType, EPlayerStatus, EStatsFilter, IBadge, IPlayer, IPlayerRank } from "@/types";
import React, { useState } from "react";
import Link from "next/link";
import { CldImage } from "next-cloudinary";
import TextImg from "../elements/TextImg";
import BadgeIcon from "../badge/BadgeIcon";
import {
  ChevronRight,
  Crown,
  Medal,
  Award,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import LogoWithBadge from "../badge/LogoWithBadge";

interface RankPlayerRowProps {
  player: IPlayerRank | IPlayer;
  index: number;
  hasRank: boolean;
  badge: IBadge | null | undefined;
}

function RankPlayerRow({ player, index, hasRank, badge }: RankPlayerRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getRankDisplay = (index: number) => {
    return (
      <span className="text-xs font-bold text-gray-400 w-6 text-center">
        {index + 1}
      </span>
    );
  };

  const getTrendIcon = () => {
    if (!('trend' in player) || !player.trend) return null;

    if (player.trend === 'up') {
      return <TrendingUp className="w-3 h-3 text-green-400" />;
    } else if (player.trend === 'down') {
      return <TrendingDown className="w-3 h-3 text-red-400" />;
    }
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  return (
    <tr
      key={player._id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        transition-all duration-200
        ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'}
        hover:bg-gray-600
        ${index < 3 && hasRank ? 'bg-gradient-to-r from-yellow-500/10 to-transparent hover:from-yellow-500/20' : ''}
      `}
    >
      {/* Player Column with Integrated Rank */}
      {hasRank && (
        <td className="py-3 px-4 whitespace-nowrap border-b border-gray-800/30"><span className="font-bold text-xl">{getRankDisplay(index)}</span></td>
      )}
      <td className={`
        py-2 px-3 whitespace-nowrap border-b border-gray-800/30
        sticky left-0 bg-inherit min-w-[140px] max-w-[140px] md:min-w-[240px] md:max-w-[240px] z-10
        ${isHovered ? 'bg-gray-600' : ''}
      `}>
        <Link
          href={`/players/${player?._id || ""}/?${EStatsFilter.CONFERENCE}=${EGroupType.CONFERENCE}`}
          className="flex flex-col sm:flex-row sm:items-center"
        >

          <div className="relative flex-shrink-0 mx-auto sm:mx-0">
            <LogoWithBadge
              logo={player.profile}
              name={player.firstName + ' ' + player.lastName}
              badge={badge}
              size="w-16 h-16"
              badgeSize="w-8 h-8"
            />
          </div>
        </Link>
      </td>


      <td className="py-3 px-4 whitespace-nowrap border-b border-gray-800/30"><span className="font-bold text-xl">{player.firstName}</span></td>
      <td className="py-3 px-4 whitespace-nowrap border-b border-gray-800/30"><span className="font-bold text-xl">{player.lastName}</span></td>
    </tr>
  );
}

export default RankPlayerRow;