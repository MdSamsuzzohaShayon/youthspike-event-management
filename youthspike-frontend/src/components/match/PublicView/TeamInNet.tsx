import TextImg from "@/components/elements/TextImg";
import {
  EServerReceiverAction,
  ETeam,
  EView,
  IPlayer,
  IServerReceiverOnNetMixed,
  IServerReceiverSinglePlay,
  ITeam,
} from "@/types";
import { CldImage } from "next-cloudinary";
import { useCallback, useMemo } from "react";

interface ITeamInNetProps {
  team: ITeam;
  playerA: IPlayer | null;
  playerB: IPlayer | null;
  teamE: ETeam;
  srOnNet: IServerReceiverOnNetMixed | null;
  lastPlay: IServerReceiverSinglePlay | null;
  view: EView;
}

const TeamInNet: React.FC<ITeamInNetProps> = ({
  team,
  playerA,
  playerB,
  teamE,
  srOnNet,
  lastPlay,
  view,
}) => {
  const teamScored = useMemo(() => {
    let scored = false;
    if (!lastPlay) return false;
    // Check this team got the points or not
    const serverActions = new Set([
      EServerReceiverAction.SERVER_ACE_NO_THIRD_TOUCH,
      EServerReceiverAction.SERVER_ACE_NO_TOUCH,
      EServerReceiverAction.SERVER_DEFENSIVE_CONVERSION,
      EServerReceiverAction.SERVER_RECEIVING_HITTING_ERROR,
      EServerReceiverAction.SERVER_DO_NOT_KNOW,
    ]);
    const receiverActions = new Set([
      EServerReceiverAction.RECEIVER_DO_NOT_KNOW,
      EServerReceiverAction.RECEIVER_ONE_TWO_THREE_PUT_AWAY,
      EServerReceiverAction.RECEIVER_RALLEY_CONVERSION,
      EServerReceiverAction.RECEIVER_SERVICE_FAULT,
    ]);
    if (serverActions.has(lastPlay.action)) {
      // Check team is server or not
      if (
        lastPlay.server === playerA?._id ||
        lastPlay.server === playerB?._id
      ) {
        scored = true;
      }
    } else if (receiverActions.has(lastPlay.action)) {
      // Check team is receiver or not
      if (
        lastPlay.receiver === playerA?._id ||
        lastPlay.receiver === playerB?._id
      ) {
        scored = true;
      }
    }
    return scored;
  }, [lastPlay, playerA, playerB]);

  const playerAName = useMemo(() => {
    const first = playerA?.firstName?.trim() || "";
    const last = playerA?.lastName?.trim() || "";
    return { firstName: first, lastName: last };
  }, [playerA?.firstName, playerA?.lastName]);

  const playerBName = useMemo(() => {
    const first = playerB?.firstName?.trim() || "";
    const last = playerB?.lastName?.trim() || "";
    return { firstName: first, lastName: last };
  }, [playerB?.firstName, playerB?.lastName]);
  // Find last play of the net
  return (
    <div className="team-in-net team-a w-3/6 flex items-center justify-between p-1">
      <div className="w-4/12 flex flex-col items-center space-y-1">
        {playerA && (
          <>
            <div
              className={`${
                view === EView.ROUND
                  ? "image-container"
                  : "image-container-single"
              } w-full aspect-square flex justify-center items-center overflow-hidden`}
            >
              {playerA?.profile ? (
                <CldImage
                  className={`w-full h-full object-cover object-center border rounded-lg ${
                    teamE === ETeam.teamA ? "border-white" : "border-red-300"
                  }`}
                  height={120}
                  width={120}
                  src={playerA.profile}
                  alt={playerA.firstName}
                />
              ) : (
                <TextImg
                  className={`w-full h-full rounded-lg border ${
                    teamE === ETeam.teamA ? "border-white" : "border-red-300"
                  }`}
                  fullText={`${playerA.firstName} ${playerA.lastName}`}
                />
              )}
            </div>
            <p className="player-name flex justify-start gap-x-1 items-center text-center uppercase w-full">
              {srOnNet?.server && srOnNet.server === playerA._id && (
                <span className="italic text-yellow-logo server-receiver-text">
                  S
                </span>
              )}
              {srOnNet?.receiver && srOnNet.receiver === playerA._id && (
                <span className="italic text-yellow-logo server-receiver-text">
                  R
                </span>
              )}
              <span className="flex flex-col leading-tight items-start">
                {playerAName.firstName && (
                  <span className="font-bold">{playerAName.firstName}</span>
                )}
                {playerAName.lastName && <span>{playerAName.lastName}</span>}
              </span>
            </p>
          </>
        )}
      </div>
      <div className="w-4/12 flex justify-center">
        <div className="image-container w-full aspect-square flex flex-col justify-center items-center">
          <div className={`${view === EView.ROUND ? "team-logo-wrapper" : "team-logo-wrapper-single"} w-full`}>
            {team?.logo ? (
              <CldImage
                src={team.logo}
                alt={team.name}
                className="w-full"
                height={120}
                width={120}
              />
            ) : (
              <TextImg className="w-full" fullText={team.name} />
            )}
          </div>
          {teamScored && <span className={`${ view === EView.ROUND ? "plus-one" : "plus-one-single" } text-yellow-logo font-bold text-center leading-none animate-pulse [text-shadow:0_0_8px_#facc15]`}>+1</span>}
        </div>
      </div>
      <div className="w-4/12 flex flex-col items-center space-y-1">
        {playerB && (
          <>
            <div
              className={`${
                view === EView.ROUND
                  ? "image-container"
                  : "image-container-single"
              } w-full aspect-square flex justify-center items-center overflow-hidden`}
            >
              {playerB?.profile ? (
                <CldImage
                  className={`w-full h-full object-cover object-center border rounded-lg ${
                    teamE === ETeam.teamA ? "border-white" : "border-red-300"
                  }`}
                  height={120}
                  width={120}
                  src={playerB.profile}
                  alt={playerB.firstName}
                />
              ) : (
                <TextImg
                  className={`w-full h-full rounded-lg border ${
                    teamE === ETeam.teamA ? "border-white" : "border-red-300"
                  }`}
                  fullText={`${playerB.firstName} ${playerB.lastName}`}
                />
              )}
            </div>
            <p className="player-name flex justify-start gap-x-1 items-center text-center uppercase w-full">
              {srOnNet?.server && srOnNet.server === playerB._id && (
                <span className="italic text-yellow-logo server-receiver-text">
                  S
                </span>
              )}
              {srOnNet?.receiver && srOnNet.receiver === playerB._id && (
                <span className="italic text-yellow-logo server-receiver-text">
                  R
                </span>
              )}
              <span className="flex flex-col leading-tight items-start">
                {playerBName.firstName && (
                  <span className="font-bold">{playerBName.firstName}</span>
                )}
                {playerBName.lastName && <span>{playerBName.lastName}</span>}
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default TeamInNet;
