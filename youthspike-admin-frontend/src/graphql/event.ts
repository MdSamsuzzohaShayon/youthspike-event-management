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
location
nets
rounds
netVariance
rosterLock
timeout
fwango
tieBreaking
defaultSponsor
ldo {
  _id
  name
  logo
}
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

const GET_EVENTS_MIN_RAW = `
query GetEvents {
  getEvents {
    code
    success
    message
    data {
      _id
      name
      logo
      startDate
      endDate
      active
      ldo {
        _id
        name
        logo
      }
    }
  }
}
`;
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


const GET_AN_EVENT_RAW = `
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


const GET_AN_EVENT = gql`


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


const SEND_CREDENTIALS= gql`
mutation SendCredentials($eventId: String!, $teamIds: [String!], $captain: String, $coCaptain: String) {
  sendCredentials(eventId: $eventId, teamIds: $teamIds, captain: $captain, co_captain: $coCaptain) {
    code
    message
    success
  }
}
`;

export { GET_EVENTS, GET_EVENTS_MIN_RAW, ADD_EVENT, ADD_EVENT_RAW, UPDATE_EVENT, UPDATE_EVENT_RAW, CLONE_EVENT, GET_AN_EVENT, GET_AN_EVENT_RAW, DELETE_AN_EVENT, SEND_CREDENTIALS };
