import { gql } from "@apollo/client";

const eventResponse = `
  _id
  name
  logo
  startDate
  endDate
  active
  autoAssign
  autoAssignLogic
  coachPassword
  divisions
  homeTeam
  description
  nets
  rounds
  netVariance
  sendCredentials
  rosterLock
  timeout
  sponsors {
    _id
    company
    logo
  }
`;

const eventResponseLight = `
  _id
  sponsors {
    _id
  }
  matches {
    _id
  }
  players {
    _id
  }
  teams {
    _id
  }
`;

const ldoResponse = `
  _id
  name
  phone
  logo
  director {
    _id
    active
    firstName
    lastName
    role
    email
  }
  events {
    ${eventResponse}
  }
`;


/**
 * Queries
 * ==========================================================================================================
 */
const GET_LDOS = gql`
  query GetEventDirectors {
    getEventDirectors {
      code
      success
      message
      data {
        ${ldoResponse}
      }
    }
  }
`;

const GET_LDOS_LIGHT = gql`
  query GetEventDirectors {
    getEventDirectors {
      code
      success
      message
      data {
        _id
      director {
        _id
      }
      events {
        ${eventResponseLight}
      }
      }
    }
  }
`;

const GET_LDO = gql`
  query GetEventDirector($dId: String) {
    getEventDirector(dId: $dId) {
      code
      success
      message
      data {
        ${ldoResponse}
      }
    }
  }
`;

/**
 * Mutations
 * ==========================================================================================================
 */
const ADD_DIRECTOR_RAW = `
mutation CreateDirector($args: CreateDirectorArgs!, $logo: Upload) {
  createDirector(args: $args, logo: $logo) {
      code
      success
      message
      data {
        ${ldoResponse}
      }
    }
  }
`;
const ADD_DIRECTOR = gql`
  ${ADD_DIRECTOR_RAW}
`;

const UPDATE_DIRECTOR_RAW = `
mutation UpdateDirector($args: UpdateDirectorArgs!, $dId: String, $logo: Upload) {
  updateDirector(args: $args, logo: $logo, dId: $dId) {
    code
    success
      message
    data {
      ${ldoResponse}
    }
  }
}
`;

const UPDATE_DIRECTOR = gql`
  ${UPDATE_DIRECTOR_RAW}
`;

const DELETE_DIRECTOR = gql`
mutation DeleteEventDirector($dId: String!) {
  deleteEventDirector(dId: $dId) {
    code
    success
      message
    data {
      ${ldoResponse}
    }
  }
}
`;

export { GET_LDO, GET_LDOS, GET_LDOS_LIGHT, UPDATE_DIRECTOR, UPDATE_DIRECTOR_RAW, ADD_DIRECTOR, ADD_DIRECTOR_RAW, DELETE_DIRECTOR };
