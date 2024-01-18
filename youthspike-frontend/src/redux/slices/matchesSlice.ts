/* eslint-disable no-param-reassign */
import { IMatchRelatives, ITeam, IPlayer } from '@/types';
import { EActionProcess } from '@/types/elements';
import { ETeam } from '@/types/team';
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface MatchesState {
  match: IMatchRelatives,
  myTeam: null | ITeam;
  opTeam: null | ITeam;
  myPlayers: IPlayer[];
  opPlayers: IPlayer[];
  myTeamE: ETeam;
  opTeamE: ETeam;
  myTeamProcess: EActionProcess;
  opTeamProcess: EActionProcess;
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

  myTeam: null,
  opTeam: null,
  myPlayers: [],
  opPlayers: [],
  myTeamE: ETeam.teamB,
  opTeamE: ETeam.teamA,
  myTeamProcess: EActionProcess.INITIATE,
  opTeamProcess: EActionProcess.INITIATE,
};

export const matchesSlice = createSlice({
  name: 'matches',
  initialState,
  reducers: {
    setMatchInfo: (state, action: PayloadAction<IMatchRelatives>) => {
      state.match = action.payload;
    },
    setMyTeam:(state, action: PayloadAction<ITeam | null>)=>{
      if(action.payload) state.myTeam = action.payload;
    },
    setOpTeam:(state, action: PayloadAction<ITeam | null>)=>{
      if(action.payload) state.opTeam = action.payload;
    },
    setMyPlayers:(state, action: PayloadAction<IPlayer[]>)=>{
      state.myPlayers = action.payload;
    },
    setOpPlayers:(state, action: PayloadAction<IPlayer[]>)=>{
      state.opPlayers = action.payload;
    },
    setTeamE: (state, action: PayloadAction<{myTeamE: ETeam, opTeamE: ETeam}>)=>{
      state.myTeamE = action.payload.myTeamE;
      state.opTeamE = action.payload.opTeamE;
    },
    setTeamProcess: (state, action: PayloadAction<{myTeamProcess: EActionProcess, opTeamProcess: EActionProcess}>)=>{
      state.myTeamProcess = action.payload.myTeamProcess;
      state.opTeamProcess = action.payload.opTeamProcess;
    }
  },
});

// Action creators are generated for each case reducer function
export const { setMatchInfo, setMyTeam, setOpTeam, setMyPlayers, setOpPlayers, setTeamE, setTeamProcess } = matchesSlice.actions;

export default matchesSlice.reducer;
