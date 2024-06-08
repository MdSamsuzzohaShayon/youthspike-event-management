import { gql } from '@apollo/client';

const teamResponse = `
_id
active
name
logo
players {
  _id
  firstName
  lastName
  profile
  email
  status
}
captain {
  _id
  firstName
  lastName
  profile
  email
}
cocaptain {
  _id
  firstName
  lastName
  profile
  email
}
        `;

const teamRanking = `
_id
rankLock
rankings {
  _id
  rank
  player {
    _id
  }
}
`;

const teamARanking = `teamARanking {${teamRanking}}`;
const teamBRanking = `teamBRanking {${teamRanking}}`;

const GET_MATCH_DETAIL = gql`
query GetMatch($matchId: String!) {
  getMatch(matchId: $matchId) {
    code
    message
    success
    data {
      _id
      ${teamARanking}
      ${teamBRanking}
      completed
      autoAssign
      autoAssignLogic
      date
      division
      homeTeam
      description
      fwango
      netVariance
      numberOfNets
      numberOfRounds
      rosterLock
      timeout
      room {
        _id
      }
      event {
        _id
        sponsors{
          _id
          company
          logo
        }
        ldo {
          _id
          name
          logo
        }
      }
      rounds {
        _id
        num
        completed
        teamAProcess
        teamAScore
        teamBProcess
        teamBScore
        firstPlacing
        players {
          _id
          email
        }
        subs {
          _id
          email
        }
        nets {
          _id
          num
          netType
          teamAScore
          teamBScore
          points
          pairRange
          teamAPlayerA
          teamAPlayerB
          teamBPlayerA
          teamBPlayerB
        }
      }
      teamA {
        ${teamResponse}
      }
      teamB {
        ${teamResponse}
      }
    }
  }
}
`;

// eslint-disable-next-line import/prefer-default-export
export { GET_MATCH_DETAIL };
