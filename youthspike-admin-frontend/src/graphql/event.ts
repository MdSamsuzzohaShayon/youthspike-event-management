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
    success
    message
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
mutation CreateEvent($sponsorsInput: [EventSponsorInput!]!, $input: CreateEventInput!, $logo: Upload) {
  createEvent(sponsorsInput: $sponsorsInput, input: $input, logo: $logo) {
    code
    success
    message
    data {
      ${eventResponse}
    }
  }
}
`;

const ADD_EVENT = gql`${ADD_EVENT_RAW}`;

const UPDATE_EVENT_RAW = `
mutation UpdateEvent($sponsorsInput: [EventSponsorInput!]!, $updateInput: UpdateEventInput!, $eventId: String!, $sponsorsStringInput: [EventSponsorStringInput!], $logo: Upload) {
  updateEvent(sponsorsInput: $sponsorsInput, updateInput: $updateInput, eventId: $eventId, sponsorsStringInput: $sponsorsStringInput, logo: $logo) {
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
      success
      message
      data {
        ${eventResponse}
      }
    }
  }
`;


const DELETE_AN_EVENT = gql`
mutation DeleteEvent($eventId: String!) {
  deleteEvent(eventId: $eventId) {
    code
    message
    success
  }
}
`;

export { GET_EVENTS, ADD_EVENT, ADD_EVENT_RAW, UPDATE_EVENT, UPDATE_EVENT_RAW, CLONE_EVENT, GET_A_EVENT, DELETE_AN_EVENT };
