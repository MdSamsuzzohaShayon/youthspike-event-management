import { gql } from '@apollo/client';

const rankingResponse = `
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
`;

const teamResponse = `
    _id
    active
    name
    logo
    division
    sendCredentials
    num
    players {
      _id
      firstName
      lastName
      email
      phone
      profile
      status
      teams {
        _id
        name
      }
      captainofteams {
        _id
        name
      }
      cocaptainofteams {
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
    captain {
      _id
      firstName
      lastName
      profile
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
`;



const eventResponse = `
    _id
    name
    logo
    active
    autoAssign
    autoAssignLogic
    coachPassword
    divisions
    endDate
    homeTeam
    description
    netVariance
    playerLimit
    rosterLock
    timeout
    startDate
    teams{
      _id
      name
      division
    }
    groups{
      _id
      name
      division
    }
    players{
      _id
      firstName
      lastName
      email
      division
      teams{
        _id
        name
      }
    }
`;

/**
 * Query
 * =========================================================================================================================================
 */
const GET_A_TEAM_RAW = `
  query GetTeam($teamId: String!) {
    getTeam(teamId: $teamId) {
      code
      message
      success
      data {
        group{
          _id
          name
        }
        ${rankingResponse}
        ${teamResponse}
        event{
          ${eventResponse}
        }
      }
    }
  }
`;

const GET_A_TEAM = gql`
  ${GET_A_TEAM_RAW}
`;

const GET_TEAM_DETAIL_RAW = `
query GetTeamDetails($teamId: String!) {
  getTeamDetails(teamId: $teamId) {
    code
    success
    message
    data {
      team {
        _id
        name
        logo
        active
        division
        rankLock
        sendCredentials
        num
      }
      playerRanking {
        _id
        rankLock
      }
      players {
        _id
        firstName
        lastName
        username
        email
        status
        profile
        phone
        division
        captainofteams
        cocaptainofteams
        teams
      }
      group {
        _id
        name
        active
        division
        rule
      }
      captain {
        _id
        firstName
        lastName
        username
        email
        status
        profile
        phone
        division
        captainofteams
      }
      cocaptain {
        _id
        firstName
        lastName
        username
        email
        status
        profile
        phone
        division
        cocaptainofteams
      }
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
        rounds 
        nets
        teamA 
        teamB
      }
      rankings {
        _id
        rank
        player
      }
      rounds {
        _id
        num
        match
        teamAScore
        teamBScore
        teamAProcess
        teamBProcess
        completed
        firstPlacing
        nets
      }
      nets {
        _id
        num
        points
        netType
        teamAScore
        teamBScore
        pairRange
        match
        round
        teamA
        teamB
      }
      teams {
        _id
        name
        logo
        num
        division
      }
    }
  }
}
`;

const GET_TEAM_DETAIL = gql`${GET_TEAM_DETAIL_RAW}`;

const GET_TEAMS_MIN_RAW = `
query GetTeams {
  getTeams {
    code
    success
    message
    data {
      _id
      name
      group {
        _id
        name
      }
      event {
        _id
        name
        ldo {
          _id
          name
        }
      }
      division
      logo
    }
    message
    success
  }
}
`;

const GET_TEAMS_BY_EVENT = gql`
  query GetTeams($eventId: String) {
    getTeams(eventId: $eventId) {
      code
      success
      message
      data {
        ${teamResponse}
      }
    }
  }
`;

const GET_EVENT_WITH_TEAMS_RAW = `
query GetEventWithTeams($eventId: String) {
  getEventWithTeams(eventId: $eventId) {
    code
    message
    success
    data {
      event {
        _id
        logo
        active
        autoAssign
        autoAssignLogic
        coachPassword
        description
        divisions
        endDate
        fwango
        homeTeam
        rosterLock
        tieBreaking
        timeout
        location
        startDate
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
        players
        group
        captain
      }
      groups {
        _id
        name
        active
        division
        rule
        teams
      }
      players {
        _id
        firstName
        lastName
        username
        email
        status
        profile
        phone
        division
        teams
      }
    }
  }
}
`;


const GET_EVENT_WITH_TEAMS = gql`${GET_EVENT_WITH_TEAMS_RAW}`;

