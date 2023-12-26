/* eslint-disable no-param-reassign */
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { ITeam } from '@/types/team';

export interface TeamsState {
  teamA?: ITeam | null;
  teamB?: ITeam | null;
}

const initialState: TeamsState = {
  teamA: null,
  teamB: null,
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
