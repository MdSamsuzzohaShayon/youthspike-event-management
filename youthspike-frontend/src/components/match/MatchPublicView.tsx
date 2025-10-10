import React, { useMemo, useRef, useState } from "react";
import RoundView from "./PublicView/RoundView";
import AllNetsView from "./PublicView/AllNetsView";
import {
  EView,
  INetRelatives,
  IRoundRelatives,
  IServerReceiverOnNetMixed,
  ITeam,
} from "@/types";
import { useAppSelector } from "@/redux/hooks";
import Image from "next/image";
import LocalStorageService from "@/utils/LocalStorageService";
import NetInRoundView from "./PublicView/NetInRoundView";
import { useSearchParams } from "next/navigation";

interface IMatchPublicViewProps {
  nets: INetRelatives[];
  currRound: IRoundRelatives | null;
  roundList: IRoundRelatives[];
  currRoundNets: INetRelatives[];
  teamA: ITeam | null;
  teamB: ITeam | null;
  serverReceiversOnNet: IServerReceiverOnNetMixed[];
  currServerReceiver: IServerReceiverOnNetMixed | null;
  matchId: string;
}

function MatchPublicView({
  nets,
  currRound,
  roundList,
  currRoundNets,
  teamA,
  teamB,
  serverReceiversOnNet,
  currServerReceiver,
  matchId,
}: IMatchPublicViewProps) {
  const searchParams = useSearchParams();
  const [view, setView] = useState<EView>(() => {
    const match = LocalStorageService.getMatch(matchId);
    const viewInParams = searchParams.get('view');
    if(viewInParams && viewInParams === EView.ROUND){
      LocalStorageService.setMatch(matchId, match?.roundId || currRound?._id || "");
      return EView.ROUND;
    }
    if (match && match.netId) {
      return EView.NET;
    }
    return EView.ROUND;
  }); // allNets | round | net
  const containerRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const { teamAPlayers, teamBPlayers } = useAppSelector(
    (state) => state.players
  );
  const { currNetNum } = useAppSelector((state) => state.nets);

  const srMap = useMemo(() => {
    const entries = serverReceiversOnNet.reduce((acc, s) => {
      // Safely handle potential null values
      let key: string | null = null;
      
      if (s.netId) {
        key = s.netId;
      } else if (s.net) {
        key = typeof s.net === "string" ? s.net : s.net._id;
      }
      
      // If we still don't have a key, skip this entry
      if (!key) {
        console.warn("Could not determine key for serverReceiver entry:", s);
        return acc;
      }
  
      // Check if this serverReceiver matches the current one
      const isCurrentServerReceiver = currServerReceiver && 
        (key === currServerReceiver.net || key === currServerReceiver.netId);
      
      if (isCurrentServerReceiver) {
        acc.push([
          key,
          {
            ...s,
            mutate: currServerReceiver.mutate,
            play: currServerReceiver.play,
            teamAScore: currServerReceiver.teamAScore,
            teamBScore: currServerReceiver.teamBScore,
            serverPositionPair: currServerReceiver.serverPositionPair,
            serverId: currServerReceiver.serverId || String(currServerReceiver.server),
            receiverId: currServerReceiver.receiverId || String(currServerReceiver.receiver),
            servingPartnerId: currServerReceiver.servingPartnerId || String(currServerReceiver.servingPartner),
            receivingPartnerId: currServerReceiver.receivingPartnerId || String(currServerReceiver.receivingPartner),
            server: currServerReceiver.server,
            receiver: currServerReceiver.receiver,
            servingPartner: currServerReceiver.servingPartner,
            receivingPartner: currServerReceiver.receivingPartner,
          },
        ]);
      } else {
        acc.push([
          key,
          {
            ...s,
            serverId: s.serverId || String(s.server),
            receiverId: s.receiverId || String(s.receiver),
            servingPartnerId: s.servingPartnerId || String(s.servingPartner),
            receivingPartnerId: s.receivingPartnerId || String(s.receivingPartner),
          },
        ]);
      }
      
      return acc;
    }, [] as [string, IServerReceiverOnNetMixed][]);
  
    return new Map<string, IServerReceiverOnNetMixed>(entries);
  }, [serverReceiversOnNet, currServerReceiver]);

  const selectedNet = useMemo(() => {
    return currRoundNets.find((n) => n.num === currNetNum);
  }, [currNetNum, currRoundNets]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`min-h-screen container px-4 mx-auto ${
        fullscreen ? "fixed inset-0 z-50 overflow-auto" : ""
      }`}
    >
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-yellow-400">
          Match Public View
        </h1>
        <div className="flex space-x-3">
          {/* <button
            onClick={() => setView(EView.ALL_NETS)}
            className="bg-yellow-400 text-black px-3 py-1 rounded-lg"
          >
            All Nets
          </button>
          <button
            onClick={() => setView(EView.ROUND)}
            className="bg-yellow-400 text-black px-3 py-1 rounded-lg"
          >
            Round View
          </button>
          <button
            onClick={() => setView(EView.NET)}
            className="bg-yellow-400 text-black px-3 py-1 rounded-lg"
          >
            Specific Net
          </button> */}
          <Image
            role="presentation"
            onClick={toggleFullscreen}
            className="w-8 svg-white"
            src={fullscreen ? "/icons/minimize.svg" : "/icons/maximize.svg"}
            width={50}
            height={50}
            alt="minimize-maximize"
          />
        </div>
      </div>

      {/* Views */}
      {view === EView.ROUND && (
        <RoundView
          currRound={currRound}
          currRoundNets={currRoundNets}
          teamA={teamA}
          teamB={teamB}
          teamAPlayers={teamAPlayers}
          teamBPlayers={teamBPlayers}
          setView={setView}
          allNets={nets}
          roundList={roundList}
          srMap={srMap}
          matchId={matchId}
          view={view}
        />
      )}
      {view === EView.NET && selectedNet && (
        <NetInRoundView
          key={"nirv"}
          srNet={(selectedNet ? srMap.get(selectedNet._id) : null) || null}
          net={selectedNet || null}
          setView={setView}
          teamA={teamA}
          teamB={teamB}
          currRoundNets={currRoundNets}
          teamAPlayers={teamAPlayers}
          teamBPlayers={teamBPlayers}
          matchId={matchId}
          view={view}
        />
      )}
    </div>
  );
}

export default MatchPublicView;