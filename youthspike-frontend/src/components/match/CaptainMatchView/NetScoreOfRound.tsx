import { useAppSelector } from "@/redux/hooks";
import MatchSetting from "../MatchSetting";
import LeftSidePanel from "./LeftSidePanel";
import RightSidePanel from "./RightSidePanel";
import { MAX_MATCH_HEIGHT } from "@/utils/constant";

const NetScoreOfRound = () => {
  const { current: currentRound } = useAppSelector((state) => state.rounds);
  const { myTeam, opTeam, myTeamE, match } = useAppSelector((state) => state.matches);
  const currRoom = useAppSelector((state) => state.rooms.current);

  return (
    <div className="net-score h-full w-full container px-4 mx-auto">
      
      {/* Mobile Portrait Layout */}
      {/* Visible by default. Hidden on small screens (sm:) and up, OR if in landscape mode. */}
      <div className="flex landscape:hidden sm:hidden justify-between gap-2 text relative">
        <div className={`left-side-panel ${MAX_MATCH_HEIGHT} w-1/2`}>
          <LeftSidePanel />
        </div>
        <MatchSetting
          match={match}
          myTeam={myTeam}
          opTeam={opTeam}
          currRoom={currRoom}
          currRound={currentRound}
          myTeamE={myTeamE}
        />
        <div className={`right-side-panel ${MAX_MATCH_HEIGHT} w-1/2`}>
          <RightSidePanel />
        </div>
      </div>

      {/* Mobile Landscape & Desktop Layout */}
      {/* Hidden by default. Visible on small screens (sm:) and up, OR if in landscape mode. */}
      <div className="hidden landscape:flex sm:flex justify-between gap-2 text relative">
        <div className={`left-side-panel ${MAX_MATCH_HEIGHT} w-1/4`}>
          <LeftSidePanel />
        </div>
        <MatchSetting
          match={match}
          myTeam={myTeam}
          opTeam={opTeam}
          currRoom={currRoom}
          currRound={currentRound}
          myTeamE={myTeamE}
        />
        <div className={`right-side-panel ${MAX_MATCH_HEIGHT} w-3/4`}>
          <RightSidePanel />
        </div>
      </div>

    </div>
  );
};

export default NetScoreOfRound;