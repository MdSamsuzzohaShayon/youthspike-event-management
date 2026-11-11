import { gql } from "@apollo/client";
/**
 * Query
 * =========================================================================================================================================
 */


const SEARCH_EVENTS = gql`
query SearchEvents($filter: EventSearchInput){
  searchEvents(filter:$filter){
    code
    success
    message
    data{
      events{
        _id
        name
        location
        logo
        defaulted
        description
      }
      matches{
        _id 
        division
        description
        date
        group
        rounds
        nets
        location
        completed
      }
      rounds{
        _id
        num
        firstPlacing
        completed   
        nets   
        match            
      }
      nets{
        _id
        num
        points
        teamAPlayerA
        teamAPlayerB
        teamBPlayerA
        teamBPlayerB
        match
        round
      }
    }
  }
}
`;



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
        defaulted
        matches {
          _id
          date
        }
      }
    }
  }
`;

const GET_EVENTS = gql`${GET_EVENTS_RAW}`;

export { GET_EVENTS_RAW, GET_EVENTS, SEARCH_EVENTS };
