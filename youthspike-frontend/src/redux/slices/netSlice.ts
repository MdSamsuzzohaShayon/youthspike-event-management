/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { INetBase, INetUpdate, INetPlayers } from '@/types';
import { INetRelatives, INetScoreUpdate } from '@/types/net';
import { ETeam } from '@/types/team';



interface INetState {
  nets: INetRelatives[];
  currentRoundNets: INetRelatives[];
  currNetNum: number;
  updateNets: INetUpdate[];
}

interface INetScore {
  netId: string; teamScore: number; teamAorB: string;
}

const initialState: INetState = {
  nets: [],
  currentRoundNets: [],
  currNetNum: 0,
  updateNets: []
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
    setCurrNetNum: (state, action: PayloadAction<number>) => {
      state.currNetNum = action.payload;
    },
    updateMultiNetsPlayers: (state, action: PayloadAction<INetPlayers[]>) => {
      const clonedNets = [...state.currentRoundNets];
      const newNets = [];
      for (const net of clonedNets) {
        const findNet = action.payload.find((n) => n._id === net._id);
        if (findNet) {
          newNets.push({
            ...net,
            teamAPlayerA: findNet.teamAPlayerA,
            teamAPlayerB: findNet.teamAPlayerB,
            teamBPlayerA: findNet.teamBPlayerA,
            teamBPlayerB: findNet.teamBPlayerB,
          })
        }
      }
      state.currentRoundNets = newNets;
    },
    updateNetPlayer: (state, action: PayloadAction<INetUpdate>) => {
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


    setUpdateNets: (state, action: PayloadAction<INetUpdate>) => {
      // Update Net
      const findPrev = state.updateNets.find((net) => net._id === action.payload._id);
      if (findPrev) {
        const updateAObj = { ...findPrev, ...action.payload };
        state.updateNets = [updateAObj, ...state.updateNets.filter((net) => net._id !== action.payload._id)];
      } else {
        state.updateNets = [...state.updateNets, action.payload];
      }

      // Current round net
      const findRNIndex = state.currentRoundNets.findIndex((crn) => crn._id === action.payload._id);
      if (findRNIndex !== -1) {
        const updatedNetObj = { ...state.currentRoundNets[findRNIndex], ...action.payload };
        state.currentRoundNets[findRNIndex] = updatedNetObj;
      }

      // All Nets
      const findNIndex = state.nets.findIndex((n) => n._id === action.payload._id);
      if (findNIndex !== -1) {
        const updatedNetObj = { ...state.nets[findNIndex], ...action.payload };
        state.nets[findNIndex] = updatedNetObj;
      }
    }
  },
});

export const { setNets, setCurrentRoundNets, setCurrNetNum, updateNetPlayer, setUpdateNets, updateMultiNetsPlayers } = netSlice.actions;
export default netSlice.reducer;
