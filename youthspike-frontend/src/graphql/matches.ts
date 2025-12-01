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
moved{
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

// match, serverReceiverSinglePlay, serverReceiverOnNet, room, event, sponsors, ldo, rounds, subs, nets
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
      streamUrl
      netVariance
      numberOfNets
      numberOfRounds
      rosterLock
      timeout
      tieBreaking
      extendedOvertime
      teamAP
      teamBP
      serverReceiverSinglePlay {
        _id
        matchId
        play
        netId
        receiverId
        receivingPartnerId
        serverId
        servingPartnerId
        teamAScore
        teamBScore
        serverPositionPair
        action
      }
      serverReceiverOnNet {
        _id
        mutate
        play
        room
        teamAScore
        teamBScore
        
        netId
        serverId
        servingPartnerId
        receiverId
        receivingPartnerId
        matchId
        roundId

        serverPositionPair
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
          streamUrl
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

const SEARCH_MATCHES = gql`
query SearchMatches($eventId: String!, $filter: SearchFilterInput) {
  searchMatches(eventId: $eventId, filter: $filter) {
    code
    data {
      event {
        _id
        name
        divisions
      }
      groups {
        _id
        name
        division
      }
      ldo {
        _id
        name
      }
      matches {
        _id
        teamB
        teamA
        teamAP
        teamBP
        date
        location
        group
        division
        description
        completed
      }
      nets {
        _id
        num
        match
        round
        teamBPlayerA
        teamBPlayerB
        teamAPlayerA
        teamAPlayerB
        teamBScore
        teamAScore
        streamUrl
        points
      }
      rounds {
        _id
        completed
        firstPlacing
        match
        num
        teamAScore
        teamBScore
        teamAProcess
        teamBProcess
      }
      teams {
        _id
        name
        num
        division
        matches
        logo
        group
        active
      }
    }
    code
    message
    success
  }
}
`;




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


const UPDATE_MATCH = gql`
mutation UpdateMatch($input: UpdateMatchInput!, $matchId: String!) {
  updateMatch(input: $input, matchId: $matchId) {
    code
    success
    message
  }
}
`;



// eslint-disable-next-line import/prefer-default-export
export { GET_MATCH_DETAIL, ACCESS_CODE_VALIDATION_RAW, ACCESS_CODE_VALIDATION, GET_MATCH_DETAIL_RAW, UPDATE_MATCH, SEARCH_MATCHES };
