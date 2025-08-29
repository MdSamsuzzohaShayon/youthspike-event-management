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
import { usePathname } from "next/navigation";

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
}: INetInRoundViewProps) {

  const pathname = usePathname();
  const handleScordboardRedirect=(e: React.SyntheticEvent)=>{
    e.preventDefault();
    console.log(pathname);
    
    LocalStorageService.setMatch(matchId, net.round, net._id);
    window.location.assign(`/score-keeping/${matchId}`);
  }


  const teamAPlayerMap = useMemo(() => {
    return new Map(teamAPlayers.map((p) => [p._id, p]));
  }, [teamAPlayers, currRoundNets]);
  const teamBPlayerMap = useMemo(() => {
    return new Map(teamBPlayers.map((p) => [p._id, p]));
  }, [teamBPlayers, currRoundNets]);

  const selectedNet = useMemo(() => {
    return {
      ...net,
      teamAScore: srNet?.teamAScore || net.teamAScore,
      teamBScore: srNet?.teamBScore || net.teamBScore,
    };
  }, [net, srNet]);

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
    <div className="bg-gray-800 p-4 md:p-5 rounded-xl shadow-lg border border-gray-700 hover:border-yellow-400 transition-all duration-300">
      {/* Net Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 pb-4 border-b border-gray-600 gap-4">
        <h3 className="text-yellow-400 font-bold text-xl whitespace-nowrap">
          Net {net.num}
        </h3>

        {/* Score Display */}
        <div className="flex items-center justify-center gap-6">
          {/* Team A Score */}
          <div className="relative">
            <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <div className="text-black font-bold text-3xl">
                {selectedNet?.teamAScore || 0}
              </div>
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-black px-2 py-1 rounded-full border border-yellow-400">
              <span className="text-yellow-400 text-xs font-bold truncate max-w-[60px]">
                {teamA?.name?.split(" ")[0] || "A"}
              </span>
            </div>
          </div>

          {/* Divider */}
          <span className="text-yellow-400 font-bold text-2xl">-</span>

          {/* Team B Score */}
          <div className="relative">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-400">
              <div className="text-black font-bold text-3xl">
                {selectedNet?.teamBScore || 0}
              </div>
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-black px-2 py-1 rounded-full border border-yellow-400">
              <span className="text-yellow-400 text-xs font-bold truncate max-w-[60px]">
                {teamB?.name?.split(" ")[0] || "B"}
              </span>
            </div>
          </div>
        </div>

        <button
          className="btn btn-info px-4 py-2 text-sm font-bold ml-auto sm:ml-0 whitespace-nowrap bg-yellow-400 text-black hover:bg-yellow-300 border-0"
          onClick={() => {
            setView(EView.NET);
          }}
        >
          ENTER NET
        </button>
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
        <div className="w-10 h-px bg-yellow-400"></div>
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
              className="btn btn-info px-4 py-2 text-sm font-bold ml-auto sm:ml-0 whitespace-nowrap bg-yellow-400 text-black hover:bg-yellow-300 border-0"
              onClick={handleScordboardRedirect}
            >
              SCOREBOARD
            </button>
          </div>
        )}
    </div>
  );
}

export default NetInRoundView;
