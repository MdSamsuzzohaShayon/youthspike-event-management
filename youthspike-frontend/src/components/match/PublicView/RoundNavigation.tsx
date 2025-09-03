import { EArrowSize, ENDirection, IRoundRelatives } from "@/types";
import NavArrow from "./NavArrow";

const RoundNavigation = ({
  size = EArrowSize.MD,
  handleRoundChange,
  currRound
}: {
  size?: EArrowSize;
  handleRoundChange: (
    direction: ENDirection
  ) => (e: React.SyntheticEvent) => void;
  currRound : IRoundRelatives | null;
}) => (
  <div className="flex items-center space-x-4">
    <NavArrow
      direction={ENDirection.PREV}
      onClick={handleRoundChange(ENDirection.PREV)}
      size={size}
    />
    <div className="text-yellow-400 font-bold text-xl text-center bg-black px-4 py-2 rounded-full border border-yellow-400">
      Round {currRound?.num}
    </div>
    <NavArrow
      direction={ENDirection.NEXT}
      onClick={handleRoundChange(ENDirection.NEXT)}
      size={size}
    />
  </div>
);

export default RoundNavigation;
