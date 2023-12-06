/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { ILeague } from '@/types/league';
import { Nullable } from '@/types/document';

export interface LeagueState {
  current: Nullable<ILeague>;
}

const initialState: LeagueState = {
  current: {
    _id: null,
    name: null,
    startDate: null,
    endDate: null,
    active: false,
    playerLimit: null,
  },
};

export const leagueSlice = createSlice({
  name: 'league',
  initialState,
  reducers: {
    setCurrentLeagueInfo: (state, action: PayloadAction<ILeague>) => {
      state.current = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setCurrentLeagueInfo } = leagueSlice.actions;

export default leagueSlice.reducer;
