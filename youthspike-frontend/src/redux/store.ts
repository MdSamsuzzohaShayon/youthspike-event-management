/* eslint-disable import/no-named-as-default */
import { configureStore } from '@reduxjs/toolkit';
import matchesSlice from './slices/matchesSlice';
import teamSlice from './slices/teamSlice';
import playerSlice from './slices/playerSlice';
import eventSlice from './slices/eventSlice';
import roundSlice from './slices/roundSlice';
import netSlice from './slices/netSlice';
import elementSlice from './slices/elementSlice';
import roomSlice from './slices/roomSlice';

export const store = configureStore({
  reducer: {
    matches: matchesSlice,
    teams: teamSlice,
    players: playerSlice,
    events: eventSlice,
    rounds: roundSlice,
    nets: netSlice,
    rooms: roomSlice,
    elements: elementSlice
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
