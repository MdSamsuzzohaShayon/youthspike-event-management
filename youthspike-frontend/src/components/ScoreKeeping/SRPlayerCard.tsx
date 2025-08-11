import TextImg from "@/components/elements/TextImg";
import { useAppSelector } from "@/redux/hooks";
import {
  EPosition,
  EServerPositionPair,
  ESRRole,
  ETeam,
  IPlayer,
} from "@/types";
import { CldImage } from "next-cloudinary";
import Image from "next/image";
import React, { useMemo } from "react";

interface ISPPlayerCardProps {
  selected: string | null;
  player: IPlayer | null;
  role: ESRRole | null;
  dark?: boolean;
  handlePlayerSelection?: (e: React.SyntheticEvent) => void;
  positionPairE: EServerPositionPair; // This is not server position pair
}

const SRPlayerCard: React.FC<ISPPlayerCardProps> = ({
  selected,
  player,
  role,
  dark,
  handlePlayerSelection,
  positionPairE,
}) => {
  const { teamA, teamB } = useAppSelector((state) => state.teams);

  // Memoization
  const teamOfPlayer = useMemo(() => {
    if (!player) return null;
    if (
      teamA?._id &&
      player.teams?.some((team) =>
        typeof team === "string" ? team === teamA._id : team._id === teamA._id
      )
    )
      return teamA;
    if (
      teamB?._id &&
      player.teams?.some((team) =>
        typeof team === "string" ? team === teamB._id : team._id === teamB._id
      )
    )
      return teamB;
    return null;
  }, [player, teamA, teamB]);

  const isServingTeam = useMemo(() => {
    return role === ESRRole.SERVER || role === ESRRole.SWING;
  }, [role]);

  const selectable = useMemo(() => {
    if (player) return false;
    return (
      positionPairE === EServerPositionPair.PAIR_A_LEFT ||
      positionPairE === EServerPositionPair.PAIR_B_RIGHT
    );
  }, [positionPairE]);

  const bgColor = isServingTeam ? "bg-yellow-400/90" : "bg-gray-900/90";
  const borderColor = isServingTeam ? "border-yellow-400" : "border-gray-700";
  const roleTextColor = isServingTeam ? "text-black" : "text-yellow-400";
  const roleBgColor = isServingTeam ? "bg-yellow-400" : "bg-gray-700 ";
  const nameTextColor = isServingTeam ? "text-black" : "text-yellow-logo";
  const teamTextColor = isServingTeam ? "text-gray-800" : "text-gray-400";

  const selectInitialRole = useMemo(() => {
    // Show all placeholder initially if there is no role selected
    let initialRole = null;
    if (positionPairE === EServerPositionPair.PAIR_A_TOP) {
      initialRole = ESRRole.SWING;
    } else if (positionPairE === EServerPositionPair.PAIR_A_LEFT) {
      initialRole = ESRRole.SERVER;
    } else if (positionPairE === EServerPositionPair.PAIR_B_RIGHT) {
      initialRole = ESRRole.RECEIVER;
    } else if (positionPairE === EServerPositionPair.PAIR_B_BOTTOM) {
      initialRole = ESRRole.SETTER;
    }

    return (
      <span
        className={`absolute -top-2 right-2 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase
              rounded-full ${roleBgColor} shadow-sm ${roleTextColor}`}
      >
        {initialRole}
      </span>
    );
  }, [positionPairE]);

  return (
    <div
      className={`relative flex flex-col items-center w-28 lg:w-36 p-4 rounded-3xl transition-all
                  border shadow-lg hover:shadow-2xl backdrop-blur-sm 
                  ${bgColor} ${borderColor}`}
    >
      {/* Role badge */}
      {role ? (
        <span
          className={`absolute -top-2 right-2 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase
                    rounded-full ${roleBgColor} shadow-sm ${roleTextColor}`}
        >
          {role}
        </span>
      ) : (
        selectInitialRole
      )}

      {/* Avatar button */}
      <button
        type="button"
        onClick={selectable ? handlePlayerSelection : () => {}}
        aria-label="Select player"
        className={`group w-24 h-24 lg:w-32 lg:h-32 rounded-2xl border-4 overflow-hidden
                    flex items-center justify-center transition-transform hover:scale-105 
                    focus:outline-none focus:ring-2 focus:ring-yellow-300
                    ${
                      selected
                        ? "border-yellow-400 bg-gray-800 shadow-inner"
                        : dark
                        ? "border-gray-700 bg-gray-700"
                        : "border-yellow-400 bg-gray-800"
                    }`}
      >
        {selected ? (
          player?.profile ? (
            <CldImage
              alt={`${player.firstName} ${player.lastName}`}
              width="200"
              height="200"
              className="object-cover w-full h-full"
              src={player.profile}
            />
          ) : (
            <TextImg
              className="w-full h-full"
              fText={player?.firstName}
              lText={player?.lastName}
            />
          )
        ) : dark ? (
          <div className="w-full h-full animate-pulse" />
        ) : selectable ? (
          <Image
            alt="Add player"
            src="/icons/plus.svg"
            width={32}
            height={32}
            className="svg-white"
          />
        ) : (
          <Image
            alt="Empty Image"
            src="/empty-img.jpg"
            width={100}
            height={100}
            className="w-full h-full"
          />
        )}
      </button>

      {/* Player info */}
      {selected && (
        <div className="mt-3 text-center">
          <h4
            className={`text-sm font-semibold leading-tight text-center break-words max-w-full 
              ${nameTextColor} max-h-[2.75rem] overflow-hidden`}
            title={`${player?.firstName ?? ""} ${player?.lastName ?? ""}`}
          >
            {player?.firstName} {player?.lastName}
          </h4>
          <p
            className={`text-xs sm:text-sm md:text-base font-medium break-words max-w-[100px] sm:max-w-[150px] md:max-w-[200px] w-full ${teamTextColor}`}
            title={teamOfPlayer?.name ?? ""}
          >
            {teamOfPlayer?.name}
          </p>
        </div>
      )}
    </div>
  );
};

export default SRPlayerCard;
