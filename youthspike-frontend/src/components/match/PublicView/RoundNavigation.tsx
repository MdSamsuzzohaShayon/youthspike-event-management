import { EArrowSize, ENDirection, IRoundRelatives } from "@/types";
import NavArrow from "./NavArrow";

const RoundNavigation = ({
  size = EArrowSize.MD,
  handleRoundChange,
  currRound,
  className = ""
}: {
  size?: EArrowSize;
  handleRoundChange: (
    direction: ENDirection
  ) => (e: React.SyntheticEvent) => void;
  currRound : IRoundRelatives | null;
  className?: string;
}) => (
  <div className={`flex items-center justify-center space-x-4 ${className}`}>
    <NavArrow
      direction={ENDirection.PREV}
      onClick={handleRoundChange(ENDirection.PREV)}
      size={size}
      className="nav-arrow"
    />
    <div className="text-yellow-400 font-bold text-lg bg-gray-900 px-5 py-2 rounded-full border border-yellow-400 shadow-md min-w-[120px] text-center">
      Round {currRound?.num}
    </div>
    <NavArrow
      direction={ENDirection.NEXT}
      onClick={handleRoundChange(ENDirection.NEXT)}
      size={size}
      className="nav-arrow"
    />
  </div>
);

export default RoundNavigation;
