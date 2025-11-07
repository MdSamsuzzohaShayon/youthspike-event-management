import { gql } from "@apollo/client";

const GET_PLAYER_WITH_STATS_RAW = `query GetPlayerWithStats($playerId: String!) {
  getPlayerWithStats(playerId: $playerId) {
    code
    message
    success
    data {
      groups{
        _id
        name
        division
      }
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
      players {
        _id
        division
        email
        firstName
        lastName
        profile
        teams
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
      oponents {
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
        group
        netVariance
        numberOfNets
        numberOfRounds
        teamA
        teamB
        tieBreaking
        timeout
      }
      rounds {
        _id
        match
        num
        nets
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
        serveOpportunity
        serveAce
        serveCompletionCount
        servingAceNoTouch
        receiverOpportunity
        receivedCount
        noTouchAcedCount
        settingOpportunity
        cleanSets
        hittingOpportunity
        cleanHits
        defensiveOpportunity
        defensiveConversion
        break
        broken
        matchPlayed
        net
        player
        match
      }

      multiplayer{
        _id
        acePercentage
        defensiveConversionPercentage
        hittingPercentage
        receivingPercentage
        servingPercentage
        settingPercentage
      }
      weight{
        _id
        acePercentage
        defensiveConversionPercentage
        hittingPercentage
        receivingPercentage
        servingPercentage
        settingPercentage
      }
      stats{
        _id
        acePercentage
        defensiveConversionPercentage
        hittingPercentage
        receivingPercentage
        servingPercentage
        settingPercentage
      }
    }
  }
}`;

const GET_PLAYER_WITH_STATS = gql`${GET_PLAYER_WITH_STATS_RAW}`;

export { GET_PLAYER_WITH_STATS_RAW, GET_PLAYER_WITH_STATS };