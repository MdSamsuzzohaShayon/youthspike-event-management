import Image from "next/image";
import TeamInNet from "./TeamInNet";
import {
  EServerReceiverAction,
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
    <div className="relative w-full border border-yellow-logo rounded-lg">
      <button
        onClick={handleRoundNetSelect}
        className="net-num bg-yellow-logo absolute -top-4 left-1/2 -translate-x-1/2 p-2 py-1 text-black rounded-lg"
      >
        Net {net.num}
      </button>
      {/* Top side  */}
      <div className="top-side flex justify-between items-start border-b border-yellow-logo mt-4">
        {teamA && (
          <TeamInNet
            team={teamA}
            playerA={
              net.teamAPlayerA ? playerMap.get(net.teamAPlayerA) || null : null
            }
            playerB={
              net.teamAPlayerB ? playerMap.get(net.teamAPlayerB) || null : null
            }
          />
        )}
        <div className="vertical-separator h-full w-px bg-yellow-logo self-stretch" />
        {teamB && (
          <TeamInNet
            team={teamB}
            playerA={
              net.teamBPlayerA ? playerMap.get(net.teamBPlayerA) || null : null
            }
            playerB={
              net.teamBPlayerB ? playerMap.get(net.teamBPlayerB) || null : null
            }
          />
        )}
      </div>

      {/* Bottom side  */}
      <div className="bottom-side flex justify-between items-center">
        <div className="net-team-score bg-gray-100 text-black text-4xl md:text-6xl p-2 rounded min-w-16 text-center">
          {net?.teamAScore || 0}
        </div>
        <div className="w-4/12">
          <CurrentAction
            srOnNet={srMap.get(net._id) || null}
            serverReceiverPlays={playMapByNet.get(net._id) || []}
            playerMap={playerMap}
            net={net}
            teamA={teamA}
            teamB={teamB}
          />
        </div>
        <div className="net-team-score bg-red-400 text-black text-4xl md:text-6xl p-2 rounded min-w-16 text-center">
          {net?.teamBScore || 0}
        </div>
      </div>
    </div>
  );
};

export default NetInRound;
