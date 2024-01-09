import { gql } from "@apollo/client";

const UPDATE_NET_PLAYERS = gql`
mutation UpdateNet($input: UpdateNetInput!, $netId: String!) {
    updateNet(input: $input, netId: $netId) {
      code
      message
      success
      data {
        _id
        teamAPlayerA
        teamAPlayerB
        teamBPlayerA
        teamBPlayerB
        num
        pairRange
        teamAScore
        teamBScore
      }
    }
  }
`;

export {UPDATE_NET_PLAYERS};