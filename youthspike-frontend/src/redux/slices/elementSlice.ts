/* eslint-disable no-param-reassign */
import { IColMenu } from '@/types';
import { EAssignStrategies, EMenuTitle, IMessage } from '@/types/elements';
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface IElementState {
  playerAssignStrategy: EAssignStrategies[];
  isLoading: boolean;
  message: IMessage | null;
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

const initialState: IElementState = {
  playerAssignStrategy: initialStrategyList,
  isLoading: false,
  message: null,
  colMenus: initialColMenu,
  selectedColItem: null,
};

export const elementSlice = createSlice({
  name: 'element',
  initialState,
  reducers: {
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setMessage: (state, action: PayloadAction<IMessage | null>) => {
      state.message = action.payload;
    },

  },
});

// Action creators are generated for each case reducer function
export const { setIsLoading, setMessage } = elementSlice.actions;

export default elementSlice.reducer;
