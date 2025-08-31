import {
  EView,
  INetRelatives,
  IPlayer,
  IRoundRelatives,
  IServerReceiverOnNetMixed,
  ITeam,
} from "@/types";
import NetCardView from "./NetCardView";
import { useMemo } from "react";

interface ISpecificNetViewProps {
  currRoundNets: INetRelatives[];
  currNetNum: number;
  teamA: ITeam | null;
  teamB: ITeam | null;
  teamAPlayers: IPlayer[];
  teamBPlayers: IPlayer[];
  srMap: Map<string, IServerReceiverOnNetMixed>;
  setView: React.Dispatch<React.SetStateAction<EView>>;
  matchId: string;
  currRound: IRoundRelatives | null;
}

const SpecificNetView = ({
  currRoundNets,
  currNetNum,
  teamA,
  teamB,
  teamAPlayers,
  teamBPlayers,
  srMap,
  setView,
  matchId,
  currRound
}: ISpecificNetViewProps) => {
  const net = useMemo(() => {
    return currRoundNets.find((n) => n.num === currNetNum);
  }, [currRoundNets, currNetNum]);
  return (
    <div className="specific-net-view">
      {!net ? (
        <p>No net has been selected</p>
      ) : (
        <NetCardView
          matchId={matchId}
          net={net}
          teamA={teamA}
          teamB={teamB}
          teamAPlayers={teamAPlayers}
          teamBPlayers={teamBPlayers}
          netNumber={net.num}
          srNet={srMap.get(net._id) || null}
          setView={setView}
          currRound={currRound}
        />
      )}
    </div>
  );
};

export default SpecificNetView;
