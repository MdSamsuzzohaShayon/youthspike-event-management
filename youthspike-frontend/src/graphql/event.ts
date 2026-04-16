/**
 * Query
 * =========================================================================================================================================
 */

import { gql } from "@apollo/client";



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

export { GET_EVENTS_RAW, GET_EVENTS };
