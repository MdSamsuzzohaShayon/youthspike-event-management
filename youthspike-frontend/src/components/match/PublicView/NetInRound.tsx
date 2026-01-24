import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@apollo/client/react";
import TeamInNet from "./TeamInNet";
import CurrentAction from "./CurrentAction";
import ChangePlayDialog from "@/components/elements/Dialog/ChangePlayDialog";
import StreamUrlDialog from "@/components/elements/Dialog/StreamUrlDialog";
import { UPDATE_NET } from "@/graphql/net";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setCurrNetNum } from "@/redux/slices/netSlice";
import { setMessage } from "@/redux/slices/elementSlice";
import { useLdoId } from "@/lib/LdoProvider";
import LocalStorageService from "@/utils/LocalStorageService";
import {
  EMessage,
  ETeam,
  EView,
  INetRelatives,
  IPlayer,
  IServerReceiverOnNetMixed,
  IServerReceiverSinglePlay,
  ITeam,
} from "@/types";
import { IUpdateNetResponse } from "@/types";

// Constants
const LONG_PRESS_DURATION_MS = 1000;

// Types
interface NetInRoundProps {
  net: INetRelatives;
  teamA: ITeam | null;
  teamB: ITeam | null;
  playerMap: Map<string, IPlayer>;
  srMap: Map<string, IServerReceiverOnNetMixed>;
  playMapByNet: Map<string, IServerReceiverSinglePlay[]>;
  setView: React.Dispatch<React.SetStateAction<EView>>;
  matchId: string;
  view: EView;
}

interface LiveStreamButtonProps {
  net: INetRelatives;
  onStreamClick: (e: React.MouseEvent) => void;
  onLongPressStart: () => void;
  onLongPressEnd: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

interface ScoreDisplayProps {
  score: number;
  isRoundView: boolean;
  variant: ETeam;
}

// Sub-components
const LiveStreamButton: React.FC<LiveStreamButtonProps> = ({
  net,
  onStreamClick,
  onLongPressStart,
  onLongPressEnd,
  onContextMenu,
}) => {
  const ariaLabel = net.streamUrl
    ? `Open live stream for net ${net.num}. Long press or right click to edit.`
    : `Add stream URL for net ${net.num}. Long press or right click to edit.`;

  const title = net.streamUrl
    ? "Click to open stream. Long press/right click to edit."
    : "Click to add stream URL. Long press/right click to edit.";

  return (
    <button
      className="live-stream flex items-center relative"
      onClick={onStreamClick}
      onMouseDown={onLongPressStart}
      onMouseUp={onLongPressEnd}
      onMouseLeave={onLongPressEnd}
      onTouchStart={onLongPressStart}
      onTouchEnd={onLongPressEnd}
      onContextMenu={onContextMenu}
      aria-label={ariaLabel}
      title={title}
    >
      <Image
        src="/icons/live.svg"
        alt="live"
        width={32}
        height={32}
        className="w-8 svg-black"
      />
    </button>
  );
};

const ScorekeeperLink: React.FC<{ matchId: string; ldoIdUrl: string }> = ({
  matchId,
  ldoIdUrl,
}) => (
  <Link
    className="score-keeper flex items-center"
    href={`/score-keeping/${matchId}/${ldoIdUrl}`}
    aria-label="Go to scorekeeper"
  >
    <Image
      width={16}
      height={16}
      src="/icons/scorekeeper.png"
      alt="Scorekeeper"
      className="w-4 svg-black"
    />
  </Link>
);

const NetNumberButton: React.FC<{
  netNum: number;
  hasLastPlay: boolean;
  onClick: () => void;
}> = ({ netNum, hasLastPlay, onClick }) => (
  <button
    className="w-24 md:w-12 net-num uppercase text-sm font-medium"
    onClick={onClick}
    disabled={!hasLastPlay}
    aria-label={`Change plays for net ${netNum}`}
  >
    Net-{netNum}
  </button>
);

const ViewToggleButton: React.FC<{
  view: EView;
  onClick: (e: React.SyntheticEvent) => void;
}> = ({ view, onClick }) => {
  const isRoundView = view === EView.ROUND;
  const iconSrc = isRoundView ? "/icons/maximize.svg" : "/icons/minimize.svg";
  const altText = isRoundView ? "maximize-button" : "minimize-button";
  const ariaLabel = isRoundView ? "Maximize net view" : "Minimize net view";

  return (
    <div className="relative group">
      <button
        className="flex items-center"
        onClick={onClick}
        aria-label={ariaLabel}
      >
        <Image src={iconSrc} alt={altText} width={24} height={24} className="w-6 h-6" />
      </button>
      {!isRoundView && (
        <div className="absolute left-1/2 -top-10 -translate-x-1/2 bg-gray-700 text-white text-sm px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none whitespace-nowrap">
          Click to see all nets in this round.
        </div>
      )}
    </div>
  );
};

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, isRoundView, variant }) => {
  const wrapperClass = isRoundView ? "score-wrapper" : "score-wrapper-single";
  const scoreClass = isRoundView ? "net-team-score" : "net-team-score-single";
  const bgColor = variant === "teamA" ? "bg-white text-black" : "bg-[#e43756] text-white";

  return (
    <div
      className={`${wrapperClass} ${bgColor} rounded-lg text-center flex justify-center items-center h-fit w-4/6`}
    >
      <span className={`team-score-in-round ${scoreClass} font-bold text-lg tracking-wider`}>
        {score}
      </span>
    </div>
  );
};

