// components/player/PlayerProfileHeader.tsx

'use client';

import Link from 'next/link';
import { CldImage } from 'next-cloudinary';
import { EPlayerStatus, IBadge, IPlayer, ITeam } from '@/types';
import TextImg from '../elements/TextImg';
import { 
  Trophy, 
  User, 
  MapPin, 
  Star, 
  ChevronRight, 
  Activity,
  Users,
  Shield,
  Award
} from 'lucide-react';
import BadgeIcon from '../badge/BadgeIcon';

interface IPlayerProfileHeaderProps {
  player: IPlayer;
  team?: ITeam | null;
  badge?: IBadge | null;
}

const PlayerProfileHeader = ({ player, team, badge }: IPlayerProfileHeaderProps) => {
  return (
    <div className="relative mb-12">
      {/* Animated background glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 via-yellow-400/10 to-transparent rounded-3xl blur-2xl opacity-50 animate-pulse" />
      
      {/* Main container */}
      <div className="relative backdrop-blur-2xl bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-gray-950/95 rounded-2xl border border-gray-800/50 shadow-2xl overflow-hidden">
        
        {/* Animated gradient border top */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
        
        {/* Decorative corner accents */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-bl-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-yellow-500/5 to-transparent rounded-tr-full" />
        
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-yellow-400/5 blur-3xl" />

        {/* Content container */}
        <div className="relative p-6 md:p-8 lg:p-10">
          <div className="flex flex-col-reverse lg:flex-row lg:items-center gap-8 lg:gap-12">
            
            {/* Identity Section */}
            <div className="flex-1 min-w-0 text-center lg:text-left">
              
              {/* Player Name */}
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-3">
                <h1 className="bg-gradient-to-r from-white via-gray-100 to-yellow-200 bg-clip-text text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-transparent">
                  {player.firstName} {player.lastName}
                </h1>
                {player.status === EPlayerStatus.ACTIVE && (
                  <Star className="w-6 h-6 text-yellow-400 flex-shrink-0 animate-pulse" fill="currentColor" />
                )}
              </div>

              {/* Status and Division */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full text-xs font-medium text-green-400 border border-green-500/20">
                  <Activity className="w-3.5 h-3.5" />
                  {player.status}
                </span>
                {player.division && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 rounded-full text-xs font-medium text-yellow-400 border border-yellow-500/20">
                    <Shield className="w-3.5 h-3.5" />
                    {player.division}
                  </span>
                )}
              </div>

              {/* Info Cards */}
              <div className="flex flex-wrap items-stretch justify-center lg:justify-start gap-3">
                
                {/* Team Card */}
                {team?._id && (
                  <Link
                    href={`/teams/${team._id}/roster`}
                    className="group relative flex items-center gap-4 px-4 py-3 rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm transition-all duration-300 hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/10 hover:-translate-y-0.5"
                  >
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/0 via-yellow-500/5 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    
                    {team?.logo ? (
                      <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-amber-600 opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300 rounded-lg" />
                        <CldImage
                          height={80}
                          width={80}
                          src={team.logo}
                          alt={team.name}
                          className="relative h-12 w-12 rounded-lg object-cover ring-1 ring-gray-700 transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-gray-800 border border-gray-700">
                        <Users className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    
                    <div className="flex flex-col justify-center text-left min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                        Team
                      </p>
                      <p className="font-semibold text-white group-hover:text-yellow-400 transition-colors duration-300 truncate">
                        {team?.name || "Free Agent"}
                      </p>
                    </div>
                    
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-yellow-400 group-hover:translate-x-0.5 transition-all duration-300 flex-shrink-0" />
                  </Link>
                )}

                {/* Username Card */}
                {player.username && (
                  <div className="group relative flex items-center gap-4 px-4 py-3 rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm transition-all duration-300 hover:border-gray-700/70">
                    <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-gray-800 border border-gray-700">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    <div className="flex flex-col justify-center text-left">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                        Username
                      </p>
                      <p className="font-semibold text-white">
                        {player.username}
                      </p>
                    </div>
                  </div>
                )}

                {/* Location Card */}
                {player.division && (
                  <div className="group relative flex items-center gap-4 px-4 py-3 rounded-xl border border-gray-800/50 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm transition-all duration-300 hover:border-gray-700/70">
                    <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-gray-800 border border-gray-700">
                      <MapPin className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    <div className="flex flex-col justify-center text-left">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                        Division
                      </p>
                      <p className="font-semibold text-white">
                        {player.division}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Avatar Section */}
            <div className="relative flex-shrink-0 self-center">
              {/* Orbital ring */}
              <div className="absolute -inset-3 bg-gradient-to-tr from-yellow-500 via-yellow-400 to-transparent rounded-3xl opacity-20 blur-2xl animate-pulse" />
              <div className="absolute -inset-1 bg-gradient-to-tr from-yellow-500/30 via-yellow-400/20 to-transparent rounded-3xl rotate-45 animate-spin-slow" />
              
              {/* Avatar container */}
              <div className="relative group">
                {/* Glow ring */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-yellow-400 via-yellow-200 to-white opacity-70 blur-md transition-opacity duration-500 group-hover:opacity-100 animate-pulse" />
                
                {/* Avatar image */}
                <div className="relative">
                  {player.profile ? (
                    <CldImage
                      alt={`${player.firstName} ${player.lastName}`}
                      src={player.profile}
                      height={160}
                      width={160}
                      crop="fit"
                      className="h-36 w-36 md:h-40 md:w-40 lg:h-44 lg:w-44 rounded-2xl border-2 border-gray-900 object-cover shadow-2xl transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <TextImg
                      className="h-36 w-36 md:h-40 md:w-40 lg:h-44 lg:w-44 rounded-2xl border-2 border-gray-900 shadow-2xl"
                      fullText={`${player.firstName}${player.lastName}`}
                    />
                  )}
                  
                  {/* Status indicator */}
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-4 border-gray-900 flex items-center justify-center">
                    <Activity className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>

                {/* Badge */}
                {badge && (
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 group/badge">
                    <div className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-400 shadow-lg shadow-yellow-500/30 ring-1 ring-black/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/40">
                      <BadgeIcon badge={badge} className='h-4 w-4' />
                      <span className="text-xs font-bold uppercase text-black whitespace-nowrap">
                        {badge.name}
                      </span>
                      <Award className="w-4 h-4 text-black/70" />
                    </div>
                    
                    {/* Badge glow */}
                    <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl -z-10 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};


export default PlayerProfileHeader;