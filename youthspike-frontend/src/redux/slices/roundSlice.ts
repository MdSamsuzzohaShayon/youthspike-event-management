/* eslint-disable no-param-reassign */
import { IRoundRelatives } from '@/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RoundState {
  roundList: IRoundRelatives[];
  current: IRoundRelatives | null;
};

const initialState: RoundState = {
  roundList: [],
  current: null,
};
const roundSlice = createSlice({
  name: 'round',
  initialState,
  reducers: {
    setCurrentRound: (state, action: PayloadAction<IRoundRelatives>) => {
      state.current = action.payload;
    },
    setRoundList: (state, action: PayloadAction<IRoundRelatives[]>) => {
      state.roundList = action.payload.sort((a, b) => a.num - b.num);;
    },
  },
});

export const { setRoundList, setCurrentRound } = roundSlice.actions;
export default roundSlice.reducer;
