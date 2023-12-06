/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IRound } from '@/types/round';

interface RoundState {
  roundList: IRound[];
}

const initialState: RoundState = {
  roundList: [],
};
const roundSlice = createSlice({
  name: 'round',
  initialState,
  reducers: {
    setRoundList: (state, action: PayloadAction<IRound[]>) => {
      state.roundList = action.payload;
    },
  },
});

export const { setRoundList } = roundSlice.actions;
export default roundSlice.reducer;
