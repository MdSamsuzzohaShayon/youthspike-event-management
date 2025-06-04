/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { IEvent, IEventSponsor, IEventWMatch, ILDO } from '@/types';

export interface EventState {
  current?: IEventWMatch | null;
  sponsors: IEventSponsor[];
  ldo?: ILDO | null;
  eventList: IEventWMatch[];
}

const initialState: EventState = {
  current: null,
  sponsors: [],
  ldo: null,
  eventList: []
};

export const eventSlice = createSlice({
  name: 'event',
  initialState,
  reducers: {
    setCurrentEventInfo: (state, action: PayloadAction<IEventWMatch>) => {
      state.current = action.payload;
    },
    setEventSponsors: (state, action: PayloadAction<IEventSponsor[]>) => {
      state.sponsors = action.payload;
    },
    setLdo: (state, action: PayloadAction<ILDO>) => {
      state.ldo = action.payload;
    },

    setEventList: (state, action: PayloadAction<IEventWMatch[]>) => {
      state.eventList = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setCurrentEventInfo, setEventSponsors, setLdo, setEventList } = eventSlice.actions;

export default eventSlice.reducer;
