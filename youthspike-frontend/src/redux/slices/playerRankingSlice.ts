/* eslint-disable no-param-reassign */
import { IPlayerRankingExpRel } from '@/types';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

type MapType = [string, number][];

interface IPlayerRankingState {
  teamAPlayerRanking: IPlayerRankingExpRel | null;
  teamBPlayerRanking: IPlayerRankingExpRel | null;

  teamsPlayerRanking: IPlayerRankingExpRel[];
  rankingMap: MapType;  // Storing as an array of key-value pairs
}

const initialState: IPlayerRankingState = {
  teamAPlayerRanking: null,
  teamBPlayerRanking: null,

  // All teams rankings
  teamsPlayerRanking: [],

  rankingMap: [],
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

    setTeamsPlayerRanking: (state, action: PayloadAction<IPlayerRankingExpRel[]>) => {
      state.teamsPlayerRanking = action.payload;
    },
    setRankingMap: (state, action: PayloadAction<MapType>) => {
      state.rankingMap = action.payload;
    },
  },
});

export const { setTeamAPlayerRanking, setTeamBPlayerRanking, setTeamsPlayerRanking, setRankingMap } = playerRankingSlice.actions;

export default playerRankingSlice.reducer;
