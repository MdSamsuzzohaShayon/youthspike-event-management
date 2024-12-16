import { gql } from '@apollo/client';

const roundResponse = `
rounds {
  _id
  num
  teamAScore
  teamBScore
  teamAProcess
  teamBProcess
  nets {
    _id
    num
    teamAPlayerA
    teamAPlayerB
    teamAScore
    teamBPlayerA
    teamBPlayerB
    teamBScore
  }
}
`;

const netResponse = `
nets {
  _id
  teamAScore
  teamBScore
  num
  points
  round{
    _id
  }
}
`;

const matchResponse = `
matches {
  ${roundResponse}
  ${netResponse}
  _id
  date
  division
  completed
  group{
    _id
    name
  }
  teamA {
    _id
    name
    active
    division
    logo
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
    logo
    captain {
      _id
      firstName
      lastName
      email
    }
  }
  description
  location
}
`;

const teamResponse = `
teams{
  _id
  name
  division
  logo
  group{
    _id
    name
    division
  }
  captain {
    _id
    firstName
    lastName
    email
    profile
  }
  playerRanking {
    _id
    rankLock
    rankings {
      _id
      rank
      player {
        _id
      }
    }
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
  division
  ${teamResponse}
}
`;

const sponsorResponse = `
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
description
location
nets
rounds
netVariance
rosterLock
timeout

groups{
  _id
  name
  division
}

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
        _id
        name
        logo
        startDate
        endDate
        active
        divisions
        description
        location
        matches {
          _id
          date
        }
      }
    }
  }
`;

export { GET_AN_EVENT, GET_EVENTS };
