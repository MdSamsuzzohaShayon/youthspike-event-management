/* eslint-disable no-param-reassign */
import { IError } from '@/types';
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface ElementState {
  screenWidth: number;
  playerAssignStrategy: string[];
  isLoading: boolean;
  actErr: IError | null;
}

const initialStrategyList = ["high", "random"]

const initialState: ElementState = {
  screenWidth: 0,
  playerAssignStrategy: initialStrategyList,
  isLoading: false,
  actErr: null,

};

export const elementSlice = createSlice({
  name: 'element',
  initialState,
  reducers: {
    setScreenSize: (state, action: PayloadAction<number>) => {
      state.screenWidth = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setActErr: (state, action: PayloadAction<IError | null>) => {
      state.actErr = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setScreenSize, setIsLoading, setActErr } = elementSlice.actions;

export default elementSlice.reducer;
