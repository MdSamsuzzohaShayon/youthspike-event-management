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
import QRCode from "../elements/QRCode.tsx";
import { FRONTEND_URL } from "@/utils/keys";

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
      <div className="relative mb-8">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-900 to-yellow-900/20 rounded-2xl shadow-2xl"></div>

        {/* Animated border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/0 via-yellow-400/30 to-yellow-400/0 animate-pulse-slow"></div>

        <div className="relative flex flex-col lg:flex-row items-center justify-between p-6 lg:p-8 space-y-6 lg:space-y-0">
          {/* Main Title Section */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex flex-col items-center lg:items-start">
              {/* Decorative elements */}
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-1 h-1 bg-yellow-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>

              <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 tracking-tight">
                MATCH VIEW
              </h1>

              {/* Subtle status indicator */}
              <div className="flex items-center space-x-2 mt-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300 font-medium tracking-wide">
                  LIVE SCORING ACTIVE
                </span>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center space-y-4">
            {/* QR Code Container with enhanced styling */}
            <div className="relative group">
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-yellow-400 rounded-2xl blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>

              {/* QR Code with border animation */}
              <div className="relative bg-white p-3 rounded-xl shadow-2xl border-2 border-yellow-400/50 transform group-hover:scale-105 transition-transform duration-300">
                <div className="w-20 md:w-28 aspect-square">
                  <QRCode
                    value={`${FRONTEND_URL}/matches/${matchId}/scoreboard`}
                  />
                </div>

                {/* Animated corner accents */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-yellow-400 rounded-tl-lg"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-yellow-400 rounded-tr-lg"></div>
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-yellow-400 rounded-bl-lg"></div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-yellow-400 rounded-br-lg"></div>
              </div>
            </div>

            {/* QR Code label */}
            <div className="text-center">
              <p className="text-xs text-gray-300 font-semibold tracking-wide uppercase">
                Scan to Follow
              </p>
              <p className="text-[10px] text-gray-400 mt-1">Live Scoreboard</p>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="relative group">
              {/* Button with enhanced styling */}
              <button
                onClick={toggleFullscreen}
                className="relative flex items-center justify-center w-12 h-12 bg-gray-800 hover:bg-gray-700 border-2 border-yellow-400/30 rounded-xl transition-all duration-300 group-hover:border-yellow-400 group-hover:shadow-lg group-hover:shadow-yellow-400/20"
                aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {/* Icon container */}
                <div className="relative w-6 h-6">
                  <Image
                    role="presentation"
                    className="w-full h-full filter brightness-0 invert transition-transform duration-300 group-hover:scale-110"
                    src={
                      fullscreen ? "/icons/minimize.svg" : "/icons/maximize.svg"
                    }
                    width={24}
                    height={24}
                    alt={fullscreen ? "Minimize" : "Maximize"}
                  />
                </div>

                {/* Tooltip */}
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
                  {fullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </button>
            </div>
          </div>
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
