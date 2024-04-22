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

// eslint-disable-next-line import/prefer-default-export
export { UPDATE_ROUND };