/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { IEvent } from '@/types';
import { Nullable } from '@/types/document';

export interface EventState {
  current?: IEvent | null;
}

const initialState: EventState = {
  current: null,
};

export const eventSlice = createSlice({
  name: 'event',
  initialState,
  reducers: {
    setCurrentEventInfo: (state, action: PayloadAction<IEvent>) => {
      state.current = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setCurrentEventInfo } = eventSlice.actions;

export default eventSlice.reducer;
