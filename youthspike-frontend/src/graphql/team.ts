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
    }
  }
}
`;

// eslint-disable-next-line import/prefer-default-export
export { GET_A_TEAM, GET_TEAM_DETAIL_RAW };
