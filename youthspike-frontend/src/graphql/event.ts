/**
 * Query
 * =========================================================================================================================================
 */

import { gql } from "@apollo/client";

const GET_AN_EVENT_RAW = `
query GetEventDetails($eventId: String!) {
  getEventDetails(eventId: $eventId) {
    code
    success
    message
    data {
      event {
        _id
        name
        logo
        startDate
        endDate
        active
        sendCredentials
        playerLimit
        fwango
        divisions
        nets
        rounds
        netVariance
        homeTeam
        autoAssign
        autoAssignLogic
        rosterLock
        tieBreaking
        timeout
        coachPassword
        description
        location
      }
      matches {
        _id
        date
        division
        numberOfNets
        numberOfRounds
        netVariance
        homeTeam
        autoAssign
        autoAssignLogic
        rosterLock
        tieBreaking
        timeout
        location
        description
        fwango
        completed
        extendedOvertime
        nets
        rounds
        teamA
        teamB
        group
      }
      teams {
        _id
        name
        logo
        active
        division
        rankLock
        sendCredentials
        num
        matches
        group
      }
      ldo {
        _id
        name
        phone
        logo
      }
      nets {
        _id
        num
        match
        round
        teamA
        teamB
        teamAPlayerA
        teamAPlayerB
        teamBPlayerA
        teamBPlayerB
        points
        netType
        teamAScore
        teamBScore
        pairRange
      }
      rounds {
        _id
        num
        match
        nets
        teamAScore
        teamBScore
        teamAProcess
        teamBProcess
        completed
        firstPlacing
      }
      groups {
        _id
        name
        active
        division
        rule
        teams
      }
      players {
        _id
        firstName
        lastName
        username
        email
        status
        profile
        phone
        division
        teams
      }
      sponsors {
        _id
        company
        logo
      }
    }
  }
}
`;

const GET_AN_EVENT = gql`${GET_AN_EVENT_RAW}`;

/**
 * Mutation
 * =========================================================================================================================================
 */


const GET_EVENTS_RAW = `
  query GetEvents {
    getEvents {
      code
      success
      message
      data {
        _id
        name
        logo
        startDate
        endDate
        active
        divisions
        description
        location
        matches {
          _id
          date
        }
      }
    }
  }
`;



export { GET_AN_EVENT_RAW, GET_EVENTS_RAW, GET_AN_EVENT };
