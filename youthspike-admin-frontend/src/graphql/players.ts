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
    passcode
    playerLimit
    rosterLock
    timeout
    startDate
`;


const playerResponse = `
  _id
  firstName
  lastName
  email
  rank
  team {
    _id
    name
  }
`;


/**
 * Queries
 * =======================================================================================
 */
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
  mutation CreateMultiPlayers($uploadedFile: Upload!, $event: String!) {
    createMultiPlayers(uploadedFile: $uploadedFile, event: $event) {
      code
      message
      success
      data {
        _id
        firstName
        lastName
        email
      }
    }
  }
`;

const CREATE_MULTIPLE_PLAYERS = gql`${CREATE_MULTIPLE_PLAYERS_RAW}`;

const CREATE_PLAYER_RAW = `
mutation CreatePlayer($input: CreatePlayerInput!) {
  createPlayer(input: $input) {
    code
    message
    success
  }
}
`;

const CREATE_PLAYER = gql`${CREATE_PLAYER_RAW}`;

export { GET_PLAYERS, CREATE_MULTIPLE_PLAYERS_RAW, CREATE_MULTIPLE_PLAYERS, CREATE_PLAYER_RAW, CREATE_PLAYER, GET_EVENT_WITH_PLAYERS };
