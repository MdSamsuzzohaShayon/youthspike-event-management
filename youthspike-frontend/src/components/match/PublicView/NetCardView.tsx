import { INetRelatives, IPlayer, ITeam } from "@/types";
import TeamView from "./TeamView";
import { useMemo } from "react";

interface INetCardViewProps {
  net: INetRelatives;
  teamA: ITeam | null;
  teamB: ITeam | null;
  teamAPlayers: IPlayer[];
  teamBPlayers: IPlayer[];
  netNumber?: number;
}
const NetCardView = ({
  net,
  teamA,
  teamB,
  teamAPlayers,
  teamBPlayers,
  netNumber,
}: INetCardViewProps) => {

  const tap = useMemo(()=>{
    return teamAPlayers.filter((p)=> p._id === net.teamAPlayerA || p._id === net.teamAPlayerB)
  }, [teamAPlayers, net]);

  const tbp = useMemo(()=>{
    return teamBPlayers.filter((p)=> p._id === net.teamBPlayerA || p._id === net.teamBPlayerB)
  }, [teamBPlayers, net]);


  return (
    <div className="bg-gray-800 rounded-2xl p-4 md:p-6 shadow-lg border border-gray-700 hover:border-yellow-400 transition-all duration-300 group">
      {/* Net Header */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-600">
        <h3 className="text-yellow-400 font-bold text-lg md:text-xl flex items-center">
          <span className="bg-yellow-400 text-black rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
            {netNumber}
          </span>
          Net {netNumber}
        </h3>
        <div className="flex items-center space-x-3 bg-black px-3 py-1 rounded-full border border-yellow-400">
          <span className="text-white font-bold text-lg">{net.teamAScore || 0}</span>
          <span className="text-yellow-400 font-bold">-</span>
          <span className="text-white font-bold text-lg">{net.teamBScore || 0}</span>
        </div>
      </div>

      {/* Teams Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {teamA && (
          <TeamView 
            team={teamA} 
            players={tap} 
            teamScore={net.teamAScore || 0} 
            orientation="left"
          />
        )}
        
        {/* VS Separator for mobile */}
        <div className="md:hidden flex justify-center my-2">
          <div className="bg-yellow-400 text-black font-bold px-3 py-1 rounded-full text-sm">
            VS
          </div>
        </div>
        
        {teamB && (
          <TeamView 
            team={teamB} 
            players={tbp} 
            teamScore={net.teamBScore || 0} 
            orientation="right"
          />
        )}
      </div>
    </div>
  )
};

export default NetCardView;