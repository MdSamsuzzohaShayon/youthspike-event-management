/* eslint-disable no-param-reassign */
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { ITeam } from '@/types/team';

export interface TeamsState {
  teamA?: ITeam | null;
  teamB?: ITeam | null;
  teamList: ITeam[];
}

const initialState: TeamsState = {
  // For match
  teamA: null,
  teamB: null,

  // For event
  teamList: [],
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
    setTeamList: (state, action:  PayloadAction<ITeam[]>)=>{
      state.teamList = action.payload;
    },
  },
});

export const { setTeamA, setTeamB, setTeamList } = teamSlice.actions;

export default teamSlice.reducer;
