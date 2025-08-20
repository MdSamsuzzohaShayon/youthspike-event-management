import { INetRelatives, IPlayer, ITeam } from "@/types";
import NetCardView from "./NetCardView";

interface IAllNetsViewProps {
  nets: INetRelatives[];
  teamA: ITeam | null;
  teamB: ITeam | null;
  teamAPlayers: IPlayer[];
  teamBPlayers: IPlayer[];
}
const AllNetsView = ({
  nets,
  teamA,
  teamB,
  teamAPlayers,
  teamBPlayers,
}: IAllNetsViewProps) => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {nets.map((net: any) => (
      <NetCardView
        key={net.id}
        net={net}
        teamA={teamA}
        teamB={teamB}
        teamAPlayers={teamAPlayers}
        teamBPlayers={teamBPlayers}
      />
    ))}
  </div>
);

export default AllNetsView;
