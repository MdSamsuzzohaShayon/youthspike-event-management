import React, { useMemo, useRef, useState } from "react";
import RoundView from "./PublicView/RoundView";
import {
  EView,
  INetRelatives,
  IRoundRelatives,
  IServerReceiverOnNetMixed,
  IServerReceiverSinglePlay,
  ITeam,
} from "@/types";
import { useAppSelector } from "@/redux/hooks";
import Image from "next/image";
import LocalStorageService from "@/utils/LocalStorageService";
import { useSearchParams } from "next/navigation";
import NetInRound from "./PublicView/NetInRound";

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
  serverReceiverPlays: IServerReceiverSinglePlay[];
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
  serverReceiverPlays,
}: IMatchPublicViewProps) {
  const searchParams = useSearchParams();
  const [view, setView] = useState<EView>(() => {
    const match = LocalStorageService.getMatch(matchId);
    const viewInParams = searchParams.get("view");
    if (viewInParams && viewInParams === EView.ROUND) {
      LocalStorageService.setMatch(
        matchId,
        match?.roundId || currRound?._id || ""
      );
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

  const playerMap = useMemo(() => {
    return new Map([...teamAPlayers, ...teamBPlayers].map((p) => [p._id, p]));
  }, [teamAPlayers, teamBPlayers]);

  const playMapByNet = useMemo(() => {
    const playMap = new Map<string, IServerReceiverSinglePlay[]>();

    for (const play of serverReceiverPlays) {
      // Only include plays whose net exists in the nets array
      if (!nets.some((net) => net._id === play.net)) continue;

      if (!playMap.has(String(play.net))) {
        playMap.set(String(play.net), []);
      }

      playMap.get(String(play.net))!.push(play);
    }

    return playMap;
  }, [nets, serverReceiverPlays]);

  

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
      const isCurrentServerReceiver =
        currServerReceiver &&
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
            serverId:
              currServerReceiver.serverId || String(currServerReceiver.server),
            receiverId:
              currServerReceiver.receiverId ||
              String(currServerReceiver.receiver),
            servingPartnerId:
              currServerReceiver.servingPartnerId ||
              String(currServerReceiver.servingPartner),
            receivingPartnerId:
              currServerReceiver.receivingPartnerId ||
              String(currServerReceiver.receivingPartner),
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
            receivingPartnerId:
              s.receivingPartnerId || String(s.receivingPartner),
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

      <div className="round-net-view w-full">
        {/* Views */}
        {view === EView.ROUND && (
          <RoundView
            currRound={currRound}
            currRoundNets={currRoundNets}
            teamA={teamA}
            teamB={teamB}
            setView={setView}
            allNets={nets}
            roundList={roundList}
            srMap={srMap}
            matchId={matchId}
            view={view}
            playerMap={playerMap}
            playMapByNet={playMapByNet}
          />
        )}
        {view === EView.NET && selectedNet && (
          <NetInRound
            net={selectedNet || null}
            teamA={teamA}
            teamB={teamB}
            playerMap={playerMap}
            srMap={srMap}
            playMapByNet={playMapByNet}
            view={view}
            matchId={matchId}
            setView={setView}
          />
        )}
      </div>
    </div>
  );
}

export default MatchPublicView;
