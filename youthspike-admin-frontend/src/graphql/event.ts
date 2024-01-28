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
timeout
sponsors {
  _id
  company
  logo
}
teams {
  _id
  name
  division
}
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
        ${eventResponse}
      }
    }
  }
`;

const GET_A_EVENT = gql`
query GetEvent($eventId: String!) {
  getEvent(eventId: $eventId) {
    code
    message
    success
    data {
      ${eventResponse}
    }
  }
}

`;

/**
 * Mutation
 * =========================================================================================================================================
 */
const ADD_EVENT_RAW = `
mutation CreateEvent($sponsorsInput: [EventSponsorInput!]!, $input: CreateEventInput!) {
  createEvent(sponsorsInput: $sponsorsInput, input: $input) {
    code
    message
    success
    data {
      ${eventResponse}
    }
  }
}
`;

const ADD_EVENT = gql`${ADD_EVENT_RAW}`;

const UPDATE_EVENT_RAW = `
mutation UpdateEvent($sponsorsInput: [Upload!]!, $input: UpdateEventInput!, $eventId: String!) {
  updateEvent(sponsorsInput: $sponsorsInput, input: $input, eventId: $eventId) {
    code
    message
    success
    data {
      ${eventResponse}
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
        ${eventResponse}
      }
    }
  }
`;

export { GET_EVENTS, ADD_EVENT, ADD_EVENT_RAW, UPDATE_EVENT, UPDATE_EVENT_RAW, CLONE_EVENT, GET_A_EVENT };
