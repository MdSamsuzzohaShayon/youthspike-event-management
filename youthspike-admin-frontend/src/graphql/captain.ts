import { gql } from '@apollo/client';

/**
 * Query
 * ===========================================================================================================================
 */
const GET_CAPTAIN = gql`
query GetUser($userId: String!) {
  getUser(userId: $userId) {
    code
    message
    success
    data {
      _id
      firstName
      lastName
      email
    }
  }
}
`;

/**
 * Mutation
 * ===========================================================================================================================
 */

const UPDATE_CAPTAIN_RAW = `
mutation UpdateUser($userId: String!, $updateInput: UpdateUserArgs!) {
  updateUser(userId: $userId, updateInput: $updateInput) {
    code
    data {
      _id
      firstName
      lastName
      password
    }
  }
}
`;

const UPDATE_CAPTAIN = gql`${UPDATE_CAPTAIN_RAW}`;



export { GET_CAPTAIN, UPDATE_CAPTAIN_RAW, UPDATE_CAPTAIN};
