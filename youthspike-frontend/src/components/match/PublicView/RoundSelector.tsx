import { FC } from "react";
import Image from "next/image";
import { ENDirection } from "@/types";

interface IRoundSelectorProps {
  currRound: { _id: string; num: number } | null;
  handleRoundChange: (
    direction: ENDirection
  ) => (e: React.SyntheticEvent) => void;
}

const RoundSelector: FC<IRoundSelectorProps> = ({
  currRound,
  handleRoundChange,
}) => {
  if (!currRound) return null;

  return (
    <div className="round-selector flex items-center justify-center gap-4 bg-yellow-logo rounded-lg">
      {/* Left arrow (rotated) */}
      <button
        onClick={handleRoundChange(ENDirection.PREV)}
        className="hover:bg-yellow-700 rounded-full transition"
      >
        <Image
          src="/icons/right-arrow.svg"
          alt="Previous Round"
          width={24}
          height={24}
          className="svg-black rotate-180"
        />
      </button>

      {/* Round number */}
      <span className="text-lg md:text-xl font-bold text-center px-4 text-black">
        Round {currRound.num}
      </span>

      {/* Right arrow */}
      <button
        onClick={handleRoundChange(ENDirection.NEXT)}
        className="hover:bg-yellow-700 rounded-full transition"
      >
        <Image
          src="/icons/right-arrow.svg"
          alt="Next Round"
          width={24}
          height={24}
          className="svg-black "
        />
      </button>
    </div>
  );
};

export default RoundSelector;
