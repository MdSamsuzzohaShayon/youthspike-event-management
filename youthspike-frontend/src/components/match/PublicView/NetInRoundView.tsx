import TextImg from "@/components/elements/TextImg";
import {
  ESRRole,
  EView,
  INetRelatives,
  IPlayer,
  IServerReceiverOnNetMixed,
  ITeam,
} from "@/types";
import { CldImage } from "next-cloudinary";
import React, { useMemo } from "react";
import PlayerView from "./PlayerView";
import LocalStorageService from "@/utils/LocalStorageService";
import NetHeader from "./NetHeader";

interface INetInRoundViewProps {
  net: INetRelatives;
  setView: React.Dispatch<React.SetStateAction<EView>>;
  teamA: ITeam | null;
  teamB: ITeam | null;
  currRoundNets: INetRelatives[];
  teamAPlayers: IPlayer[];
  teamBPlayers: IPlayer[];
  srNet: IServerReceiverOnNetMixed | null;
  matchId: string;
  view: EView;
}
function NetInRoundView({
  net,
  setView,
  teamA,
  teamB,
  currRoundNets,
  teamAPlayers,
  teamBPlayers,
  srNet,
  matchId,
  view
}: INetInRoundViewProps) {


  const handleScordboardRedirect = (e: React.SyntheticEvent) => {
    e.preventDefault();

    LocalStorageService.setMatch(matchId, net.round, net._id);
    window.location.assign(`/score-keeping/${matchId}`);
  };


  

  const teamAPlayerMap = useMemo(() => {
    return new Map(teamAPlayers.map((p) => [p._id, p]));
  }, [teamAPlayers, currRoundNets]);
  const teamBPlayerMap = useMemo(() => {
    return new Map(teamBPlayers.map((p) => [p._id, p]));
  }, [teamBPlayers, currRoundNets]);

  

  

  const roleMap = useMemo(() => {
    const newMap = new Map<string, ESRRole>();
    if (srNet?.serverId) {
      newMap.set(srNet?.serverId, ESRRole.SERVER);
    }
    if (srNet?.receiverId) {
      newMap.set(srNet?.receiverId, ESRRole.RECEIVER);
    }
    if (srNet?.servingPartnerId) {
      newMap.set(srNet?.servingPartnerId, ESRRole.SWING);
    }
    if (srNet?.receivingPartnerId) {
      newMap.set(srNet?.receivingPartnerId, ESRRole.SETTER);
    }
    return newMap;
  }, [srNet]);

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 shadow-2xl border border-gray-700">
      {/* Net Header */}
      <div className=" mb-5 pb-4 border-b border-gray-600">
        <NetHeader matchId={matchId} net={net} setView={setView} srNet={srNet} teamA={teamA} teamB={teamB} view={view} />
      </div>

      {/* Team A Players */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          {teamA && teamA.logo ? (
            <CldImage
              src={teamA.logo}
              alt={teamA.name}
              width={30}
              height={30}
              className="w-6 h-6 mr-2 rounded-full object-cover"
            />
          ) : (
            <TextImg
              fullText={teamA?.name?.charAt(0) || "A"}
              className="w-6 h-6 mr-2 text-xs"
            />
          )}
          <span className="text-white text-sm font-semibold">
            {teamA?.name}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {net?.teamAPlayerA && (
            <PlayerView
              key={net.teamAPlayerA}
              player={teamAPlayerMap.get(net.teamAPlayerA) || null}
              role={roleMap.get(net.teamAPlayerA) || null}
            />
          )}
          {net?.teamAPlayerB && (
            <PlayerView
              key={net.teamAPlayerB}
              player={teamAPlayerMap.get(net.teamAPlayerB) || null}
              role={roleMap.get(net.teamAPlayerB) || null}
            />
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="flex justify-center my-3">
        <div className="w-10 h-px bg-yellow-logo"></div>
      </div>

      {/* Team B Players */}
      <div>
        <div className="flex items-center mb-2">
          {teamB && teamB.logo ? (
            <CldImage
              src={teamB.logo}
              alt={teamB.name}
              width={30}
              height={30}
              className="w-6 h-6 mr-2 rounded-full object-cover"
            />
          ) : (
            <TextImg
              fullText={teamB?.name?.charAt(0) || "B"}
              className="w-6 h-6 mr-2 text-xs"
            />
          )}
          <span className="text-white text-sm font-semibold">
            {teamB?.name}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {net.teamBPlayerA && (
            <PlayerView
              key={net.teamBPlayerA}
              player={teamBPlayerMap.get(net.teamBPlayerA) || null}
              role={roleMap.get(net.teamBPlayerA) || null}
            />
          )}
          {net.teamBPlayerB && (
            <PlayerView
              key={net.teamBPlayerB}
              player={teamBPlayerMap.get(net.teamBPlayerB) || null}
              role={roleMap.get(net.teamBPlayerB) || null}
            />
          )}
        </div>
      </div>

      {/* Net footer  */}
      {net.teamAPlayerA &&
        net.teamAPlayerB &&
        net.teamBPlayerA &&
        net.teamBPlayerB && (
          <div className="w-full mt-4 flex justify-between items-center">
            <button
              className="btn btn-info px-4 py-2 text-sm font-bold ml-auto sm:ml-0 whitespace-nowrap bg-yellow-logo text-black hover:bg-yellow-300 border-0"
              onClick={handleScordboardRedirect}
            >
              Scorekeeper Access
            </button>
          </div>
        )}
    </div>
  );
}

export default NetInRoundView;
