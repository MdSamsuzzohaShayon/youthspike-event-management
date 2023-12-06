/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { IMatch } from '@/types/match';
import { Nullable } from '@/types/document';

export interface MatchesState {
  match: Nullable<IMatch>;
}

const initialState: MatchesState = {
  match: {
    _id: null,
    teamAId: null,
    teamBId: null,
    leagueId: null,
    date: null,
    location: null,
    numberOfNets: null,
    numberOfRounds: null,
    netRange: null,
    pairLimit: null,
    active: false,
    roundIdList: [],
  },
};

export const matchesSlice = createSlice({
  name: 'matches',
  initialState,
  reducers: {
    setMatchInfo: (state, action: PayloadAction<IMatch>) => {
      state.match = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setMatchInfo } = matchesSlice.actions;

export default matchesSlice.reducer;
