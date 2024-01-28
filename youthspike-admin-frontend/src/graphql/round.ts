import { gql } from "@apollo/client";

const roundResponse = `
_id
num
teamAScore
teamBScore
nets {
  _id
  num
  points
  pairRange
  teamAPlayerA
  teamAPlayerB
  teamAScore
  teamBPlayerA
  teamBPlayerB
  teamBScore
}
`;

/**
 * Query
 * =========================================================================================================================================
 */
const GET_A_ROUND = gql`
query GetRound($roundId: String!) {
    getRound(roundId: $roundId) {
      code
      message
      success
      data {
        ${roundResponse}
      }
    }
  }
`;

/**
 * Mutation
 * =========================================================================================================================================
 */


export { GET_A_ROUND };
