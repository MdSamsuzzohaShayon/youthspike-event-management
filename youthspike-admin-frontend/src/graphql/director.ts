import { gql } from "@apollo/client";

const eventResponse = `
  _id
  name
  startDate
  endDate
  active
  autoAssign
  autoAssignLogic
  coachPassword
  divisions
  homeTeam
  location
  nets
  rounds
  netVariance
  rosterLock
  passcode
  timeout
  sponsors
`;
const ldoResponse = `
  _id
  name
  logo
  director {
    _id
    active
    firstName
    lastName
    role
    login {
      email
    }
  }
  events {
    ${eventResponse}
  }
`;

const GET_LDOS = gql`
  query GetEventDirectors {
    getEventDirectors {
      code
      message
      success
      data {
        ${ldoResponse}
      }
    }
  }
`;

const GET_LDO = gql`
  query GetEventDirector($dId: String) {
    getEventDirector(dId: $dId) {
      code
      message
      success
      data {
        ${ldoResponse}
      }
    }
  }
`;

const ADD_DIRECTOR_RAW = `
mutation CreateDirector($args: CreateDirectorArgs!, $logo: Upload) {
  createDirector(args: $args, logo: $logo) {
      code
      message
      success
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
mutation UpdateDirector($args: UpdateDirectorArgs!, $logo: Upload) {
  updateDirector(args: $args, logo: $logo) {
    code
    message
    success
    data {
      ${ldoResponse}
    }
  }
}
`;

const UPDATE_DIRECTOR = gql`
  ${UPDATE_DIRECTOR_RAW}
`;

export { GET_LDO, GET_LDOS, UPDATE_DIRECTOR, UPDATE_DIRECTOR_RAW, ADD_DIRECTOR, ADD_DIRECTOR_RAW };
