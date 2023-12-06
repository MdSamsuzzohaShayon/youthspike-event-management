import { gql } from "@apollo/client";

const commonResponse = `
  _id
  name
  startDate
  endDate
  active
  autoAssign
  autoAssignLogic
  coachPassword
  ldo {
    _id
    name
    logo
  }
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

/**
 * Query
 * =========================================================================================================================================
 */
const GET_EVENTS = gql`
  query GetEvents($directorId: String) {
    getEvents(directorId: $directorId) {
      code
      message
      success
      data {
        ${commonResponse}
      }
    }
  }
`;

const GET_A_EVENT = gql`
  query GetEvent($eventId: String!) {
    getEvent(id: $eventId) {
      code
      message
      success
      data {
        ${commonResponse}
      }
    }
  }
`;

/**
 * Mutation
 * =========================================================================================================================================
 */
const ADD_EVENT_RAW = `
mutation CreateEvent($sponsors: [Upload!]!, $input: CreateEventInput!) {
  createEvent(sponsors: $sponsors, input: $input) {
    code
    data {
      ${commonResponse}
    }
  }
}
`;

const ADD_EVENT = gql`${ADD_EVENT_RAW}`;

const UPDATE_EVENT_RAW = `
mutation UpdateEvent($sponsors: [Upload!]!, $input: UpdateEventInput!, $eventId: String!) {
  updateEvent(sponsors: $sponsors, input: $input, eventId: $eventId) {
    code
    message
    success
    data {
      ${commonResponse}
    }
  }
}
`;

const UPDATE_EVENT = gql`${UPDATE_EVENT_RAW}`;

const CLONE_EVENT = gql`
  mutation CloneEvent($eventId: String!) {
    cloneEvent(eventId: $eventId) {
      code
      message
      success
      data {
        ${commonResponse}
      }
    }
  }
`;

export { GET_EVENTS, ADD_EVENT, ADD_EVENT_RAW , UPDATE_EVENT, UPDATE_EVENT_RAW, CLONE_EVENT, GET_A_EVENT };
