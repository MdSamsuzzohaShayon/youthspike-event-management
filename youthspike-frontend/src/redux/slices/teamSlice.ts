/* eslint-disable no-param-reassign */
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { ITeam } from '@/types/team';
import { Nullable } from '@/types/document';

export interface TeamsState {
  teamA: Nullable<ITeam>;
  teamB: Nullable<ITeam>;
}

const initialState: TeamsState = {
  teamA: {
    _id: null,
    name: null,
    active: false,
    coachId: null,
    leagueId: null,
  },
  teamB: {
    _id: null,
    name: null,
    active: false,
    coachId: null,
    leagueId: null,
  },
};

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    setTeamA: (state, action: PayloadAction<ITeam>) => {
      state.teamA = action.payload;
    },
    setTeamB: (state, action: PayloadAction<ITeam>) => {
      state.teamB = action.payload;
    },
  },
});

export const { setTeamA, setTeamB } = teamSlice.actions;

export default teamSlice.reducer;
