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

const GET_MATCH_DETAIL_RAW = `
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
      location
      fwango
      netVariance
      numberOfNets
      numberOfRounds
      rosterLock
      timeout
      tieBreaking
      extendedOvertime
      netsServerReceiver {
        match
        mutate
        net
        receiver
        receivingPartner
        room
        round
        server
        servingPartner
      }
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
const GET_MATCH_DETAIL = gql`${GET_MATCH_DETAIL_RAW}`;


const ACCESS_CODE_VALIDATION_RAW = `
mutation AccessCodeValidation($input: AccessCodeInput!) {
  accessCodeValidation(input: $input) {
    code
    message
    success
    data {
      accessCode
      match
    }
  }
}
`;

const ACCESS_CODE_VALIDATION = gql`${ACCESS_CODE_VALIDATION_RAW}`;



// eslint-disable-next-line import/prefer-default-export
export { GET_MATCH_DETAIL, ACCESS_CODE_VALIDATION_RAW, ACCESS_CODE_VALIDATION, GET_MATCH_DETAIL_RAW };
