import { IRoundRelatives } from "@/types";
import { screen } from "@/utils/constant";



interface IRoundButtonProps{
  roundList: IRoundRelatives[];
  screenWidth: number;
  onRoundClick: (roundId: string) => void;
  currentRoundId?: string;
  extendedOvertime?: boolean;
}

const RoundButtons: React.FC<IRoundButtonProps> = ({
  roundList,
  currentRoundId,
  extendedOvertime,
  screenWidth,
  onRoundClick
}) => {
  return (
    <div className="round-nums flex flex-wrap w-full justify-center gap-1 items-center">
      {roundList.map((round, index) => {
        const isCurrentRound = round._id === currentRoundId;
        const buttonLabel = extendedOvertime && index === roundList.length - 1
          ? "OT"
          : `RD${round.num}`;

        return (
          <button
            key={round._id}
            className={`single-r ${isCurrentRound ? "bg-yellow-logo" : "bg-white"} py-1 text-center cursor-pointer ${screenWidth > screen.xs ? "text-xs w-6" : "text-sm w-8"
              } rounded-t-lg`}
            type="button"
            onClick={() => onRoundClick(round._id)}
            aria-label={`Round ${buttonLabel}`}
          >
            {buttonLabel}
          </button>
        );
      })}
    </div>
  );
};



export default RoundButtons;