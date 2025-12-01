import { gql } from '@apollo/client';

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


const UPDATE_NET = gql`
  mutation UpdateNet($input: UpdateNetInput!, $netId: String!) {
    updateNet(input: $input, netId: $netId) {
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
export { UPDATE_NETS, UPDATE_NET };
