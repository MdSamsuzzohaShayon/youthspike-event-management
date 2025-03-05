import { gql } from "@apollo/client";

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

const teamResponseMin = `
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
    }
    captain {
      _id
      firstName
      lastName
      profile
    }
    group {
      _id
      name
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
const GET_A_TEAM = gql`
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
      oponentTeams {
        _id
        name
        logo
        num
      }
    }
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

const ADD_A_TEAM = gql`${ADD_TEAM_RAW}`;

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

const UPDATE_TEAM = gql`${UPDATE_TEAM_RAW}`;



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
query GetEvent($eventId: String!) {
    getEvent(eventId: $eventId) {
      code
      message
      success
      data {
        _id
        active
        autoAssign
        autoAssignLogic
        coachPassword
        description
        divisions
        startDate
        endDate
        fwango
        homeTeam
        location
        logo
        name
        groups {
          _id
          name
          division
        }
        matches {
          _id
          autoAssign
          autoAssignLogic
          completed
          description
          group {
            _id
            name
          }
          teamA {
            _id
            name
          }
          teamB {
            _id
            name
          }
          rounds {
            _id
            completed
            num
            teamAScore
            teamBScore
          }
          nets {
            _id
            num
            teamAPlayerA
            teamAPlayerB
            teamBPlayerA
            teamBPlayerB
            teamAScore
            teamBScore
            points
            round {
              _id
            }
          }
        }
        teams {
          _id
          active
          division
          name
          num
          logo
          group {
            _id
            name
          }

        }
      }
    }
  }
`;

export { GET_TEAMS_BY_EVENT, ADD_A_TEAM, ADD_TEAM_RAW, GET_A_TEAM, 
  GET_EVENT_WITH_TEAMS_RAW, UPDATE_TEAM_RAW, UPDATE_TEAM, DELETE_TEAM, 
  DELETE_MULTIPLE_TEAMS, GET_TEAMS_AND_MATCHES_RAW, GET_TEAM_DETAIL_RAW};
