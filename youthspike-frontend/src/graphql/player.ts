import { gql } from "@apollo/client";

const GET_PLAYER_AND_TEAMS_RAW = `
query GetPlayerAndTeams($playerId: String!, $eventId: String!) {
  getPlayerAndTeams(playerId: $playerId, eventId: $eventId) {
    code
    success
    message
    data {
      player {
        _id
        firstName
        teams
        lastName
        username
        email
        status
        profile
        phone
        division
      }
      teams {
        _id
        name
        logo
        division
        active
        rankLock
        players
        group
        captain
        cocaptain
      }
    }
  }
}
`;

const playerResponse = `
  _id
  firstName
  lastName
  username
  profile
  email
  status
  phone
  division
  teams {
    _id
    name
  }
`;

const GET_A_PLAYER_RAW = `
query GetPlayer($playerId: String!) {
  getPlayer(playerId: $playerId) {
    code
    message
    success
    data {
      ${playerResponse}
    }
  }
}
`;


const SEARCH_PLAYERS = gql`
query SearchPlayers($eventId: String!, $filter: PlayerSearchFilter) {
  searchPlayers(eventId: $eventId, filter: $filter) {
    code
    message
    success
    data {
      event {
        _id
        name
        logo
        divisions
      }
      groups {
        _id
        name
        active
        division
      }
      players {
        _id
        email
        firstName
        lastName
        username
        teams
        profile
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
      teams {
        _id
        logo
        group
        name
        division
        captain
      }
      matches {
        _id
        group
        completed
        date
        description
        division
        location
        nets
        rounds
        teamA
        teamB
      }
    }
  }
}


`;

export { GET_PLAYER_AND_TEAMS_RAW, GET_A_PLAYER_RAW, SEARCH_PLAYERS };
