// @ts-ignore
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
        groups{
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

const GET_TEAMS_MIN_RAW = `
query GetTeams ($eventIds: [String!], $limit: Float, $offset: Float) {
  getTeams (eventIds: $eventIds, limit: $limit, offset: $offset) {
    code
    success
    message
    data {
      _id
      name
      groups {
        _id
        name
      }
      events {
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
  }
}
`;

const GET_TEAMS_MIN = gql`${GET_TEAMS_MIN_RAW}`;





const GET_TEAM_ROSTER = gql`
query GetTeamRoster($teamId: String!) {
  getTeamRoster(teamId: $teamId) {
    code
    message
    success
    data {
      events{
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
      events {
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
        teamAP 
        teamBP
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
      oponents {
        _id
        matches
        logo
        name
        num
        division
      }
    }
  }
}

`;


const GET_TEAMS = gql`
query GetTeams ($eventIds: [String!], $limit: Float, $offset: Float) {
  getTeams (eventIds: $eventIds, limit: $limit, offset: $offset) {
    code
    message
    success
    data {
      _id
      name
      division
      groups {
        _id
        name
      }
    }
  }
}
`;

const GET_TEAM_WITH_GROUPS_AND_UNASSIGNED_PLAYERS = gql`
query GetTeamWithGroupsAndUnassignedPlayers($eventIds: [String]!, $teamId: String!){
  getTeamWithGroupsAndUnassignedPlayers(eventIds:$eventIds, teamId: $teamId){
    code
    success
    message
    data{
      events{
        _id
        name
        logo
        divisions
        startDate
        endDate
      }
      team{
        _id
        name
        logo
        division
        groups
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
        username
      }
    }
  }
}
`;


const GET_EVENT_WITH_TEAMS_LIGHT = gql`
query GetEvent($eventId:String!){
  getEvent(eventId: $eventId){
    code
    success
    message
    data{
      _id
      name
      logo
      startDate
      endDate
      active
      divisions
      teams{
        _id
        name
        logo
        division
      }
    }
  }
}

`;


const SEARCH_TEAMS = gql`
query SearchTeams($eventIds: [String!], $filter: TeamSearchFilter) {
  searchTeams(eventIds: $eventIds, filter: $filter) {
    code
    message
    success
    data {
      events {
        _id
        name
        logo
        divisions
        startDate
        endDate
        location
        description
        groups
      }
      groups {
        _id
        division
        active
        matches
        name
        teams
      }
      matches {
        _id
        completed
        group
        date
        description
        division
        nets
        rounds
        teamA
        teamB
        teamAP
        teamBP
      }
      nets {
        _id
        match
        netType
        num
        points
        round
        teamAScore
        teamBScore
        match
      }
      rounds {
        _id
        match
        completed
        nets
        num
        teamAProcess
        teamAScore
        teamBProcess
        teamBScore
        match
      }
      teams {
        _id
        groups
        logo
        name
        num
        matches
        division
        players
        captain
      }
    }
  }
}

`;

const SEARCH_TEAM_LIST_LIGHT = gql`
query SearchTeams($eventIds: [String!], $filter: TeamSearchFilter) {
  searchTeams(eventIds: $eventIds, filter: $filter) {
    code
    message
    success
    data {
      events {
        _id
        name
        logo
        divisions
        startDate
        endDate
        location
        description
        groups
      }
      groups {
        _id
        division
        active
        matches
        name
        teams
      }
      captains{
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
      teams {
        _id
        groups
        logo
        name
        num
        matches
        division
        players
        captain
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
        _id
        active
        name
        logo
        division
        sendCredentials
        num
      }
    }
  }
`;

const ADD_A_TEAM = gql`
  ${ADD_TEAM_RAW}
`;

const UPDATE_TEAM_RAW = `
  mutation UpdateTeam($input: UpdateTeamInput!, $teamId: String!, $logo: Upload) {
    updateTeam(input: $input, teamId: $teamId, logo: $logo) {
      code
      success
      message
      data {
        _id
        active
        name
        logo
        captain 
        cocaptain 
        division
        group
      }
    }
  }
`;

const UPDATE_TEAM = gql`
  ${UPDATE_TEAM_RAW}
`;


const UPDATE_TEAMS_RAW = `
  mutation UpdateTeams($input: UpdateTeamsInput!, $eventId: String!, $logo: Upload) {
    updateTeams(input: $input, eventId: $eventId, logo: $logo) {
      code
      success
      message
      data {
        _id
        active
        name
        logo
        captain 
        cocaptain 
        division
        group
      }
    }
  }
`;

const UPDATE_TEAMS = gql`
  ${UPDATE_TEAMS_RAW}
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


export {
  ADD_A_TEAM,
  ADD_TEAM_RAW,
  GET_A_TEAM,
  UPDATE_TEAM_RAW,
  UPDATE_TEAM,
  DELETE_TEAM,
  DELETE_MULTIPLE_TEAMS,
  GET_A_TEAM_RAW,
  GET_TEAMS_MIN_RAW,
  GET_TEAMS_MIN,
  GET_TEAM_ROSTER,
  GET_TEAM_MATCHES,
  GET_TEAMS,
  GET_TEAM_WITH_GROUPS_AND_UNASSIGNED_PLAYERS,
  GET_EVENT_WITH_TEAMS_LIGHT,
  SEARCH_TEAMS,
  SEARCH_TEAM_LIST_LIGHT,
  UPDATE_TEAMS
};
