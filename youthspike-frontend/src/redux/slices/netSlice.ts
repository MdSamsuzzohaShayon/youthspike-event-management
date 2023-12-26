/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { INetBase, IPlayer } from '@/types';
import { INetPlayers, INetRelatives } from '@/types/net';

interface INetState {
  nets: INetRelatives[];
  currentRoundNets: INetRelatives[];
  currNetNum: number;
  updateTeam: INetPlayers;
}

const initialState: INetState = {
  nets: [],
  currentRoundNets: [],
  currNetNum: 0,
  updateTeam: {
    _id: '',
    teamAPlayerA: null,
    teamAPlayerB: null,

    teamBPlayerA: null,
    teamBPlayerB: null,
  }
};
const netSlice = createSlice({
  name: 'net',
  initialState,
  reducers: {
    setNets: (state, action: PayloadAction<INetRelatives[]>) => {
      state.nets = action.payload;
    },
    setCurrentRoundNets: (state, action: PayloadAction<INetRelatives[]>) => {
      state.currentRoundNets = action.payload;
    },
    // Unused
    setNetsByRoundId: (state, action: PayloadAction<string>) => {
      const newCurrNets: INetRelatives[] = state.nets.filter((net) => net.round === action.payload);
      state.currentRoundNets = newCurrNets;
    },
    setCurrNetNum: (state, action: PayloadAction<number>) => {
      state.currNetNum = action.payload;
    },
    updateNetPlayer: (state, action: PayloadAction<INetPlayers>) => {
      const prevNPI = state.currentRoundNets.findIndex((np) => np._id === action.payload._id);
      const prevANPI = state.nets.findIndex((np) => np._id === action.payload._id);
      // net should be unique
      if (prevNPI >= 0) {
        const netObj: INetRelatives = {
          ...state.currentRoundNets[prevNPI],
          teamAPlayerA: action.payload.teamAPlayerA,
          teamAPlayerB: action.payload.teamAPlayerB,
          teamBPlayerA: action.payload.teamBPlayerA,
          teamBPlayerB: action.payload.teamBPlayerB,
        };


        state.currentRoundNets[prevNPI] = netObj;

        if (prevANPI >= 0) {
          state.nets[prevANPI] = netObj;
        }
      }
    },

    // Unused
    setNetPlayers: (state, action: PayloadAction<INetRelatives[]>) => {
      // state.netPlayers = action.payload;
    },

    setUpdateNetTeam: (state, action: PayloadAction<INetPlayers>) => {
      state.updateTeam = action.payload;
    }
  },
});

export const { setNets, setCurrentRoundNets, setNetsByRoundId, setCurrNetNum, updateNetPlayer, setNetPlayers, setUpdateNetTeam } = netSlice.actions;
export default netSlice.reducer;
