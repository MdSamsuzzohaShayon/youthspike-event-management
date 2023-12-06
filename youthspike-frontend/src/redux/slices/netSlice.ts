/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { INet, INetTeam } from '@/types/net';

interface INetState {
  nets: INet[];
  currentRoundNets: INet[];
  currNetNum: number;
  netPlayers: INetTeam[];
}

const initialState: INetState = {
  nets: [],
  currentRoundNets: [],
  currNetNum: 0,
  netPlayers: [],
};
const netSlice = createSlice({
  name: 'net',
  initialState,
  reducers: {
    setNets: (state, action: PayloadAction<INet[]>) => {
      state.nets = action.payload;
    },
    // Unused
    setCurrentRoundNets: (state, action: PayloadAction<INet[]>) => {
      state.currentRoundNets = action.payload;
    },
    setNetsByRoundId: (state, action: PayloadAction<string>) => {
      const newCurrNets: INet[] = state.nets.filter((net) => net.roundId === action.payload);
      state.currentRoundNets = newCurrNets;

      // Set net players precisely
      const newNetPlayers: INetTeam[] = [];
      for (let i = 0; i < newCurrNets.length; i += 1) {
        const netPlayer: INetTeam = {
          netId: newCurrNets[i]._id,
          roundId: newCurrNets[i]._id,
          teamA: {
            playerAId: newCurrNets[i].teamAPlayerAId,
            playerBId: newCurrNets[i].teamAPlayerBId,
          },
          teamB: {
            playerAId: newCurrNets[i].teamBPlayerAId,
            playerBId: newCurrNets[i].teamBPlayerBId,
          },
        };
        newNetPlayers.push(netPlayer);
      }
      state.netPlayers = newNetPlayers;
    },
    setCurrNetNum: (state, action: PayloadAction<number>) => {
      state.currNetNum = action.payload;
    },
    updateNetPlayer: (state, action: PayloadAction<INetTeam>) => {
      // net should be unique
      const prevNPI = state.netPlayers.findIndex((np) => np.netId === action.payload.netId);
      if (prevNPI >= 0) {
        state.netPlayers[prevNPI] = action.payload;
      } else {
        state.netPlayers = [...state.netPlayers, action.payload];
      }
    },

    // Unused
    setNetPlayers: (state, action: PayloadAction<INetTeam[]>) => {
      state.netPlayers = action.payload;
    },
  },
});

export const { setNets, setCurrentRoundNets, setNetsByRoundId, setCurrNetNum, updateNetPlayer, setNetPlayers } = netSlice.actions;
export default netSlice.reducer;
