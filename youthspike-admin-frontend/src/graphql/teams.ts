import { gql } from "@apollo/client";

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

const teamResponse = `
    _id
    active
    name
    logo
    division
    sendCredentials
    num
    players {
      _id
      firstName
      lastName
      email
      phone
      profile
      status
      teams {
        _id
        name
      }
      captainofteams {
        _id
        name
      }
      cocaptainofteams {
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
    captain {
      _id
      firstName
      lastName
      profile
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

const groupResponse = `
_id
name
`;

const teamResponseMin = `
    _id
    active
    name
    logo
    division
    sendCredentials
    num
    players {
      _id
      firstName
      lastName
    }
    captain {
      _id
      firstName
      lastName
      profile
    }
    group {
      _id
      name
    }
`;

const eventResponse = `
    _id
    name
    logo
    active
    autoAssign
    autoAssignLogic
    coachPassword
    divisions
    endDate
    homeTeam
    description
    netVariance
    playerLimit
    rosterLock
    timeout
    startDate
    teams{
      _id
      name
      division
    }
    groups{
      _id
      name
      division
    }
    players{
      _id
      firstName
      lastName
      email
      division
      teams{
        _id
        name
      }
    }
`;

/**
 * Query
 * =========================================================================================================================================
 */
const GET_A_TEAM = gql`
  query GetTeam($teamId: String!) {
    getTeam(teamId: $teamId) {
      code
      message
      success
      data {
        group{
          _id
          name
        }
        ${rankingResponse}
        ${teamResponse}
        event{
          ${eventResponse}
        }
      }
    }
  }
  
`;

const GET_TEAMS_BY_EVENT = gql`
  query GetTeams($eventId: String) {
    getTeams(eventId: $eventId) {
      code
      success
      message
      data {
        ${teamResponse}
      }
    }
  }
`;



const GET_EVENT_WITH_TEAMS = gql`
query GetEvent($eventId: String!) {
  getEvent(eventId: $eventId) {
    code
    success
    message
    data {
      ${eventResponse}
      teams {
        ${teamResponseMin}
      }
      ldo {
        _id
        name
        logo
      }
      groups{
        _id
        name
        division
      }
    }
  }
}
`;

/**
 * Mutation
 * =========================================================================================================================================
 */

const ADD_TEAM_RAW = `
  mutation CreateTeam($input: CreateTeamInput!, $logo: Upload) {
    createTeam(input: $input, logo: $logo) {
      code
      success
      message
      data {
        ${teamResponse}
      }
    }
  }
`;

const ADD_A_TEAM = gql`${ADD_TEAM_RAW}`;

const UPDATE_TEAM_RAW = `
  mutation UpdateTeam($input: UpdateTeamInput!, $teamId: String!, $eventId: String!, $logo: Upload) {
    updateTeam(input: $input, teamId: $teamId, eventId: $eventId, logo: $logo) {
      code
      success
      message
      data {
        _id
        active
        name
        logo
        captain {
          _id
          email
          firstName
          lastName
          captainuser {
            _id
            firstName
            lastName
            email
          }
        }
        cocaptain {
          _id
          email
          firstName
          lastName
        }
      }
    }
  }
`;

const UPDATE_TEAM = gql`${UPDATE_TEAM_RAW}`;



const DELETE_TEAM = gql`
mutation DeleteTeam($teamId: String!) {
  deleteTeam(teamId: $teamId) {
    code
    success
    message
  }
}
`;


const DELETE_MULTIPLE_TEAMS = gql`
mutation DeleteTeams($teamIds: [String!]!) {
  deleteTeams(teamIds: $teamIds) {
    code
    message
    success
  }
}
`;

export { GET_TEAMS_BY_EVENT, ADD_A_TEAM, ADD_TEAM_RAW, GET_A_TEAM, GET_EVENT_WITH_TEAMS, UPDATE_TEAM_RAW, UPDATE_TEAM, DELETE_TEAM, DELETE_MULTIPLE_TEAMS};
