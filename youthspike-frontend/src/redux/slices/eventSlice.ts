/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { IEvent, IEventSponsor } from '@/types';

export interface EventState {
  current?: IEvent | null;
  sponsors: IEventSponsor[]
}

const initialState: EventState = {
  current: null,
  sponsors: []
};

export const eventSlice = createSlice({
  name: 'event',
  initialState,
  reducers: {
    setCurrentEventInfo: (state, action: PayloadAction<IEvent>) => {
      state.current = action.payload;
    },
    setEventSponsors: (state, action: PayloadAction<IEventSponsor[]>) => {
      state.sponsors = action.payload;
    }
  },
});

// Action creators are generated for each case reducer function
export const { setCurrentEventInfo, setEventSponsors } = eventSlice.actions;

export default eventSlice.reducer;
