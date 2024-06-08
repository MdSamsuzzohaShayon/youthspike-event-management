import { gql } from "@apollo/client";

const UPDATE_PLAYER_RANKING = gql`
mutation UpdatePlayerRanking($teamId: [String!]!, $input: [UpdatePlayerRankingInput!]!) {
    updatePlayerRanking(teamId: $teamId, input: $input) {
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


export { UPDATE_PLAYER_RANKING };