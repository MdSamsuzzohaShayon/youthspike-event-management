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
    passcode
  }
  events {
    ${eventResponse}
  }
`;


/**
 * Queries
 * ==========================================================================================================
 */

const GET_LDOS_RAW = `
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
const GET_LDOS = gql`${GET_LDOS_RAW}`;

const GET_SYSTEM_DETAILS_RAW = `
query GetSystemDetails {
  getSystemDetails {
    code
    success
    message
    data {
      events
      ldos
      matches
      players
      teams
    }
  }
}
`;


const GET_LDO_RAW = `
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

const GET_LDO = gql`${GET_LDO_RAW}`;


/**
 * Mutations
 * ==========================================================================================================
 */
const ADD_DIRECTOR_RAW = `
mutation CreateDirector($input: CreateDirector!, $logo: Upload) {
  createDirector(input: $input, logo: $logo) {
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
mutation UpdateDirector($input: UpdateDirector!, $dId: String, $logo: Upload) {
  updateDirector(input: $input, logo: $logo, dId: $dId) {
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

export { GET_LDO, GET_LDO_RAW, GET_LDOS, GET_LDOS_RAW, GET_SYSTEM_DETAILS_RAW, UPDATE_DIRECTOR, UPDATE_DIRECTOR_RAW, ADD_DIRECTOR, ADD_DIRECTOR_RAW, DELETE_DIRECTOR };
