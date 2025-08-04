import { setCurrentRound, setRoundList } from '@/redux/slices/roundSlice';
import { IRoundRelatives } from '@/types';
import { MutationFunction } from '@apollo/client';
import React from 'react';

interface IRemovePlayerProps {
  playerId: string;
  currRound: IRoundRelatives | null;
  dispatch: React.Dispatch<React.SetStateAction<any>>;
  mutateRound: MutationFunction;
  roundList: IRoundRelatives[];
}

const updateSubbedPlayer = async ({ playerId, currRound, mutateRound, dispatch, roundList }: IRemovePlayerProps) => {
  if (!currRound) return;
  // Check status of current round, if current round is completed do not allow them to remove player from sub
  try {
    const roundObj = { ...currRound };
    const subPlayerIds: string[] = [...roundObj.subs.filter((s) => s !== playerId)];
    roundObj.subs = subPlayerIds;
    const newRoundList = [];
    await mutateRound({ variables: { updateInput: { subs: subPlayerIds, roundId: currRound._id, matchId: currRound.match } } });
    for (let rIdx = 0; rIdx < roundList.length; rIdx += 1) {
      const roundObjUpdate = { ...roundList[rIdx] };
      if (roundObjUpdate.match === roundObj.match && roundObjUpdate.num >= roundObj.num) {
        roundObjUpdate.subs = subPlayerIds;
      }
      newRoundList.push(roundObjUpdate);
    }
    dispatch(setRoundList(newRoundList));
    dispatch(setCurrentRound(roundObj));
  } catch (error) {
    console.log(error);
  }
};

export default updateSubbedPlayer;
