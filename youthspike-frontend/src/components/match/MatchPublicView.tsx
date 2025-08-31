import React, { useMemo, useRef, useState } from "react";
import RoundView from "./PublicView/RoundView";
import AllNetsView from "./PublicView/AllNetsView";
import SpecificNetView from "./PublicView/SpecificNetView";
import { EView, INetRelatives, IRoundRelatives, IServerReceiverOnNetMixed, ITeam } from "@/types";
import { useAppSelector } from "@/redux/hooks";
import Image from "next/image";
import LocalStorageService from "@/utils/LocalStorageService";

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
  matchId
}: IMatchPublicViewProps) {
  const [view, setView] = useState<EView>(()=> {
    const match = LocalStorageService.getMatch(matchId);
    if(match && match.netId){
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
    const entries = serverReceiversOnNet.map((s) => {
      const key = s.netId ?? (typeof s.net === "string" ? s.net : s.net._id);


      if (
        currServerReceiver &&
        (key === currServerReceiver.net || key === currServerReceiver.netId)
      ) {  
        return [
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
            servingPartnerId: currServerReceiver.servingPartnerId  || String(currServerReceiver.servingPartner),
            receivingPartnerId: currServerReceiver.receivingPartnerId  || String(currServerReceiver.receivingPartner),

            server: currServerReceiver.server,
            receiver: currServerReceiver.receiver,
            servingPartner: currServerReceiver.servingPartner,
            receivingPartner: currServerReceiver.receivingPartner,
          },
        ] as const;
      }
  
      return [key, s] as const;
    });
  
    return new Map<string, IServerReceiverOnNetMixed>(entries);
  }, [serverReceiversOnNet, currServerReceiver]);
  

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  console.log({currRound});
  

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
      {view === EView.ALL_NETS && (
        <AllNetsView
          nets={currRoundNets}
          teamA={teamA}
          teamB={teamB}
          teamAPlayers={teamAPlayers}
          teamBPlayers={teamBPlayers}
        />
      )}
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
        />
      )}
      {view === EView.NET && (
        <SpecificNetView
          currNetNum={currNetNum}
          currRoundNets={currRoundNets}
          teamA={teamA}
          teamB={teamB}
          teamAPlayers={teamAPlayers}
          teamBPlayers={teamBPlayers}
          setView={setView}
          srMap={srMap}
          matchId={matchId}
          currRound={currRound}
        />
      )}
    </div>
  );
}

export default MatchPublicView;
