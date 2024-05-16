/* eslint-disable no-param-reassign */
import { IColMenu, IError } from '@/types';
import { EAssignStrategies, EMenuTitle } from '@/types/elements';
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface ElementState {
  screenWidth: number;
  playerAssignStrategy: EAssignStrategies[];
  isLoading: boolean;
  actErr: IError | null;
  colMenus: IColMenu[];
  selectedColItem: EMenuTitle | null;
}

const initialStrategyList = [EAssignStrategies.ANCHOR, EAssignStrategies.RANDOM, EAssignStrategies.HIERARCHY];

const initialColMenu = [
  { id: 2, title: EMenuTitle.EDIT_MATCH },
  { id: 3, title: EMenuTitle.EDIT_ROSTER },
  { id: 4, title: EMenuTitle.DASHBOARD },
  { id: 5, title: EMenuTitle.FIND_MATCHES },
];

const initialState: ElementState = {
  screenWidth: 0,
  playerAssignStrategy: initialStrategyList,
  isLoading: false,
  actErr: null,
  colMenus: initialColMenu,
  selectedColItem: null,
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
    setSelectedColItem: (state, action: PayloadAction<EMenuTitle | null>) => {
      state.selectedColItem = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setScreenSize, setIsLoading, setActErr, setSelectedColItem } = elementSlice.actions;

export default elementSlice.reducer;
