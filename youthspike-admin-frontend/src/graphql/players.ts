import { gql } from '@apollo/client';

const eventResponse = `
    _id
    active
    autoAssign
    autoAssignLogic
    coachPassword
    divisions
    endDate
    homeTeam
    description
    name
    netVariance
    playerLimit
    rosterLock
    timeout
    startDate
`;

const rankingResponse = `
playerRanking {
  _id
  rankLock
  rankings {
    _id
    rank
    player {
      _id
    }
  }
}
`;

const playerResponse = `
  _id
  firstName
  lastName
  username
  profile
  email
  status
  phone
  division
  teams {
    _id
    name
  }
`;

/**
 * Queries
 * =======================================================================================
 */

const GET_PLAYER_AND_TEAMS_RAW = `
query GetPlayerAndTeams($playerId: String!, $eventId: String!) {
  getPlayerAndTeams(playerId: $playerId, eventId: $eventId) {
    code
    success
    message
    data {
      player {
        _id
        firstName
        teams
        lastName
        username
        email
        status
        profile
        phone
        division
      }
      teams {
        _id
        name
        logo
        division
        active
        rankLock
        players
        group
        captain
        cocaptain
      }
    }
  }
}
`;
const GET_PLAYER_AND_TEAMS = gql`${GET_PLAYER_AND_TEAMS_RAW}`;
const GET_A_PLAYER_RAW = `
query GetPlayer($playerId: String!) {
  getPlayer(playerId: $playerId) {
    code
    message
    success
    data {
      ${playerResponse}
    }
  }
}
`;

const GET_A_PLAYER = gql`
  ${GET_A_PLAYER_RAW}
`;

const GET_PLAYERS = gql`
query GetPlayers($eventId: String!) {
  getPlayers(eventId: $eventId) {
    code
    message
    success
    data {
      ${playerResponse}
    }
  }
}
`;

const GET_PLAYERS_MIN_RAW = `
query GetPlayers {
  getPlayers {
    code
    message
    success
    data {
      _id
      division
      firstName
      lastName
      profile
      teams {
        _id
        name
        logo
      }
      events {
        _id
        name
        logo
      }
    }
  }
}
`;

const GET_EVENT_PLAYERS_GROUPS_TEAMS_RAW = `
query GetEventWithPlayers($eventId: String!) {
  getEventWithPlayers(eventId: $eventId) {
    code
    success
    message
    data {
      event {
        _id
        name
        logo
        startDate
        endDate
        active
        sendCredentials
        description
        location
        divisions
      }
      players {
        _id
        firstName
        lastName
        username
        email
        status
        profile
        phone
        division
        teams
      }
      groups {
        _id
        name
        teams
        rule
        division
        active
      }
      teams {
        _id
        name
        logo
        active
        division
        rankLock
        sendCredentials
        num
        players
        captain
        cocaptain
      }
      rankings {
        _id
        player
        playerRanking
        rank
      }
      playerRankings {
        _id
        match
        rankLock
        rankings
        team
      }
    }
  }
}
`;

const GET_EVENT_PLAYERS_GROUPS_TEAMS = gql`${GET_EVENT_PLAYERS_GROUPS_TEAMS_RAW}`;

const GET_EVENT_WITH_TEAM_PLAYERS_RAW = `
query GetEvent($eventId: String!) {
  getEvent(eventId: $eventId) {
    code
    message
    success
     data {
        ${eventResponse}
        players {
          ${playerResponse}
        }
        teams{
          _id
          name
          division
          rankLock
          ${rankingResponse}
        }
        ldo {
          _id
          name
          logo
        }
        groups {
          _id
          name
          division
        }
     }
  }
}
`;

const GET_EVENT_WITH_PLAYERS = gql`
  ${GET_EVENT_WITH_TEAM_PLAYERS_RAW}
`;

/**
 * Mutations
 * =======================================================================================
 */
const CREATE_MULTIPLE_PLAYERS_RAW = `
mutation CreateMultiPlayers($uploadedFile: Upload!, $eventId: String!, $division: String!) {
  createMultiPlayers(uploadedFile: $uploadedFile, eventId: $eventId, division: $division) {
    code
    success
    message
    data {
      ${playerResponse}
    }
  }
}
`;

const CREATE_MULTIPLE_PLAYERS = gql`
  ${CREATE_MULTIPLE_PLAYERS_RAW}
`;

const CREATE_PLAYER_RAW = `
  mutation CreatePlayer($input: CreatePlayerInput!, $profile: Upload) {
    createPlayer(input: $input, profile: $profile) {
      code
      message
      success
      data{
        ${playerResponse}
      }
    }
  }
`;
const CREATE_PLAYER = gql`
  ${CREATE_PLAYER_RAW}
`;

const UPDATE_PLAYER_RAW = `
  mutation UpdatePlayer($input: UpdatePlayerInput!, $playerId: String!, $profile: Upload) {
    updatePlayer(input: $input, playerId: $playerId, profile: $profile) {
      code
      message
      success
      data {
        ${playerResponse}
      }
    }
  }
`;

const UPDATE_PLAYER = gql`
  ${UPDATE_PLAYER_RAW}
`;

const UPDATE_PLAYERS = gql`
mutation UpdatePlayers($input: [UpdatePlayersInput!]!) {
  updatePlayers(input: $input) {
    code
    success
    message
    data {
      ${playerResponse}
    }
  }
}
`;

const DELETE_A_PLAYER = gql`
  mutation DeletePlayer($playerId: String!) {
    deletePlayer(playerId: $playerId) {
      code
      success
      message
      data {
        _id
      }
    }
  }
`;

export {
  GET_PLAYERS,
  GET_EVENT_WITH_PLAYERS,
  GET_A_PLAYER,
  GET_A_PLAYER_RAW,
  GET_EVENT_PLAYERS_GROUPS_TEAMS_RAW,
  GET_EVENT_PLAYERS_GROUPS_TEAMS,
  CREATE_MULTIPLE_PLAYERS_RAW,
  CREATE_MULTIPLE_PLAYERS,
  CREATE_PLAYER_RAW,
  CREATE_PLAYER,
  UPDATE_PLAYER_RAW,
  UPDATE_PLAYERS,
  UPDATE_PLAYER,
  DELETE_A_PLAYER,
  GET_EVENT_WITH_TEAM_PLAYERS_RAW,
  GET_PLAYER_AND_TEAMS_RAW,
  GET_PLAYER_AND_TEAMS,
  GET_PLAYERS_MIN_RAW,
};
