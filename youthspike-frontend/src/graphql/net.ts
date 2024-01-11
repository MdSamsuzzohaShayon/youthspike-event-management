import { gql } from "@apollo/client";

const UPDATE_NETS = gql`
mutation UpdateNets($input: [UpdateMultipleNetInput!]!) {
  updateNets(input: $input) {
    code
    data {
      _id
      num
      pairRange
      teamAPlayerA
      teamAPlayerB
      teamAScore
      teamBPlayerA
      teamBPlayerB
      teamBScore
    }
  }
}
`;

export {UPDATE_NETS};