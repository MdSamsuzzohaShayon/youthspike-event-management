import { useAppSelector } from "@/redux/hooks";
import MatchSetting from "../MatchSetting";
import LeftSidePanel from "./LeftSidePanel";
import RightSidePanel from "./RightSidePanel";
import { MAX_MATCH_HEIGHT } from "@/utils/constant";




const NetScoreOfRound = () => {

  const { current: currentRound } = useAppSelector((state) => state.rounds);
  const {
    myTeam,
    opTeam,
    myTeamE,
    match,
  } = useAppSelector((state) => state.matches);
  const currRoom = useAppSelector((state) => state.rooms.current);



  return (
    <div className="net-score h-full container px-4 mx-auto flex justify-between gap-1 text relative">
      <div className={`left-side-panel ${MAX_MATCH_HEIGHT} w-3/6 md:w-3/12`}>
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
      <div className={`right-side-panel ${MAX_MATCH_HEIGHT} w-3/6 md:w-9/12`}>
        <RightSidePanel />
      </div>
    </div>
  );
};




export default NetScoreOfRound;