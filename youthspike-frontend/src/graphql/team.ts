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
        teamAPlayerA
        teamAPlayerB
        teamBPlayerA
        teamBPlayerB
      }
      teams {
        _id
        name
        logo
        num
      }

      statsOfPlayer {
        playerId
        stats {
          _id
          break
          broken
          cleanHits
          cleanSets
          defensiveConversion
          defensiveOpportunity
          match
          hittingOpportunity
          matchPlayed
          net
          noTouchAcedCount
          player
          receivedCount
          receiverOpportunity
          serveAce
          serveCompletionCount
          serveOpportunity
          servingAceNoTouch
          settingOpportunity
        }
      }
    }
  }
}
`;


const SEARCH_TEAMS = gql`
query SearchTeams($eventId: String!, $filter: TeamSearchFilter) {
  searchTeams(eventId: $eventId, filter: $filter) {
    code
    message
    success
    data {
      event {
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
        group
        logo
        name
        num
        nets
        matches
        division
      }
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
      event {
          _id
          active
          divisions
          description
          logo
          location
          name
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
      statsOfPlayer {
        playerId
        stats {
          _id
          break
          broken
          cleanHits
          cleanSets
          defensiveConversion
          defensiveOpportunity
          hittingOpportunity
          match
          matchPlayed
          net
          noTouchAcedCount
          player
          receivedCount
          receiverOpportunity
          serveAce
          serveCompletionCount
          serveOpportunity
          servingAceNoTouch
          settingOpportunity
        }
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

// eslint-disable-next-line import/prefer-default-export
export { SEARCH_TEAMS, GET_A_TEAM, GET_TEAM_DETAIL_RAW, GET_TEAM_ROSTER, GET_TEAM_MATCHES };
