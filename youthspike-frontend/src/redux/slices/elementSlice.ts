/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface ElementState {
  screenWidth: number;
  playerAssignStrategy: string[];
  isLoading: boolean;
}

const initialStrategyList = ["high", "random"]

const initialState: ElementState = {
  screenWidth: 0,
  playerAssignStrategy: initialStrategyList,
  isLoading: false,
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
    }
  },
});

// Action creators are generated for each case reducer function
export const { setScreenSize, setIsLoading } = elementSlice.actions;

export default elementSlice.reducer;
