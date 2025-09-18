import { useCallback, useMemo } from "react";
import { useAppDispatch } from "@/redux/hooks";
import { setCurrentRoundNets } from "@/redux/slices/netSlice";
import { setCurrentRound, setRoundList } from "@/redux/slices/roundSlice";
import {
  setDisabledPlayerIds,
  setPrevPartner,
} from "@/redux/slices/matchesSlice";
import LocalStorageService from "@/utils/LocalStorageService";
import { EActionProcess } from "@/types/room";
import { ETeam } from "@/types/team";
import { EMessage, IMatchRelatives, INetRelatives, IRoundRelatives } from "@/types";
import { setMessage } from "@/redux/slices/elementSlice";

interface UseRoundNavigationProps {
  roundList: IRoundRelatives[];
  netsByRound: Record<string, INetRelatives[]>;
  myTeamE: ETeam;
  currentRound?: IRoundRelatives | null;
  match: IMatchRelatives
}

export const useRoundNavigation = ({
  roundList,
  netsByRound,
  myTeamE,
  currentRound,
  match
}: UseRoundNavigationProps) => {
  const dispatch = useAppDispatch();

  // Precompute round index lookup for O(1) access
  const roundIdToIndex = useMemo(() => {
    const map: Record<string, number> = {};
    roundList.forEach((round, idx) => {
      map[round._id] = idx;
    });
    return map;
  }, [roundList]);

  // Optimized round change function
  const changeTheRound = useCallback(
    (targetRoundIndex: number) => {
      const roundObj = roundList[targetRoundIndex];
      if (!roundObj) return;

      // Get nets for target round - O(1) lookup
      const filteredNets = netsByRound[roundObj._id] || [];
      dispatch(setCurrentRoundNets(filteredNets));

      // Update team process if needed
      const shouldUpdateTeamA =
        myTeamE === ETeam.teamA &&
        roundObj.teamAProcess === EActionProcess.INITIATE;
      const shouldUpdateTeamB =
        myTeamE === ETeam.teamB &&
        roundObj.teamBProcess === EActionProcess.INITIATE;

      // Only create new object if changes are needed
      const newRoundObj = shouldUpdateTeamA || shouldUpdateTeamB
        ? {
            ...roundObj,
            teamAProcess: shouldUpdateTeamA
              ? EActionProcess.CHECKIN
              : roundObj.teamAProcess,
            teamBProcess: shouldUpdateTeamB
              ? EActionProcess.CHECKIN
              : roundObj.teamBProcess,
          }
        : roundObj;

      // Only update if changes were made
      if (newRoundObj !== roundObj) {
        dispatch(setCurrentRound(newRoundObj));

        // Update only the changed round in the list
        const newRoundList = [...roundList];
        newRoundList[targetRoundIndex] = newRoundObj;
        dispatch(setRoundList(newRoundList));
      } else {
        // Still need to set current round even if no process changes
        dispatch(setCurrentRound(newRoundObj));
      }

      LocalStorageService.setMatch(newRoundObj.match, newRoundObj._id);
    },
    [dispatch, myTeamE, netsByRound, roundList]
  );

  const handleRoundChange = useCallback(
    (roundId: string, onError?: (message: string) => void) => {
      const targetRoundIndex = roundIdToIndex[roundId];
      if (targetRoundIndex === undefined || !currentRound) return false;

      const targetRound = roundList[targetRoundIndex];

      if(match?.completed && targetRound.num > currentRound.num && !targetRound.completed){
        dispatch(setMessage({message: "This  match is finished. Unselect the finish match box to go to the next round.", type: EMessage.ERROR}));
        return false;
      }

      // Check if previous round is completed when moving forward
      if (targetRound.num > currentRound.num) {
        const prevRound = roundList[targetRoundIndex - 1];
        if (!prevRound?.completed) {
          dispatch(setMessage({message: "Complete the previous round by putting players on all nets and points.", type: EMessage.ERROR}))
          return false;
        }
      }

      changeTheRound(targetRoundIndex);
      dispatch(setDisabledPlayerIds([]));
      dispatch(setPrevPartner(null));
      
      return true;
    },
    [changeTheRound, currentRound, dispatch, roundIdToIndex, roundList, match]
  );

  return {
    roundIdToIndex,
    handleRoundChange,
    changeTheRound,
  };
};