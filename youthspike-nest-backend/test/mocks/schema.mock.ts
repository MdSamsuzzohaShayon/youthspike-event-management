/**
 * Schema mocks for breaking circular dependencies.
 *
 * Problem:
 *   event.schema.ts line 104 does: ref: LDO.name
 *   But LDO is undefined due to circular imports.
 *   Chain: event.fields.spec → event.fields → ldo.service → ldo.schema
 *   → user.schema → player.schema → badge.schema → team.schema
 *   → emailsender.schema → event.schema → LDO.name (CRASH)
 *
 * Solution:
 *   jest.mock('../event.schema', () => mockEventSchema)
 *   This prevents event.schema.ts from being evaluated at all.
 *
 * Naming rule:
 *   Exports MUST start with "mock" — Jest allows only mock-prefixed
 *   variables inside jest.mock() factory functions.
 *
 * .name guarantee:
 *   Every class (class Event {}) has .name === 'Event' automatically.
 *   This is a non-null, non-undefined string. Safe for ref: ClassName.name.
 */

// ════════════════════════════════════════════════════════════════
// EVENT SCHEMA
// ════════════════════════════════════════════════════════════════
export const mockEventSchema = {
  Event: class Event {},
  EventSchema: {},
  EventSchemaFactory: async () => ({}),
  EEventItem: {
    PLAYER: 'PLAYER',
    MATCH: 'MATCH',
    TEAM: 'STANDINGS',
  },
  ETieBreakingStrategy: {
    TWO_POINTS_NET: 'TWO_POINTS_NET',
    OVERTIME_ROUND: 'OVERTIME_ROUND',
    MATCH_TIE: 'MATCH_TIE',
  },
  ERosterLock: {
    FIRST_ROSTER_SUBMIT: 'FIRST_ROSTER_SUBMIT',
    PICK_A_DATE: 'PICK_A_DATE',
  },
};

// ════════════════════════════════════════════════════════════════
// PLAYER SCHEMA
// ════════════════════════════════════════════════════════════════
export const mockPlayerSchema = {
  Player: class Player {},
  PlayerSchema: {},
};

// ════════════════════════════════════════════════════════════════
// TEAM SCHEMA
// ════════════════════════════════════════════════════════════════
export const mockTeamSchema = {
  Team: class Team {},
  TeamSchema: {},
};

// ════════════════════════════════════════════════════════════════
// BADGE SCHEMA
// ════════════════════════════════════════════════════════════════
export const mockBadgeSchema = {
  Badge: class Badge {},
  BadgeSchema: {},
  EBadgeFor: {
    PLAYER: 'PLAYER',
    TEAM: 'TEAM',
  },
};

// ════════════════════════════════════════════════════════════════
// LDO SCHEMA
// ════════════════════════════════════════════════════════════════
export const mockLdoSchema = {
  LDO: class LDO {},
  LDOSchema: {},
};

// ════════════════════════════════════════════════════════════════
// MATCH SCHEMA
// ════════════════════════════════════════════════════════════════
export const mockMatchSchema = {
  Match: class Match {},
  MatchSchema: {},
};

// ════════════════════════════════════════════════════════════════
// GROUP SCHEMA
// ════════════════════════════════════════════════════════════════
export const mockGroupSchema = {
  Group: class Group {},
  GroupSchema: {},
};

// ════════════════════════════════════════════════════════════════
// SPONSOR SCHEMA
// ════════════════════════════════════════════════════════════════
export const mockSponsorSchema = {
  Sponsor: class Sponsor {},
  SponsorSchema: {},
};

// ════════════════════════════════════════════════════════════════
// TEMPLATE SCHEMA
// ════════════════════════════════════════════════════════════════
export const mockTemplateSchema = {
  Template: class Template {},
  TemplateSchema: {},
};

// ════════════════════════════════════════════════════════════════
// EMAILSENDER SCHEMA
// ════════════════════════════════════════════════════════════════
export const mockEmailsenderSchema = {
  Emailsender: class Emailsender {},
  EmailsenderSchema: {},
};

// ════════════════════════════════════════════════════════════════
// NET SCHEMA
// ════════════════════════════════════════════════════════════════
export const mockNetSchema = {
  Net: class Net {},
  NetSchema: {},
};

// ════════════════════════════════════════════════════════════════
// ROUND SCHEMA
// ════════════════════════════════════════════════════════════════
export const mockRoundSchema = {
  Round: class Round {},
  RoundSchema: {},
};

// ════════════════════════════════════════════════════════════════
// ROOM SCHEMA
// ════════════════════════════════════════════════════════════════
export const mockRoomSchema = {
  Room: class Room {},
  RoomSchema: {},
};

// ════════════════════════════════════════════════════════════════
// USER SCHEMA
// ════════════════════════════════════════════════════════════════
export const mockUserSchema = {
  User: class User {},
  UserSchema: {},
  UserRole: {
    admin: 'admin',
    director: 'director',
    captain: 'captain',
    co_captain: 'co_captain',
    player: 'player',
  },
};

// ════════════════════════════════════════════════════════════════
// PLAYER STATS SCHEMA
// ════════════════════════════════════════════════════════════════
export const mockPlayerStatsSchema = {
  ProStats: class ProStats {},
  PlayerStatsSchema: {},
};

// ════════════════════════════════════════════════════════════════
// ARCHIVE SCHEMA (all archive types)
// ════════════════════════════════════════════════════════════════
export const mockArchiveSchema = {
  ArchiveEvent: class ArchiveEvent {},
  ArchiveTeam: class ArchiveTeam {},
  ArchiveMatch: class ArchiveMatch {},
  ArchiveGroup: class ArchiveGroup {},
  ArchiveSponsor: class ArchiveSponsor {},
  ArchiveTemplate: class ArchiveTemplate {},
  ArchivePlayerStats: class ArchivePlayerStats {},
  ArchiveNet: class ArchiveNet {},
  ArchivePlayerRanking: class ArchivePlayerRanking {},
  ArchivePlayerRankingItem: class ArchivePlayerRankingItem {},
  ArchiveRoom: class ArchiveRoom {},
  ArchiveRound: class ArchiveRound {},
  ArchiveServerReceiverOnNet: class ArchiveServerReceiverOnNet {},
  ArchiveServerReceiverSinglePlay: class ArchiveServerReceiverSinglePlay {},
  ArchiveBadge: class ArchiveBadge {},
  ArchiveEmailsender: class ArchiveEmailsender {},
  ArchiveEmailcontent: class ArchiveEmailcontent {},
};
