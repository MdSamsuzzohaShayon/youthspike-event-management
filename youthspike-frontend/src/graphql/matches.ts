import { gql } from '@apollo/client';

const GET_MATCH_DETAIL = gql`
query GetMatch($matchId: String!) {
  getMatch(matchId: $matchId) {
    code
    message
    success
    data {
      _id
      autoAssign
      autoAssignLogic
      date
      divisions
      homeTeam
      location
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
      }
      rounds {
        _id
        num
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
        _id
        active
        name
        players {
          _id
          firstName
          lastName
          profile
          email
          rank
        }
        captain {
          _id
          firstName
          lastName
          profile
          email
          rank
        }
      }
      teamB {
        _id
        active
        name
        players {
          _id
          firstName
          lastName
          profile
          email
          rank
        }
        captain {
          _id
          firstName
          lastName
          profile
          email
          rank
        }
      }
    }
  }
}
`;



export {GET_MATCH_DETAIL};