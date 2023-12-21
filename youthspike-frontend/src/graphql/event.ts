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
sponsors
matches {
  _id
  date
  divisions
  teamA {
    _id
    name
    active
    captain {
      _id
      firstName
      lastName
    }
  }
  teamB {
    _id
    name
    active
    captain {
      _id
      firstName
      lastName
    }
  }
  location
}
players {
  _id
  firstName
  lastName
  profile
  email
  email
}

teams {
  _id
  name
  captain {
    _id
    firstName
    lastName
    email
    profile
  }
}
`;

/**
 * Query
 * =========================================================================================================================================
 */

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
}`;


export { GET_A_EVENT };