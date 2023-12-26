/* eslint-disable no-param-reassign */
import { IActionBox, IRoundRelatives } from '@/types';
import { EActionProcess } from '@/types/elements';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RoundState {
  roundList: IRoundRelatives[];
  current: IRoundRelatives | null;
  actionBoxOponent: IActionBox;
  actionBox: IActionBox;
};

const initialAction = {
  title: '',
  roundNum: 1,
  text: '',
  process: EActionProcess.CHECKIN,
};

const initialState: RoundState = {
  roundList: [],
  current: null,
  actionBoxOponent: initialAction,
  actionBox: initialAction,
};
const roundSlice = createSlice({
  name: 'round',
  initialState,
  reducers: {
    setCurrentRound: (state, action: PayloadAction<IRoundRelatives>) => {
      state.current = action.payload;
    },
    setRoundList: (state, action: PayloadAction<IRoundRelatives[]>) => {
      state.roundList = action.payload;
    },
    setActionBox: (state, action: PayloadAction<IActionBox>) => {
      state.actionBox = action.payload;
    },
    setActionBoxOponent: (state, action: PayloadAction<IActionBox>) =>{
      state.actionBoxOponent = action.payload;
    }
  },
});

export const { setRoundList, setCurrentRound, setActionBox } = roundSlice.actions;
export default roundSlice.reducer;
