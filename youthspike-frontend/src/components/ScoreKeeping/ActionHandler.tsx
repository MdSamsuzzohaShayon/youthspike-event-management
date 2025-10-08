import { EServerReceiverAction, ETeam, IServerReceiverOnNetMixed, ITeam } from "@/types";
import { CldImage } from "next-cloudinary";
import React, { useCallback } from "react";
import TextImg from "../elements/TextImg";
import EmitEvents from "@/utils/socket/EmitEvents";
import { Socket } from "socket.io-client";
import { AppDispatch } from "@/redux/store";

interface IActionHandlerProps {
  teamA: ITeam | null;
  teamB: ITeam | null;
  serverTeamE: null | ETeam;
  awardTo: ETeam | null;
  socket: Socket | null;
  dispatch: AppDispatch;
  setAwardTo: React.Dispatch<React.SetStateAction<ETeam | null>>;
  net: string | null;
  room: string | null;
  match: string;
  currServerReceiver: IServerReceiverOnNetMixed | null;
}

const ActionHandler: React.FC<IActionHandlerProps> = ({
  teamA,
  teamB,
  serverTeamE,
  awardTo,
  socket,
  dispatch,
  setAwardTo,
  net,
  room,
  match,
  currServerReceiver
}) => {
  // Generic click handler
  const handleAction =
    (action: EServerReceiverAction) => (e: React.SyntheticEvent) => {
      e.preventDefault();
      if(!currServerReceiver) {
        console.log("No current server receiver found");
        return;
      }

      const emit = new EmitEvents(socket, dispatch);
      switch (action) {
        case EServerReceiverAction.SERVER_ACE_NO_TOUCH:
          if (currServerReceiver.receiver && net && room) {
            emit.aceNoTouch({ match, net, room });
          }
          break;

        case EServerReceiverAction.SERVER_ACE_NO_THIRD_TOUCH:
          if (currServerReceiver.receiver && net && room) {
            emit.aceNoThirdTouch({ match, net, room });
          }
          break;

        case EServerReceiverAction.SERVER_DEFENSIVE_CONVERSION:
          if (currServerReceiver.receiver && net && room) {
            emit.serverDefensiveConversion({ match, net, room });
          }
          break;

        case EServerReceiverAction.SERVER_RECEIVING_HITTING_ERROR:
          if (currServerReceiver.receiver && net && room) {
            emit.receivingHittingError({ match, net, room });
          }
          break;

        case EServerReceiverAction.SERVER_DO_NOT_KNOW:
          if (currServerReceiver.receiver && net && room) {
            emit.serverDoNotKnow({ match, net, room });
          }
          break;

        case EServerReceiverAction.RECEIVER_SERVICE_FAULT:
          if (currServerReceiver.receiver && net && room) {
            emit.serviceFault({ match, net, room });
          }
          break;

        case EServerReceiverAction.RECEIVER_ONE_TWO_THREE_PUT_AWAY:
          if (currServerReceiver.receiver && net && room) {
            emit.oneTwoThreePutAway({ match, net, room });
          }
          break;

        case EServerReceiverAction.RECEIVER_RALLEY_CONVERSION:
          if (currServerReceiver.receiver && net && room) {
            emit.receiverDefensiveConversion({ match, net, room });
          }
          break;

        case EServerReceiverAction.RECEIVER_DO_NOT_KNOW:
          if (currServerReceiver.receiver && net && room) {
            emit.receiverDoNotKnow({ match, net, room });
          }
          break;

        default:
          console.log(`Action is unknown ${action}`);
          break;
      }

      setAwardTo(null);
    };

  // Color-coded action configurations with meaningful colors
  const serverActions = [
    {
      label: "ACE",
      value: EServerReceiverAction.SERVER_ACE_NO_TOUCH,
      subLabel: "NO 2ND TOUCH",
      color: "bg-green-500 hover:bg-green-600 border-green-600 text-white shadow-lg",
      icon: "🎯",
      mobileColor: "bg-green-500 hover:bg-green-600"
    },
    {
      label: "SETTER ERROR",
      value: EServerReceiverAction.SERVER_ACE_NO_THIRD_TOUCH,
      subLabel: "NO 3RD TOUCH",
      color: "bg-blue-500 hover:bg-blue-600 border-blue-600 text-white shadow-lg",
      icon: "⚡",
      mobileColor: "bg-blue-500 hover:bg-blue-600"
    },
    {
      label: "SPIKER ERROR",
      value: EServerReceiverAction.SERVER_RECEIVING_HITTING_ERROR,
      subLabel: "HITTING ERROR",
      color: "bg-red-500 hover:bg-red-600 border-red-600 text-white shadow-lg",
      icon: "💥",
      mobileColor: "bg-red-500 hover:bg-red-600"
    },
    {
      label: "RALLY POINT",
      value: EServerReceiverAction.SERVER_DEFENSIVE_CONVERSION,
      subLabel: "DEFENSIVE RP",
      color: "bg-purple-500 hover:bg-purple-600 border-purple-600 text-white shadow-lg",
      icon: "🔄",
      mobileColor: "bg-purple-500 hover:bg-purple-600"
    },
    {
      label: "Don't know",
      value: EServerReceiverAction.SERVER_DO_NOT_KNOW,
      subLabel: "UNKNOWN PLAY",
      color: "bg-gray-500 hover:bg-gray-600 border-gray-600 text-white shadow-lg",
      icon: "❓",
      mobileColor: "bg-gray-500 hover:bg-gray-600"
    },
  ];

  const receiverActions = [
    {
      label: "DOUBLE FAULT",
      value: EServerReceiverAction.RECEIVER_SERVICE_FAULT,
      subLabel: "SERVICE ERROR",
      color: "bg-orange-500 hover:bg-orange-600 border-orange-600 text-white shadow-lg",
      icon: "❌",
      mobileColor: "bg-orange-500 hover:bg-orange-600"
    },
    {
      label: "SPIKER PUT AWAY",
      value: EServerReceiverAction.RECEIVER_ONE_TWO_THREE_PUT_AWAY,
      subLabel: "ATTACK POINT",
      color: "bg-teal-500 hover:bg-teal-600 border-teal-600 text-white shadow-lg",
      icon: "🔥",
      mobileColor: "bg-teal-500 hover:bg-teal-600"
    },
    {
      label: "RALLY POINT",
      value: EServerReceiverAction.RECEIVER_RALLEY_CONVERSION,
      subLabel: "OFFENSIVE RP",
      color: "bg-indigo-500 hover:bg-indigo-600 border-indigo-600 text-white shadow-lg",
      icon: "⚔️",
      mobileColor: "bg-indigo-500 hover:bg-indigo-600"
    },
    {
      label: "Don't know",
      value: EServerReceiverAction.RECEIVER_DO_NOT_KNOW,
      subLabel: "UNKNOWN PLAY",
      color: "bg-gray-500 hover:bg-gray-600 border-gray-600 text-white shadow-lg",
      icon: "❓",
      mobileColor: "bg-gray-500 hover:bg-gray-600"
    },
  ];

  // Helper to render team logo
  const renderTeamLogo = useCallback((team: ITeam | null) => {
    if (!team) {
      return (
        <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-yellow-600/10 flex items-center justify-center">
          <span className="text-xs text-yellow-300">No Team</span>
        </div>
      );
    }
    return team.logo ? (
      <CldImage
        className="w-10 h-10 md:w-14 md:h-14 object-cover shadow-sm"
        height={56}
        width={56}
        crop="fit"
        src={team.logo}
        alt={team.name}
      />
    ) : (
      <div className="w-10 h-10 md:w-14 md:h-14 bg-yellow-logo overflow-hidden rounded-full">
        <TextImg fullText={team.name} className="w-full h-full rounded-full" />
      </div>
    );
  }, []);

  // Decide which team is serving / receiving
  const servingTeam = serverTeamE === ETeam.teamA ? teamA : teamB;
  const receivingTeam = serverTeamE === ETeam.teamA ? teamB : teamA;

  if (!awardTo) return null;

  // Action Button Component
  const ActionButton = ({ 
    label, 
    value, 
    subLabel, 
    color, 
    mobileColor, 
    icon 
  }: { 
    label: string; 
    value: EServerReceiverAction; 
    subLabel: string | null; 
    color: string; 
    mobileColor: string; 
    icon: string;
  }) => (
    <button
      key={value}
      className={`
        w-full rounded-xl border-2 font-semibold transition-all duration-200 
        active:scale-95 hover:scale-105 shadow-md
        flex flex-col items-center justify-center p-3 md:p-4
        ${color} md:${color}
        min-h-[80px] md:min-h-[100px]
      `}
      onClick={handleAction(value)}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-sm md:text-base font-bold truncate">{label}</span>
      </div>
      {subLabel && (
        <span className="text-xs opacity-90 text-center leading-tight">
          {subLabel}
        </span>
      )}
    </button>
  );

  return (
    <div className="bottom-side border-t border-yellow-400/30 mt-6 w-full">
      {awardTo === serverTeamE ? (
        // Serving Team Actions
        <div className="w-full">
          {/* Team Header - Visible on all screens */}
          <div className="hidden md:flex items-center gap-3 mb-4 p-3 bg-gray-800/50 rounded-lg">
            <div>{renderTeamLogo(servingTeam)}</div>
            <div className="flex-1">
              <h4 className="text-xs text-yellow-300 uppercase tracking-wider">
                Serving Team
              </h4>
              <p className="font-semibold text-white truncate text-sm md:text-base">
                {servingTeam?.name ?? "—"}
              </p>
            </div>
            <div className="bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold">
              SERVING
            </div>
          </div>

          {/* Action Grid - 2 columns on mobile, 1 column on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-2">
            {serverActions.map((action) => (
              <ActionButton key={action.value} {...action} />
            ))}
          </div>
        </div>
      ) : (
        // Receiving Team Actions
        <div className="w-full">
          {/* Team Header - Visible on all screens */}
          <div className="hidden md:flex items-center gap-3 mb-4 p-3 bg-gray-800/50 rounded-lg">
            <div>{renderTeamLogo(receivingTeam)}</div>
            <div className="flex-1">
              <h4 className="text-xs text-yellow-300 uppercase tracking-wider">
                Receiving Team
              </h4>
              <p className="font-semibold text-white truncate text-sm md:text-base">
                {receivingTeam?.name ?? "—"}
              </p>
            </div>
            <div className="bg-blue-400 text-black px-2 py-1 rounded-full text-xs font-bold">
              RECEIVING
            </div>
          </div>

          {/* Action Grid - 2 columns on mobile, 1 column on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-2">
            {receiverActions.map((action) => (
              <ActionButton key={action.value} {...action} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionHandler;