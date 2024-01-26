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
    location
    name
    netVariance
    playerLimit
    rosterLock
    timeout
    startDate
`;


const playerResponse = `
  _id
  firstName
  lastName
  profile
  email
  rank
  status
  teams {
    _id
    name
  }
`;


/**
 * Queries
 * =======================================================================================
 */

const GET_A_PLAYER = gql`
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


const GET_EVENT_WITH_PLAYERS = gql`
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
        }
        ldo {
          _id
          name
          logo
        }
     }
  }
}
`;

/**
 * Mutations
 * =======================================================================================
 */
const CREATE_MULTIPLE_PLAYERS_RAW = `
mutation CreateMultiPlayers($uploadedFile: Upload!, $eventId: String!, $division: String!) {
  createMultiPlayers(uploadedFile: $uploadedFile, eventId: $eventId, division: $division) {
    code
    data {
      ${playerResponse}
    }
  }
}
`;

const CREATE_MULTIPLE_PLAYERS = gql`${CREATE_MULTIPLE_PLAYERS_RAW}`;

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
const CREATE_PLAYER = gql`${CREATE_PLAYER_RAW}`;

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

const UPDATE_PLAYER = gql`${UPDATE_PLAYER_RAW}`;

const UPDATE_PLAYERS = gql`
mutation UpdatePlayers($input: [UpdatePlayersInput!]!) {
  updatePlayers(input: $input) {
    code
    message
    success
    data {
      ${playerResponse}
    }
  }
}
`;



export {
  GET_PLAYERS, GET_EVENT_WITH_PLAYERS, GET_A_PLAYER,
  CREATE_MULTIPLE_PLAYERS_RAW, CREATE_MULTIPLE_PLAYERS, CREATE_PLAYER_RAW, CREATE_PLAYER,
  UPDATE_PLAYER_RAW, UPDATE_PLAYERS, UPDATE_PLAYER
};
