import { gql } from "@apollo/client";

const GET_PLAYER_WITH_STATS_RAW = `query GetPlayerWithStats($playerId: String!) {
  getPlayerWithStats(playerId: $playerId) {
    code
    message
    success
    data {
      player {
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
        teams
        username
      }
      team {
        _id
        active
        captain
        cocaptain
        division
        logo
        matches
        name
      }
      matches {
        _id
        completed
        division
        date
        description
        location
        nets
        netVariance
        numberOfNets
        numberOfRounds
        teamA
        teamB
        tieBreaking
        timeout
      }
      nets {
        _id
        match
        netType
        num
        pairRange
        points
        round
        teamA
        teamAPlayerA
        teamAPlayerB
        teamAScore
        teamB
        teamBPlayerA
        teamBPlayerB
        teamBScore
      }
      playerstats {
        _id
        break
        broken
        cleanHits
        defensiveOpportunity
        hittingCompletion
        hittingOpportunity
        match
        matchPlayed
        noTouchAcedCount
        player
        receivedCount
        receiverOpportunity
        serveAce
        serveCompletionCount
        serveOpportunity
        servingAceNoTouch
        settingOpportunity
        defensiveConversion
        settingCompletion
      }
    }
  }
}`;

const GET_PLAYER_WITH_STATS = gql`${GET_PLAYER_WITH_STATS_RAW}`;

export { GET_PLAYER_WITH_STATS_RAW, GET_PLAYER_WITH_STATS };