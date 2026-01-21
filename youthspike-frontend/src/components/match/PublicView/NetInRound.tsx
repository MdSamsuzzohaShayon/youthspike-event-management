import Image from "next/image";
import TeamInNet from "./TeamInNet";
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
import CurrentAction from "./CurrentAction";
import LocalStorageService from "@/utils/LocalStorageService";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setCurrNetNum } from "@/redux/slices/netSlice";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLdoId } from "@/lib/LdoProvider";
import ChangePlayDialog from "@/components/elements/Dialog/ChangePlayDialog";
import { useMutation } from "@apollo/client/react";
import { UPDATE_NET } from "@/graphql/net";
import StreamUrlDialog from "@/components/elements/Dialog/StreamUrlDialog";
import { setMessage } from "@/redux/slices/elementSlice";

interface IProps {
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

const PRESSING_TIME = 1000; // 1 second

const NetInRound: React.FC<IProps> = ({
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
  const dispatch = useAppDispatch();
  const { ldoIdUrl } = useLdoId();
  const changePlayEl = useRef<HTMLDialogElement | null>(null);
  const streamUrlDialogRef = useRef<HTMLDialogElement | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>(net.streamUrl || "");
  const [isLongPress, setIsLongPress] = useState<boolean>(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // GraphQL Mutation
  const [updateNet, { loading: isUpdating }] = useMutation(UPDATE_NET);

  const { teamAPlayers, teamBPlayers } = useAppSelector((state) => ({
    teamAPlayers: state.players.teamAPlayers,
    teamBPlayers: state.players.teamBPlayers,
  }));

  const srOnNet = useMemo(() => {
    return srMap.get(net._id) || null;
  }, [srMap, net]);

  const sortedPlays = useMemo(() => {
    const serverReceiverPlays = playMapByNet.get(net._id) || [];
    return [...serverReceiverPlays].sort((a, b) => a.play - b.play);
  }, [playMapByNet, net._id]);

  const lastPlay = sortedPlays.at(-1) || null;

  const handleRoundNetSelect = (e: React.SyntheticEvent) => {
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

  // Handle long press start on mobile
  const handleLongPressStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPress(true);
      streamUrlDialogRef.current?.showModal();
    }, PRESSING_TIME); // 500ms for long press
  };

  // Handle long press end
  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsLongPress(false);
  };