const GET_TEAM_ROSTER = gql`
query GetTeamRoster($teamId: String!) {
  getTeamRoster(teamId: $teamId) {
    code
    message
    success
    data {
      event{
        _id
        name
        logo
        active
        autoAssign
        autoAssignLogic
        coachPassword
        divisions
        endDate
        homeTeam
        description
        netVariance
        playerLimit
        rosterLock
        timeout
        startDate
      }
      players {
        _id
        captainofteams
        cocaptainofteams
        division
        email
        firstName
        lastName
        phone
        profile
        status
        username
      }
      team {
        _id
        active
        num
        name
        logo
        rankLock
        sendCredentials
      }
      playerRanking {
        _id
        rankLock
        rankings
      }
      rankings {
        _id
        player
        playerRanking
        rank
      }
    }
  }
}

`;

const GET_TEAM_MATCHES = gql`
query GetTeamMatches($teamId: String!) {
  getTeamMatches(teamId: $teamId) {
    code
    message
    success
    data {
      event {
        _id
        active
        divisions
        description
        logo
        location
        name
      }
      team {
        _id
        active
        division
        logo
        name
        num
        rankLock
      }
      matches {
        _id
        completed
        date
        description
        division
        extendedOvertime
        fwango
        location
        netVariance
        nets
        numberOfNets
        numberOfRounds
        rounds
        teamA
        teamB
        tieBreaking
        timeout
      }
      nets {
        _id
        match
        num
        pairRange
        points
        round
        teamAPlayerA
        teamAPlayerB
        teamAScore
        teamBPlayerA
        teamBPlayerB
        teamBScore
        netType
      }
      rounds {
        _id
        completed
        match
        firstPlacing
        nets
        num
        teamAScore
        teamBProcess
        teamBScore
        teamAProcess
      }
      teams {
        _id
        matches
        logo
        name
        num
        rankLock
        division
      }
    }
  }
}

`;

/**
 * Mutation
 * =========================================================================================================================================
 */

const ADD_TEAM_RAW = `
  mutation CreateTeam($input: CreateTeamInput!, $logo: Upload) {
    createTeam(input: $input, logo: $logo) {
      code
      success
      message
      data {
        ${teamResponse}
      }
    }
  }
`;

const ADD_A_TEAM = gql`
  ${ADD_TEAM_RAW}
`;

const UPDATE_TEAM_RAW = `
  mutation UpdateTeam($input: UpdateTeamInput!, $teamId: String!, $eventId: String!, $logo: Upload) {
    updateTeam(input: $input, teamId: $teamId, eventId: $eventId, logo: $logo) {
      code
      success
      message
      data {
        _id
        active
        name
        logo
        captain {
          _id
          email
          firstName
          lastName
          captainuser {
            _id
            firstName
            lastName
            email
          }
        }
        cocaptain {
          _id
          email
          firstName
          lastName
        }
      }
    }
  }
`;

const UPDATE_TEAM = gql`
  ${UPDATE_TEAM_RAW}
`;

const DELETE_TEAM = gql`
  mutation DeleteTeam($teamId: String!) {
    deleteTeam(teamId: $teamId) {
      code
      success
      message
    }
  }
`;

const DELETE_MULTIPLE_TEAMS = gql`
  mutation DeleteTeams($teamIds: [String!]!) {
    deleteTeams(teamIds: $teamIds) {
      code
      message
      success
    }
  }
`;

const GET_TEAMS_AND_MATCHES_RAW = `
query GetTeamStandings($eventId: String!) {
  getTeamStandings(eventId: $eventId) {
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
        captain
        cocaptain
        matches
        players
        group
      }
      groups {
        _id
        name
        teams
        rule
        division
        active
      }
      matches {
        _id
        date
        division
        group
        teamB
        teamA
        rounds
        nets
        extendedOvertime
        completed
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
    }
  }
}
`;

export {
  GET_TEAMS_BY_EVENT,
  ADD_A_TEAM,
  ADD_TEAM_RAW,
  GET_A_TEAM,
  GET_EVENT_WITH_TEAMS_RAW,
  GET_EVENT_WITH_TEAMS,
  UPDATE_TEAM_RAW,
  UPDATE_TEAM,
  DELETE_TEAM,
  DELETE_MULTIPLE_TEAMS,
  GET_TEAMS_AND_MATCHES_RAW,
  GET_TEAM_DETAIL_RAW,
  GET_TEAM_DETAIL,
  GET_A_TEAM_RAW,
  GET_TEAMS_MIN_RAW,
  GET_TEAM_ROSTER,
  GET_TEAM_MATCHES
};
