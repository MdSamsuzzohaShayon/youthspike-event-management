// @Field({ nullable: false })
// match: string;

// @Field({ nullable: false })
// room: string;

// @Field({ nullable: true })
// teamA: null | string;

// @Field({ nullable: true })
// teamAClient: null | string;

// @Field({ nullable: true })
// teamAProcess: null | EActionProcess;

// @Field({ nullable: true })
// teamB: null | string;

// @Field({ nullable: true })
// teamBClient: null | string;

// @Field({ nullable: true })
// teamBProcess: null | EActionProcess;

/* eslint-disable no-param-reassign */
import { IRoom } from '@/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RoomState {
  current: IRoom | null;
};


const initialState: RoomState = {
  current: null,
};
const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setCurrentRoom: (state, action: PayloadAction<IRoom>) => {
      state.current = action.payload;
    },
  },
});

export const { setCurrentRoom } = roomSlice.actions;
export default roomSlice.reducer;