  // Handle context menu (right click) on desktop
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    streamUrlDialogRef.current?.showModal();
  };

  // Handle single click - go to stream URL if exists
  const handleLiveStreamClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Clear any pending long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // If it was a long press, don't trigger click
    if (isLongPress) {
      setIsLongPress(false);
      return;
    }

    // If there's a stream URL, open it
    if (net.streamUrl) {
      const url = net.streamUrl.startsWith("http")
        ? net.streamUrl
        : `https://${net.streamUrl}`;
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      // If no stream URL, open dialog to add one
      streamUrlDialogRef.current?.showModal();
    }
  };

  const handleViewToggle = (e: React.SyntheticEvent) => {
    e.preventDefault();
    handleRoundNetSelect(e);
  };

  const handleUpdateStreamUrl = async (e: React.FormEvent) => {
    e.preventDefault();

    streamUrlDialogRef.current?.close();

    if (!streamUrl.trim()) {
      dispatch(
        setMessage({
          name: "Invalid URL",
          message: "Put a valid URL",
          type: EMessage.ERROR,
        })
      );
      return;
    }

    if (
      !streamUrl.trim().includes("www") &&
      !streamUrl.trim().includes("http")
    ) {
      dispatch(
        setMessage({
          name: "Invalid URL",
          message: "Put a valid URL. Include www or http in the URL.",
          type: EMessage.ERROR,
        })
      );
      return;
    }

    try {
      const { data } = await updateNet({
        variables: {
          netId: net._id,
          input: {
            streamUrl: streamUrl.trim(),
          },
        },
      });

      // @ts-ignore
      if (data?.updateNet?.success) {
        dispatch(
          setMessage({
            name: "Invalid URL",
            message: "Stream URL updated successfully!",
            type: EMessage.SUCCESS,
          })
        );
        
      } else {
        const message = (data as any)?.updateNet?.message || "Failed to update stream URL"
        dispatch(
          setMessage({
            name: "Invalid URL",
            message: message,
            type: EMessage.ERROR,
          })
        );
      }
    } catch (error) {
      console.error("Error updating stream URL:", error);
      dispatch(
        setMessage({
          name: "Invalid URL",
          message: "Error updating stream URL. Please try again.",
          type: EMessage.ERROR,
        })
      );
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
          input: {
            streamUrl: "",
          },
        },
      });

      // @ts-ignore
      if (data?.updateNet?.success) {
        setStreamUrl("");
        alert("Stream URL cleared successfully!");
        streamUrlDialogRef.current?.close();
      } else {
        // @ts-ignore
        alert(data?.updateNet?.message || "Failed to clear stream URL");
      }
    } catch (error) {
      console.error("Error clearing stream URL:", error);
      alert("Error clearing stream URL. Please try again.");
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full border border-white rounded-lg">
      <div className="net-bar bg-yellow-logo absolute -top-4 left-1/2 -translate-x-1/2 py-0 px-1 text-black rounded-lg flex justify-between items-center gap-x-2">
        {/* Live Stream Button with long press and right click support */}
        <button
          className="live-stream flex items-center relative"
          onClick={handleLiveStreamClick}
          onMouseDown={handleLongPressStart}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
          onContextMenu={handleContextMenu}
          aria-label={
            net.streamUrl
              ? `Open live stream for net ${net.num}. Long press or right click to edit.`
              : `Add stream URL for net ${net.num}. Long press or right click to edit.`
          }
          title={
            net.streamUrl
              ? "Click to open stream. Long press/right click to edit."
              : "Click to add stream URL. Long press/right click to edit."
          }
        >
          <Image
            src="/icons/live.svg"
            alt="live"
            width={32}
            height={32}
            className="w-8 svg-black"
          />
          {/* {!net.streamUrl && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          )} */}
        </button>

        {/* Scorekeeper Link (internal route) */}
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

        {/* Net Number Button */}
        <button
          className="w-24 md:w-12 net-num uppercase text-sm font-medium"
          onClick={() => {
            if (lastPlay) changePlayEl.current?.showModal();
          }}
          disabled={!lastPlay}
          aria-label={`Change plays for net ${net.num}`}
        >
          Net-{net.num}
        </button>

        {/* View Toggle Button */}
        {view === EView.ROUND ? (
          <button
            className="flex items-center"
            onClick={handleViewToggle}
            aria-label="Maximize net view"
          >
            <Image
              src="/icons/maximize.svg"
              alt="maximize-button"
              width={24}
              height={24}
              className="w-6 h-6"
            />
          </button>
        ) : (
          <div className="relative group">
            <button
              className="flex items-center"
              onClick={handleViewToggle}
              aria-label="Minimize net view"
            >
              <Image
                src="/icons/minimize.svg"
                alt="minimize-button"
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </button>
            <div className="absolute left-1/2 -top-10 -translate-x-1/2 bg-gray-700 text-white text-sm px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none whitespace-nowrap">
              Click to see all nets in this round.
            </div>
          </div>
        )}
      </div>

      {/* Top side - Teams */}
      <div className="top-side flex justify-between items-start mt-2">
        {teamA && (
          <TeamInNet
            team={teamA}
            playerA={
              net.teamAPlayerA ? playerMap.get(net.teamAPlayerA) || null : null
            }
            playerB={
              net.teamAPlayerB ? playerMap.get(net.teamAPlayerB) || null : null
            }
            teamE={ETeam.teamA}
            srOnNet={srOnNet}
            lastPlay={lastPlay}
            view={view}
            matchId={matchId}
            netId={net._id}
          />
        )}

        {teamB && (
          <TeamInNet
            team={teamB}
            playerA={
              net.teamBPlayerA ? playerMap.get(net.teamBPlayerA) || null : null
            }
            playerB={
              net.teamBPlayerB ? playerMap.get(net.teamBPlayerB) || null : null
            }
            teamE={ETeam.teamB}
            srOnNet={srOnNet}
            lastPlay={lastPlay}
            view={view}
            matchId={matchId}
            netId={net._id}
          />
        )}
      </div>

      {/* Bottom side - Scores and Action */}
      <div className="bottom-side flex justify-between items-center p-1">
        <div
          className={`${
            view === EView.ROUND ? "score-wrapper" : "score-wrapper-single"
          } bg-[#ffffff] text-black rounded-lg text-center flex justify-center items-center min-w-[3rem]`}
        >
          <span
            className={`team-score-in-round ${
              view === EView.ROUND ? "net-team-score" : "net-team-score-single"
            } font-bold text-lg`}
          >
            {srOnNet?.net === net._id
              ? srOnNet?.teamAScore || net?.teamAScore || 0
              : net?.teamAScore || 0}
          </span>
        </div>

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

        <div
          className={`${
            view === EView.ROUND ? "score-wrapper" : "score-wrapper-single"
          } bg-[#e43756] text-white rounded-lg text-center flex justify-center items-center min-w-[3rem]`}
        >
          <span
            className={`team-score-in-round ${
              view === EView.ROUND ? "net-team-score" : "net-team-score-single"
            } font-bold text-lg`}
          >
            {srOnNet?.net === net._id
              ? srOnNet?.teamBScore || net?.teamBScore || 0
              : net?.teamBScore || 0}
          </span>
        </div>
      </div>

      {/* Stream URL Dialog */}
      <StreamUrlDialog
        handleClearStreamUrl={handleClearStreamUrl}
        handleUpdateStreamUrl={handleUpdateStreamUrl}
        isUpdating={isUpdating}
        net={net}
        setStreamUrl={setStreamUrl}
        streamUrl={streamUrl}
        streamUrlDialogRef={streamUrlDialogRef}
      />

      {/* Change Play Dialog */}
      <ChangePlayDialog
        changePlayEl={changePlayEl}
        currPlays={sortedPlays}
        teamAPlayers={teamAPlayers}
        teamBPlayers={teamBPlayers}
        playerMap={playerMap}
      />
    </div>
  );
};

export default NetInRound;
