import { EPlayerStatus, IBadge, IPlayer, IPlayerRank } from "@/types";
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

interface RankPlayerRowProps {
  player: IPlayerRank | IPlayer;
  index: number;
  hasRank: boolean;
  badge: IBadge | null | undefined;
}

function RankPlayerRow({ player, index, hasRank, badge }: RankPlayerRowProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const getRankDisplay = (index: number) => {
    switch(index) {
      case 0:
        return (
          <div className="relative flex items-center justify-center w-6">
            <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg animate-pulse" />
            <Crown className="relative w-4 h-4 text-yellow-400" fill="currentColor" />
          </div>
        );
      case 1:
        return (
          <div className="flex items-center justify-center w-6">
            <Medal className="w-4 h-4 text-gray-300" />
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center w-6">
            <Award className="w-4 h-4 text-amber-700" />
          </div>
        );
      default:
        return (
          <span className="text-xs font-bold text-gray-400 w-6 text-center">
            {index + 1}
          </span>
        );
    }
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
      <td className={`
        py-2 px-3 whitespace-nowrap border-b border-gray-800/30
        sticky left-0 bg-inherit min-w-[140px] max-w-[140px] md:min-w-[240px] md:max-w-[240px] z-10
        ${isHovered ? 'bg-gray-600' : ''}
      `}>
        <Link 
          href={`/players/${player._id}`}
          className="flex items-center gap-3 group/player"
        >
          {/* Rank Display */}
          {hasRank && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {getRankDisplay(index)}
              {getTrendIcon()}
            </div>
          )}

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-amber-600 opacity-0 group-hover/player:opacity-20 blur-md transition-opacity duration-300 rounded-lg" />
            
            {player.profile ? (
              <CldImage
                src={player.profile}
                alt={`${player.firstName} ${player.lastName}`}
                width={40}
                height={40}
                className="relative h-10 w-10 rounded-lg object-cover border border-gray-600 group-hover/player:border-yellow-500/50 transition-all duration-300 group-hover/player:scale-105"
              />
            ) : (
              <div className="relative">
                <TextImg
                  className="h-10 w-10 rounded-lg border border-gray-600 group-hover/player:border-yellow-500/50 transition-all duration-300"
                  fullText={`${player.firstName}${player.lastName}`}
                />
              </div>
            )}
            
            {/* Status indicator */}
            {player.status === EPlayerStatus.ACTIVE && (
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-gray-800" />
            )}
          </div>

          {/* Player Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm text-white truncate group-hover/player:text-yellow-400 transition-colors duration-300">
                {player.firstName} {player.lastName}
              </p>
              {badge && (
                <BadgeIcon badge={badge} className="w-4 h-4 flex-shrink-0" />
              )}
            </div>
            {player.division && (
              <p className="text-xs text-gray-400 truncate">
                {player.division}
              </p>
            )}
          </div>

          <ChevronRight className="w-4 h-4 text-gray-500 opacity-0 group-hover/player:opacity-100 group-hover/player:text-yellow-400 transition-all duration-300 -translate-x-2 group-hover/player:translate-x-0 flex-shrink-0" />
        </Link>
      </td>

      {/* Username Column */}
      <td className="py-3 px-4 whitespace-nowrap border-b border-gray-800/30">
        {player.username ? (
          <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-gray-800/50 border border-gray-700/50 text-xs font-medium text-gray-300 group-hover:border-yellow-500/20 group-hover:text-yellow-400 transition-all duration-300">
            @{player.username}
          </span>
        ) : (
          <span className="text-gray-500 text-xs">No username</span>
        )}
      </td>

      {/* Badge Column */}
      <td className="py-3 px-4 text-center whitespace-nowrap border-b border-gray-800/30">
        {badge ? (
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <BadgeIcon badge={badge} className="w-4 h-4" />
            <span className="text-xs font-medium text-yellow-400">
              {badge.name}
            </span>
          </div>
        ) : (
          <span className="text-gray-500 text-xs">—</span>
        )}
      </td>
    </tr>
  );
}

export default RankPlayerRow;