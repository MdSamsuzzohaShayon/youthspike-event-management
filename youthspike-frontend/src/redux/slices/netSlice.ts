/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { INetBase, IPlayer } from '@/types';
import { INetPlayers, INetRelatives } from '@/types/net';

interface INetState {
  nets: INetRelatives[];
  currentRoundNets: INetRelatives[];
  currNetNum: number;
}

const initialState: INetState = {
  nets: [],
  currentRoundNets: [],
  currNetNum: 0,
};
const netSlice = createSlice({
  name: 'net',
  initialState,
  reducers: {
    setNets: (state, action: PayloadAction<INetRelatives[]>) => {
      state.nets = action.payload;
    },
    // Unused
    setCurrentRoundNets: (state, action: PayloadAction<INetRelatives[]>) => {
      state.currentRoundNets = action.payload;
    },
    setNetsByRoundId: (state, action: PayloadAction<string>) => {
      const newCurrNets: INetRelatives[] = state.nets.filter((net) => net.round === action.payload);
      state.currentRoundNets = newCurrNets;

      // Set net players precisely
      // const newNetPlayers: INetRelatives[] = [];
      // for (let i = 0; i < newCurrNets.length; i += 1) {
      //   const netPlayer: INetRelatives = {
      //     netId: newCurrNets[i]._id,
      //     roundId: newCurrNets[i]._id,
      //     teamA: {
      //       playerAId: newCurrNets[i].teamAPlayerAId,
      //       playerBId: newCurrNets[i].teamAPlayerBId,
      //     },
      //     teamB: {
      //       playerAId: newCurrNets[i].teamBPlayerAId,
      //       playerBId: newCurrNets[i].teamBPlayerBId,
      //     },
      //   };
      //   newNetPlayers.push(netPlayer);
      // }
      // state.netPlayers = newNetPlayers;
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
        };

        if (action.payload.teamAPlayerA) netObj.teamAPlayerA = action.payload.teamAPlayerA;
        if (action.payload.teamAPlayerB) netObj.teamAPlayerB = action.payload.teamAPlayerB;
        if (action.payload.teamBPlayerA) netObj.teamBPlayerA = action.payload.teamBPlayerA;
        if (action.payload.teamBPlayerB) netObj.teamBPlayerB = action.payload.teamBPlayerB;

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
  },
});

export const { setNets, setCurrentRoundNets, setNetsByRoundId, setCurrNetNum, updateNetPlayer, setNetPlayers } = netSlice.actions;
export default netSlice.reducer;
