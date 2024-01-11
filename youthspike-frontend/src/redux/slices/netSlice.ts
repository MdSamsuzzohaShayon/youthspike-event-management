/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { INetBase, INetUpdate } from '@/types';
import { INetRelatives } from '@/types/net';
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
    // Unused
    setNetsByRoundId: (state, action: PayloadAction<string>) => {
      const newCurrNets: INetRelatives[] = state.nets.filter((net) => net.round === action.payload);
      state.currentRoundNets = newCurrNets;
    },
    setCurrNetNum: (state, action: PayloadAction<number>) => {
      state.currNetNum = action.payload;
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
      const findPrev = state.updateNets.find((net)=> net._id === action.payload._id);
      if(findPrev){
        state.updateNets = [action.payload, ...state.updateNets.filter((net)=> net._id !== action.payload._id)];
      }else{
        state.updateNets = [action.payload, ...state.updateNets];
      }

      const findRNIndex = state.currentRoundNets.findIndex((crn)=> crn._id === action.payload._id);
      if(findRNIndex !== -1){
        const updatedNetObj = {...state.currentRoundNets[findRNIndex], ...action.payload};
        state.currentRoundNets[findRNIndex] = updatedNetObj;
      }

      const findNIndex = state.nets.findIndex((n)=> n._id === action.payload._id);
      if(findNIndex !== -1){
        const updatedNetObj = {...state.nets[findRNIndex], ...action.payload};
        state.nets[findRNIndex] = updatedNetObj;
      }
    }
  },
});

export const { setNets, setCurrentRoundNets, setNetsByRoundId, setCurrNetNum, updateNetPlayer, setUpdateNets } = netSlice.actions;
export default netSlice.reducer;
