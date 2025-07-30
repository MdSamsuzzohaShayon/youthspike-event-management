/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { INetUpdate, IServerReceiverOnNetMixed } from '@/types';
import { INetRelatives } from '@/types/net';



interface INetState {
  nets: INetRelatives[];
  currentRoundNets: INetRelatives[];
  currNetNum: number;
  updateNets: INetUpdate[];
  notTieBreakerNetId: string | null;
}



const initialState: INetState = {
  nets: [],
  currentRoundNets: [],
  currNetNum: 0,
  updateNets: [],
  notTieBreakerNetId: null,

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

    setNotTieBreakerNetId:(state, action: PayloadAction<string | null>)=>{
      state.notTieBreakerNetId = action.payload;
    },

  },
});

export const { setNets, setCurrentRoundNets, setCurrNetNum, updateNetPlayer, setNotTieBreakerNetId } = netSlice.actions;
export default netSlice.reducer;
