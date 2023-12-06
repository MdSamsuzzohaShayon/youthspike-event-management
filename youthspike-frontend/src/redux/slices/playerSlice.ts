/* eslint-disable no-param-reassign */
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { IPlayerUser } from '@/types/user';

interface PlayersState {
  teamAPlayers: IPlayerUser[];
  teamBPlayers: IPlayerUser[];
}

const initialState: PlayersState = {
  teamAPlayers: [],
  teamBPlayers: [],
};
export const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setTeamAPlayers: (state, action: PayloadAction<IPlayerUser[]>) => {
      state.teamAPlayers = action.payload;
    },
    setTeamBPlayers: (state, action: PayloadAction<IPlayerUser[]>) => {
      state.teamBPlayers = action.payload;
    },
  },
});

export const { setTeamAPlayers, setTeamBPlayers } = playerSlice.actions;

export default playerSlice.reducer;
