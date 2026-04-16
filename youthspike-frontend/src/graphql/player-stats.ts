import { gql } from "@apollo/client";

const GET_PLAYER_WITH_STATS_RAW = `
query GetPlayerWithStats($playerId: String!) {
  getPlayerWithStats(playerId: $playerId) {
    code
    message
    success
    data {
      events{
        _id
        name
        divisions
        teams
        players
        matches
        groups
      }
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
        groups
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
        event
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
        teamAPlayerA
        teamAPlayerB
        teamAScore
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

      multiplayers{
        _id
        acePercentage
        defensiveConversionPercentage
        hittingPercentage
        receivingPercentage
        servingPercentage
        settingPercentage
      }
      weights{
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



// Multiple players
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


export { GET_PLAYER_WITH_STATS_RAW, GET_PLAYER_WITH_STATS, STATS_OF_PLAYERS };