import { gql } from "@apollo/client";

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

const matchResponse = `
    _id
    date
    numberOfNets
    numberOfRounds
    location
    netRange
    pairLimit
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
const GET_MATCHES = gql`
  query GetMatches($eventId: String!) {
    getMatches(eventId: $eventId) {
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

export { GET_MATCHES, CREATE_MATCH, GET_EVENT_WITH_MATCHES_TEAMS };
