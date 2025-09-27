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

  // Config for both teams
  const serverActions = [
    {
      label: "ACE",
      value: EServerReceiverAction.SERVER_ACE_NO_TOUCH,
      subLabel: "NO 2ND TOUCH",
    },
    {
      label: " SETTER ERROR",
      value: EServerReceiverAction.SERVER_ACE_NO_THIRD_TOUCH,
      subLabel: "NO 3RD TOUCH",
    },
    {
      label: "SPIKER ERROR",
      value: EServerReceiverAction.SERVER_RECEIVING_HITTING_ERROR,
      subLabel: null,
    },
    {
      label: "RALLY POINT (RP)",
      value: EServerReceiverAction.SERVER_DEFENSIVE_CONVERSION,
      subLabel: null,
    },
    {
      label: "Don't know",
      value: EServerReceiverAction.SERVER_DO_NOT_KNOW,
      subLabel: null,
    },
  ];

  const receiverActions = [
    {
      label: "DOUBLE FAULT  (DF)",
      value: EServerReceiverAction.RECEIVER_SERVICE_FAULT,
      subLabel: null,
    },
    {
      label: "SPIKER PUT AWAY  (SPA)",
      value: EServerReceiverAction.RECEIVER_ONE_TWO_THREE_PUT_AWAY,
      subLabel: null,
    },
    {
      label: "RALLY POINT (RP)",
      value: EServerReceiverAction.RECEIVER_RALLEY_CONVERSION,
      subLabel: null,
    },
    {
      label: "Don't know",
      value: EServerReceiverAction.RECEIVER_DO_NOT_KNOW,
      subLabel: null,
    },
  ];

  // Helper to render team logo
  const renderTeamLogo = useCallback((team: ITeam | null) => {
    if (!team) {
      return (
        <div className="w-14 h-14 rounded-full bg-yellow-600/10 flex items-center justify-center">
          <span className="text-xs text-yellow-300">No Team</span>
        </div>
      );
    }
    return team.logo ? (
      <CldImage
        className="w-14 h-14 rounded-full object-cover shadow-sm"
        height={56}
        width={56}
        src={team.logo}
        alt={team.name}
      />
    ) : (
      <div className="w-14 h-14 rounded-full overflow-hidden">
        <TextImg fullText={team.name} className="w-14 h-14 rounded-full" />
      </div>
    );
  }, []);

  // Decide which team is serving / receiving
  const servingTeam = serverTeamE === ETeam.teamA ? teamA : teamB;
  const receivingTeam = serverTeamE === ETeam.teamA ? teamB : teamA;

  if (!awardTo) return null;

  return (
    <div className="bottom-side border-t border-yellow-logo mt-6 flex flex-col md:flex-row justify-center items-center">
      {awardTo === serverTeamE ? (
        // {/* Serving Team */}
        <div className="w-full md:w-2/6 flex flex-col gap-y-2 mt-6">
          <div className="flex items-center gap-3 w-full">
            <div>{renderTeamLogo(servingTeam)}</div>
            <div className="flex-1">
              <h4 className="text-xs text-yellow-300 uppercase tracking-wider">
                Serving Team
              </h4>
              <p className="font-semibold text-white truncate">
                {servingTeam?.name ?? "—"}
              </p>
            </div>
          </div>
          {serverActions.map(({ label, value, subLabel }) => (
            <button
              key={value}
              className="btn-light flex flex-col items-center jusitify-center"
              onClick={handleAction(value)}
            >
              <span>{label}</span>
              {subLabel && <span className="text-sm">{subLabel}</span>}
            </button>
          ))}
        </div>
      ) : (
        // {/* Receiving Team */}
        <div className="w-full md:w-2/6 flex flex-col gap-y-2 mt-6">
          <div className="flex items-center gap-3 w-full">
            <div>{renderTeamLogo(receivingTeam)}</div>
            <div className="flex-1">
              <h4 className="text-xs text-yellow-300 uppercase tracking-wider">
                Receiving Team
              </h4>
              <p className="font-semibold text-white truncate">
                {receivingTeam?.name ?? "—"}
              </p>
            </div>
          </div>
          {receiverActions.map(({ label, value }) => (
            <button
              key={value}
              className={`btn-light uppercase`}
              onClick={handleAction(value)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionHandler;
