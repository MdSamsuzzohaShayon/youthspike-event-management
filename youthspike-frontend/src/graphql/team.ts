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

const netResponse = `
nets {
  _id
  teamAScore
  teamBScore
  num
  points
  teamAPlayerA
  teamAPlayerB
  teamBPlayerA
  teamBPlayerB
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
    _id
    active
    name
    logo
    division
    sendCredentials
    num
    ${matchResponse}
    ${rankingResponse}
    event{
      _id
    }
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

/**
 * Query
 * =========================================================================================================================================
 */
const GET_A_TEAM = gql`
  query GetTeam($teamId: String!) {
    getTeam(teamId: $teamId) {
      code
      success
      message
      data {
        
      ${teamResponse}
      }
    }
  }
`;





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
        team
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

const SEARCH_TEAMS = gql`
query SearchTeams($eventIds: [String!], $filter: TeamSearchFilter) {
  searchTeams(eventIds: $eventIds, filter: $filter) {
    code
    message
    success
    data {
      events {
        _id
        logo
        location
        name
        divisions
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
      }
      teams {
        _id
        groups
        logo
        name
        num
        matches
        division
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

// eslint-disable-next-line import/prefer-default-export
export { SEARCH_TEAMS, GET_A_TEAM, GET_TEAM_MATCHES, GET_TEAM_ROSTER, GET_TEAMS };
