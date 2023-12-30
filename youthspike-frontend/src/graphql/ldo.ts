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
  timeout
  sponsors{
    _id 
    company
    logo
  }
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
    email
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

export { GET_LDOS, GET_LDO };