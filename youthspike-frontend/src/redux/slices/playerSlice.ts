/* eslint-disable no-param-reassign */
import { IPlayer } from '@/types';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface PlayersState {
  teamAPlayers: IPlayer[];
  teamBPlayers: IPlayer[];
}

const initialState: PlayersState = {
  teamAPlayers: [],
  teamBPlayers: [],
};
export const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setTeamAPlayers: (state, action: PayloadAction<IPlayer[]>) => {
      state.teamAPlayers = action.payload;
    },
    setTeamBPlayers: (state, action: PayloadAction<IPlayer[]>) => {
      state.teamBPlayers = action.payload;
    },
  },
});

export const { setTeamAPlayers, setTeamBPlayers } = playerSlice.actions;

export default playerSlice.reducer;
