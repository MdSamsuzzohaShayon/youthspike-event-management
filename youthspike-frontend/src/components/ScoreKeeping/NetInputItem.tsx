import { INetRelatives, IPlayer, ITeam } from "@/types";
import { CldImage } from "next-cloudinary";
import React, { useMemo } from "react";
import TextImg from "../elements/TextImg";

interface INetInputItemProps {
  net: INetRelatives | null;
  playerMap: Map<string, IPlayer>;
  teamA: ITeam;
  teamB: ITeam;
  onNetChange?: (e: React.SyntheticEvent, netNum: number) => void;
  isCurrentNet?: boolean;
}

function NetInputItem({
  net,
  playerMap,
  teamA,
  teamB,
  onNetChange,
  isCurrentNet = false,
}: INetInputItemProps) {
  const teamAPlayerA = useMemo(
    () => (net?.teamAPlayerA ? playerMap.get(net?.teamAPlayerA) : null),
    [net, playerMap]
  );
  const teamAPlayerB = useMemo(
    () => (net?.teamAPlayerB ? playerMap.get(net?.teamAPlayerB) : null),
    [net, playerMap]
  );
  const teamBPlayerA = useMemo(
    () => (net?.teamBPlayerA ? playerMap.get(net?.teamBPlayerA) : null),
    [net, playerMap]
  );
  const teamBPlayerB = useMemo(
    () => (net?.teamBPlayerB ? playerMap.get(net?.teamBPlayerB) : null),
    [net, playerMap]
  );

  if (!net) {
    return <li>Select A Net</li>;
  }

  // Mobile version - compact with full names
  const MobileNetItem = () => (
    <li
      className={`
        border-2 rounded-lg p-2 transition-all duration-200 cursor-pointer
        ${
          isCurrentNet
            ? "border-yellow-400 bg-yellow-400/10 shadow-lg"
            : "border-gray-600 hover:border-gray-400 hover:bg-gray-800"
        }
      `}
      onClick={(e) => onNetChange && onNetChange(e, net.num)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`font-bold text-sm ${
            isCurrentNet ? "text-yellow-400" : "text-white"
          }`}
        >
          Net {net.num}
        </span>
        {isCurrentNet && (
          <span className="text-xs bg-yellow-400 text-black px-2 py-1 rounded-full font-semibold">
            Current
          </span>
        )}
      </div>

      {/* Teams compact view with full names */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Team A */}
        <div className="space-y-1">
          <div className="font-semibold text-white truncate text-[10px] uppercase tracking-wide">
            {teamA?.name}
          </div>
          <div className="space-y-1">
            {teamAPlayerA && (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden">
                  {teamAPlayerA?.profile ? (
                    <CldImage
                      src={teamAPlayerA.profile}
                      height={20}
                      width={20}
                      className="w-5 h-5 object-cover"
                      alt={teamAPlayerA.firstName}
                    />
                  ) : (
                    <TextImg
                      fullText={teamAPlayerA.firstName}
                      className="w-5 h-5 text-[9px]"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-white font-medium truncate text-[11px] leading-tight">
                    {teamAPlayerA.firstName}
                  </div>
                  <div className="text-gray-300 truncate text-[10px] leading-tight">
                    {teamAPlayerA.lastName}
                  </div>
                </div>
              </div>
            )}
            {teamAPlayerB && (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden">
                  {teamAPlayerB?.profile ? (
                    <CldImage
                      src={teamAPlayerB.profile}
                      height={20}
                      width={20}
                      className="w-5 h-5 object-cover"
                      alt={teamAPlayerB.firstName}
                    />
                  ) : (
                    <TextImg
                      fullText={teamAPlayerB.firstName}
                      className="w-5 h-5 text-[9px]"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-white font-medium truncate text-[11px] leading-tight">
                    {teamAPlayerB.firstName}
                  </div>
                  <div className="text-gray-300 truncate text-[10px] leading-tight">
                    {teamAPlayerB.lastName}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Team B */}
        <div className="space-y-1">
          <div className="font-semibold text-white truncate text-[10px] uppercase tracking-wide">
            {teamB?.name}
          </div>
          <div className="space-y-1">
            {teamBPlayerA && (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden">
                  {teamBPlayerA?.profile ? (
                    <CldImage
                      src={teamBPlayerA.profile}
                      height={20}
                      width={20}
                      className="w-5 h-5 object-cover"
                      alt={teamBPlayerA.firstName}
                    />
                  ) : (
                    <TextImg
                      fullText={teamBPlayerA.firstName}
                      className="w-5 h-5 text-[9px]"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-white font-medium truncate text-[11px] leading-tight">
                    {teamBPlayerA.firstName}
                  </div>
                  <div className="text-gray-300 truncate text-[10px] leading-tight">
                    {teamBPlayerA.lastName}
                  </div>
                </div>
              </div>
            )}
            {teamBPlayerB && (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden">
                  {teamBPlayerB?.profile ? (
                    <CldImage
                      src={teamBPlayerB.profile}
                      height={20}
                      width={20}
                      className="w-5 h-5 object-cover"
                      alt={teamBPlayerB.firstName}
                    />
                  ) : (
                    <TextImg
                      fullText={teamBPlayerB.firstName}
                      className="w-5 h-5 text-[9px]"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-white font-medium truncate text-[11px] leading-tight">
                    {teamBPlayerB.firstName}
                  </div>
                  <div className="text-gray-300 truncate text-[10px] leading-tight">
                    {teamBPlayerB.lastName}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );

  // Desktop version - more detailed but still compact
  const DesktopNetItem = () => (
    <li
      className={`
        border-2 rounded-lg p-3 transition-all duration-200 cursor-pointer
        ${
          isCurrentNet
            ? "border-yellow-400 bg-yellow-400/10 shadow-lg scale-105"
            : "border-gray-600 hover:border-gray-400 hover:bg-gray-800 hover:scale-102"
        }
      `}
      onClick={(e) => onNetChange && onNetChange(e, net.num)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`font-bold text-lg ${
            isCurrentNet ? "text-yellow-400" : "text-white"
          }`}
        >
          Net {net.num}
        </span>
        {isCurrentNet && (
          <span className="text-sm bg-yellow-400 text-black px-3 py-1 rounded-full font-semibold">
            Active
          </span>
        )}
      </div>

      {/* Teams grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Team A */}
        <div className="space-y-2">
          <div className="font-semibold text-white text-sm truncate">
            {teamA?.name}
          </div>
          <div className="space-y-2">
            {teamAPlayerA && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden">
                  {teamAPlayerA?.profile ? (
                    <CldImage
                      src={teamAPlayerA.profile}
                      height={32}
                      width={32}
                      className="w-8 h-8 object-cover"
                      alt={teamAPlayerA.firstName}
                    />
                  ) : (
                    <TextImg
                      fullText={teamAPlayerA.firstName}
                      className="w-8 h-8 text-xs"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-white text-sm font-medium truncate">
                    {teamAPlayerA.firstName} {teamAPlayerA.lastName}
                  </div>
                </div>
              </div>
            )}
            {teamAPlayerB && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden">
                  {teamAPlayerB?.profile ? (
                    <CldImage
                      src={teamAPlayerB.profile}
                      height={32}
                      width={32}
                      className="w-8 h-8 object-cover"
                      alt={teamAPlayerB.firstName}
                    />
                  ) : (
                    <TextImg
                      fullText={teamAPlayerB.firstName}
                      className="w-8 h-8 text-xs"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-white text-sm font-medium truncate">
                    {teamAPlayerB.firstName} {teamAPlayerB.lastName}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Team B */}
        <div className="space-y-2">
          <div className="font-semibold text-white text-sm truncate">
            {teamB?.name}
          </div>
          <div className="space-y-2">
            {teamBPlayerA && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden">
                  {teamBPlayerA?.profile ? (
                    <CldImage
                      src={teamBPlayerA.profile}
                      height={32}
                      width={32}
                      className="w-8 h-8 object-cover"
                      alt={teamBPlayerA.firstName}
                    />
                  ) : (
                    <TextImg
                      fullText={teamBPlayerA.firstName}
                      className="w-8 h-8 text-xs"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-white text-sm font-medium truncate">
                    {teamBPlayerA.firstName} {teamBPlayerA.lastName}
                  </div>
                </div>
              </div>
            )}
            {teamBPlayerB && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden">
                  {teamBPlayerB?.profile ? (
                    <CldImage
                      src={teamBPlayerB.profile}
                      height={32}
                      width={32}
                      className="w-8 h-8 object-cover"
                      alt={teamBPlayerB.firstName}
                    />
                  ) : (
                    <TextImg
                      fullText={teamBPlayerB.firstName}
                      className="w-8 h-8 text-xs"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-white text-sm font-medium truncate">
                    {teamBPlayerB.firstName} {teamBPlayerB.lastName}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );

  return (
    <React.Fragment>
      {/* Mobile - hidden on md and above */}
      <div className="md:hidden">
        <MobileNetItem />
      </div>

      {/* Desktop - hidden on mobile */}
      <div className="hidden md:block">
        <DesktopNetItem />
      </div>
    </React.Fragment>
  );
}

export default NetInputItem;
