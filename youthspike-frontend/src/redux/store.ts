/* eslint-disable import/no-named-as-default */
import { configureStore } from '@reduxjs/toolkit';
import matchesSlice from './slices/matchesSlice';
import teamSlice from './slices/teamSlice';
import playerSlice from './slices/playerSlice';
import leagueSlice from './slices/leagueSlice';
import roundSlice from './slices/roundSlice';
import netSlice from './slices/netSlice';
import elementSlice from './slices/elementSlice';

export const store = configureStore({
  reducer: {
    matches: matchesSlice,
    teams: teamSlice,
    players: playerSlice,
    leagues: leagueSlice,
    rounds: roundSlice,
    nets: netSlice,
    elements: elementSlice
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
