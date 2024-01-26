/* eslint-disable no-param-reassign */
import { IMatchRelatives, ITeam, IPlayer } from '@/types';
import { EActionProcess } from '@/types/elements';
import { ETeamPlayer, INetRelatives } from '@/types/net';
import { ETeam } from '@/types/team';
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface INetProps {
  net?: INetRelatives | null | undefined;
}

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

  // For drop down selections
  showTeamPlayers: boolean;
  netTeamPlayer: ETeamPlayer | null;
  availablePlayerIds: string[],
  disabledPlayerIds: string[],
  selectedPlayerSpot: ETeamPlayer | null,
  selectedNet: INetRelatives | null,
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

  // Submitline up
  showTeamPlayers: false,
  netTeamPlayer: null,
  availablePlayerIds: [],
  disabledPlayerIds: [],
  selectedPlayerSpot: null,
  selectedNet: null,
};

export const matchesSlice = createSlice({
  name: 'matches',
  initialState,
  reducers: {
    setMatchInfo: (state, action: PayloadAction<IMatchRelatives>) => {
      state.match = action.payload;
    },
    setMyTeam: (state, action: PayloadAction<ITeam | null>) => {
      if (action.payload) state.myTeam = action.payload;
    },
    setOpTeam: (state, action: PayloadAction<ITeam | null>) => {
      if (action.payload) state.opTeam = action.payload;
    },
    setMyPlayers: (state, action: PayloadAction<IPlayer[]>) => {
      state.myPlayers = action.payload;
    },
    setOpPlayers: (state, action: PayloadAction<IPlayer[]>) => {
      state.opPlayers = action.payload;
    },
    setTeamE: (state, action: PayloadAction<{ myTeamE: ETeam, opTeamE: ETeam }>) => {
      state.myTeamE = action.payload.myTeamE;
      state.opTeamE = action.payload.opTeamE;
    },
    setTeamProcess: (state, action: PayloadAction<{ myTeamProcess: EActionProcess, opTeamProcess: EActionProcess }>) => {
      state.myTeamProcess = action.payload.myTeamProcess;
      state.opTeamProcess = action.payload.opTeamProcess;
    },


    // Match Submit Lineup
    setShowTeamPlayers: (state, action: PayloadAction<boolean>) => {
      state.showTeamPlayers = action.payload;
      // if (action.payload === false) {
      //   state.selectedTeamPlayer = null;
      //   state.selectedNet = null;
      // }
    },

    setNetTeamPlayers: (state, action: PayloadAction<ETeamPlayer>) => {
      state.netTeamPlayer = action.payload;
    },

    setAvailablePlayers: (state, action: PayloadAction<string[]>) => {
      state.availablePlayerIds = action.payload;
    },
    setDisabledPlayerIds: (state, action: PayloadAction<string[]>) => {
      state.disabledPlayerIds = action.payload;
    },

    setPlayerSpot: (state, action: PayloadAction<ETeamPlayer>) => {
      state.selectedPlayerSpot = action.payload;
    },
    setSelectedNet: (state, action: PayloadAction<INetRelatives | null>) => {
      state.selectedNet = action.payload;
    },

  },
});

// Action creators are generated for each case reducer function
export const {
  setMatchInfo, setMyTeam, setOpTeam, setMyPlayers, setOpPlayers, setTeamE, setTeamProcess,
  setShowTeamPlayers, setNetTeamPlayers, setAvailablePlayers, setDisabledPlayerIds, setPlayerSpot, setSelectedNet
} = matchesSlice.actions;

export default matchesSlice.reducer;