// Main Component
const NetInRound: React.FC<NetInRoundProps> = ({
  net,
  teamA,
  teamB,
  playerMap,
  srMap,
  playMapByNet,
  setView,
  matchId,
  view,
}) => {
  // Hooks
  const dispatch = useAppDispatch();
  const { ldoIdUrl } = useLdoId();
  
  // Refs
  const changePlayDialogRef = useRef<HTMLDialogElement | null>(null);
  const streamUrlDialogRef = useRef<HTMLDialogElement | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // State
  const [streamUrl, setStreamUrl] = useState<string>(net.streamUrl || "");
  const [isLongPress, setIsLongPress] = useState<boolean>(false);

  // GraphQL Mutation
  const [updateNet, { loading: isUpdatingNet }] = useMutation<IUpdateNetResponse>(UPDATE_NET);

  // Redux State
  const { teamAPlayers, teamBPlayers } = useAppSelector((state) => ({
    teamAPlayers: state.players.teamAPlayers,
    teamBPlayers: state.players.teamBPlayers,
  }));

  // Memoized values
  const serverReceiverOnNet = useMemo(
    () => srMap.get(net._id) || null,
    [srMap, net._id]
  );

  const sortedPlays = useMemo(() => {
    const plays = playMapByNet.get(net._id) || [];
    return [...plays].sort((a, b) => a.play - b.play);
  }, [playMapByNet, net._id]);

  const lastPlay = sortedPlays.at(-1) || null;

  const teamAScore = useMemo(() => {
    const isActiveNet = serverReceiverOnNet?.net === net._id;
    return isActiveNet
      ? serverReceiverOnNet?.teamAScore ?? net.teamAScore ?? 0
      : net.teamAScore ?? 0;
  }, [serverReceiverOnNet, net]);

  const teamBScore = useMemo(() => {
    const isActiveNet = serverReceiverOnNet?.net === net._id;
    return isActiveNet
      ? serverReceiverOnNet?.teamBScore ?? net.teamBScore ?? 0
      : net.teamBScore ?? 0;
  }, [serverReceiverOnNet, net]);

  // Utility functions
  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const showErrorMessage = (message: string) => {
    dispatch(
      setMessage({
        name: "Invalid URL",
        message,
        type: EMessage.ERROR,
      })
    );
  };

  const showSuccessMessage = (message: string) => {
    dispatch(
      setMessage({
        name: "Success",
        message,
        type: EMessage.SUCCESS,
      })
    );
  };

  const isValidStreamUrl = (url: string): boolean => {
    const trimmedUrl = url.trim();
    return trimmedUrl.length > 0 && 
           (trimmedUrl.includes("www") || trimmedUrl.includes("http"));
  };

  const formatStreamUrl = (url: string): string => {
    return url.startsWith("http") ? url : `https://${url}`;
  };

  // Event handlers
  const handleViewChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    
    if (view === EView.NET) {
      LocalStorageService.setMatch(matchId, net.round);
      setView(EView.ROUND);
    } else {
      LocalStorageService.setMatch(matchId, net.round, net._id);
      dispatch(setCurrNetNum(net.num));
      setView(EView.NET);
    }
  };

  const handleLongPressStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPress(true);
      streamUrlDialogRef.current?.showModal();
    }, LONG_PRESS_DURATION_MS);
  };

  const handleLongPressEnd = () => {
    clearLongPressTimer();
    setIsLongPress(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    streamUrlDialogRef.current?.showModal();
  };

  const handleLiveStreamClick = (e: React.MouseEvent) => {
    e.preventDefault();
    clearLongPressTimer();

    if (isLongPress) {
      setIsLongPress(false);
      return;
    }

    if (net.streamUrl) {
      const url = formatStreamUrl(net.streamUrl);
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      streamUrlDialogRef.current?.showModal();
    }
  };

  const handleOpenChangePlayDialog = () => {
    if (lastPlay) {
      changePlayDialogRef.current?.showModal();
    }
  };

  const handleUpdateStreamUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    streamUrlDialogRef.current?.close();

    if (!isValidStreamUrl(streamUrl)) {
      showErrorMessage(
        streamUrl.trim()
          ? "Put a valid URL. Include www or http in the URL."
          : "Put a valid URL"
      );
      return;
    }

    try {
      const { data } = await updateNet({
        variables: {
          netId: net._id,
          input: { streamUrl: streamUrl.trim() },
        },
      });

      if (data?.updateNet?.success) {
        showSuccessMessage("Stream URL updated successfully!");
      } else {
        const errorMessage = data?.updateNet?.message || "Failed to update stream URL";
        showErrorMessage(errorMessage);
      }
    } catch (error) {
      console.error("Error updating stream URL:", error);
      showErrorMessage("Error updating stream URL. Please try again.");
    }
  };

  const handleClearStreamUrl = async () => {
    if (!confirm("Are you sure you want to clear the stream URL?")) {
      return;
    }

    try {
      const { data } = await updateNet({
        variables: {
          netId: net._id,
          input: { streamUrl: "" },
        },
      });

      if (data?.updateNet?.success) {
        setStreamUrl("");
        alert("Stream URL cleared successfully!");
        streamUrlDialogRef.current?.close();
      } else {
        alert(data?.updateNet?.message || "Failed to clear stream URL");
      }
    } catch (error) {
      console.error("Error clearing stream URL:", error);
      alert("Error clearing stream URL. Please try again.");
    }
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, []);

  // Render
  const isRoundView = view === EView.ROUND;

  return (
    <div className="relative w-full border border-white rounded-lg">
      {/* Net Control Bar */}
      <div className="net-bar bg-yellow-logo absolute -top-4 left-1/2 -translate-x-1/2 py-0 px-1 text-black rounded-lg flex justify-between items-center gap-x-2">
        <LiveStreamButton
          net={net}
          onStreamClick={handleLiveStreamClick}
          onLongPressStart={handleLongPressStart}
          onLongPressEnd={handleLongPressEnd}
          onContextMenu={handleContextMenu}
        />
        <ScorekeeperLink matchId={matchId} ldoIdUrl={ldoIdUrl} />
        <NetNumberButton
          netNum={net.num}
          hasLastPlay={!!lastPlay}
          onClick={handleOpenChangePlayDialog}
        />
        <ViewToggleButton view={view} onClick={handleViewChange} />
      </div>

      {/* Teams Section */}
      <div className="top-side flex justify-between items-start mt-2">
        {teamA && (
          <TeamInNet
            team={teamA}
            playerA={net.teamAPlayerA ? playerMap.get(net.teamAPlayerA) || null : null}
            playerB={net.teamAPlayerB ? playerMap.get(net.teamAPlayerB) || null : null}
            teamE={ETeam.teamA}
            srOnNet={serverReceiverOnNet}
            lastPlay={lastPlay}
            view={view}
            matchId={matchId}
            netId={net._id}
          />
        )}

        {teamB && (
          <TeamInNet
            team={teamB}
            playerA={net.teamBPlayerA ? playerMap.get(net.teamBPlayerA) || null : null}
            playerB={net.teamBPlayerB ? playerMap.get(net.teamBPlayerB) || null : null}
            teamE={ETeam.teamB}
            srOnNet={serverReceiverOnNet}
            lastPlay={lastPlay}
            view={view}
            matchId={matchId}
            netId={net._id}
          />
        )}
      </div>

      {/* Scores and Current Action */}
      <div className="bottom-side flex justify-between items-center p-1">
        <ScoreDisplay score={teamAScore} isRoundView={isRoundView} variant={ETeam.teamA} />
        
        <div className="w-4/12">
          <CurrentAction
            lastPlay={lastPlay}
            playerMap={playerMap}
            net={net}
            teamA={teamA}
            teamB={teamB}
            view={view}
          />
        </div>

        <ScoreDisplay score={teamBScore} isRoundView={isRoundView} variant={ETeam.teamB} />
      </div>

      {/* Dialogs */}
      <StreamUrlDialog
        handleClearStreamUrl={handleClearStreamUrl}
        handleUpdateStreamUrl={handleUpdateStreamUrl}
        isUpdating={isUpdatingNet}
        net={net}
        setStreamUrl={setStreamUrl}
        streamUrl={streamUrl}
        streamUrlDialogRef={streamUrlDialogRef}
      />

      <ChangePlayDialog
        changePlayEl={changePlayDialogRef}
        currPlays={sortedPlays}
        teamAPlayers={teamAPlayers}
        teamBPlayers={teamBPlayers}
        playerMap={playerMap}
      />
    </div>
  );
};

export default NetInRound;