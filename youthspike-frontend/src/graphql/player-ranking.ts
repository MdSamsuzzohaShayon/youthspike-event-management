import { gql } from "@apollo/client";

/**
 * Mutations
 */
const UPDATE_TEAM_PLAYER_RANKING = gql`
mutation UpdateMatchPlayerRanking($input: UpdateMatchPlayerRankingInput!) {
  updateMatchPlayerRanking(input: $input) {
    code
    data {
      _id
      rankLock
    }
    message
    success
  }
}

`;

/**
 * Queries
 */

export { UPDATE_TEAM_PLAYER_RANKING };
