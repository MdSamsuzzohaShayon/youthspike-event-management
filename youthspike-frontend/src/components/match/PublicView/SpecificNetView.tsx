import { INetRelatives, IPlayer, ITeam } from "@/types";
import NetCardView from "./NetCardView";
import { useMemo } from "react";

interface ISpecificNetViewProps {
  currRoundNets: INetRelatives[];
  currNetNum: number;
  teamA: ITeam | null;
  teamB: ITeam | null;
  teamAPlayers: IPlayer[];
  teamBPlayers: IPlayer[];
}

const SpecificNetView = ({
  currRoundNets,
  currNetNum,
  teamA,
  teamB,
  teamAPlayers,
  teamBPlayers,
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
          net={net}
          teamA={teamA}
          teamB={teamB}
          teamAPlayers={teamAPlayers}
          teamBPlayers={teamBPlayers}
        />
      )}
    </div>
  );
};

export default SpecificNetView;
