import { gql } from "@apollo/client";

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
      ${teamResponse}
      }
    }
  }
`;

const GET_TEAMS_BY_EVENT = gql`
  query GetTeams($eventId: String) {
    getTeams(eventId: $eventId) {
      code
      message
      success
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
    message
    success
    data {
      ${eventResponse}
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
 * Mutation
 * =========================================================================================================================================
 */

const ADD_A_TEAM = gql`
  mutation CreateTeam($input: CreateTeamInput!) {
    createTeam(input: $input) {
      code
      message
      success
      data {
        ${teamResponse}
      }
    }
  }
`;

export { GET_TEAMS_BY_EVENT, ADD_A_TEAM, GET_A_TEAM, GET_EVENT_WITH_TEAMS };
