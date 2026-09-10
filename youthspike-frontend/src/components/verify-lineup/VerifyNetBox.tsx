import { ETeam, INetRelatives, IPlayer } from "@/types";
import ScoreCard from "./ScoreCard";

interface INetBoxProps {
    crn: INetRelatives;
    myTeamE: ETeam;
    playerMap: Map<string, IPlayer>;
    rankingMap: Map<string, number>;
  }

const VerifyNetBox: React.FC<INetBoxProps> = ({ crn, myTeamE, playerMap, rankingMap }) => {
    const playerAId = myTeamE === ETeam.teamA ? crn.teamAPlayerA : crn.teamBPlayerA;
    const playerBId = myTeamE === ETeam.teamA ? crn.teamAPlayerB : crn.teamBPlayerB;
  
    const playerA = playerAId ? playerMap.get(playerAId) ?? null : null;
    const playerB = playerBId ? playerMap.get(playerBId) ?? null : null;
  
    const playerARank = playerA?._id ? rankingMap.get(playerA._id) ?? 0 : 0;
    const playerBRank = playerB?._id ? rankingMap.get(playerB._id) ?? 0 : 0;
  
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between bg-gray-900 px-2 py-1.5">
          <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">
            Net {crn.num}
          </span>
          {/* Pair Score - Made Larger & Bolder */}
          <div className="flex items-baseline gap-1">
            <span className="text-[8px] uppercase text-gray-500 font-bold">Score</span>
            <span className="text-xl font-black text-white leading-none">
              {playerARank + playerBRank}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-gray-100 flex-1 py-2">
          <div className="px-1 flex items-start justify-center">
            <ScoreCard onTop player={playerA} playerRank={playerARank} />
          </div>
          <div className="px-1 flex items-start justify-center">
            <ScoreCard player={playerB} playerRank={playerBRank} />
          </div>
        </div>
      </div>
    );
  };


  export default VerifyNetBox;
  