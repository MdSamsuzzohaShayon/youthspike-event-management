import { gql } from "@apollo/client";

const UPDATE_ROUND = gql`
mutation UpdateRound($updateInput: UpdateRoundInput!) {
    updateRound(updateInput: $updateInput) {
      code
      message
      success
      data {
        _id
        num
      }
    }
  }
`;

export { UPDATE_ROUND };