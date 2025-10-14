import Image from "next/image";
import TeamInNet from "./TeamInNet";
import {
  EServerReceiverAction,
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
import { useAppDispatch } from "@/redux/hooks";
import { setCurrNetNum } from "@/redux/slices/netSlice";
import { useMemo } from "react";
import Link from "next/link";
import { useLdoId } from "@/lib/LdoProvider";

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
        <span className="net-num uppercase">Net-{net.num}</span>
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
          <Image
            src="/icons/minimize.svg"
            alt="maximize-button"
            height={40}
            width={40}
            className="w-6 svg-black"
            role="presentation"
            onClick={handleRoundNetSelect}
          />
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
          />
        )}
      </div>

      {/* Bottom side  */}
      <div className="bottom-side flex justify-between items-center p-1">
        <span className="net-team-score bg-[#ffffff] text-black rounded-lg text-center drop-shadow-[1px_1px_2px_rgba(0,0,0,0.7)]">
          {srOnNet?.net === net._id
            ? srOnNet?.teamAScore || net?.teamAScore || 0
            : net?.teamAScore || 0}
        </span>
        {/* <span className="net-team-score bg-[#ffffff] text-black rounded text-center drop-shadow-[1px_1px_2px_rgba(0,0,0,0.7)] h-8 flex items-center justify-center px-3">12</span> */}
        <div className="w-4/12">
          <CurrentAction
            lastPlay={lastPlay}
            playerMap={playerMap}
            net={net}
            teamA={teamA}
            teamB={teamB}
          />
        </div>
        <div className="net-team-score bg-[#e43756] text-black rounded-lg text-center text-white drop-shadow-[1px_1px_2px_rgba(255,255,255,0.6)]">
          {/* {net?.teamBScore || 0} */}
          {srOnNet?.net === net._id
            ? srOnNet?.teamBScore || net?.teamBScore || 0
            : net?.teamBScore || 0}
        </div>
      </div>
    </div>
  );
};

export default NetInRound;
