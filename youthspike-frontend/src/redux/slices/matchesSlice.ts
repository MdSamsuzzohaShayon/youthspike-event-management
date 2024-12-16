/* eslint-disable no-param-reassign */
import { IMatchRelatives, ITeam, IPlayer } from '@/types';
import { ETeamPlayer, INetRelatives } from '@/types/net';
import { ETeam } from '@/types/team';
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface ITeamScore {
  teamATotalScore: number;
  teamBTotalScore: number;
  teamAPMScore: number; // plus minus score
  teamBPMScore: number; // plus minus score
}

interface MatchesState extends ITeamScore {
  match: IMatchRelatives;
  myTeam: null | ITeam;
  opTeam: null | ITeam;
  myPlayers: IPlayer[];
  opPlayers: IPlayer[];
  myTeamE: ETeam;
  opTeamE: ETeam;

  // For drop down selections
  showTeamPlayers: boolean;
  netTeamPlayer: ETeamPlayer | null;
  availablePlayerIds: string[];
  disabledPlayerIds: string[];
  selectedPlayerSpot: ETeamPlayer | null;
  selectedNet: INetRelatives | null;
  prevPartner: null | string;
  outOfRange: string[];
  verifyLineup: boolean; // Temporary
  closePSCAvailable: boolean; // PSC = Player Score Card
}

const initialState: MatchesState = {
  match: {
    _id: '',
    teamA: '',
    teamB: '',
    event: '',
    completed: false,
    date: new Date().toISOString(),
    description: '',
    location: '',
    numberOfNets: 0,
    numberOfRounds: 0,
    division: '',
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

  // Submitline up
  showTeamPlayers: false,
  netTeamPlayer: null,
  selectedPlayerSpot: null,
  selectedNet: null,
  verifyLineup: false,

  availablePlayerIds: [],
  disabledPlayerIds: [],
  prevPartner: null,
  outOfRange: [], // Net Variance
  closePSCAvailable: false,

  // Score
  teamATotalScore: 0,
  teamBTotalScore: 0,
  teamAPMScore: 0, // plus minus score
  teamBPMScore: 0, // plus minus score
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
    setTeamE: (state, action: PayloadAction<{ myTeamE: ETeam; opTeamE: ETeam }>) => {
      state.myTeamE = action.payload.myTeamE;
      state.opTeamE = action.payload.opTeamE;
    },

    // Match Submit Lineup
    setShowTeamPlayers: (state, action: PayloadAction<boolean>) => {
      state.showTeamPlayers = action.payload;
    },
    setVerifyLineup: (state, action: PayloadAction<boolean>) => {
      state.verifyLineup = action.payload;
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
    setPrevPartner: (state, action: PayloadAction<string | null>) => {
      state.prevPartner = action.payload;
    },

    setOutOfRange: (state, action: PayloadAction<string[]>) => {
      state.outOfRange = action.payload;
    },
    setclosePSCAvailable: (state, action: PayloadAction<boolean>) => {
      state.closePSCAvailable = action.payload;
    },

    // Team A & Team B Score
    setTeamATotalScore: (state, action: PayloadAction<number>) => {
      state.teamATotalScore = action.payload;
    },
    setTeamBTotalScore: (state, action: PayloadAction<number>) => {
      state.teamBTotalScore = action.payload;
    },
    setTeamAPMScore: (state, action: PayloadAction<number>) => {
      state.teamAPMScore = action.payload;
    },
    setTeamBPMScore: (state, action: PayloadAction<number>) => {
      state.teamBPMScore = action.payload;
    },

    setTeamScore: (state, action: PayloadAction<ITeamScore>) => {
      if (action.payload.teamATotalScore) state.teamATotalScore = action.payload.teamATotalScore;
      if (action.payload.teamBTotalScore) state.teamBTotalScore = action.payload.teamBTotalScore;
      if (action.payload.teamAPMScore) state.teamAPMScore = action.payload.teamAPMScore;
      if (action.payload.teamBPMScore) state.teamBPMScore = action.payload.teamBPMScore;
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  setMatchInfo,
  setMyTeam,
  setOpTeam,
  setMyPlayers,
  setOpPlayers,
  setTeamE,
  setShowTeamPlayers,
  setNetTeamPlayers,
  setAvailablePlayers,
  setDisabledPlayerIds,
  setPlayerSpot,
  setSelectedNet,
  setPrevPartner,
  setOutOfRange,
  setVerifyLineup,
  setclosePSCAvailable,

  setTeamATotalScore,
  setTeamBTotalScore,
  setTeamAPMScore,
  setTeamBPMScore,
  setTeamScore
} = matchesSlice.actions;

export default matchesSlice.reducer;
