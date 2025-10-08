import { ESRRole, ETeam, IPlayer, ITeam } from "@/types";
import PlayerView from "./PlayerView";
import TextImg from "@/components/elements/TextImg";
import { CldImage } from "next-cloudinary";

interface ITeamViewProps {
  team: ITeam;
  teamScore: number;
  players: IPlayer[];
  roleMap: Map<string, ESRRole>;
  orientation?: "left" | "right";
}
const TeamView = ({ team, players, teamScore, orientation = "left", roleMap }: ITeamViewProps) => (
  <div className={`bg-gray-900 text-white rounded-xl p-4 md:p-5 flex flex-col h-full shadow-lg border border-gray-700 hover:border-yellow-400 transition-all duration-200 group ${
    orientation === "left" ? "md:border-r md:border-r-yellow-400 md:pr-6" : "md:border-l md:border-l-yellow-400 md:pl-6"
  }`}>
    {/* Team Header */}
    <div className="flex flex-col items-center mb-4">
      <div className="relative mb-3">
        {team.logo ? (
          <CldImage 
            height={70} 
            width={70} 
            src={team.logo} 
            alt={team.name} 
            className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-yellow-400 group-hover:scale-105 transition-transform duration-200" 
            crop="fit"
          />
        ) : (
          <TextImg 
            className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-yellow-400" 
            fullText={team.name} 
          />
        )}
        
        {/* Score Badge */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black font-bold px-3 py-1 rounded-full text-sm md:text-base min-w-[40px] text-center shadow-md">
          {teamScore}
        </div>
      </div>
      
      <h3 className="font-bold text-lg md:text-xl text-center text-yellow-400">{team.name}</h3>
    </div>

    {/* Players List */}
    <div className="space-y-3 flex-1">
      {players.length > 0 ? (
        players.map((p: IPlayer) => (
          <PlayerView 
            key={p._id} 
            player={p} 
            role={roleMap.get(p._id) || null} 
            compact={true}
          />
        ))
      ) : (
        <div className="flex flex-col items-center justify-center h-full py-4">
          <div className="w-12 h-12 rounded-full bg-gray-800 border border-dashed border-yellow-400 flex items-center justify-center mb-2">
            <span className="text-gray-400 text-sm">?</span>
          </div>
          <p className="text-gray-400 text-sm text-center">Players to be announced</p>
        </div>
      )}
    </div>
  </div>
);

export default TeamView;