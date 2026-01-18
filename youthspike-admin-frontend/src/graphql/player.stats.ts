import { gql } from "@apollo/client";

const SEARCH_PLAYER_STATS = gql`
query SearchPlayerStats($eventId: String!, $filter: PlayerSearchFilter) {
  searchPlayerStats(eventId: $eventId, filter: $filter) {
    code
    message
    success
    data {
      event {
        _id
        name
        logo
        divisions
        startDate
        endDate
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

export { SEARCH_PLAYER_STATS };
