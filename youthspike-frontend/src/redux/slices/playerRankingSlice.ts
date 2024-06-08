/* eslint-disable no-param-reassign */
import { IPlayerRankingExpRel } from '@/types';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface IPlayerRankingState {
  teamAPlayerRanking: IPlayerRankingExpRel | null;
  teamBPlayerRanking: IPlayerRankingExpRel | null;
}

const initialState: IPlayerRankingState = {
  teamAPlayerRanking: null,
  teamBPlayerRanking: null,
};
export const playerRankingSlice = createSlice({
  name: 'playerRanking',
  initialState,
  reducers: {
    setTeamAPlayerRanking: (state, action: PayloadAction<IPlayerRankingExpRel>) => {
      state.teamAPlayerRanking = action.payload;
    },
    setTeamBPlayerRanking: (state, action: PayloadAction<IPlayerRankingExpRel>) => {
      state.teamBPlayerRanking = action.payload;
    },
  },
});

export const { setTeamAPlayerRanking, setTeamBPlayerRanking } = playerRankingSlice.actions;

export default playerRankingSlice.reducer;
