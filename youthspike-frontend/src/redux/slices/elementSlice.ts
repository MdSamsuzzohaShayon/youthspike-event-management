/* eslint-disable no-param-reassign */
import { IColMenu, IError } from '@/types';
import { MenuTitle } from '@/types/elements';
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';


export interface ElementState {
  screenWidth: number;
  playerAssignStrategy: string[];
  isLoading: boolean;
  actErr: IError | null;
  colMenus: IColMenu[];
  selectedColItem: MenuTitle | null;
}

const initialStrategyList = ["high", "random"];

const initialColMenu = [
  {id: 1, title: MenuTitle.FWANGO},
  {id: 2, title: MenuTitle.EDIT_MATCH},
  {id: 3, title: MenuTitle.EDIT_ROSTER},
  {id: 4, title: MenuTitle.DASHBOARD},
  {id: 5, title: MenuTitle.FIND_MATCHES},
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
    setSelectedColItem: (state, action: PayloadAction<MenuTitle | null>) => {
      state.selectedColItem = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setScreenSize, setIsLoading, setActErr, setSelectedColItem } = elementSlice.actions;

export default elementSlice.reducer;
