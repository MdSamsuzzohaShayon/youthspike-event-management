import { EGroupType, EStatsFilter, IBadge, IPlayer, IPlayerRank } from "@/types";
import Link from "next/link";
import LogoWithBadge from "../badge/LogoWithBadge";

interface RankPlayerRowProps {
  player: IPlayerRank | IPlayer;
  index: number;
  hasRank: boolean;
  badge: IBadge | null | undefined;
}

function RankPlayerRow({ player, index, hasRank, badge }: RankPlayerRowProps) {
  return (
    <Link
      href={`/players/${player?._id || ""}/?${EStatsFilter.CONFERENCE}=${EGroupType.CONFERENCE}`}
      className={`
        flex items-center w-full 
        py-1.5 px-3 md:py-2.5 md:px-4 
        border-b border-gray-800/30 
        transition-all duration-200
        ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'}
        hover:bg-gray-600
        ${index < 3 && hasRank ? 'bg-gradient-to-r from-yellow-500/10 to-transparent hover:from-yellow-500/20' : ''}
      `}
    >
      {/* Rank */}
      {hasRank && (
        <div className="w-10 md:w-12 flex-shrink-0 flex justify-center items-center">
          <span className="text-xs font-bold text-gray-400 md:text-sm">
            {index + 1}
          </span>
        </div>
      )}

      {/* Player Column with Image */}
      <div className="flex-shrink-0 ml-1 md:ml-3">
        <LogoWithBadge
          logo={player.profile}
          name={player.firstName + ' ' + player.lastName}
          badge={badge}
          size="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14" 
          badgeSize="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7"
        />
      </div>

      {/* Concatenated Name Column */}
      <div className="flex-grow ml-3 md:ml-4 whitespace-nowrap overflow-hidden text-ellipsis">
        <span className="font-bold text-base md:text-lg lg:text-xl text-gray-200">
          {player.firstName} {player.lastName}
        </span>
      </div>
    </Link>
  );
}

export default RankPlayerRow;