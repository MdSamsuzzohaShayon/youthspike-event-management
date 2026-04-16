import { gql } from "@apollo/client";


const STATS_OF_PLAYERS = gql`
query GetStatsOfPlayers($teamId: String!) {
  getStatsOfPlayers(teamId: $teamId) {
    code
    message
    success
    data {
      events {
        _id
        active
        startDate
        endDate
        divisions
        description
        logo
        location
        name
        matches
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
      oponents {
        _id
        active
        num
        name
        logo
        sendCredentials
      }
      matches {
        _id
        nets
        rounds
        date
        division
        description
        completed
        includeStats
      }
      nets {
        _id
        num
        match
        round
        teamAPlayerA
        teamAPlayerB
        teamBPlayerA
        teamBPlayerB
        points
      }
      rounds {
        _id
        num
        match
        nets
        completed
        teamBScore
        teamBScore
      }
      statsOfPlayers {
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
    }
  }
}

`;

export { STATS_OF_PLAYERS };
