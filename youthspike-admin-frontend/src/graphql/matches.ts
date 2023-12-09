import { gql } from "@apollo/client";

const eventResponse = `
    _id
    nets
    rounds
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

const matchResponse = `
    _id
    netRange

    divisions
    numberOfNets
    numberOfRounds
    netVariance
    homeTeam
    autoAssign
    autoAssignLogic
    rosterLock
    timeout
    coachPassword
    location

    teamA {
      _id
      name
      captain {
        _id
        firstName
        lastName
      }
    }
    teamB {
      _id
      name
      captain {
        _id
        firstName
        lastName
      }
    }
`;

const teamResponse = `
    _id
    active
    name
    players {
      _id
      firstName
      lastName
      rank
      captainofteam {
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
      captainofteam {
        _id
        name
      }
      captainuser {
        _id
        firstName
        lastName
        login {
          email
          password
        }
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
      message
      success
      data {
        ${matchResponse}
      }
    }
  }
`;

const GET_EVENT_WITH_MATCHES_TEAMS = gql`
  query GetEvent($eventId: String!) {
    getEvent(eventId: $eventId) {
      code
      message
      success
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
    message
    success
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
    message
    success
    data {
      ${matchResponse}
    }
  }
}
`;

export { CREATE_MATCH, GET_EVENT_WITH_MATCHES_TEAMS, GET_A_MATCH, UPDATE_MATCH };
