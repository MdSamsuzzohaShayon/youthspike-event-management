import { gql } from "@apollo/client";

/**
 * Mutations
 */
const UPDATE_TEAM_PLAYER_RANKING = gql`
mutation UpdateTeamPlayerRanking($input: UpdateTeamPlayerRankingInput!) {
  updateTeamPlayerRanking(input: $input) {
    code
    message
    success
    data {
      _id
      rankLock
    }
  }
}
`;

/**
 * Queries
 */

export { UPDATE_TEAM_PLAYER_RANKING };
