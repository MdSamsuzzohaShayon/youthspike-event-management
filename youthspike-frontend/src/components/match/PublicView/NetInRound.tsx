import Image from "next/image";
import TeamInNet from "./TeamInNet";
import {
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
import { useMemo, useRef } from "react";
import Link from "next/link";
import { useLdoId } from "@/lib/LdoProvider";
import { toOrdinal } from "@/utils/helper";
import ChangePlayDialog from "@/components/elements/Dialog/ChangePlayDialog";

interface INetInRoundProps {
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

const NetInRound: React.FC<INetInRoundProps> = ({
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

  const { teamAPlayers, teamBPlayers } = useAppSelector((state) => ({
    teamAPlayers: state.players.teamAPlayers,
    teamBPlayers: state.players.teamBPlayers,
  }));

  const srOnNet = useMemo(() => {
    return srMap.get(net._id) || null;
  }, [srMap]);

  const sortedPlays = useMemo(() => {
    const serverReceiverPlays = playMapByNet.get(net._id) || [];
    return [...serverReceiverPlays].sort((a, b) => a.play - b.play);
  }, [playMapByNet, net]);

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

  return (
    <div className="relative w-full border border-white rounded-lg">
      <div className="net-bar bg-yellow-logo absolute -top-4 left-1/2 -translate-x-1/2 py-0 px-1 text-black rounded-lg flex justify-between items-center gap-x-2">
        <Link
          className="score-keeper"
          href={`/score-keeping/${matchId}/${ldoIdUrl}`}
        >
          <Image
            width={30}
            height={30}
            src="/icons/scorekeeper.png"
            alt="Scorekeeper"
            className="w-4 svg-black"
          />
        </Link>
        <button
          className="net-num uppercase"
          onClick={() => {
            if (lastPlay) changePlayEl.current?.showModal();
          }}
        >
          Net-{net.num}
        </button>
        {view === EView.ROUND ? (
          <Image
            src="/icons/maximize.svg"
            alt="maximize-button"
            height={40}
            width={40}
            className="w-6 svg-black"
            role="presentation"
            onClick={handleRoundNetSelect}
          />
        ) : (
          <div className="relative group">
            <Image
              src="/icons/minimize.svg"
              alt="maximize-button"
              height={40}
              width={40}
              className="w-6 svg-black"
              role="presentation"
              onClick={handleRoundNetSelect}
            />
            <div className="absolute left-1/2 -top-10 -translate-x-1/2 bg-gray-700 text-white text-sm px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              Click to see all nets in this round.
            </div>
          </div>
        )}
      </div>
      {/* Top side  */}
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
          />
        )}
      </div>

      {/* Bottom side  */}
      <div className="bottom-side flex justify-between items-center p-1">
        <div
          className={`${
            view === EView.ROUND ? "score-wrapper" : "score-wrapper-single"
          } bg-[#ffffff] text-black rounded-lg text-center flex justify-center items-center`}
        >
          <span
            className={`team-score-in-round ${
              view === EView.ROUND ? "net-team-score" : "net-team-score-single"
            }`}
          >
            {srOnNet?.net === net._id
              ? srOnNet?.teamAScore || net?.teamAScore || 0
              : net?.teamAScore || 0}
          </span>
        </div>
        {/* <span className="net-team-score bg-[#ffffff] text-black rounded text-center drop-shadow-[1px_1px_2px_rgba(0,0,0,0.7)] h-8 flex items-center justify-center px-3">12</span> */}
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
          } bg-[#e43756] text-white rounded-lg text-center flex justify-center items-center`}
        >
          <span
            className={`team-score-in-round ${
              view === EView.ROUND ? "net-team-score" : "net-team-score-single"
            }`}
          >
            {srOnNet?.net === net._id
              ? srOnNet?.teamBScore || net?.teamBScore || 0
              : net?.teamBScore || 0}
          </span>
        </div>
      </div>

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
