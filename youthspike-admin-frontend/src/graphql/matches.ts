import { gql } from "@apollo/client";

const eventResponse = `
    _id
    nets
    rounds
    active
    autoAssign
    autoAssignLogic
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

const roundResponse = `
rounds {
  _id
  num
  teamAScore
  teamBScore
  nets {
    _id
    num
    teamAPlayerA
    teamAPlayerB
    teamAScore
    teamBPlayerA
    teamBPlayerB
    teamBScore
  }
}
`;

const matchResponse = `
    _id
    date
    division
    numberOfNets
    numberOfRounds
    netVariance
    homeTeam
    autoAssign
    autoAssignLogic
    rosterLock
    timeout
    location
    teamA {
      _id
      name
      captain {
        _id
        firstName
        lastName
        profile
      }
    }
    teamB {
      _id
      name
      captain {
        _id
        firstName
        lastName
        profile
      }
    }
`;

const matchResponseWithRound = `
    ${roundResponse}
    ${matchResponse}
`;

const teamResponse = `
    _id
    active
    name
    division
    players {
      _id
      firstName
      lastName
      rank
      captainofteams {
        _id
        name
      }
      captainuser {
        _id
        firstName
        lastName
      }
    }
    captain {
      _id
      firstName
      lastName
      rank
      captainofteams {
        _id
        name
      }
      captainuser {
        _id
        firstName
        lastName
        email
      }
    }
`;

/**
 * QUERIES
 * ===========================================================================================
 */
const GET_A_MATCH = gql`
  query GetMatch($matchId: String!) {
    getMatch(matchId: $matchId) {
      code
      success
      message
      data {
        ${matchResponseWithRound}
      }
    }
  }
`;

const GET_EVENT_WITH_MATCHES_TEAMS = gql`
  query GetEvent($eventId: String!) {
    getEvent(eventId: $eventId) {
      code
      success
      message
      data {
        ${eventResponse}
        matches {
          ${matchResponse}
        }
        teams {
          ${teamResponse}
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
 * MUTATIONS
 * ===========================================================================================
 */
const CREATE_MATCH = gql`
mutation CreateMatch($input: CreateMatchInput!) {
  createMatch(input: $input) {
    code
    success
    message
    data {
      ${matchResponse}
    }
  }
}
`;

const UPDATE_MATCH = gql`
mutation UpdateMatch($input: UpdateMatchInput!, $matchId: String!) {
  updateMatch(input: $input, matchId: $matchId) {
    code
    success
    message
    data {
      ${matchResponse}
    }
  }
}
`;


const DELETE_MATCH = gql`
mutation DeleteMatch($matchId: String!) {
  deleteMatch(matchId: $matchId) {
    code
    name
  }
}
`;

export { CREATE_MATCH, GET_EVENT_WITH_MATCHES_TEAMS, GET_A_MATCH, UPDATE_MATCH, DELETE_MATCH };
