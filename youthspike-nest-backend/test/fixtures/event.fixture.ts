import { Types } from 'mongoose';

export const objectId = (id?: string) => new Types.ObjectId(id);

export const validCreateEventInput = {
  name: 'Summer Cup 2025',
  startDate: '2025-06-01',
  endDate: '2025-06-10',
  active: true,
  divisions: 'A,B',
  nets: 4,
  rounds: 3,
  playerLimit: 64,
  netVariance: 2,
  homeTeam: 'Home',
  autoAssign: true,
  autoAssignLogic: 'round-robin',
  rosterLock: 'FIRST_ROSTER_SUBMIT',
  timeout: 30,
  coachPassword: 'coach-pass-123',
  description: 'Annual summer tournament',
  location: 'NYC',
  defaultSponsor: true,
  badges: [],
};

export const validUpdateEventInput = {
  ...validCreateEventInput,
  newteams: [],
  updatedivisions: [],
  badges: [],
};

export const sampleEventDoc = (overrides: Partial<any> = {}) => ({
  _id: '64f1a2b3c4d5e6f7a8b9c0d1',                    // ← string, NOT ObjectId
  name: 'Summer Cup 2025',
  startDate: '2025-06-01',
  endDate: '2025-06-10',
  active: true,
  divisions: 'A, B',
  nets: 4,
  rounds: 3,
  playerLimit: 64,
  netVariance: 2,
  homeTeam: 'Home',
  autoAssign: true,
  autoAssignLogic: 'round-robin',
  rosterLock: 'FIRST_ROSTER_SUBMIT',
  timeout: 30,
  coachPassword: 'coach-pass-123',
  description: 'desc',
  location: 'NYC',
  ldo: '64f1a2b3c4d5e6f7a8b9c0d2',                    // ← string
  players: [],
  teams: [],
  matches: [],
  groups: [],
  sponsors: [],
  badges: [],
  multiplayer: '64f1a2b3c4d5e6f7a8b9c0d3',             // ← string
  weight: '64f1a2b3c4d5e6f7a8b9c0d4',                 // ← string
  ...overrides,
});

export const directorUser = (overrides: Partial<any> = {}) => ({
  _id: '64f1a2b3c4d5e6f7a8b9c0d5',
  role: 'director',
  ...overrides,
});

export const adminUser = (overrides: Partial<any> = {}) => ({
  _id: '64f1a2b3c4d5e6f7a8b9c0d6',
  role: 'admin',
  ...overrides,
});

export const sampleLdo = (overrides: Partial<any> = {}) => ({
  _id: '64f1a2b3c4d5e6f7a8b9c0d2',
  director: '64f1a2b3c4d5e6f7a8b9c0d5',
  events: [],
  archivedEvents: [],
  ...overrides,
});