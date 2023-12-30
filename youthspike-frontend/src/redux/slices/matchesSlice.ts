/* eslint-disable no-param-reassign */
import { IMatchRelatives, ICaptainSide } from '@/types';
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface MatchesState {
  match: IMatchRelatives,
  myDetail: ICaptainSide,
  oponentDetail: ICaptainSide
}

const initialState: MatchesState = {
  match: {
    _id: '',
    teamA: '',
    teamB: '',
    event: '',
    date: new Date().toISOString(),
    location: '',
    numberOfNets: 0,
    numberOfRounds: 0,
    netRange: 0,
    divisions: '',
    netVariance: 0,
    homeTeam: '',
    autoAssign: false,
    autoAssignLogic: '',
    rosterLock: '',
    timeout: 0,
    coachPassword: '',
    rounds: [],
  },
  myDetail: {
    matchId: null,
    captainId: null,
    teamId: null,
  },
  oponentDetail: {
    matchId: null,
    captainId: null,
    teamId: null,
  },
};

export const matchesSlice = createSlice({
  name: 'matches',
  initialState,
  reducers: {
    setMatchInfo: (state, action: PayloadAction<IMatchRelatives>) => {
      state.match = action.payload;
    },
    setMyDetail: (state, action: PayloadAction<ICaptainSide>) => {
      state.myDetail = action.payload;
    },
    setOponentDetail: (state, action: PayloadAction<ICaptainSide>) => {
      state.oponentDetail = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setMatchInfo, setMyDetail, setOponentDetail } = matchesSlice.actions;

export default matchesSlice.reducer;
