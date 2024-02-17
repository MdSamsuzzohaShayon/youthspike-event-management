import { gql } from "@apollo/client";

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
      email
      profile
      status
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
      rank
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
    teams{
      _id
      name
      division
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

const UPDATE_TEAM = gql`
  mutation UpdateTeam($input: UpdateTeamInput!, $teamId: String!, $eventId: String!) {
    updateTeam(input: $input, teamId: $teamId, eventId: $eventId) {
      code
      data {
        _id
        active
        name
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


const MOVE_TEAM = gql`
  mutation MoveTeam($eventId: String!, $teamId: String!, $division: String!) {
    moveTeam(eventId: $eventId, teamId: $teamId, division: $division) {
      code
      message
      success
      data {
        _id
        active
        division
        name
      }
    }
  }
`;

export { GET_TEAMS_BY_EVENT, ADD_A_TEAM, GET_A_TEAM, GET_EVENT_WITH_TEAMS, UPDATE_TEAM, MOVE_TEAM };
