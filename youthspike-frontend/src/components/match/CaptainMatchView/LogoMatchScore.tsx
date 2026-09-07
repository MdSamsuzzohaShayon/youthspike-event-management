import { useAppSelector } from "@/redux/hooks";
import { ETeam, ITeam } from "@/types/team";
import { netSize } from "@/utils/constant";
import TextImg from "@/components/elements/TextImg";
import { CldImage } from "next-cloudinary";

interface ILogoMatchScoreProps {
  dark: boolean;
  teamE: ETeam;
  completed: boolean;
  team?: ITeam | null;
  penalty: number;
}

export default function LogoMatchScore({ 
  dark, 
  team, 
  teamE, 
  completed, 
  penalty 
}: ILogoMatchScoreProps) {
  const { matchScore } = useAppSelector((state) => state.matches);

  // Extract scores based on team perspective
  const myScore = teamE === ETeam.teamA ? matchScore.teamAMScore : matchScore.teamBMScore;
  const opScore = teamE === ETeam.teamA ? matchScore.teamBMScore : matchScore.teamAMScore;
  const plusMinus = teamE === ETeam.teamA ? matchScore.teamAMPlusMinus : matchScore.teamBMPlusMinus;
  
  // Determine if this team is winning
  const isWinning = completed && (myScore + penalty) > opScore;
  const totalScore = myScore + penalty;

  // Dynamic layout classes
    
  const flexDirection = dark ? "flex-col" : "flex-col-reverse";

  return (
    <div 
      className={`logo-match-score relative py-4 px-3 flex w-full ${flexDirection} gap-4 rounded-2xl transition-all duration-500 shadow-lg`}
    >
      <div className="w-full flex justify-between items-center gap-4">
        
        {/* Team Logo Section */}
        <div className="w-2/5 flex justify-center items-center">
          <div className="relative group">
            {team?.logo ? (
              <CldImage
                alt={`${team?.name || 'Team'} logo`}
                width={100}
                height={100}
                className="w-20 h-20 md:w-24 md:h-24 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110"
                crop="fit"
                src={team.logo}
              />
            ) : (
              <TextImg 
                fullText={team?.name} 
                className="h-20 w-20 md:h-24 md:w-24 rounded-xl flex items-center justify-center p-2 bg-zinc-200/50 dark:bg-zinc-800/50 border border-yellow-400/30" 
                style={{ height: `${netSize.tlh}rem` }} 
              />
            )}
          </div>
        </div>

        {/* Score Section */}
        <div className="w-3/5 flex flex-col justify-center items-center gap-y-2">
          <span className="text-[10px] md:text-xs tracking-[0.2em] uppercase font-bold text-yellow-logo text-center">
            Match Score
          </span>
          
          {/* Score Box */}
          <div 
            aria-live="polite" // Accessibility: announces score changes to screen readers
            className={`
              score-box relative w-full max-w-[160px] p-1 md:p-2 rounded-2xl 
              flex flex-col justify-center items-center text-center
              border-2 transition-all duration-500
              ${isWinning 
                ? "bg-gradient-to-br from-green-500 to-green-600 border-green-400 shadow-lg shadow-green-500/30 text-white scale-105" 
                : `bg-black/5 dark:bg-white/5 border-yellow-400 ${dark ? 'text-white' : 'text-black'}`
              }
            `}
          >
            {/* Plus/Minus Badge */}
            {plusMinus !== 0 && (
              <span 
                className={`
                  absolute -top-3 -right-3 text-xs font-bold w-8 h-8 flex items-center justify-center
                  rounded-full shadow-md border-2 border-black/10 transition-transform duration-300
                  ${plusMinus > 0 ? "bg-green-400 text-black" : "bg-red-500 text-white"}
                `}
              >
                {plusMinus > 0 ? `+${plusMinus}` : plusMinus}
              </span>
            )}

            <span className="text-4xl md:text-6xl font-extrabold tabular-nums tracking-tighter drop-shadow-sm">
              {totalScore}
            </span>

            {/* Penalty Indicator */}
            {penalty > 0 && (
              <span className="mt-1 text-[9px] md:text-[10px] uppercase tracking-wider opacity-80">
                (incl. {penalty} pen)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}