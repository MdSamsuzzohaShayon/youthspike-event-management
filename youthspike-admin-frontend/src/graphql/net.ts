import { gql } from "@apollo/client";

const GET_A_NET = gql`
query GetNet($netId: String!) {
  getNet(netId: $netId) {
    code
    success
    message
    data {
      _id
      num
      pairRange
      points
      teamAPlayerA
      teamAPlayerB
      teamAScore
      teamBPlayerA
      teamBPlayerB
      teamBScore
      teamA {
        _id
        active
        name
        captain {
          _id
          email
          firstName
          lastName
          profile
          rank
          status
        }
        players {
          _id
          email
          firstName
          lastName
          profile
          rank
          status
        }
      }
      teamB {
        _id
        active
        name
        captain {
          _id
          email
          firstName
          lastName
          profile
          rank
          status
        }
        players {
          _id
          email
          firstName
          lastName
          profile
          rank
          status
        }
      }
    }
  }
}
`;

export { GET_A_NET };