import TextImg from "@/components/elements/TextImg";
import {
  EServerReceiverAction,
  ETeam,
  IPlayer,
  IServerReceiverOnNetMixed,
  IServerReceiverSinglePlay,
  ITeam,
} from "@/types";
import { CldImage } from "next-cloudinary";
import { useMemo } from "react";

interface ITeamInNetProps {
  team: ITeam;
  playerA: IPlayer | null;
  playerB: IPlayer | null;
  teamE: ETeam;
  srOnNet: IServerReceiverOnNetMixed | null;
  lastPlay: IServerReceiverSinglePlay | null;
}

const TeamInNet: React.FC<ITeamInNetProps> = ({
  team,
  playerA,
  playerB,
  teamE,
  srOnNet,
  lastPlay,
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
  // Find last play of the net
  return (
    <div className="team-in-net team-a w-3/6 flex items-start justify-between p-1">
      <div className="w-4/12 flex flex-col items-center space-y-1">
        {playerA && (
          <>
            <div className="image-container w-full aspect-square flex justify-center items-center overflow-hidden">
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
            <p className="player-name flex justify-center items-center text-center uppercase w-full">
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
              <span>
                {(() => {
                  const words = `${playerA.firstName} ${playerA.lastName}`
                    .trim()
                    .split(" ");
                  const first = words[0] || "";
                  const second = words[1] || "";
                  return (
                    <>
                      <span className="font-bold">{first}</span>
                      {second && ` ${second}`}
                    </>
                  );
                })()}
              </span>
            </p>
          </>
        )}
      </div>
      <div className="w-4/12 flex justify-center">
        <div className="image-container w-full aspect-square flex flex-col justify-center items-center overflow-hidden">
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
          {teamScored && <span className="text-yellow-logo">+1</span>}
        </div>
      </div>
      <div className="w-4/12 flex flex-col items-center space-y-1">
        {playerB && (
          <>
            <div className="image-container w-full aspect-square flex justify-center items-center overflow-hidden">
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
            <p className="player-name flex justify-center items-center text-center uppercase w-full">
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
              <span>
                {(() => {
                  const words = `${playerB.firstName} ${playerB.lastName}`
                    .trim()
                    .split(" ");
                  const first = words[0] || "";
                  const second = words[1] || "";
                  return (
                    <>
                      <span className="font-bold">{first}</span>
                      {second && ` ${second}`}
                    </>
                  );
                })()}
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default TeamInNet;
