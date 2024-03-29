import { gql } from "@apollo/client";

const matchResponse = `
matches {
  _id
  date
  division
  teamA {
    _id
    name
    active
    division
    captain {
      _id
      firstName
      lastName
      email
    }
  }
  teamB {
    _id
    name
    active
    division
    captain {
      _id
      firstName
      lastName
      email
    }
  }
  location
}
`;

const teamResponse = `
teams{
  _id
  name
  division
  captain {
    _id
    firstName
    lastName
    email
    profile
  }
}
`;

const playerResponse = `
players {
  _id
  firstName
  lastName
  profile
  email
  ${teamResponse}
}
`;

const sponsorResponse= `
sponsors{
  _id
  company
  logo
}
`;

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

${matchResponse}
${playerResponse}
${teamResponse}
${sponsorResponse}
`;

/**
 * Query
 * =========================================================================================================================================
 */

const GET_AN_EVENT = gql`
query GetEvent($eventId: String!) {
  getEvent(eventId: $eventId) {
    code
    message
    success
    data {
      ${eventResponse}
    }
  }
}`;


/**
 * Mutation
 * =========================================================================================================================================
 */

const GET_EVENTS = gql`
query GetEvents {
  getEvents {
    code
    data {
      ${eventResponse}
    }
  }
}
`;



export { GET_AN_EVENT, GET_EVENTS };