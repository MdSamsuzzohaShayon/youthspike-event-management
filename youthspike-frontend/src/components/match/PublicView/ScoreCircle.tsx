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
  const bgColor = teamType === ETeamType.TEAM_A ? "bg-yellow-400" : "bg-white";
  const borderColor =
    teamType === ETeamType.TEAM_A ? "border-white" : "border-yellow-400";
  const textSize = className.includes("w-40")
    ? "text-7xl"
    : "text-5xl md:text-6xl";

  return (
    <div
      className={`rounded-full flex items-center justify-center shadow-2xl border-4 ${borderColor} ${bgColor} ${className}`}
    >
      <div className={`text-black font-bold ${textSize}`}>{score}</div>
    </div>
  );
};

export default ScoreCircle;
