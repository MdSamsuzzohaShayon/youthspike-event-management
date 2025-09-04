import { ETeamType } from "@/types";

const ScoreCircle = ({
  score,
  teamType,
  className = "",
}: {
  score: number;
  teamType: ETeamType;
  className?: string;
}) => {
  const bgGradient = teamType === ETeamType.TEAM_A 
    ? "bg-gradient-to-br from-yellow-500 to-yellow-600" 
    : "bg-gradient-to-br from-gray-100 to-gray-300";
  const borderColor =
    teamType === ETeamType.TEAM_A ? "border-yellow-logo" : "border-white";
  const shadowColor = teamType === ETeamType.TEAM_A ? "shadow-yellow-500/30" : "shadow-gray-500/30";
  
  const textSize = className.includes("w-36") 
    ? "text-7xl" 
    : className.includes("w-28") 
      ? "text-5xl" 
      : "text-4xl";

  return (
    <div
      className={`rounded-full flex items-center justify-center border-4 ${borderColor} bg-yellow-logo ${shadowColor} shadow-2xl ${className}`}
    >
      <div className={`text-black font-bold ${textSize} drop-shadow-md`}>{score}</div>
    </div>
  );
};

export default ScoreCircle;