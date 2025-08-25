import { useRoundNavigation } from "@/hooks/useRoundNavigation";
import { setMessage } from "@/redux/slices/elementSlice";
import { AppDispatch } from "@/redux/store";
import { EMessage, ETeam, IMatchExpRel, IMatchRelatives, INetRelatives, IRoundRelatives } from "@/types";
import { useCallback, useMemo } from "react";

interface IRoundInputBoxProps{
    currMatch: IMatchRelatives; 
    roundList: IRoundRelatives[]; 
    currRound: IRoundRelatives | null; 
    allNets: INetRelatives[]; 
    myTeamE: ETeam; 
    dispatch: AppDispatch;

}

function RoundInputBox({currMatch, roundList, currRound, allNets, myTeamE, dispatch}: IRoundInputBoxProps) {
  const currentRoundIndex = roundList.findIndex(
    (r) => r._id === currRound?._id
  );
  const totalRounds = roundList.length;

  const netsByRound = useMemo(() => {
    const map: Record<string, INetRelatives[]> = {};
    allNets.forEach((net) => {
      if (!map[net.round]) map[net.round] = [];
      map[net.round].push(net);
    });
    return map;
  }, [allNets]);

  const { handleRoundChange } = useRoundNavigation({
    roundList,
    netsByRound,
    myTeamE,
    currentRound: currRound,
  });

  // Simplified event handler using the hook
  const handleRoundChangeClick = useCallback(
    (e: React.SyntheticEvent, roundId: string) => {
      e.preventDefault();

      handleRoundChange(roundId, (errorMessage) => {
        dispatch(
          setMessage({
            type: EMessage.ERROR,
            message: errorMessage,
          })
        );
      });

      dispatch(setMessage(null));
    },
    [dispatch, handleRoundChange]
  );

  return (
    <div className="w-full mb-6">
      {/* Desktop View - Horizontal Tabs */}
      <div className="hidden md:flex items-center justify-center space-x-1 bg-gray-800 p-2 rounded-lg shadow-lg">
        {roundList.map((round, index) => {
          const isCurrent = round._id === currRound?._id;
          const isCompleted = round.completed;
          const isOvertime =
            currMatch.extendedOvertime && index === roundList.length - 1;

          return (
            <button
              key={round._id}
              onClick={(e) => handleRoundChangeClick(e, round._id)}
              className={`
                  relative flex flex-col items-center justify-center px-4 py-3 rounded-lg transition-all duration-200 transform hover:scale-105
                  ${
                    isCurrent
                      ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg scale-105"
                      : isCompleted
                      ? "bg-green-600 text-white hover:bg-green-500"
                      : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                  }
                  min-w-[80px] group
                `}
              title={`Round ${round.num}${isCompleted ? " (Completed)" : ""}`}
            >
              {/* Round Indicator */}
              <div
                className={`
                  absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                  ${
                    isCurrent
                      ? "bg-black text-yellow-400"
                      : isCompleted
                      ? "bg-white text-green-600"
                      : "bg-gray-600 text-gray-300"
                  }
                `}
              >
                {index + 1}
              </div>

              {/* Round Label */}
              <span className="text-sm font-semibold uppercase">
                {isOvertime ? "OT" : `RD${round.num}`}
              </span>

              {/* Status Indicator */}
              <div
                className={`
                  w-2 h-2 rounded-full mt-1
                  ${isCompleted ? "bg-green-300" : "bg-gray-400"}
                `}
              />

              {/* Hover Tooltip */}
              <div className="absolute top-full mt-2 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded z-50">
                {isOvertime ? "Overtime" : `Round ${round.num}`}
                {isCompleted && " ✓"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Mobile View - Compact with Navigation Arrows */}
      <div className="md:hidden bg-gray-800 p-3 rounded-lg shadow-lg">
        <div className="flex items-center justify-between space-x-2">
          {/* Previous Button */}
          <button
            onClick={(e) =>
              currentRoundIndex > 0 &&
              handleRoundChangeClick(e, roundList[currentRoundIndex - 1]._id)
            }
            disabled={currentRoundIndex === 0}
            className="p-2 rounded-full bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Current Round Display */}
          <div className="flex-1 text-center">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-6 py-3 rounded-lg shadow-md">
              <div className="text-sm font-semibold uppercase">
                {currMatch.extendedOvertime &&
                currentRoundIndex === roundList.length - 1
                  ? "OVERTIME"
                  : `ROUND ${currRound?.num}`}
              </div>
              <div className="text-xs opacity-80">
                {currentRoundIndex + 1} of {totalRounds}
              </div>
              {currRound?.completed && (
                <div className="text-xs bg-green-600 text-white px-2 py-1 rounded-full mt-1 inline-block">
                  Completed ✓
                </div>
              )}
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={(e) =>
              currentRoundIndex < totalRounds - 1 &&
              handleRoundChangeClick(e, roundList[currentRoundIndex + 1]._id)
            }
            disabled={currentRoundIndex === totalRounds - 1}
            className="p-2 rounded-full bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Round Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span>
              {Math.round(((currentRoundIndex + 1) / totalRounds) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentRoundIndex + 1) / totalRounds) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Quick Round Selector (Dropdown alternative) */}
        <div className="mt-3">
          <select
            onChange={(e) => handleRoundChangeClick(e, e.target.value)}
            value={currRound?._id || ""}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            {roundList.map((round) => (
              <option key={round._id} value={round._id}>
                {currMatch.extendedOvertime && round.num === roundList.length
                  ? "Overtime"
                  : `Round ${round.num}`}
                {round.completed && " ✓"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Round Status Summary */}
      <div className="mt-4 flex justify-center">
        <div className="flex items-center space-x-4 text-xs text-gray-400">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
            <span>Current</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-600 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-600 rounded"></div>
            <span>Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoundInputBox;
