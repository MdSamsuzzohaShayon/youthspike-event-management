import { IRoundRelatives } from "@/types";



interface IRoundButtonProps{
  roundList: IRoundRelatives[];
  onRoundClick: (roundId: string) => void;
  currentRoundId?: string;
  extendedOvertime?: boolean;
}

const RoundButtons: React.FC<IRoundButtonProps> = ({
  roundList,
  currentRoundId,
  extendedOvertime,
  onRoundClick
}) => {
  return (
    <div className="round-nums flex flex-wrap w-full justify-center gap-1 items-center">
      {/* Empty button just for space  */}
      <div className="py-1 text-center w-6"/>
      {roundList.map((round, index) => {
        const isCurrentRound = round._id === currentRoundId;
        const buttonLabel = extendedOvertime && index === roundList.length - 1
          ? "OT"
          : `RD${round.num}`;

        return (
          <button
            key={round._id}
            className={`single-r ${isCurrentRound ? "bg-yellow-logo" : "bg-white"} py-1 text-center cursor-pointer text-xs w-6
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