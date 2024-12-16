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

// eslint-disable-next-line import/prefer-default-export
export { GET_A_TEAM };
