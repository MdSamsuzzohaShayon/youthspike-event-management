/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IServerReceiverOnNetMixed, IServerReceiverSinglePlay } from '@/types';



interface IServerReceiverOnNetState {
  // Score keeper for specific match
  serverReceiversOnNet: IServerReceiverOnNetMixed[];
  currentServerReceiver: IServerReceiverOnNetMixed | null;
  serverReceiverPlays: IServerReceiverSinglePlay[];
}



const initialState: IServerReceiverOnNetState = {
  // Score Keeper for specific match
  serverReceiversOnNet: [],
  currentServerReceiver: null,
  serverReceiverPlays: [],
};
const serverReceiverOnNetSlice = createSlice({
  name: 'serverReceiverOnNet',
  initialState,
  reducers: {
 
    // Score keeper
    setServerReceiversOnNet: (state, action: PayloadAction<IServerReceiverOnNetMixed[]>) => {
      state.serverReceiversOnNet = action.payload;
    },
    setCurrentServerReceiver: (state, action: PayloadAction<IServerReceiverOnNetMixed | null>) => {
      state.currentServerReceiver = action.payload;
    },

    setServerReceiverPlays: (state, action: PayloadAction<IServerReceiverSinglePlay[]>) => {
      state.serverReceiverPlays = action.payload;
    },
    
  },
});

export const { setServerReceiversOnNet, setCurrentServerReceiver, setServerReceiverPlays} = serverReceiverOnNetSlice.actions;
export default serverReceiverOnNetSlice.reducer;
