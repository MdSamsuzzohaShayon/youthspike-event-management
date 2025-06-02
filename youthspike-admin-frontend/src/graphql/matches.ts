import { gql } from "@apollo/client";

const eventResponse = `
    _id
    nets
    rounds
    active
    autoAssign
    autoAssignLogic
    divisions
    endDate
    homeTeam
    tieBreaking
    description
    location
    name
    netVariance
    playerLimit
    rosterLock
    timeout
    startDate
    fwango
`;

const roundResponse = `
rounds {
  _id
  num
  teamAScore
  teamBScore
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

const matchResponse = `
    _id
    date
    division
    numberOfNets
    numberOfRounds
    netVariance
    homeTeam
    tieBreaking
    autoAssign
    autoAssignLogic
    rosterLock
    timeout
    description
    location
    extendedOvertime
    completed
    group{
          _id
          name
    }
    rounds {
      _id
      num
      completed
      teamAScore
      teamBScore
    }
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
    teamA {
      _id
      name
      logo
      captain {
        _id
        firstName
        lastName
        profile
      }
    }
    teamB {
      _id
      name
      logo
      captain {
        _id
        firstName
        lastName
        profile
      }
    }
`;

const matchResponseWithRound = `
    ${roundResponse}
    ${matchResponse}
`;

const teamResponse = `
    _id
    active
    name
    logo
    division
    players {
      _id
      firstName
      lastName
      captainofteams {
        _id
        name
      }
      captainuser {
        _id
        firstName
        lastName
      }
    }
    captain {
      _id
      firstName
      lastName
      captainofteams {
        _id
        name
      }
      captainuser {
        _id
        firstName
        lastName
        email
      }
    }
    cocaptain {
      _id
      firstName
      lastName
    }
`;

/**
 * QUERIES
 * ===========================================================================================
 */
const GET_A_MATCH = gql`
  query GetMatch($matchId: String!) {
    getMatch(matchId: $matchId) {
      code
      success
      message
      data {
        ${matchResponseWithRound}
      }
    }
  }
`;

const GET_EVENT_WITH_MATCHES_RAW = `
query GetEventWithMatches($eventId: String!) {
  getEventWithMatches(eventId: $eventId) {
    code
    success
    message
    data {
      event {
        _id
        name
        logo
        startDate
        endDate
        active
        sendCredentials
        playerLimit
        fwango
        divisions
        nets
        rounds
        netVariance
        homeTeam
        autoAssign
        autoAssignLogic
        rosterLock
        tieBreaking
        timeout
        coachPassword
        description
        location
        accessCode
      }
      matches {
        _id
        date
        division
        numberOfNets
        numberOfRounds
        netVariance
        homeTeam
        autoAssign
        autoAssignLogic
        rosterLock
        tieBreaking
        timeout
        location
        description
        fwango
        completed
        extendedOvertime
        nets
        rounds
        teamA
        teamB
        group
      }
      teams {
        _id
        name
        logo
        active
        division
        rankLock
        sendCredentials
        num
        matches
        captain
        cocaptain
      }
      ldo {
        _id
        name
        phone
        logo
      }
      nets {
        _id
        num
        match
        round
        teamA
        teamB
        teamAPlayerA
        teamAPlayerB
        teamBPlayerA
        teamBPlayerB
        points
        netType
        teamAScore
        teamBScore
        pairRange
      }
      rounds {
        _id
        num
        match
        nets
        teamAScore
        teamBScore
        teamAProcess
        teamBProcess
        completed
        firstPlacing
      }
      groups {
        _id
        name
        active
        division
        rule
        teams
      }
    }
  }
}
`;

/**
 * MUTATIONS
 * ===========================================================================================
 */
const CREATE_MATCH = gql`
mutation CreateMatch($input: CreateMatchInput!) {
  createMatch(input: $input) {
    code
    success
    message
    data {
      ${matchResponse}
    }
  }
}
`;

const UPDATE_MATCH = gql`
mutation UpdateMatch($input: UpdateMatchInput!, $matchId: String!) {
  updateMatch(input: $input, matchId: $matchId) {
    code
    success
    message
  }
}
`;


const DELETE_MATCH = gql`
mutation DeleteMatch($matchId: String!) {
  deleteMatch(matchId: $matchId) {
    code
    message
    success
  }
}
`;

const DELETE_MATCHES = gql`
mutation DeleteMatches($matchIds: [String!]!) {
  deleteMatches(matchIds: $matchIds) {
    code
    success
    message
  }
}
`;



export { CREATE_MATCH, GET_EVENT_WITH_MATCHES_RAW, GET_A_MATCH, UPDATE_MATCH, DELETE_MATCH, DELETE_MATCHES };
